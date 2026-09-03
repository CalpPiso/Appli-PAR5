/**
 * PAR 5 — Carnet d'analyse de risques (« Fiche d'identification des risques et
 * préventions », Génitique). Données de référence transcrites du carnet officiel
 * (Carnet analyse_risques-R01, mise à jour janvier 2025) :
 *  - la LISTE des 16 risques avec leur description (la « spécification » à cocher),
 *  - les MOYENS DE PRÉVENTION types (pages 4-6 du carnet) → onglet « Définitions ».
 *
 * L'outil reproduit la fiche recto/verso pour la remplir, l'enregistrer et sortir
 * un PDF — sur le modèle des fiches de calcul.
 */

export interface Risque {
  id: string
  nom: string
  /** « Spécification du/des risque(s) présent(s) » — libellé de référence du carnet */
  description: string
  /** Exemples de moyens de prévention (pages 4-6) — pour l'onglet Définitions et
   *  l'insertion rapide dans le formulaire. */
  moyens: string
}

/** Les 16 risques, dans l'ordre du carnet (recto puis verso). */
export const RISQUES: Risque[] = [
  {
    id: 'chimiques',
    nom: 'Risques chimiques',
    description:
      'Présence de produits dangereux sous forme de solide, liquide, aérosol, gaz, vapeur, poussière, fumée, brouillards, autre (précisez).',
    moyens:
      "Éliminer les produits dangereux et utiliser des substituts moins toxiques, réduire la quantité de produit, s'assurer d'une ventilation adéquate. S'assurer que les capteurs de détection continue sont fonctionnels et que les équipements et contenants sont sécuritaires. Consulter les procédures et les fiches de sécurité ainsi que les étiquettes, être formé sur le SIMDUT et l'utilisation des ÉPI. Connaître le plan d'évacuation en vigueur ainsi que l'emplacement des douches de sécurité chimique."
  },
  {
    id: 'biologiques',
    nom: 'Risques biologiques',
    description:
      'Présence de micro-organismes sous forme de poussière, brume, décomposition, croissance dans un milieu humide, amiante, plomb, autre (précisez).',
    moyens:
      "Utiliser des instruments et appareils sécuritaires, utiliser des produits ou équipements plus sûrs, s'assurer que la ventilation est adéquate. Consulter les procédures, utiliser des fiches de sécurité, maîtriser les règles de biosécurité et une procédure d'entreposage sécuritaire. Manipuler et entreposer correctement les déchets biomédicaux, entretenir les lieux, assainir les outils. Être à jour dans sa vaccination, connaître l'emplacement des auto-injecteurs d'épinéphrine et les mesures d'urgence, utiliser des ÉPI."
  },
  {
    id: 'electriques',
    nom: 'Risques électriques',
    description:
      "Exposition à des pièces sous tension ou chargées, un courant de fuite, une source d'alimentation, de l'énergie emmagasinée, autre (précisez).",
    moyens:
      "Prendre connaissance des consignes de sécurité affichées, les respecter en tout temps et porter les ÉPI requis. S'assurer que toutes les pièces accessibles sont mises hors tension. Appliquer une méthode de contrôle de l'énergie électrique comme le cadenassage. S'assurer que les composantes d'un circuit de plus de 30 V sont protégées pour empêcher tout contact avec un élément sous tension. Vérifier que les appareils ou outils électriques comportent un lien à la terre par continuité des masses ou une double isolation."
  },
  {
    id: 'chocs-electriques',
    nom: 'Risques de chocs électriques',
    description:
      "Exposition à des conducteurs sous tension, contacts directs ou indirects avec des parties actives, défaut d'isolement, installation défectueuse, manipulation incorrecte d'équipements électriques, chute d'objets ou de câbles sous tension, ou exposition à des environnements humides favorisant la conductivité.",
    moyens:
      "Prendre connaissance des consignes de sécurité affichées et les respecter en tout temps. S'assurer que les équipements électriques sont hors tension avant d'intervenir. Vérifier l'intégrité des isolations et des protections contre les contacts accidentels. Utiliser des outils et équipements isolés ou à double isolation. Assurer une mise à la terre correcte de tous les appareils et circuits. Porter les ÉPI appropriés."
  },
  {
    id: 'thermiques',
    nom: 'Risques thermiques',
    description:
      'Exposition à des températures froides, chaudes ou extrêmes, à des objets ou à des matériaux, à des flammes, autre (précisez).',
    moyens:
      "Utiliser des procédés sécuritaires pour réduire l'émission de chaleur, éliminer l'exposition à la chaleur radiante, améliorer la ventilation, utiliser des équipements d'aide à la manutention, recouvrir les poignées métalliques d'isolant thermique. Prendre un temps d'acclimatation avant le travail intense, réduire le temps d'exposition aux températures extrêmes. S'assurer d'avoir accès à l'eau potable, connaître les aires de repos, porter une tenue appropriée et des ÉPI."
  },
  {
    id: 'bruit',
    nom: 'Risques de bruit',
    description: 'Exposition au bruit continu, intermittent, impulsif ou de choc, autre (précisez).',
    moyens:
      "Connaître le niveau de bruit des activités et des équipements sur lesquels on intervient et porter les ÉPI adéquats. Choisir la bonne méthode de travail. Réduire la durée d'exposition ou utiliser des protecteurs auditifs."
  },
  {
    id: 'vibrations',
    nom: 'Risques de vibrations',
    description: 'Exposition à des vibrations.',
    moyens:
      "Connaître les méthodes de travail sécuritaire et les moyens de prévention. Limiter le temps d'exposition. Porter des gants antivibrations si requis. Porter les ÉPI adéquats."
  },
  {
    id: 'mecaniques',
    nom: 'Risques mécaniques généraux',
    description:
      "Contact avec des sources d'énergie accumulée ou non, avec une forme dangereuse (pointue ou tranchante), fixe ou mobile, autre (précisez).",
    moyens:
      'Connaître les procédures de travail sécuritaire et les appliquer. Vérifier que les protections figurant sur les machines sont en place et fonctionnelles. Prendre des pauses régulières. Utiliser les ÉPI requis.'
  },
  {
    id: 'pieces-mouvement',
    nom: "Risques de pièces, d'outils et de véhicule en mouvement",
    description:
      "Risque d'happement, d'enroulement, d'entraînement, de coupure, de blessure, de sectionnement, cisaillement, de perte totale ou partielle d'un membre, autre (précisez).",
    moyens:
      "Vérifier que l'éclairage est suffisant. Prévoir des périodes de repos régulières. Respecter les méthodes de travail sécuritaires et les procédures de cadenassage. Vérifier régulièrement que les protecteurs et dispositifs de protection sont en place et en bon état. Utiliser des ÉPI."
  },
  {
    id: 'espace-clos',
    nom: "Risques d'espace clos",
    description:
      'Déficience en oxygène, présence de gaz, poussière toxique ou inflammable, présence de matière à écoulement libre, solide ou liquide, autre (précisez).',
    moyens:
      "S'assurer que le système de ventilation est adéquat. Contrôler les énergies et cadenasser à partir de l'extérieur. Connaître les procédures de sauvetage en cas d'urgence. Participer aux formations sur les pratiques de sécurité et rester informé des mises à jour. Utiliser des ÉPI et les moyens de communication appropriés."
  },
  {
    id: 'chute',
    nom: 'Risques de chute',
    description:
      "Travail en hauteur, sous une charge, sous une machine, à proximité du vide, voie de circulation encombrée, plancher glissant ou en mauvais état, autre (précisez).",
    moyens:
      "Maintenir les voies d'accès et de circulation, les passages, planchers et postes de travail en bon état, dégagés et non glissants, à l'intérieur comme à l'extérieur. Travailler à partir du sol, utiliser des appareils de levage, assurer une protection collective, adopter des méthodes de travail sécuritaires. Réaliser un entretien périodique des lieux. Porter des ÉPI adéquats."
  },
  {
    id: 'incendie-explosion',
    nom: "Risques d'incendie et d'explosion",
    description:
      "Éclat d'arc flash électrique, entreposage ou utilisation de produits inflammables, travail à chaud, environnement explosif, autre (précisez).",
    moyens:
      "Vérifier que la ventilation des lieux est adéquate, s'assurer de la présence et du bon fonctionnement d'un avertisseur de fumée et de monoxyde de carbone lorsque nécessaire. Utiliser des équipements anti-explosion. Maîtriser les méthodes de travail sécuritaires, le SIMDUT et les mesures d'urgence. Utiliser les bons ÉPI."
  },
  {
    id: 'ergonomiques',
    nom: 'Risques ergonomiques',
    description:
      'Effort statique, posture contraignante, effort excessif, mouvements répétitifs, autre (précisez).',
    moyens:
      "Sélectionner des équipements, outils, mobilier et véhicules offrant des ajustements pour des postures sécuritaires lors des efforts. Connaître les méthodes de travail, les gestes et postures à privilégier (manutention et travail statique). Intégrer des temps de pause selon l'exigence de la tâche, la température et la nature du travail. Porter des ÉPI adaptés."
  },
  {
    id: 'psychosociaux',
    nom: 'Risques psychosociaux',
    description:
      "Surcharge de travail, rythme élevé, demande psychologique élevée, conflit, exposition à un environnement de travail malsain, état d'esprit (pression, fatigue, préoccupation), autre (précisez).",
    moyens:
      "Appliquer une tolérance zéro pour la violence et le harcèlement physique ou moral. Connaître la politique contre le harcèlement. Rapporter tout fait de violence verbale ou physique dont on est témoin ou victime. Connaître le plan d'évacuation d'urgence."
  },
  {
    id: 'violences',
    nom: 'Risques de violences',
    description:
      "Comportements violents provenant de l'externe, par des collègues, par des fournisseurs, par des animaux, autre (précisez).",
    moyens:
      "Respecter la politique de tolérance zéro à la violence. En cas de comportement violent, le signaler immédiatement à un responsable et remplir un rapport d'incident selon les procédures. Connaître le plan d'évacuation et les points de rassemblement en cas de situation de violence."
  },
  {
    id: 'coactivite',
    nom: 'Risque de coactivité',
    description:
      'Risques d’interférence, chute, électrique, nuisances sonores et visuelles, autre (précisez).',
    moyens:
      "Établir une planification claire des activités de chaque équipe et organiser des réunions pour tous les intervenants. Délimiter clairement les zones de travail. Avoir une communication constante avec les autres intervenants à proximité. Effectuer des inspections fréquentes pour identifier les dangers potentiels."
  }
]

// ------------------------------------------------------------------ //
//  Enregistrement d'un PAR 5 rempli                                   //
// ------------------------------------------------------------------ //

export type Presence = 'oui' | 'non' | null

export interface LignePar5 {
  risqueId: string
  present: Presence
  /** précisions sur le(s) risque(s) présent(s) */
  specification: string
  /** moyens de prévention retenus */
  moyens: string
  /** responsable (nom / titre) */
  responsable: string
  realise: boolean
  /** Photo jointe au risque present - data URL JPEG deja compressee. Une seule
   *  par risque : voir le budget de memoire dans data/photo.ts. */
  photo?: string
}

export interface Travailleur {
  nom: string
  initiales: string
  /** date AA-MM-JJ (saisie libre) */
  date: string
}

export interface DonneesPar5 {
  noProjet: string
  installation: string
  emplacement: string
  tache: string
  lignes: LignePar5[]
  travailleurs: Travailleur[]
}

export function ligneVide(risqueId: string): LignePar5 {
  return { risqueId, present: null, specification: '', moyens: '', responsable: '', realise: false }
}

export function donneesPar5Vides(): DonneesPar5 {
  return {
    noProjet: '',
    installation: '',
    emplacement: '',
    tache: '',
    lignes: RISQUES.map((r) => ligneVide(r.id)),
    travailleurs: [{ nom: '', initiales: '', date: '' }]
  }
}

// ------------------------------------------------------------------ //
//  CONTRÔLE D'EXHAUSTIVITÉ avant transmission                         //
// ------------------------------------------------------------------ //

/**
 * Ce qui manque dans une fiche, avant de la laisser partir.
 *
 * ⚠️ Pourquoi ceci existe : `envoyer()` ne contrôlait RIEN. Une fiche avec zéro
 * risque sur seize répondu, ou un risque déclaré présent sans le moindre moyen
 * de prévention, partait en PDF sans un mot. Un PAR 5 est la pièce qu'on ressort
 * quand quelque chose est arrivé ; incomplète, elle se retourne contre l'équipe
 * qui l'a signée.
 *
 * Le contrôle AVERTIT, il n'interdit pas. Sur un chantier il y a de vraies
 * raisons d'envoyer une fiche partielle, et un outil qui bloque se contourne.
 * On nomme ce qui manque, et c'est le signataire qui décide.
 */
export type Gravite = 'bloquant' | 'avertissement'

export interface Manque {
  gravite: Gravite
  texte: string
}

export function verifierPar5(d: DonneesPar5): Manque[] {
  const m: Manque[] = []
  const nom = (id: string): string => RISQUES.find((r) => r.id === id)?.nom ?? id

  /* --- ce qui vide le document de sa substance --------------------- */

  const sansReponse = d.lignes.filter((l) => l.present === null)
  if (sansReponse.length)
    m.push({
      gravite: 'bloquant',
      texte:
        sansReponse.length === 1
          ? `1 risque sur ${RISQUES.length} n'a pas de réponse : ${nom(sansReponse[0].risqueId)}.`
          : `${sansReponse.length} risques sur ${RISQUES.length} n'ont pas de réponse.`
    })

  const presents = d.lignes.filter((l) => l.present === 'oui')

  /* Un risque reconnu présent sans moyen de prévention : c'est le seul cas où
     la fiche AGGRAVE la situation au lieu de la documenter — elle prouve qu'on
     savait, et ne montre rien qui ait été fait. */
  for (const l of presents.filter((x) => !x.moyens.trim()))
    m.push({
      gravite: 'bloquant',
      texte: `« ${nom(l.risqueId)} » est présent, mais aucun moyen de prévention n'est écrit.`
    })

  if (!d.travailleurs.some((t) => t.nom.trim() || t.initiales.trim()))
    m.push({ gravite: 'bloquant', texte: 'Aucun travailleur n\u2019est inscrit sur la fiche.' })

  /* --- ce qui la rend seulement moins utile ------------------------ */

  if (!d.tache.trim())
    m.push({ gravite: 'avertissement', texte: 'La tâche à exécuter n\u2019est pas décrite.' })

  if (!d.noProjet.trim() && !d.installation.trim())
    m.push({
      gravite: 'avertissement',
      texte: 'Ni numéro de projet ni installation : la fiche sera difficile à retrouver.'
    })

  for (const l of presents.filter((x) => !x.responsable.trim()))
    m.push({
      gravite: 'avertissement',
      texte: `« ${nom(l.risqueId)} » : aucun responsable désigné.`
    })

  const pasEnPlace = presents.filter((x) => x.moyens.trim() && !x.realise)
  if (pasEnPlace.length)
    m.push({
      gravite: 'avertissement',
      texte:
        pasEnPlace.length === 1
          ? `Les moyens de « ${nom(pasEnPlace[0].risqueId)} » ne sont pas déclarés mis en place.`
          : `${pasEnPlace.length} risques ont des moyens qui ne sont pas déclarés mis en place.`
    })

  return m
}

export const bloquants = (m: Manque[]): Manque[] => m.filter((x) => x.gravite === 'bloquant')
