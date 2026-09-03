/*
 * FABRIQUE LA VERSION INSTALLABLE SUR TÉLÉPHONE (dist-web/).
 *
 * Pourquoi une SECONDE sortie plutôt qu'un seul fichier ?
 *
 * Le fichier unique posé sur le Bureau est parfait pour un poste : on double-
 * clique, ça s'ouvre. Mais une icône sur l'écran d'accueil d'un téléphone n'est
 * pas un fichier, c'est une PAGE — et il en faut trois choses que le fichier
 * unique ne peut pas porter :
 *
 *  1. un MANIFESTE (`manifest.webmanifest`), sans lequel Android ne propose
 *     jamais « Installer l'application » ;
 *  2. un AGENT DE SERVICE (`sw.js`), qui met tout en cache et fait marcher
 *     l'app sans réseau — sur un chantier, c'est la moitié de l'intérêt.
 *     ⚠️ Un agent de service DOIT être un fichier à part : le navigateur
 *     refuse un script d'agent en `blob:` ou en `data:`. C'est cette règle-là,
 *     et pas un choix d'architecture, qui impose un dossier ;
 *  3. des ICÔNES en vrais fichiers, aux noms stables, parce que le manifeste
 *     les référence par leur chemin.
 *
 * dist-web/ se dépose tel quel sur n'importe quel hébergement en HTTPS.
 *
 *   node tools/construire-web.cjs
 */
'use strict'
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const RACINE = path.resolve(__dirname, '..')
const DIST = path.join(RACINE, 'dist')
const WEB = path.join(RACINE, 'dist-web')
const ASSETS = path.join(RACINE, 'src/assets')

const ENTREE = path.join(DIST, 'index.html')
if (!fs.existsSync(ENTREE)) {
  console.error('dist/index.html introuvable — lancer « npx vite build » d’abord.')
  process.exit(1)
}

fs.rmSync(WEB, { recursive: true, force: true })
fs.mkdirSync(WEB, { recursive: true })

/* ------------------------------------------------------------- icônes */
const ICONES = ['icone-180.png', 'icone-192.png', 'icone-512.png']
for (const i of ICONES) {
  const src = path.join(ASSETS, i)
  if (!fs.existsSync(src)) {
    console.error(`${i} introuvable — lancer « node tools/faire-icone.cjs ».`)
    process.exit(1)
  }
  fs.copyFileSync(src, path.join(WEB, i))
}

/* ----------------------------------------------------------- manifeste */
/*
 * `purpose: "any maskable"` sur la même image : Android rogne l'icône en rond
 * ou en écusson selon le lanceur, et ne garde que le cercle de 80 % du côté.
 * Notre logo occupe 62 % du carré et est centré — sa demi-largeur est donc à
 * 31 % du centre, sous le rayon de 40 % du masque. Il passe sans être coupé.
 * Sans `maskable`, Android replace l'icône dans une pastille blanche et le
 * carré noir de la marque disparaît.
 */
const manifeste = {
  name: 'Génitique PAR 5',
  short_name: 'PAR 5',
  description: 'Analyse de risques PAR 5 — Génitique',
  lang: 'fr-CA',
  dir: 'ltr',
  /* Tout en relatif : l’app marche à la racine d’un domaine comme dans un
     sous-dossier, sans rien reconfigurer. */
  start_url: './',
  scope: './',
  id: './',
  display: 'standalone',
  orientation: 'portrait',
  /* Le noir de la barre du haut et de l’écran d’ouverture : l’écran de
     démarrage d’Android reprend `background_color`, donc la transition vers
     notre propre écran d’ouverture se fait sans coupure de couleur. */
  background_color: '#000000',
  theme_color: '#000000',
  categories: ['productivity', 'business'],
  icons: [
    { src: 'icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}
fs.writeFileSync(path.join(WEB, 'manifest.webmanifest'), JSON.stringify(manifeste, null, 2))

/* ------------------------------------------------------------ index.html */
let html = fs.readFileSync(ENTREE, 'utf8')

/* L’empreinte de la page EST le numéro de version du cache : si un octet
   change, l’agent de service se réinstalle. Aucun numéro à tenir à la main,
   donc aucun risque d’oublier de l’incrémenter. */
const empreinte = crypto.createHash('sha256').update(html).digest('hex').slice(0, 12)

/**
 * ⚠️ On injecte sur la DERNIÈRE occurrence de la balise, pas la première.
 *
 * vite-plugin-singlefile pose tout le bundle dans un <script> DANS L'EN-TÊTE,
 * et ce bundle contient les chaînes littérales `</head>` et `</body>`. Mesuré
 * sur cette page : `</head>` apparaît à 841 859 octets (dans le JavaScript) et
 * à 1 027 731 (la vraie balise). Un `String.replace()` naïf vise la première —
 * autrement dit, il écrit au milieu du code.
 *
 * Le piège ne se voit pas : la page se charge encore, l'application marche, et
 * seul le manifeste n'existe pas. Android n'offre alors jamais l'installation,
 * sans le moindre message. C'est comme ça qu'on l'a trouvé.
 */
const injecter = (source, balise, contenu) => {
  const i = source.lastIndexOf(balise)
  if (i < 0) {
    console.error('pas de ' + balise + ' dans dist/index.html')
    process.exit(1)
  }
  return source.slice(0, i) + contenu + source.slice(i)
}

html = injecter(html, '</head>', '  <link rel="manifest" href="manifest.webmanifest" />\n  ')

const ENREGISTREMENT = `    <script>
      /*
       * L'agent de service : l'app fonctionne sans réseau une fois ouverte.
       *
       * Il n'est enregistré qu'en http(s). Sur une page ouverte depuis le
       * Bureau (file://), le navigateur refuse — et ce n'est pas une erreur,
       * c'est le mode de distribution de l'autre version.
       */
      if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('sw.js').catch(function (e) {
            console.warn('[par5] agent de service non enregistré :', e && e.message)
          })
        })
      }
    </script>
  `
html = injecter(html, '</body>', ENREGISTREMENT)

fs.writeFileSync(path.join(WEB, 'index.html'), html)

/* ------------------------------------------------------ agent de service */
const FICHIERS = ['./', './index.html', './manifest.webmanifest', ...ICONES.map((i) => './' + i)]

const sw = `/*
 * Agent de service du PAR 5 — fabriqué par tools/construire-web.cjs.
 * NE PAS ÉDITER À LA MAIN : il est réécrit à chaque construction.
 *
 * Stratégie : LE CACHE D'ABORD. C'est le bon choix ici et pas ailleurs — un
 * PAR 5 se remplit dans une salle de batteries, un poste de transformation, un
 * sous-sol. Il n'y a pas de réseau, et une application qui attend le réseau
 * avant de s'afficher est inutilisable. Tout tient dans un seul fichier HTML,
 * donc il n'y a aucun risque de servir un mélange d'anciennes et de nouvelles
 * ressources.
 *
 * La version est l'empreinte de la page : elle change quand la page change,
 * jamais autrement.
 */
const VERSION = 'par5-${empreinte}'
const FICHIERS = ${JSON.stringify(FICHIERS, null, 2)}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(FICHIERS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  /* On ne touche qu'aux lectures, et qu'à notre propre origine. */
  if (e.request.method !== 'GET') return
  if (new URL(e.request.url).origin !== self.location.origin) return

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cache) => {
      if (cache) return cache
      return fetch(e.request).catch(() =>
        /* Hors réseau et hors cache : c'est une navigation, on rend la page.
           Sans ça, rouvrir l'app dans le tunnel donnerait le dinosaure. */
        e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()
      )
    })
  )
})
`
fs.writeFileSync(path.join(WEB, 'sw.js'), sw)

/* ------------------------------------------------------------- rapport */
const ko = (f) => Math.round(fs.statSync(path.join(WEB, f)).size / 1024)
console.log('\ndist-web/ construit — version ' + empreinte + '\n')
for (const f of fs.readdirSync(WEB).sort()) console.log('  ' + String(ko(f)).padStart(5) + ' Ko  ' + f)
console.log('\nÀ déposer tel quel sur un hébergement HTTPS.\n')
