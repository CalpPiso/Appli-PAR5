/*
 * BANC D'ESSAI — le contrôle avant transmission, et la reprise de fiche.
 *
 * Deux ajouts qui touchent au FOND du document :
 *  · `verifierPar5` dit ce qui manque avant de laisser partir un PAR 5 ;
 *  · `dupliquerPar5` reprend la fiche de la veille sans recopier ce qui ne
 *    doit pas l'être (signatures, constat de mise en place, photos d'hier).
 *
 * Une erreur ici ne se voit pas à l'écran : elle se voit six mois plus tard,
 * sur une fiche qu'on ressort. D'où ce banc.
 *
 *   node tools/test-controle.cjs
 */
'use strict'
const path = require('path')
const RACINE = path.resolve(__dirname, '..')

let reussis = 0
let echecs = 0
function verifier(nom, ok, obtenu, attendu) {
  if (ok) {
    reussis++
    console.log('  ✓ ' + nom)
  } else {
    echecs++
    console.log('  ✗ ' + nom)
    if (attendu !== undefined) {
      console.log('      attendu : ' + attendu)
      console.log('      obtenu  : ' + obtenu)
    }
  }
}

/* localStorage n'existe pas dans Node : on en pose un, minimal, AVANT de
   charger le magasin — qui le lit au premier appel. */
const memoire = new Map()
global.localStorage = {
  getItem: (k) => (memoire.has(k) ? memoire.get(k) : null),
  setItem: (k, v) => memoire.set(k, String(v)),
  removeItem: (k) => memoire.delete(k),
  clear: () => memoire.clear()
}

function charger(rel) {
  const esbuild = require('esbuild')
  const src = path.join(RACINE, rel)
  const out = esbuild.buildSync({
    entryPoints: [src],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false
  })
  const Module = require('module')
  const m = new Module(src)
  m.filename = src
  m.paths = Module._nodeModulePaths(path.dirname(src))
  m._compile(out.outputFiles[0].text, src)
  return m.exports
}

const { RISQUES, donneesPar5Vides, verifierPar5, bloquants } = charger('src/data/par5.ts')
const store = charger('src/data/par5-store.ts')

const durs = (d) => bloquants(verifierPar5(d))
const doux = (d) => verifierPar5(d).filter((m) => m.gravite === 'avertissement')

/** Une fiche irréprochable : seize « non », une tâche, un travailleur. */
function ficheImpeccable() {
  const d = donneesPar5Vides()
  d.noProjet = 'HQC26-075'
  d.installation = 'Poste Saint-François'
  d.tache = 'Remplacement de USDI'
  d.lignes.forEach((l) => (l.present = 'non'))
  d.travailleurs = [{ nom: 'Raphaël Gauthier', initiales: 'RG', date: '2026-08-21' }]
  return d
}

console.log('\n=== BANC D’ESSAI — contrôle avant transmission ===\n')

console.log('1. Ce qui doit alerter')
{
  const m = durs(donneesPar5Vides())
  verifier(
    'fiche vide : les 16 risques sans réponse sont signalés',
    m.some((x) => x.texte.includes('16 risques sur 16')),
    JSON.stringify(m.map((x) => x.texte)),
    'un manque mentionnant « 16 risques sur 16 »'
  )
  verifier(
    'fiche vide : aucun travailleur inscrit est signalé',
    m.some((x) => x.texte.toLowerCase().includes('travailleur')),
    JSON.stringify(m.map((x) => x.texte)),
    'un manque sur les travailleurs'
  )
}
{
  /* Le cas le plus grave : la fiche prouve qu'on savait, et ne montre rien
     qui ait été fait. */
  const d = ficheImpeccable()
  d.lignes[3].present = 'oui'
  d.lignes[3].responsable = 'R. Gauthier'
  const m = durs(d)
  verifier(
    'risque présent sans moyen de prévention : bloquant',
    m.length === 1 && m[0].texte.includes(RISQUES[3].nom),
    JSON.stringify(m.map((x) => x.texte)),
    'un seul bloquant, nommant « ' + RISQUES[3].nom + ' »'
  )
}
{
  const d = ficheImpeccable()
  d.lignes[0].present = null
  const m = durs(d)
  verifier(
    'un seul risque sans réponse : il est NOMMÉ, pas compté',
    m.length === 1 && m[0].texte.includes(RISQUES[0].nom),
    JSON.stringify(m.map((x) => x.texte)),
    'le nom du risque'
  )
}

console.log('\n2. Ce qui ne doit PAS alerter à tort')
{
  const d = ficheImpeccable()
  verifier(
    'fiche complète, 16 « non » : aucun manque',
    verifierPar5(d).length === 0,
    JSON.stringify(verifierPar5(d).map((x) => x.texte)),
    '[]'
  )
}
{
  const d = ficheImpeccable()
  d.lignes[2].present = 'oui'
  d.lignes[2].moyens = 'Cadenassage et vérification d’absence de tension'
  d.lignes[2].responsable = 'R. Gauthier'
  d.lignes[2].realise = true
  verifier(
    'risque présent, complet : aucun bloquant',
    durs(d).length === 0,
    JSON.stringify(durs(d).map((x) => x.texte)),
    '[]'
  )
}
{
  const d = ficheImpeccable()
  d.lignes[2].present = 'oui'
  d.lignes[2].moyens = 'Cadenassage'
  d.lignes[2].realise = true
  const b = durs(d)
  const a = doux(d)
  verifier(
    'responsable manquant : avertissement, pas bloquant',
    b.length === 0 && a.some((x) => x.texte.includes('responsable')),
    'bloquants=' + b.length + ' avertissements=' + JSON.stringify(a.map((x) => x.texte)),
    '0 bloquant, 1 avertissement « responsable »'
  )
}
{
  const d = ficheImpeccable()
  d.lignes[2].present = 'oui'
  d.lignes[2].moyens = 'Cadenassage'
  d.lignes[2].responsable = 'R. Gauthier'
  d.lignes[2].realise = false
  verifier(
    'moyens pas encore en place : avertissement seulement',
    durs(d).length === 0 && doux(d).some((x) => x.texte.includes('mis en place')),
    JSON.stringify(verifierPar5(d)),
    '0 bloquant, 1 avertissement « mis en place »'
  )
}
{
  const d = ficheImpeccable()
  d.travailleurs = [{ nom: '   ', initiales: '  ', date: '2026-08-21' }]
  verifier(
    'un travailleur dont le nom n’est que des espaces ne compte pas',
    durs(d).some((x) => x.texte.toLowerCase().includes('travailleur')),
    JSON.stringify(durs(d).map((x) => x.texte)),
    'un bloquant sur les travailleurs'
  )
}

console.log('\n3. Reprendre la fiche de la veille')
{
  const hier = ficheImpeccable()
  hier.lignes[1].present = 'oui'
  hier.lignes[1].specification = 'Poussière de plomb'
  hier.lignes[1].moyens = 'Masque P100'
  hier.lignes[1].responsable = 'R. Gauthier'
  hier.lignes[1].realise = true
  hier.lignes[1].photo = 'data:image/jpeg;base64,AAAA'
  hier.travailleurs = [
    { nom: 'Raphaël Gauthier', initiales: 'RG', date: '2026-08-20' },
    { nom: '', initiales: '', date: '2026-08-20' }
  ]
  const source = { id: 'x', dateISO: '2026-08-20T12:00:00Z', donnees: hier }
  const avant = JSON.stringify(hier)

  const n = store.dupliquerPar5(source, '2026-08-21')

  verifier(
    'les 16 réponses sont reprises',
    n.lignes.every((l, i) => l.present === hier.lignes[i].present),
    'divergence',
    'identiques'
  )
  verifier(
    'les moyens et le responsable sont repris',
    n.lignes[1].moyens === 'Masque P100' && n.lignes[1].responsable === 'R. Gauthier',
    n.lignes[1].moyens + ' / ' + n.lignes[1].responsable,
    'Masque P100 / R. Gauthier'
  )
  verifier(
    '« moyens mis en place » est REMIS À ZÉRO (constat du jour)',
    n.lignes[1].realise === false,
    String(n.lignes[1].realise),
    'false'
  )
  verifier(
    'la photo d’hier n’est pas recopiée',
    n.lignes[1].photo === undefined,
    String(n.lignes[1].photo),
    'undefined'
  )
  verifier(
    'les dates de signature passent au jour même',
    n.travailleurs.every((t) => t.date === '2026-08-21'),
    JSON.stringify(n.travailleurs.map((t) => t.date)),
    'toutes 2026-08-21'
  )
  verifier('le travailleur vide est écarté', n.travailleurs.length === 1, String(n.travailleurs.length), '1')
  verifier('la fiche d’origine n’est PAS modifiée', JSON.stringify(hier) === avant, 'mutée', 'intacte')
  verifier(
    'le chantier suit',
    n.noProjet === 'HQC26-075' && n.tache === 'Remplacement de USDI',
    n.noProjet + ' / ' + n.tache,
    'HQC26-075 / Remplacement de USDI'
  )
}

console.log('\n4. Le budget des photos')
{
  memoire.clear()
  const d1 = ficheImpeccable()
  d1.lignes[0].present = 'oui'
  d1.lignes[0].moyens = 'x'
  d1.lignes[0].photo = 'data:image/jpeg;base64,' + 'A'.repeat(1000)
  const r1 = store.enregistrerPar5(d1)
  verifier('la photo est bien persistée', r1.persiste === true, String(r1.persiste), 'true')

  const relu = store.listerPar5()[0]
  verifier(
    'la photo se relit telle quelle',
    relu.donnees.lignes[0].photo === d1.lignes[0].photo,
    'divergence',
    'identique'
  )

  verifier('poidsPhotos compte la fiche', store.poidsPhotos() > 1000, String(store.poidsPhotos()), '> 1000')
  verifier(
    'poidsPhotos(exclureId) écarte la fiche en cours',
    store.poidsPhotos(r1.id) === 0,
    String(store.poidsPhotos(r1.id)),
    '0'
  )

  /* Une chaîne qui n'est pas une image ne doit pas ressortir du magasin :
     elle finirait dans un <img src> et dans le PDF. */
  memoire.set(
    'gtq-par5',
    JSON.stringify({
      v: 1,
      par5: [
        {
          id: 'y',
          dateISO: '2026-08-20T00:00:00Z',
          donnees: { lignes: [{ risqueId: RISQUES[0].id, present: 'oui', photo: 'javascript:alert(1)' }] }
        }
      ]
    })
  )
  const sale = store.listerPar5()[0]
  verifier(
    'une « photo » qui n’est pas une data URL d’image est rejetée',
    sale.donnees.lignes[0].photo === undefined,
    String(sale.donnees.lignes[0].photo),
    'undefined'
  )
}

console.log('\n5. La date de l’analyse ne bouge pas')
{
  memoire.clear()
  const a = store.enregistrerPar5(ficheImpeccable())
  const d2 = ficheImpeccable()
  d2.tache = 'Corrigée'
  const b = store.enregistrerPar5(d2, a.id)
  verifier('rouvrir et ré-enregistrer conserve dateISO', b.dateISO === a.dateISO, b.dateISO, a.dateISO)
  verifier('majISO est posée', typeof b.majISO === 'string', String(b.majISO), 'une date')
}

console.log('\n' + '='.repeat(54))
console.log('  ' + reussis + ' réussis, ' + echecs + ' échec(s)')
console.log('='.repeat(54) + '\n')
process.exit(echecs ? 1 : 0)
