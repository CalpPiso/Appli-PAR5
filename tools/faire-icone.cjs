/*
 * Fabrique les icônes d'application : le logo Génitique blanc centré sur un
 * carré noir — la même image que l'écran d'ouverture, pour que le raccourci sur
 * l'écran d'accueil annonce ce qu'on va voir.
 *
 * Trois tailles : 180 px (raccourci iOS), 192 et 512 px (manifeste Android).
 *
 *   node tools/faire-icone.cjs
 *
 * @napi-rs/canvas n'est pas installé ici : on emprunte celui de ToolApp, qui
 * est sur le même Bureau. C'est un outil de fabrication, pas une dépendance de
 * l'application — le résultat est un PNG versionné dans src/assets.
 */
'use strict'
const fs = require('fs')
const path = require('path')

const CANVAS = path.resolve(__dirname, '../../ToolApp/node_modules/@napi-rs/canvas')
if (!fs.existsSync(CANVAS)) {
  console.error(`@napi-rs/canvas introuvable à ${CANVAS}`)
  process.exit(1)
}
const { createCanvas, loadImage } = require(CANVAS)

const LOGO = path.resolve(__dirname, '../src/assets/logo-genitique.png')
const SORTIE = path.resolve(__dirname, '../src/assets')

/** Part du carré occupée par le logo — le reste est la marge de sécurité que
 *  les systèmes rognent (masque rond d'Android, coins arrondis d'iOS). */
const PROPORTION = 0.62

async function main() {
  const logo = await loadImage(LOGO)

  for (const taille of [180, 192, 512]) {
    const c = createCanvas(taille, taille)
    const ctx = c.getContext('2d')

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, taille, taille)

    const largeur = taille * PROPORTION
    const hauteur = (logo.height / logo.width) * largeur
    ctx.drawImage(logo, (taille - largeur) / 2, (taille - hauteur) / 2, largeur, hauteur)

    const fichier = path.join(SORTIE, `icone-${taille}.png`)
    fs.writeFileSync(fichier, c.toBuffer('image/png'))
    console.log(`écrit : ${path.basename(fichier)} (${Math.round(fs.statSync(fichier).size / 1024)} Ko)`)
  }
}

main().catch((e) => {
  console.error('ERREUR :', e.message)
  process.exit(1)
})
