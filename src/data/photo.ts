/**
 * PHOTO JOINTE À UN RISQUE PRÉSENT.
 *
 * « Présence d'hydrogène près des batteries » se décrit en trois lignes ; une
 * photo le montre. Le carnet papier ne peut pas, le téléphone oui. Ça n'ajoute
 * aucune colonne au modèle GTQ : c'est une pièce jointe à une case qui existe.
 *
 * ⚠️ TOUT LE PROBLÈME EST LA MÉMOIRE, et il est réel, pas théorique.
 * Une photo de téléphone fait 3 à 8 Mo. `localStorage` plafonne autour de 5 Mo
 * — et il stocke en UTF-16, donc UN caractère de base64 coûte DEUX octets. Une
 * seule photo brute encodée en data URL suffirait à faire échouer
 * l'enregistrement de la fiche entière. Sur un chantier, perdre la fiche parce
 * qu'on a pris une photo serait le pire résultat possible.
 *
 * D'où trois garde-fous, dans cet ordre :
 *   1. on RÉDUIT (900 px de côté) et on RECOMPRESSE en JPEG, en baissant la
 *      qualité par paliers jusqu'à tenir sous le plafond par photo ;
 *   2. on REFUSE la photo si le budget total est déjà pris, en le disant ;
 *   3. la fiche reste enregistrable sans la photo — jamais l'inverse.
 */

/** Côté le plus long, en pixels. Assez pour montrer un panneau, un cadenas,
 *  une échelle mal appuyée — c'est un constat, pas une photo d'art. */
const COTE_MAX = 900

/** Paliers de qualité JPEG essayés dans l'ordre, jusqu'à tenir sous le cap. */
const QUALITES = [0.55, 0.45, 0.35, 0.25]

/** Plafond par photo, en CARACTÈRES de data URL (≈ 105 Ko d'image réelle). */
export const CAP_PHOTO = 145_000

/** Budget total pour toutes les photos de toutes les fiches, en caractères.
 *  ≈ 1,5 M caractères, soit ~3 Mo en UTF-16 : on laisse largement la place au
 *  texte des fiches dans les 5 Mo de localStorage. */
export const BUDGET_PHOTOS = 1_500_000

/** Taille d'une data URL, en caractères — c'est l'unité qui compte ici. */
export const poids = (dataUrl: string | undefined): number => (dataUrl ? dataUrl.length : 0)

/** Poids en kilo-octets d'image réelle, pour l'afficher à l'utilisateur. */
export function ko(dataUrl: string): number {
  const virgule = dataUrl.indexOf(',')
  const base64 = virgule >= 0 ? dataUrl.length - virgule - 1 : dataUrl.length
  return Math.round((base64 * 0.75) / 1024)
}

export class PhotoTropLourde extends Error {}
export class BudgetPhotosAtteint extends Error {}

/**
 * Charge le fichier en respectant l'orientation EXIF.
 *
 * Les téléphones écrivent souvent la photo « couchée » avec une balise
 * d'orientation ; un `<canvas>` naïf la redresserait à l'envers.
 * `createImageBitmap` sait le faire, mais pas partout : d'où la reprise par
 * `<img>`, qui applique l'orientation dans les navigateurs récents.
 */
async function charger(fichier: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(fichier, { imageOrientation: 'from-image' })
    } catch {
      /* on retombe sur <img> */
    }
  }
  const url = URL.createObjectURL(fichier)
  try {
    return await new Promise<HTMLImageElement>((ok, ko2) => {
      const img = new Image()
      img.onload = () => ok(img)
      img.onerror = () => ko2(new Error('Image illisible.'))
      img.src = url
    })
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

/**
 * Réduit et recompresse. Rend une data URL JPEG garantie sous `CAP_PHOTO`,
 * ou lève `PhotoTropLourde` si même le dernier palier n'y arrive pas.
 */
export async function compresserPhoto(fichier: File): Promise<string> {
  if (!fichier.type.startsWith('image/')) throw new Error("Ce fichier n'est pas une image.")

  const src = await charger(fichier)
  const lNat = 'naturalWidth' in src ? src.naturalWidth : src.width
  const hNat = 'naturalHeight' in src ? src.naturalHeight : src.height
  if (!lNat || !hNat) throw new Error('Image de dimensions nulles.')

  /* Deux tentatives de dimension : la seconde n'est utilisée que si aucune
     qualité ne suffit à la première. Une photo très détaillée (feuillage,
     grillage) résiste à la compression mais pas à la réduction. */
  for (const cote of [COTE_MAX, 640]) {
    const f = Math.min(1, cote / Math.max(lNat, hNat))
    const l = Math.max(1, Math.round(lNat * f))
    const h = Math.max(1, Math.round(hNat * f))

    const toile = document.createElement('canvas')
    toile.width = l
    toile.height = h
    const ctx = toile.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponible.')
    /* Fond blanc : un PNG transparent aplati en JPEG donnerait du noir. */
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, l, h)
    ctx.drawImage(src as CanvasImageSource, 0, 0, l, h)

    for (const q of QUALITES) {
      const url = toile.toDataURL('image/jpeg', q)
      if (url.length <= CAP_PHOTO) {
        if ('close' in src) src.close()
        return url
      }
    }
  }

  if ('close' in src) src.close()
  throw new PhotoTropLourde('Photo trop lourde même après compression.')
}
