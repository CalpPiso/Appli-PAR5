import { readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * Application terrain Génitique — compilée en UN SEUL fichier HTML autonome
 * (JS, CSS, logo et icônes inlinés). Elle s'ouvre sur un téléphone sans réseau.
 *
 *   npm run build     → dist/index.html
 *   npm run publier   → copie aussi vers le Bureau
 */

/**
 * `vite-plugin-singlefile` inline le JS, le CSS et les images référencées
 * depuis le CODE, mais laisse sortir en fichiers séparés celles référencées par
 * des balises <link> de l'index (les icônes du raccourci). Sans ce
 * post-traitement, le « fichier unique » pointe vers des images absentes.
 */
function inlinerIcones(): Plugin {
  return {
    name: 'inliner-icones',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      const indexPath = resolve(dist, 'index.html')
      let html = readFileSync(indexPath, 'utf8')

      const restants: string[] = []
      for (const fichier of readdirSync(dist)) {
        if (!/\.(png|jpe?g|svg|webp)$/i.test(fichier)) continue
        const ref = `./${fichier}`
        if (!html.includes(ref)) {
          restants.push(fichier)
          continue
        }
        const type = fichier.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
        const b64 = readFileSync(resolve(dist, fichier)).toString('base64')
        html = html.split(ref).join(`data:${type};base64,${b64}`)
        rmSync(resolve(dist, fichier))
      }

      writeFileSync(indexPath, html)
      if (restants.length) {
        console.warn(`[inliner-icones] non référencés, laissés en place : ${restants.join(', ')}`)
      }
    }
  }
}

/**
 * Le numéro de version affiché dans la barre du haut vient d'ICI, jamais d'une
 * chaîne recopiée dans le code : deux sources finissent toujours par diverger,
 * et une version qui ment est pire que pas de version du tout.
 */
const version = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf8')
).version as string

export default defineConfig({
  base: './',
  define: { __VERSION__: JSON.stringify(version) },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  plugins: [react(), tailwindcss(), viteSingleFile(), inlinerIcones()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 3_000
  }
})
