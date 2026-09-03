import { jsPDF } from 'jspdf'
import { RISQUES, type DonneesPar5 } from './par5'

/**
 * Met le PAR 5 rempli en PDF, sur le téléphone, sans réseau.
 *
 * C'est l'ENREGISTREMENT de l'analyse : il doit se lire seul, des mois plus
 * tard, sans l'application. Donc les 16 risques y figurent TOUS avec leur
 * réponse — un risque écarté est une décision, pas une absence — et les risques
 * présents sont détaillés en dessous.
 *
 * Les polices de base du PDF (Helvetica) sont encodées en WinAnsi, qui couvre
 * les accents français. On évite quand même les caractères hors de ce jeu
 * (guillemets typographiques, tirets cadratins) : ils sortiraient en charabia.
 */

const MARGE = 14
const LARGEUR = 210
const HAUTEUR = 297
const UTILE = LARGEUR - MARGE * 2

/** WinAnsi ne couvre pas tout : on ramène les signes typographiques à leur
 *  équivalent simple plutôt que de laisser passer un caractère cassé. */
function ascii(s: string): string {
  return (s || '')
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
}

function nomFichier(d: DonneesPar5): string {
  const bout = [d.noProjet, d.installation || d.tache]
    .filter(Boolean)
    .join(' - ')
    .slice(0, 60)
  const base = bout || 'PAR 5'
  return `PAR5 - ${base}`.replace(/[\\/:*?"<>|]/g, '-') + '.pdf'
}

export interface PdfPar5 {
  blob: Blob
  nom: string
}

export function construirePdfPar5(d: DonneesPar5, dateISO = new Date().toISOString()): PdfPar5 {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGE

  /** Passe à la page suivante s'il ne reste pas `place` mm. */
  const place = (mm: number): void => {
    if (y + mm <= HAUTEUR - MARGE - 8) return
    doc.addPage()
    y = MARGE
  }

  const titre = (t: string): void => {
    place(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(20)
    doc.text(ascii(t), MARGE, y)
    y += 2
    doc.setDrawColor(150)
    doc.setLineWidth(0.3)
    doc.line(MARGE, y, LARGEUR - MARGE, y)
    y += 5
  }

  /** Écrit un texte qui peut passer sur plusieurs lignes, et rend sa hauteur. */
  const paragraphe = (texte: string, x: number, largeur: number, taille = 9.5): number => {
    doc.setFontSize(taille)
    const lignes = doc.splitTextToSize(ascii(texte), largeur) as string[]
    for (const ligne of lignes) {
      place(6)
      doc.text(ligne, x, y)
      y += taille * 0.42
    }
    return lignes.length
  }

  /**
   * Écrit un texte SANS JAMAIS dépasser la largeur qu'on lui donne.
   *
   * ⚠️ C'est le défaut que l'audit géométrique a trouvé : trois `doc.text()`
   * posés à des abscisses fixes, sans borne. Un nom de travailleur un peu long
   * sortait de la feuille (jusqu'à 211 mm sur une page de 210) et recouvrait la
   * colonne voisine sur 102 mm. À l'écran on ne le voit pas ; à l'impression,
   * si. Toute écriture à position fixe passe désormais par ici.
   */
  const borne = (texte: string, x: number, largeurMax: number): void => {
    const propre = ascii(texte)
    if (!propre) return
    const lignes = doc.splitTextToSize(propre, largeurMax) as string[]
    doc.text(lignes[0] ?? '', x, y)
  }

  const champ = (libelle: string, valeur: string): void => {
    place(7)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(90)
    doc.text(ascii(libelle), MARGE, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20)
    doc.setFontSize(10)
    const largeurLib = 34
    const lignes = doc.splitTextToSize(ascii(valeur || '-'), UTILE - largeurLib) as string[]
    doc.text(lignes[0] || '-', MARGE + largeurLib, y)
    y += 5
    for (const l of lignes.slice(1)) {
      place(5)
      doc.text(l, MARGE + largeurLib, y)
      y += 5
    }
  }

  /**
   * Colle la photo jointe a un risque.
   *
   * ⚠️ Deux precautions qui ne sont pas du zele :
   *  · on lit les proportions REELLES de l'image (`getImageProperties`) au lieu
   *    de supposer du paysage — une photo prise a la verticale, etiree dans un
   *    cadre horizontal, ne montre plus rien ;
   *  · tout est sous `try` : une data URL abimee ne doit pas empecher le PDF
   *    de sortir. Le PAR 5 est le document ; la photo est une piece jointe. Si
   *    la piece jointe casse, on imprime le document et on le DIT.
   */
  const photo = (dataUrl: string): void => {
    const L_MAX = 78
    const H_MAX = 58
    let l = L_MAX
    let h = H_MAX
    try {
      const p = doc.getImageProperties(dataUrl)
      if (p.width > 0 && p.height > 0) {
        const f = Math.min(L_MAX / p.width, H_MAX / p.height)
        l = p.width * f
        h = p.height * f
      }
    } catch {
      /* proportions inconnues : on garde le cadre par defaut */
    }

    place(h + 10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(60)
    doc.text('Photo', MARGE + 3, y)
    y += 3.5

    try {
      doc.addImage(dataUrl, 'JPEG', MARGE + 3, y, l, h)
      doc.setDrawColor(170)
      doc.setLineWidth(0.2)
      doc.rect(MARGE + 3, y, l, h)
      y += h + 3
    } catch {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(120)
      doc.text('(photo jointe illisible)', MARGE + 3, y + 3)
      y += 7
    }
  }

  /* ------------------------------------------------------------- en-tête */
  doc.setFillColor(0, 0, 0)
  doc.rect(0, 0, LARGEUR, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255)
  doc.text('GÉNITIQUE', MARGE, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('PAR 5 - Analyse de risques', MARGE, 17.5)
  doc.setFontSize(9)
  const dateFr = new Date(dateISO).toLocaleDateString('fr-CA')
  doc.text(dateFr, LARGEUR - MARGE, 17.5, { align: 'right' })
  y = 30

  /* ------------------------------------------------------------ chantier */
  titre('Le chantier')
  champ('No de projet', d.noProjet)
  champ('Installation', d.installation)
  champ('Emplacement', d.emplacement)
  champ('Tâche à exécuter', d.tache)
  y += 3

  /* ------------------------------------------------------------- risques */
  const presents = d.lignes.filter((l) => l.present === 'oui')
  titre(`Les 16 risques - ${presents.length} présent(s)`)

  doc.setFontSize(9)
  for (const r of RISQUES) {
    const l = d.lignes.find((x) => x.risqueId === r.id)
    const rep = l?.present === 'oui' ? 'OUI' : l?.present === 'non' ? 'non' : '-'
    place(6)
    doc.setFont('helvetica', l?.present === 'oui' ? 'bold' : 'normal')
    doc.setTextColor(l?.present === 'oui' ? 20 : 110)
    borne(r.nom, MARGE + 12, UTILE - 12)
    doc.text(rep, MARGE, y)
    y += 5
  }
  y += 3

  /* ------------------------------------- détail des risques présents */
  if (presents.length) {
    titre('Risques présents - précisions et moyens')
    for (const l of presents) {
      const r = RISQUES.find((x) => x.id === l.risqueId)
      place(16)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(20)
      borne(r ? r.nom : l.risqueId, MARGE, UTILE)
      y += 5

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60)
      if (l.specification) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.text('Précisions', MARGE + 3, y)
        y += 4
        doc.setFont('helvetica', 'normal')
        paragraphe(l.specification, MARGE + 3, UTILE - 3)
        y += 2
      }
      if (l.moyens) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.text('Moyens de prévention', MARGE + 3, y)
        y += 4
        doc.setFont('helvetica', 'normal')
        paragraphe(l.moyens, MARGE + 3, UTILE - 3)
        y += 2
      }
      doc.setFontSize(9)
      doc.setTextColor(20)
      place(6)
      borne(
        `Responsable : ${l.responsable || '-'}     Moyens mis en place : ${l.realise ? 'OUI' : 'non'}`,
        MARGE + 3,
        UTILE - 3
      )
      y += 6
      if (l.photo) photo(l.photo)
      y += 4
    }
  }

  /* --------------------------------------------------------- travailleurs */
  const gens = d.travailleurs.filter((t) => t.nom || t.initiales)
  titre('Travailleurs')
  if (!gens.length) {
    paragraphe('Aucun travailleur inscrit.', MARGE, UTILE)
    y += 4
  }
  /*
   * Trois colonnes, chacune avec sa largeur — et un peu de jeu entre elles
   * pour qu'un nom au ras du bord ne touche pas les initiales.
   */
  const COL_NOM = MARGE
  const COL_INITIALES = MARGE + 96
  const COL_DATE = MARGE + 126
  const JEU = 4

  for (const t of gens) {
    place(12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(20)
    borne(t.nom || '-', COL_NOM, COL_INITIALES - COL_NOM - JEU)
    borne(t.initiales || '', COL_INITIALES, COL_DATE - COL_INITIALES - JEU)
    borne(t.date || '', COL_DATE, LARGEUR - MARGE - COL_DATE)
    y += 3
    doc.setDrawColor(190)
    doc.line(MARGE, y, LARGEUR - MARGE, y)
    y += 6
  }

  /* --------------------------------------------------- pied de chaque page */
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(130)
    doc.text('Génitique inc. - PAR 5', MARGE, HAUTEUR - 8)
    doc.text(`Page ${p} de ${pages}`, LARGEUR - MARGE, HAUTEUR - 8, { align: 'right' })
  }

  return { blob: doc.output('blob'), nom: nomFichier(d) }
}

/* ------------------------------------------------------ sortie du PDF */

/**
 * Un même bouton, trois appareils.
 *
 * ⚠️ Le défaut signalé : sur un POSTE, le PDF filait dans « Téléchargements »
 * sans rien demander. Chrome n'ouvre la fenêtre « Enregistrer sous » que si
 * l'option « Toujours demander où enregistrer » est cochée dans le navigateur —
 * autrement dit, l'application s'en remettait à un réglage que personne ne
 * connaît. Sur vingt fiches par semaine, retrouver le bon dossier à la main
 * devient le vrai travail.
 *
 * On demande donc explicitement, quand l'appareil sait le faire.
 */

type PoigneeFichier = {
  createWritable: () => Promise<{ write: (d: Blob) => Promise<void>; close: () => Promise<void> }>
}
type Choisisseur = (o: {
  suggestedName?: string
  id?: string
  types?: { description: string; accept: Record<string, string[]> }[]
}) => Promise<PoigneeFichier>

const choisisseur = (): Choisisseur | null => {
  const w = window as unknown as { showSaveFilePicker?: Choisisseur }
  return typeof w.showSaveFilePicker === 'function' ? w.showSaveFilePicker.bind(window) : null
}

/**
 * L'appareil sait-il ouvrir une fenêtre « Enregistrer sous » ?
 *
 * C'est aussi notre détecteur d'ORDINATEUR, et c'en est un bon : l'API
 * n'existe ni sur Chrome Android ni sur Safari iOS. L'interface s'en sert pour
 * dire « Enregistrer le PDF » sur un poste et « Envoyer » sur un téléphone —
 * le bouton doit annoncer ce qu'il va réellement faire.
 */
export const peutChoisirDossier = (): boolean => choisisseur() !== null

export type ResultatEnvoi = 'enregistre' | 'partage' | 'telecharge' | 'annule'

export async function envoyerPdf(pdf: PdfPar5): Promise<ResultatEnvoi> {
  /* --- 1. L'ordinateur : on laisse choisir le dossier ------------------ */
  const choisir = choisisseur()
  if (choisir) {
    try {
      const poignee = await choisir({
        suggestedName: pdf.nom,
        /* `id` fait rouvrir Chrome sur le DERNIER dossier choisi. Sans lui, on
           repart des Documents à chaque fois — et on range mal. */
        id: 'gtq-par5',
        types: [{ description: 'Document PDF', accept: { 'application/pdf': ['.pdf'] } }]
      })
      const flux = await poignee.createWritable()
      await flux.write(pdf.blob)
      await flux.close()
      return 'enregistre'
    } catch (e) {
      /* Fenêtre fermée : ce n'est pas une erreur. */
      if (e instanceof DOMException && e.name === 'AbortError') return 'annule'
      /* Tout le reste — notamment une page ouverte en `file://`, où Chrome
         refuse cette API — retombe sur le téléchargement, plus bas. */
    }
  }

  /* --- 2. Le téléphone : le menu de partage natif ---------------------- *
   * `canShare` doit être interrogé AVEC le fichier : plusieurs navigateurs
   * annoncent `share` mais refusent les pièces jointes. */
  const fichier = new File([pdf.blob], pdf.nom, { type: 'application/pdf' })
  const nav = navigator as Navigator & {
    canShare?: (d: ShareData) => boolean
    share?: (d: ShareData) => Promise<void>
  }
  if (nav.share && nav.canShare && nav.canShare({ files: [fichier] })) {
    try {
      await nav.share({ files: [fichier], title: pdf.nom })
      return 'partage'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'annule'
      /* Tout autre échec : on retombe sur le téléchargement. */
    }
  }

  /* --- 3. Le dernier recours : le téléchargement ----------------------- */
  const url = URL.createObjectURL(pdf.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = pdf.nom
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'telecharge'
}
