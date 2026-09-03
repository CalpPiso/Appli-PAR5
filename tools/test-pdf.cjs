/*
 * BANC D'ESSAI — le PDF du PAR 5.
 *
 * Le PDF est l'ENREGISTREMENT de l'analyse : il doit se lire seul, sans
 * l'application. On vérifie donc qu'il est valide, qu'il contient les 16
 * risques, les réponses, les précisions des risques présents, les travailleurs
 * — et que les accents français sortent correctement (piège classique des
 * polices de base du PDF).
 *
 *   node tools/test-pdf.cjs
 */
'use strict'
const fs = require('fs')
const os = require('os')
const path = require('path')

const RACINE = path.resolve(__dirname, '..')
const SRC = path.join(RACINE, 'src/data/pdf-par5.ts')
/* pdfjs sert seulement à RELIRE le PDF produit — outil de contrôle, pas une
   dépendance de l'application. On emprunte celui de ToolApp. */
const PDFJS = path.resolve(RACINE, '../ToolApp/node_modules/pdfjs-dist/legacy/build/pdf.mjs')

let reussis = 0
let echecs = 0
function verifier(nom, ok, obtenu, attendu) {
  if (ok) {
    reussis++
    console.log(`  ✓ ${nom}`)
  } else {
    echecs++
    console.log(`  ✗ ${nom}`)
    if (attendu !== undefined) {
      console.log(`      attendu : ${attendu}`)
      console.log(`      obtenu  : ${obtenu}`)
    }
  }
}

function charger() {
  const esbuild = require('esbuild')
  const out = esbuild.buildSync({
    entryPoints: [SRC],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    external: ['jspdf']
  })
  const Module = require('module')
  const m = new Module(SRC)
  m.filename = SRC
  m.paths = Module._nodeModulePaths(path.dirname(SRC))
  m._compile(out.outputFiles[0].text, SRC)
  return m.exports
}

async function texteDuPdf(chemin) {
  const { pathToFileURL } = require('url')
  const pdfjs = await import(pathToFileURL(PDFJS).href)
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(chemin)) }).promise
  let texte = ''
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const c = await page.getTextContent()
    texte += c.items.map((i) => i.str).join(' ') + '\n'
  }
  return { texte, pages: doc.numPages }
}

async function main() {
  console.log("\n=== BANC D'ESSAI — PDF du PAR 5 ===\n")
  const mod = charger()
  const { RISQUES, donneesPar5Vides } = require('./_par5-modele.cjs')

  /* --- une fiche représentative : accents, deux risques présents --- */
  const d = donneesPar5Vides()
  d.noProjet = 'HQC26-075'
  d.installation = 'Poste Saint-François'
  d.emplacement = 'Salle de commande, étage 2'
  d.tache = "Remplacement de l'USDI et vérification point à point"
  d.lignes[0].present = 'oui'
  d.lignes[0].specification = "Présence d'hydrogène près des batteries — zone à accès restreint."
  d.lignes[0].moyens = 'Ventilation forcée, détecteur portatif, aucune source d’ignition.'
  d.lignes[0].responsable = 'Raphaël Gauthier'
  d.lignes[0].realise = true
  d.lignes[1].present = 'non'
  d.lignes[2].present = 'oui'
  d.lignes[2].specification = 'Travaux à proximité de conducteurs sous tension 125 Vc.c.'
  d.lignes[2].moyens = 'Cadenassage, vérification d’absence de tension, ÉPI classe 0.'
  d.lignes[2].responsable = 'Michaël Boily'
  d.travailleurs = [
    { nom: 'Raphaël Gauthier', initiales: 'RG', date: '2026-08-19' },
    { nom: 'Michaël Boily', initiales: 'MB', date: '2026-08-19' }
  ]

  console.log('1. Production')
  const pdf = mod.construirePdfPar5(d, '2026-08-19T12:00:00.000Z')
  verifier('un blob est produit', pdf.blob && pdf.blob.size > 2000, pdf.blob && pdf.blob.size, '> 2000 octets')
  verifier(
    'le nom de fichier reprend le projet',
    pdf.nom.includes('HQC26-075') && pdf.nom.endsWith('.pdf'),
    pdf.nom,
    'contient HQC26-075 et finit par .pdf'
  )
  verifier(
    'aucun caractère interdit dans le nom',
    !/[\\/:*?"<>|]/.test(pdf.nom.replace(/^PAR5 /, '')),
    pdf.nom,
    'nom de fichier valide'
  )

  const fichier = path.join(os.tmpdir(), 'par5-test.pdf')
  fs.writeFileSync(fichier, Buffer.from(await pdf.blob.arrayBuffer()))
  const entete = fs.readFileSync(fichier).subarray(0, 5).toString('latin1')
  verifier('le fichier est bien un PDF', entete === '%PDF-', entete, '%PDF-')

  console.log('\n2. Contenu relu par pdfjs')
  const { texte, pages } = await texteDuPdf(fichier)
  verifier('au moins une page', pages >= 1, pages, '>= 1')

  verifier("l'en-tête porte la marque", texte.includes('GÉNITIQUE'), texte.slice(0, 24), 'GÉNITIQUE')
  verifier('le no de projet est présent', texte.includes('HQC26-075'))
  verifier(
    'les accents sortent correctement',
    texte.includes('Saint-François') && texte.includes('étage'),
    texte.match(/Saint-Fran\S+/)?.[0],
    'Saint-François'
  )

  const manquants = RISQUES.filter((r) => !texte.includes(r.nom.slice(0, 18)))
  verifier(
    'les 16 risques figurent tous',
    manquants.length === 0,
    manquants.map((r) => r.nom).join(' | '),
    'aucun manquant'
  )

  verifier(
    'les précisions du risque présent sont là',
    texte.includes('hydrog') && texte.includes('Ventilation'),
    '—',
    'précisions + moyens'
  )
  verifier(
    'le responsable et la réalisation sont notés',
    texte.includes('Raphaël Gauthier') && /Moyens mis en place\s*:\s*OUI/.test(texte),
    '—',
    'responsable + OUI'
  )
  verifier('les deux travailleurs sont inscrits', texte.includes('Micha') && texte.includes('RG'))
  verifier('la pagination est présente', /Page 1 de \d+/.test(texte), texte.match(/Page \d+ de \d+/)?.[0])

  /* --- cas limite : fiche vide --- */
  console.log('\n3. Cas limite — fiche vide')
  const vide = mod.construirePdfPar5(donneesPar5Vides(), '2026-08-19T12:00:00.000Z')
  const fv = path.join(os.tmpdir(), 'par5-vide.pdf')
  fs.writeFileSync(fv, Buffer.from(await vide.blob.arrayBuffer()))
  const rv = await texteDuPdf(fv)
  verifier('une fiche vide produit quand même un PDF lisible', rv.pages >= 1, rv.pages, '>= 1')
  verifier(
    'elle annonce zéro risque présent',
    rv.texte.includes('0 présent'),
    rv.texte.match(/\d+ present\S*/)?.[0],
    '0 présent(s)'
  )
  verifier(
    "elle signale l'absence de travailleur",
    rv.texte.includes('Aucun travailleur'),
    '—',
    'Aucun travailleur inscrit.'
  )

  console.log(`\n${'='.repeat(52)}\n  ${reussis} réussis, ${echecs} échec(s)`)
  console.log(`  fichier d'inspection : ${fichier}`)
  console.log('='.repeat(52) + '\n')
  process.exit(echecs ? 1 : 0)
}

main().catch((e) => {
  console.error('ERREUR :', e)
  process.exit(1)
})
