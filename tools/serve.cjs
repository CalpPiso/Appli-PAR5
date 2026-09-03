/* Petit serveur statique pour prévisualiser le rendu compilé (out/renderer). */
const http = require('http')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', process.argv[3] || 'out/renderer')
const port = parseInt(process.argv[2] || process.env.PORT || '4178', 10)
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
}

http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0])
    if (p === '/') p = '/index.html'
    const f = path.join(root, p)
    fs.readFile(f, (e, d) => {
      if (e) {
        res.writeHead(404)
        res.end('not found')
      } else {
        res.writeHead(200, {
          'content-type': types[path.extname(f)] || 'application/octet-stream',
          'Cache-Control': 'no-store'
        })
        res.end(d)
      }
    })
  })
  .listen(port, () => console.log('serving ' + root + ' on http://localhost:' + port))
