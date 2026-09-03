/* Contrôle des contrastes des deux thèmes. node tools/contraste.cjs */
'use strict'
const hex = (h) => { const n = h.replace('#',''); return [0,2,4].map(i => parseInt(n.slice(i,i+2),16)) }
const lin = (c) => { const s = c/255; return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4) }
const lum = (h) => { const [r,g,b] = hex(h).map(lin); return 0.2126*r + 0.7152*g + 0.0722*b }
const ratio = (a,b) => { const [x,y] = [lum(a), lum(b)].sort((p,q) => q-p); return (x+0.05)/(y+0.05) }

const T = {
  sombre: { fond:'#0e1418', surface:'#18212a', filet:'#2b3944', texte:'#f2f6f8', texte2:'#a9bac6', bleu:'#1c94c4', orange:'#e58a2a', vert:'#6fb63f' },
  clair:  { fond:'#f1f4f6', surface:'#ffffff', filet:'#ccd6dd', texte:'#0f1a21', texte2:'#4a5b66', bleu:'#10688c', orange:'#8a4b06', vert:'#2f6b12' }
}

let echecs = 0
function porte(nom, fg, bg, min = 4.5) {
  const r = ratio(fg, bg)
  const ok = r >= min
  if (!ok) echecs++
  console.log(`  ${ok ? '\u2713' : '\u2717'} ${nom.padEnd(44)} ${r.toFixed(2)}:1 (min ${min})`)
  return r
}

for (const [nom, c] of Object.entries(T)) {
  console.log(`\n=== thème ${nom} ===`)
  porte('texte sur fond', c.texte, c.fond)
  porte('texte sur surface', c.texte, c.surface)
  porte('texte2 sur fond', c.texte2, c.fond)
  porte('texte2 sur surface', c.texte2, c.surface)
  porte('filet sur fond (limite 3:1)', c.filet, c.fond, 3)
  console.log('  -- boutons pleins, encre NOIRE --')
  porte('noir sur orange', '#000000', c.orange)
  porte('noir sur vert', '#000000', c.vert)
  porte('noir sur texte2 (bouton Non)', '#000000', c.texte2)
  porte('blanc sur bleu (Enregistrer)', '#ffffff', c.bleu, 3)
  console.log('  -- variante : encre BLANCHE --')
  porte('blanc sur orange', '#ffffff', c.orange)
  porte('blanc sur vert', '#ffffff', c.vert)
  porte('blanc sur texte2', '#ffffff', c.texte2)
  console.log('  -- barre noire (invariante) --')
  porte('blanc sur noir', '#ffffff', '#000000')
  porte('blanc 75% sur noir', '#bfbfbf', '#000000')
}
console.log(`\n${echecs} porte(s) en échec`)
