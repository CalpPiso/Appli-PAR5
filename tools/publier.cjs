/*
 * Copie l'application compilée sur le Bureau, prête à être envoyée sur un
 * téléphone (ou déposée sur un partage pour être ajoutée à l'écran d'accueil).
 *
 *   node tools/publier.cjs
 */
'use strict'
const fs = require('fs')
const os = require('os')
const path = require('path')

const SOURCE = path.resolve(__dirname, '../dist/index.html')
const CIBLE = path.join(os.homedir(), 'Desktop', 'Génitique PAR 5.html')

if (!fs.existsSync(SOURCE)) {
  console.error('dist/index.html introuvable — lancer « npm run build » d’abord.')
  process.exit(1)
}

fs.copyFileSync(SOURCE, CIBLE)
const ko = Math.round(fs.statSync(CIBLE).size / 1024)
console.log(`publié : ${CIBLE} (${ko} Ko)`)
