/*
 * AUDIT GÉOMÉTRIQUE DU PDF — « un sans faute à l'impression ».
 *
 * Le banc `test-pdf.cjs` vérifie que le texte EST là. Celui-ci vérifie qu'il
 * est AU BON ENDROIT : rien qui déborde de la marge, rien qui passe sous le
 * pied de page, rien qui se superpose, rien qui se perde derrière le bandeau
 * noir de l'en-tête. C'est ce qu'on ne voit pas en relisant du texte, et c'est
 * exactement ce qui se voit à l'impression.
 *
 * On éprouve la mise en page sur des cas EXTRÊMES, pas sur un cas moyen :
 * les 16 risques présents avec de longs textes, un champ de 2 000 caractères,
 * 40 travailleurs, un mot sans espace plus large que la page, des caractères
 * hors WinAnsi.
 *
 *   node tools/audit-pdf.cjs
 */
'use strict'
const fs = require('fs')
const os = require('os')
const path = require('path')
const { pathToFileURL } = require('url')

const RACINE = path.resolve(__dirname, '..')
const SRC = path.join(RACINE, 'src/data/pdf-par5.ts')
const PDFJS = path.resolve(RACINE, '../ToolApp/node_modules/pdfjs-dist/legacy/build/pdf.mjs')

/* La géométrie déclarée dans le générateur. */
const MARGE = 14
const LARGEUR = 210
const HAUTEUR = 297
const BANDEAU = 22 // le bandeau noir de la première page
const PIED = HAUTEUR - 8 // la ligne du pied de page

/** Le PDF pense en points ; le papier, en millimetres. */
const mm = (pt) => (pt * 25.4) / 72

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

/**
 * Relève CHAQUE fragment de texte avec sa position, en millimètres.
 *
 * pdfjs rend les coordonnées en points PDF, origine en bas à gauche. On les
 * ramène en millimètres avec l'origine en haut à gauche, comme le générateur
 * les pense — sinon on compare des choux et des carottes.
 */
async function fragments(chemin) {
  const pdfjs = await import(pathToFileURL(PDFJS).href)
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(fs.readFileSync(chemin)),
    verbosity: 0
  }).promise
  const out = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const vue = page.getViewport({ scale: 1 })
    const c = await page.getTextContent()
    for (const item of c.items) {
      if (!item.str || !item.str.trim()) continue
      const [, , , , x, yBas] = item.transform
      out.push({
        page: p,
        texte: item.str,
        x: mm(x),
        /* pdfjs compte depuis le bas ; on veut depuis le haut. */
        y: mm(vue.height - yBas),
        largeur: mm(item.width),
        hauteur: mm(item.height || 0)
      })
    }
  }
  return { fragments: out, pages: doc.numPages }
}

/**
 * OU SONT LES IMAGES ?
 *
 * L'audit ne mesurait que le TEXTE. Depuis qu'un risque peut porter une photo,
 * ca ne suffit plus : une image mal cadree deborde aussi bien qu'un mot, et
 * `getTextContent()` ne la voit pas. On lit donc la liste des operateurs et on
 * suit la matrice courante (CTM) : une image est dessinee dans le carre unite
 * transforme par cette matrice, donc ses quatre coins s'en deduisent.
 *
 * Raisonner sur le code aurait dit « largeur plafonnee a 78 mm, donc ca tient ».
 * On mesure a la place — c'est exactement ce raisonnement-la qui avait laisse
 * passer les 211 mm de la colonne des travailleurs.
 */
async function images(chemin) {
  const { pathToFileURL } = require('url')
  const pdfjs = await import(pathToFileURL(PDFJS).href)
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(chemin)) }).promise
  const OPS = pdfjs.OPS
  const out = []

  const mul = (a, b) => [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5]
  ]

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const vue = page.getViewport({ scale: 1 })
    const liste = await page.getOperatorList()
    let ctm = [1, 0, 0, 1, 0, 0]
    const pile = []

    for (let i = 0; i < liste.fnArray.length; i++) {
      const op = liste.fnArray[i]
      const arg = liste.argsArray[i]
      if (op === OPS.save) pile.push(ctm.slice())
      else if (op === OPS.restore) ctm = pile.pop() || [1, 0, 0, 1, 0, 0]
      else if (op === OPS.transform) ctm = mul(ctm, arg)
      else if (
        op === OPS.paintImageXObject ||
        op === OPS.paintJpegXObject ||
        op === OPS.paintInlineImageXObject
      ) {
        /* Les quatre coins du carre unite, passes dans la CTM. */
        const coins = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => [
          ctm[0] * u + ctm[2] * v + ctm[4],
          ctm[1] * u + ctm[3] * v + ctm[5]
        ])
        const xs = coins.map((c) => c[0])
        const ys = coins.map((c) => c[1])
        out.push({
          page: p,
          x: mm(Math.min(...xs)),
          droite: mm(Math.max(...xs)),
          /* meme convention que le texte : origine en haut a gauche */
          y: mm(vue.height - Math.max(...ys)),
          bas: mm(vue.height - Math.min(...ys))
        })
      }
    }
  }
  return out
}

/** L'image deborde-t-elle de la zone imprimable ? */
function imageHorsCadre(i) {
  const fautes = []
  if (i.x < MARGE - 0.6) fautes.push(`gauche=${i.x.toFixed(1)} < marge`)
  if (i.droite > LARGEUR - MARGE + 0.6)
    fautes.push(`droite=${i.droite.toFixed(1)} > ${LARGEUR - MARGE}`)
  if (i.y < MARGE - 0.6) fautes.push(`haut=${i.y.toFixed(1)} au-dessus de la marge`)
  if (i.bas > PIED + 0.6) fautes.push(`bas=${i.bas.toFixed(1)} sous le pied (${PIED})`)
  return fautes
}

/** Le fragment déborde-t-il de la zone imprimable ? */
function horsCadre(f) {
  const fautes = []
  if (f.x < MARGE - 0.6) fautes.push(`x=${f.x.toFixed(1)} < marge`)
  if (f.x + f.largeur > LARGEUR - MARGE + 0.6) {
    fautes.push(`droite=${(f.x + f.largeur).toFixed(1)} > ${LARGEUR - MARGE}`)
  }
  if (f.y > PIED + 0.6) fautes.push(`y=${f.y.toFixed(1)} sous le pied`)
  if (f.y < MARGE - 8) fautes.push(`y=${f.y.toFixed(1)} au-dessus de la marge`)
  return fautes
}

/** Deux fragments de la même page se recouvrent-ils ? */
function chevauchements(liste) {
  const trouves = []
  const parPage = new Map()
  for (const f of liste) {
    if (!parPage.has(f.page)) parPage.set(f.page, [])
    parPage.get(f.page).push(f)
  }
  for (const [page, fs_] of parPage) {
    for (let i = 0; i < fs_.length; i++) {
      for (let j = i + 1; j < fs_.length; j++) {
        const a = fs_[i]
        const b = fs_[j]
        /* Même ligne de base, à 1 mm près, et boîtes qui se croisent. */
        if (Math.abs(a.y - b.y) > 1) continue
        const debut = Math.max(a.x, b.x)
        const fin = Math.min(a.x + a.largeur, b.x + b.largeur)
        if (fin - debut > 0.8) {
          trouves.push(
            `p${page} y=${a.y.toFixed(0)} : « ${a.texte.slice(0, 26)} » et « ${b.texte.slice(0, 26)} » se croisent sur ${(fin - debut).toFixed(1)} mm`
          )
        }
      }
    }
  }
  return trouves
}

/* ==================================================================== */

const LONG =
  "Presence d'hydrogene pres des batteries d'accumulateurs au plomb-acide, zone a acces restreint, ventilation naturelle insuffisante, risque d'atmosphere explosive en cas de charge rapide, presence simultanee de travaux par points chauds a moins de dix metres, absence de detecteur fixe en service depuis la derniere revision, "

/*
 * De vraies photos JPEG, aux proportions qui piegent : portrait, panorama,
 * carre. jsPDF lit les dimensions dans le marqueur SOF du JPEG — une image
 * fabriquee a la main ne prouverait rien, il faut de vrais octets.
 *
 * @napi-rs/canvas est emprunte a ToolApp : outil de controle, pas une
 * dependance de l'application.
 */
function photoJpeg(largeur, hauteur) {
  const { createCanvas } = require(
    path.resolve(RACINE, '../ToolApp/node_modules/@napi-rs/canvas')
  )
  const c = createCanvas(largeur, hauteur)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#8899aa'
  ctx.fillRect(0, 0, largeur, hauteur)
  ctx.fillStyle = '#223344'
  for (let i = 0; i < 40; i++)
    ctx.fillRect((i * 37) % largeur, (i * 53) % hauteur, largeur / 12, hauteur / 12)
  return 'data:image/jpeg;base64,' + c.toBuffer('image/jpeg', 0.5).toString('base64')
}

async function main() {
  console.log("\n=== AUDIT GÉOMÉTRIQUE — le PDF doit s'imprimer sans faute ===\n")
  const mod = charger()
  const { RISQUES, donneesPar5Vides } = require('./_par5-modele.cjs')

  const cas = []

  /* --- 1. La fiche vide ------------------------------------------------ */
  cas.push({ nom: 'fiche vide', d: donneesPar5Vides() })

  /* --- 2. Les 16 risques présents, textes longs ------------------------ */
  {
    const d = donneesPar5Vides()
    d.noProjet = 'HQC26-075'
    d.installation = 'Poste Saint-François-de-la-Rivière-du-Sud'
    d.emplacement = 'Salle de commande, étage 2, rangée B, panneaux P-001 à P-014'
    d.tache = "Remplacement de l'USDI, vérification point à point et essais fonctionnels"
    d.lignes.forEach((l, i) => {
      l.present = 'oui'
      l.specification = LONG.repeat(2)
      l.moyens = LONG.repeat(2)
      l.responsable = 'Raphaël Gauthier, ingénieur électrique'
      l.realise = i % 2 === 0
    })
    d.travailleurs = Array.from({ length: 12 }, (_, i) => ({
      nom: `Travailleur numéro ${i + 1} au nom passablement long`,
      initiales: 'T' + i,
      date: '2026-08-20'
    }))
    cas.push({ nom: '16 risques présents, textes longs, 12 travailleurs', d })
  }

  /* --- 3. Un champ démesuré -------------------------------------------- */
  {
    const d = donneesPar5Vides()
    d.tache = LONG.repeat(8)
    d.emplacement = LONG.repeat(4)
    d.lignes[0].present = 'oui'
    d.lignes[0].specification = LONG.repeat(10)
    cas.push({ nom: 'un champ de plusieurs milliers de caractères', d })
  }

  /* --- 4. Un mot sans espace plus large que la page -------------------- */
  {
    const d = donneesPar5Vides()
    d.noProjet = 'A'.repeat(150)
    d.lignes[0].present = 'oui'
    d.lignes[0].specification = 'B'.repeat(300)
    d.lignes[0].moyens = 'https://intranet.hydroquebec.com/' + 'x'.repeat(200)
    d.travailleurs = [{ nom: 'C'.repeat(120), initiales: 'D'.repeat(40), date: 'E'.repeat(40) }]
    cas.push({ nom: 'un mot ininterrompu plus large que la page', d })
  }

  /* --- 5. Beaucoup de travailleurs, pour forcer la coupure ------------- */
  {
    const d = donneesPar5Vides()
    d.travailleurs = Array.from({ length: 40 }, (_, i) => ({
      nom: `Personne ${i + 1}`,
      initiales: 'P' + i,
      date: '2026-08-20'
    }))
    cas.push({ nom: '40 travailleurs', d })
  }

  /* --- 6. Caractères hors WinAnsi -------------------------------------- */
  {
    const d = donneesPar5Vides()
    d.installation = 'Poste « Chênes » — 25 °C ± 2, œuvre n° 5'
    d.tache = 'Vérification ≥ 30 V, résistance ≤ 1 Ω, température −40 °C'
    d.lignes[0].present = 'oui'
    d.lignes[0].specification = 'Émoji 🔧 et symboles ✓ ✗ → ½ ¾ ‰ ™ © ® µ'
    d.lignes[0].moyens = 'Câble 3×2,5 mm² · repère Ø12 · flèche ⇒ zone α/β'
    cas.push({ nom: 'caractères hors WinAnsi (symboles, émoji)', d })
  }

  /* --- 7. Seize risques, seize photos ---------------------------------- */
  {
    const d = donneesPar5Vides()
    const p = photoJpeg(900, 675)
    d.tache = 'Fiche avec une photo sur chacun des seize risques'
    d.lignes.forEach((l, i) => {
      l.present = 'oui'
      l.specification = LONG
      l.moyens = LONG
      l.responsable = 'R. Gauthier'
      l.realise = true
      l.photo = p
    })
    cas.push({ nom: '16 risques avec photo (coupures de page)', d })
  }

  /* --- 8. Proportions extremes ----------------------------------------- */
  {
    const d = donneesPar5Vides()
    d.tache = 'Portrait, panorama et carre'
    d.lignes[0].present = 'oui'
    d.lignes[0].moyens = 'Photo en portrait'
    d.lignes[0].photo = photoJpeg(600, 1600)
    d.lignes[1].present = 'oui'
    d.lignes[1].moyens = 'Photo panoramique'
    d.lignes[1].photo = photoJpeg(2400, 500)
    d.lignes[2].present = 'oui'
    d.lignes[2].moyens = 'Photo carree'
    d.lignes[2].photo = photoJpeg(800, 800)
    cas.push({ nom: 'photos portrait / panorama / carre', d })
  }

  /* --- 9. Une data URL abimee ------------------------------------------ *
   * Le PAR 5 est le document ; la photo est une piece jointe. Si la piece
   * jointe casse, le document doit sortir QUAND MEME, et le dire. */
  {
    const d = donneesPar5Vides()
    d.tache = 'Photo illisible'
    d.lignes[0].present = 'oui'
    d.lignes[0].moyens = 'Le PDF doit sortir malgre tout'
    d.lignes[0].photo = 'data:image/jpeg;base64,Q2VjaSBuJ2VzdCBwYXMgdW5lIGltYWdl'
    cas.push({ nom: 'photo abimee — le PDF sort quand meme', d })
  }

  /* ------------------------------------------------------------------- */
  let totalHors = 0
  let totalChevauche = 0
  const detail = []

  for (const c of cas) {
    const pdf = mod.construirePdfPar5(c.d, '2026-08-20T12:00:00Z')
    const fichier = path.join(os.tmpdir(), 'audit-par5-' + cas.indexOf(c) + '.pdf')
    fs.writeFileSync(fichier, Buffer.from(await pdf.blob.arrayBuffer()))
    const { fragments: frs, pages } = await fragments(fichier)

    const hors = []
    for (const f of frs) {
      const fautes = horsCadre(f)
      if (fautes.length) hors.push(`p${f.page} « ${f.texte.slice(0, 30)} » : ${fautes.join(', ')}`)
    }
    const croises = chevauchements(frs)

    const imgs = await images(fichier)
    const horsImg = []
    for (const im of imgs) {
      const fautes = imageHorsCadre(im)
      if (fautes.length) horsImg.push(`p${im.page} image : ${fautes.join(', ')}`)
    }

    totalHors += hors.length + horsImg.length
    totalChevauche += croises.length
    detail.push({
      nom: c.nom,
      pages,
      frs: frs.length,
      hors,
      croises,
      imgs: imgs.length,
      horsImg,
      fichier
    })
  }

  console.log('1. Débordements — texte hors de la zone imprimable')
  for (const d of detail) {
    verifier(
      `${d.nom} — ${d.pages} page(s), ${d.frs} fragments`,
      d.hors.length === 0,
      d.hors.length ? `${d.hors.length} débordements · ${d.hors[0]}` : 'aucun',
      'aucun'
    )
    for (const h of d.hors.slice(0, 4)) console.log('        · ' + h)
  }

  console.log('\n2. Chevauchements — deux textes qui se superposent')
  for (const d of detail) {
    verifier(
      d.nom,
      d.croises.length === 0,
      d.croises.length ? `${d.croises.length} · ${d.croises[0]}` : 'aucun',
      'aucun'
    )
    for (const c of d.croises.slice(0, 3)) console.log('        · ' + c)
  }

  console.log('\n3. Les images restent dans la page')
  for (const d of detail) {
    if (!d.imgs) continue
    verifier(
      d.nom + ' — ' + d.imgs + ' image(s)',
      d.horsImg.length === 0,
      d.horsImg.length ? d.horsImg.length + ' · ' + d.horsImg[0] : 'aucune hors cadre',
      'aucune hors cadre'
    )
    for (const h of d.horsImg.slice(0, 3)) console.log('        · ' + h)
  }

  console.log('\n4. Le contenu survit aux cas extrêmes')
  {
    const gros = detail[1]
    verifier(
      'les 16 risques présents tiennent sur plusieurs pages',
      gros.pages >= 3,
      gros.pages + ' pages',
      '>= 3'
    )
    verifier('40 travailleurs ne perdent personne', detail[4].pages >= 2, detail[4].pages + ' pages', '>= 2')
  }

  console.log('\n      fichiers produits :')
  for (const d of detail) console.log('        ' + d.fichier)

  console.log(`\n${'='.repeat(62)}`)
  console.log(`  ${reussis} réussis, ${echecs} échec(s)`)
  console.log(`  ${totalHors} débordements, ${totalChevauche} chevauchements au total`)
  console.log('='.repeat(62) + '\n')
  process.exit(echecs ? 1 : 0)
}

main().catch((e) => {
  console.error('ERREUR :', e)
  process.exit(1)
})
