/**
 * Enregistrement des PAR 5 (analyses de risques remplies). Persistés sur le
 * poste (localStorage). Même patron tolérant + versionné que calculs-store.
 */
import {
  RISQUES,
  ligneVide,
  type DonneesPar5,
  type LignePar5,
  type Presence,
  type Travailleur
} from './par5'

export interface Par5Enregistre {
  id: string
  /**
   * La date de L'ANALYSE — celle du premier enregistrement, et elle ne bouge
   * plus.
   *
   * ⚠️ Défaut corrigé : chaque sauvegarde la remplaçait par la date du jour.
   * Rouvrir une fiche d'il y a trois semaines pour corriger une faute de frappe
   * la redatait donc à aujourd'hui — dans la liste ET dans l'en-tête du PDF.
   * Pour un document de sécurité qu'on ressort des mois plus tard, la date de
   * l'analyse est une donnée, pas un horodatage de fichier.
   */
  dateISO: string
  /** Dernière modification — pour savoir si la fiche a été retouchée. */
  majISO?: string
  donnees: DonneesPar5
}

const CLE = 'gtq-par5'
export const SCHEMA_PAR5 = 1

const uid = (): string => 'par5-' + Math.random().toString(36).slice(2, 10)
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)

function normaliserLigne(risqueId: string, x: unknown): LignePar5 {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
  const present: Presence = o.present === 'oui' ? 'oui' : o.present === 'non' ? 'non' : null
  return {
    risqueId,
    present,
    specification: str(o.specification),
    moyens: str(o.moyens),
    responsable: str(o.responsable),
    realise: o.realise === true,
    /* On n'accepte QUE des data URL d'image : une chaine quelconque venue
       d'un stockage abime finirait dans un <img src> et dans le PDF. */
    photo:
      typeof o.photo === 'string' && o.photo.startsWith('data:image/') ? o.photo : undefined
  }
}

function normaliserDonnees(x: unknown): DonneesPar5 {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
  // Index des lignes stockées par risqueId, pour retrouver l'ordre officiel des RISQUES.
  const parId = new Map<string, unknown>()
  if (Array.isArray(o.lignes))
    for (const l of o.lignes) {
      const rid = (l && typeof l === 'object' ? (l as Record<string, unknown>).risqueId : '') as string
      if (typeof rid === 'string') parId.set(rid, l)
    }
  const lignes = RISQUES.map((r) =>
    parId.has(r.id) ? normaliserLigne(r.id, parId.get(r.id)) : ligneVide(r.id)
  )
  const travailleurs: Travailleur[] = Array.isArray(o.travailleurs)
    ? o.travailleurs.map((t) => {
        const to = (t && typeof t === 'object' ? t : {}) as Record<string, unknown>
        return { nom: str(to.nom), initiales: str(to.initiales), date: str(to.date) }
      })
    : [{ nom: '', initiales: '', date: '' }]
  return {
    noProjet: str(o.noProjet),
    installation: str(o.installation),
    emplacement: str(o.emplacement),
    tache: str(o.tache),
    lignes,
    travailleurs: travailleurs.length ? travailleurs : [{ nom: '', initiales: '', date: '' }]
  }
}

export function normaliserPar5(x: unknown): Par5Enregistre | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const id = str(o.id)
  if (!id) return null
  const dateISO =
    typeof o.dateISO === 'string' && !isNaN(Date.parse(o.dateISO)) ? o.dateISO : new Date().toISOString()
  const majISO = typeof o.majISO === 'string' && !isNaN(Date.parse(o.majISO)) ? o.majISO : undefined
  return { id, dateISO, majISO, donnees: normaliserDonnees(o.donnees) }
}

function lire(): Par5Enregistre[] {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) || '[]')
    const arr = Array.isArray(brut) ? brut : brut && Array.isArray(brut.par5) ? brut.par5 : []
    return arr.map(normaliserPar5).filter((p: Par5Enregistre | null): p is Par5Enregistre => p !== null)
  } catch {
    return []
  }
}

function ecrire(l: Par5Enregistre[]): boolean {
  try {
    localStorage.setItem(CLE, JSON.stringify({ v: SCHEMA_PAR5, par5: l }))
    return true
  } catch {
    console.error('[par5-store] Écriture localStorage échouée (quota ?) — non persisté.')
    return false
  }
}

export function listerPar5(): Par5Enregistre[] {
  return lire().sort((a, b) => b.dateISO.localeCompare(a.dateISO))
}

export function enregistrerPar5(donnees: DonneesPar5, id?: string): Par5Enregistre & { persiste: boolean } {
  const l = lire()
  const rid = id ?? uid()
  const i = l.findIndex((x) => x.id === rid)
  const maintenant = new Date().toISOString()

  /* On CONSERVE la date de l'analyse quand la fiche existe déjà ; seule la
     date de modification suit. */
  const rec: Par5Enregistre = {
    id: rid,
    dateISO: i >= 0 ? l[i].dateISO : maintenant,
    majISO: maintenant,
    donnees
  }
  if (i >= 0) l[i] = rec
  else l.push(rec)
  return { ...rec, persiste: ecrire(l) }
}

/** La fiche a-t-elle été retouchée après le jour de l'analyse ? */
export function retouchee(p: Par5Enregistre): boolean {
  if (!p.majISO) return false
  return p.majISO.slice(0, 10) !== p.dateISO.slice(0, 10)
}

/**
 * REPRENDRE LA FICHE DE LA VEILLE.
 *
 * Une equipe fait la meme tache trois jours de suite : les seize reponses sont
 * identiques, seules les dates changent. Aujourd'hui il faut tout recocher —
 * donc on recoche vite, donc on ne relit plus. Le but n'est pas de gagner du
 * temps, c'est de rendre a l'analyse une chance d'etre RELUE plutot que
 * retapee.
 *
 * Ce qui est repris : le chantier, les seize reponses, les moyens, les
 * responsables. Ce qui est REMIS A ZERO :
 *  · les dates de signature — on ne recopie pas la signature d'hier ;
 *  · « moyens mis en place » — c'est un constat du jour, il se refait ;
 *  · les photos — elles montraient le chantier d'hier, et les garder
 *    consommerait le budget memoire pour rien.
 */
export function dupliquerPar5(source: Par5Enregistre, dateJour: string): DonneesPar5 {
  const d = source.donnees
  return {
    noProjet: d.noProjet,
    installation: d.installation,
    emplacement: d.emplacement,
    tache: d.tache,
    lignes: d.lignes.map((l) => ({
      risqueId: l.risqueId,
      present: l.present,
      specification: l.specification,
      moyens: l.moyens,
      responsable: l.responsable,
      realise: false,
      photo: undefined
    })),
    travailleurs: d.travailleurs
      .filter((t) => t.nom.trim() || t.initiales.trim())
      .map((t) => ({ nom: t.nom, initiales: t.initiales, date: dateJour }))
  }
}

/**
 * Poids total des photos deja stockees, en caracteres — pour refuser une
 * piece jointe AVANT qu'elle ne fasse echouer l'enregistrement de la fiche.
 * `exclureId` ecarte la fiche en cours d'edition, dont les photos vont etre
 * reecrites et non ajoutees.
 */
export function poidsPhotos(exclureId?: string): number {
  let n = 0
  for (const p of lire()) {
    if (p.id === exclureId) continue
    for (const l of p.donnees.lignes) n += l.photo ? l.photo.length : 0
  }
  return n
}

export function supprimerPar5(id: string): boolean {
  return ecrire(lire().filter((p) => p.id !== id))
}
