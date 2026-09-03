import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Plus,
  Save,
  Trash2,
  RotateCcw,
  Wand2,
  Share2,
  Download,
  Camera,
  X,
  AlertTriangle,
  Info
} from 'lucide-react'
import {
  RISQUES,
  donneesPar5Vides,
  verifierPar5,
  type DonneesPar5,
  type LignePar5,
  type Manque,
  type Presence
} from '@/data/par5'
import { enregistrerPar5, poidsPhotos } from '@/data/par5-store'
import { construirePdfPar5, envoyerPdf, peutChoisirDossier } from '@/data/pdf-par5'
import { compresserPhoto, ko, poids, BUDGET_PHOTOS, PhotoTropLourde } from '@/data/photo'

/**
 * Ce que le formulaire ouvre : soit une fiche existante (avec son `id`, on la
 * met à jour), soit les données d'une fiche DUPLIQUÉE (sans `id`, c'est une
 * nouvelle analyse). La distinction tient à ce seul champ facultatif — et elle
 * compte : sans elle, reprendre la fiche de la veille écraserait celle d'hier.
 */
export interface Ouverture {
  donnees: DonneesPar5
  id?: string
}

interface Props {
  reprise: Ouverture | null
  onRepriseConsommee: () => void
  onEnregistre: () => void
  /** Previent la coque qu'il y a du travail non enregistre — le bouton
   *  Genitique redemarre l'application et ne doit pas l'emporter en silence. */
  onEnCours: (v: boolean) => void
}

function aujourdhui(): string {
  const d = new Date()
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * Formulaire PAR 5 pour téléphone.
 *
 * Le parcours suit celui du carnet papier : on identifie le chantier, on passe
 * les 16 risques un par un, on signe. La liste des risques est le cœur : chaque
 * risque se répond en UN geste (Oui / Non), et seuls les « Oui » ouvrent les
 * champs de détail — un travailleur qui n'a que trois risques présents ne
 * remplit que trois blocs.
 */
export function Par5Form({ reprise, onRepriseConsommee, onEnregistre, onEnCours }: Props) {
  const [d, setD] = useState<DonneesPar5>(() => {
    const v = donneesPar5Vides()
    v.travailleurs = [{ nom: '', initiales: '', date: aujourdhui() }]
    return v
  })
  const [idCourant, setIdCourant] = useState<string | undefined>(undefined)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  /** Écran de contrôle avant transmission — `null` tant qu'on ne l'a pas levé. */
  const [controle, setControle] = useState<Manque[] | null>(null)
  /** Risque dont la photo est en cours de compression (le bouton attend). */
  const [photoEnCours, setPhotoEnCours] = useState<string | null>(null)
  const [erreurPhoto, setErreurPhoto] = useState('')

  /* Reprise d'une fiche existante — ou d'une fiche DUPLIQUÉE, qui arrive sans
     identifiant et deviendra donc une nouvelle analyse. */
  useEffect(() => {
    if (!reprise) return
    setD(reprise.donnees)
    setIdCourant(reprise.id)
    setOuvert(null)
    setControle(null)
    setMessage(
      reprise.id ? '' : 'Fiche reprise. Relisez les 16 réponses : le chantier a pu changer.'
    )
    /* Une fiche ENREGISTREE qu'on rouvre est propre ; une fiche DUPLIQUEE
       (sans id) est du travail neuf, donc non enregistre des la seconde ou
       elle s'ouvre. */
    if (reprise.id) {
      ignorer.current = true
      setPropre(true)
    }
    onRepriseConsommee()
  }, [reprise, onRepriseConsommee])

  /* ------------------------------------------ travail non enregistre */

  /**
   * Y a-t-il quoi que ce soit de saisi ?
   *
   * Test VOLONTAIREMENT bon marche : il tourne a chaque frappe. Comparer deux
   * `JSON.stringify` de fiches qui portent des photos (jusqu'a 145 000
   * caracteres chacune, seize risques) ferait ramer la saisie sur un telephone
   * — on regarde donc des champs, pas des empreintes.
   */
  const aDuContenu = (v: DonneesPar5): boolean =>
    Boolean(
      v.noProjet ||
        v.installation ||
        v.emplacement ||
        v.tache ||
        v.lignes.some(
          (l) => l.present !== null || l.specification || l.moyens || l.responsable || l.photo
        ) ||
        v.travailleurs.some((t) => t.nom.trim() || t.initiales.trim())
    )

  const [propre, setPropre] = useState(true)
  /** Saute le rendu de montage, puis chaque remise a zero volontaire. */
  const ignorer = useRef(true)

  useEffect(() => {
    if (ignorer.current) {
      ignorer.current = false
      return
    }
    setPropre(false)
  }, [d])

  useEffect(() => {
    onEnCours(!propre && aDuContenu(d))
  }, [propre, d, onEnCours])

  /* Vrai sur un ordinateur, faux sur un téléphone — voir `peutChoisirDossier`. */
  const surPoste = useMemo(peutChoisirDossier, [])

  const repondus = useMemo(() => d.lignes.filter((l) => l.present !== null).length, [d.lignes])
  const presents = useMemo(() => d.lignes.filter((l) => l.present === 'oui').length, [d.lignes])

  function majLigne(risqueId: string, champs: Partial<LignePar5>): void {
    setD((v) => ({
      ...v,
      lignes: v.lignes.map((l) => (l.risqueId === risqueId ? { ...l, ...champs } : l))
    }))
  }

  function repondre(risqueId: string, present: Presence): void {
    /*
     * ⚠️ Défaut trouvé à l’essai : répondre « oui », joindre une photo, puis
     * revenir à « non » laissait la photo dans les données. Elle ne
     * s’affichait plus, ne s’imprimait plus, ne pouvait plus être retirée —
     * et continuait d’occuper le budget mémoire partagé, invisible.
     *
     * On la retire, et pas seulement pour la mémoire : une photo documente un
     * risque PRÉSENT. Le risque écarté, la photo n’a plus rien à prouver. Les
     * textes, eux, restent : ils ne coûtent rien et se relisent.
     */
    majLigne(risqueId, present === 'oui' ? { present } : { present, photo: undefined })
    /* Répondre « oui » ouvre le détail ; « non » referme et passe au suivant. */
    setOuvert(present === 'oui' ? risqueId : null)
  }

  /**
   * Joint une photo au risque présent.
   *
   * ⚠️ Le budget est vérifié APRÈS la compression — c'est seulement là qu'on
   * connaît le poids réel — mais AVANT d'attacher. L'ordre n'est pas un détail :
   * si on attachait d'abord, c'est l'enregistrement de la FICHE ENTIÈRE qui
   * échouerait, et sur un chantier perdre l'analyse parce qu'on a pris une photo
   * serait le pire résultat possible. On refuse la pièce jointe, jamais le
   * document.
   */
  async function joindrePhoto(risqueId: string, fichier: File | undefined): Promise<void> {
    if (!fichier) return
    setErreurPhoto('')
    setPhotoEnCours(risqueId)
    try {
      const url = await compresserPhoto(fichier)

      const ailleurs = poidsPhotos(idCourant)
      const memeFiche = d.lignes.reduce(
        (n, l) => n + (l.risqueId === risqueId ? 0 : poids(l.photo)),
        0
      )
      if (ailleurs + memeFiche + url.length > BUDGET_PHOTOS) {
        setErreurPhoto(
          'Mémoire des photos pleine. Retirez une photo, ou supprimez une ancienne fiche.'
        )
        return
      }
      majLigne(risqueId, { photo: url })
    } catch (e) {
      setErreurPhoto(
        e instanceof PhotoTropLourde
          ? 'Photo impossible à réduire assez. Reprenez-la de plus loin.'
          : 'Photo illisible : ' + (e instanceof Error ? e.message : String(e))
      )
    } finally {
      setPhotoEnCours(null)
    }
  }

  function nouveau(): void {
    ignorer.current = true
    setPropre(true)
    const v = donneesPar5Vides()
    v.travailleurs = [{ nom: '', initiales: '', date: aujourdhui() }]
    setD(v)
    setIdCourant(undefined)
    setOuvert(null)
    setControle(null)
    setErreurPhoto('')
    setMessage('')
  }

  /**
   * « Envoyer » ne transmet plus directement : il CONTRÔLE d'abord.
   *
   * Le contrôle avertit, il n'interdit pas — il y a de vraies raisons d'envoyer
   * une fiche partielle, et un outil qui bloque se contourne. Mais on ne laisse
   * plus partir sans un mot une analyse où douze risques sur seize sont restés
   * sans réponse.
   */
  function demanderEnvoi(): void {
    const manques = verifierPar5(d)
    if (manques.length) {
      setControle(manques)
      return
    }
    void transmettre()
  }

  async function transmettre(): Promise<void> {
    setControle(null)
    setPropre(true)
    /* On enregistre d abord : une fiche qu on transmet ne doit pas pouvoir se
       perdre parce que le partage a échoué ou que le téléphone s est éteint. */
    const r = enregistrerPar5(d, idCourant)
    setIdCourant(r.id)
    try {
      const issue = await envoyerPdf(construirePdfPar5(d, r.dateISO))
      setMessage(
        issue === 'enregistre'
          ? 'PDF enregistré à l’endroit choisi.'
          : issue === 'partage'
            ? 'PDF transmis.'
            : issue === 'telecharge'
              ? 'PDF enregistré dans les téléchargements.'
              : 'Enregistrement annulé — la fiche, elle, reste enregistrée.'
      )
    } catch (e) {
      setMessage('PDF impossible à produire : ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  function enregistrer(): void {
    setPropre(true)
    const r = enregistrerPar5(d, idCourant)
    setIdCourant(r.id)
    setMessage(
      r.persiste
        ? 'Fiche enregistrée sur ' + (surPoste ? 'ce poste' : 'le téléphone') + '.'
        : 'Enregistrement impossible (mémoire pleine).'
    )
    if (r.persiste) window.setTimeout(onEnregistre, 700)
  }

  return (
    <div className="px-4 pb-40 pt-4">
      {/* ---------------------------------------------------- le chantier */}
      <Bloc titre="Le chantier">
        <Champ libelle="No de projet">
          <input
            type="text"
            inputMode="text"
            value={d.noProjet}
            onChange={(e) => setD({ ...d, noProjet: e.target.value })}
            placeholder="HQC26-075"
          />
        </Champ>
        <Champ libelle="Installation">
          <input
            type="text"
            value={d.installation}
            onChange={(e) => setD({ ...d, installation: e.target.value })}
            placeholder="Poste St-François"
          />
        </Champ>
        <Champ libelle="Emplacement">
          <input
            type="text"
            value={d.emplacement}
            onChange={(e) => setD({ ...d, emplacement: e.target.value })}
            placeholder="Salle de commande"
          />
        </Champ>
        <Champ libelle="Tâche à exécuter">
          <textarea
            value={d.tache}
            onChange={(e) => setD({ ...d, tache: e.target.value })}
            placeholder="Décrire le travail prévu"
          />
        </Champ>
      </Bloc>

      {/* ---------------------------------------------------- les risques */}
      <div className="mb-2 mt-7 flex items-baseline justify-between">
        <h2 className="text-[17px] font-semibold text-gtq-texte">Les risques</h2>
        <span className="text-[13px] text-gtq-texte2">
          {repondus} / {RISQUES.length} répondus
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-gtq-surface">
        <div
          className="h-full rounded-full bg-gtq-vert transition-[width] duration-300"
          style={{ width: `${(repondus / RISQUES.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-2.5">
        {RISQUES.map((r) => {
          const l = d.lignes.find((x) => x.risqueId === r.id)!
          const estOuvert = ouvert === r.id
          return (
            <li
              key={r.id}
              className={`overflow-hidden rounded-xl border ${
                l.present === 'oui'
                  ? 'border-gtq-orange/60 bg-gtq-orange/[0.07]'
                  : l.present === 'non'
                    ? 'border-gtq-filet bg-gtq-surface/40'
                    : 'border-gtq-filet bg-gtq-surface'
              }`}
            >
              <div className="p-3">
                <div className="mb-2.5 flex items-start gap-2">
                  <span className="flex-1 text-[15px] font-medium leading-snug text-gtq-texte">
                    {r.nom}
                  </span>
                  {/* Un risque replié ne montre plus sa photo : le trombone le
                      dit, sinon on croit l'avoir perdue. */}
                  {l.photo && !estOuvert && (
                    <Camera
                      size={16}
                      className="shrink-0 text-gtq-texte2"
                      aria-label="Photo jointe"
                    />
                  )}
                  {l.present === 'oui' && (
                    <button
                      type="button"
                      onClick={() => setOuvert(estOuvert ? null : r.id)}
                      aria-label={estOuvert ? 'Replier le détail' : 'Ouvrir le détail'}
                      className="shrink-0 rounded-lg p-1.5 text-gtq-texte2"
                    >
                      <ChevronDown
                        size={20}
                        className={`transition-transform ${estOuvert ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <BoutonReponse
                    actif={l.present === 'non'}
                    ton="neutre"
                    onClick={() => repondre(r.id, l.present === 'non' ? null : 'non')}
                  >
                    Non
                  </BoutonReponse>
                  <BoutonReponse
                    actif={l.present === 'oui'}
                    ton="alerte"
                    onClick={() => repondre(r.id, l.present === 'oui' ? null : 'oui')}
                  >
                    Oui, présent
                  </BoutonReponse>
                </div>
              </div>

              {l.present === 'oui' && estOuvert && (
                <div className="space-y-3 border-t border-gtq-filet/70 px-3 pb-3.5 pt-3">
                  <p className="text-[13px] leading-snug text-gtq-texte2">{r.description}</p>

                  <Champ libelle="Précisions sur le risque">
                    <textarea
                      value={l.specification}
                      onChange={(e) => majLigne(r.id, { specification: e.target.value })}
                      placeholder="Ce qui est présent, où, dans quelles conditions"
                    />
                  </Champ>

                  <Champ libelle="Moyens de prévention">
                    <textarea
                      value={l.moyens}
                      onChange={(e) => majLigne(r.id, { moyens: e.target.value })}
                      placeholder="Ce qui sera mis en place"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        majLigne(r.id, {
                          moyens: l.moyens ? `${l.moyens}\n${r.moyens}` : r.moyens
                        })
                      }
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gtq-filet px-3 py-2 text-[13px] text-gtq-texte2"
                    >
                      <Wand2 size={15} aria-hidden="true" /> Insérer les moyens du carnet
                    </button>
                  </Champ>

                  <Champ libelle="Responsable">
                    <input
                      type="text"
                      value={l.responsable}
                      onChange={(e) => majLigne(r.id, { responsable: e.target.value })}
                      placeholder="Nom ou titre"
                    />
                  </Champ>

                  <button
                    type="button"
                    onClick={() => majLigne(r.id, { realise: !l.realise })}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-gtq-filet px-3 py-3"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                        l.realise
                          ? 'border-gtq-vert bg-gtq-vert encre-pastille'
                          : 'border-gtq-filet bg-gtq-surface'
                      }`}
                    >
                      {l.realise && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                    </span>
                    <span className="text-[15px] text-gtq-texte">Moyens mis en place</span>
                  </button>

                  {/* ------------------------------------------- la photo *
                   * Pas de `capture="environment"` : cet attribut force
                   * l'appareil photo et retire l'accès à la pellicule. Or on
                   * photographie souvent AVANT d'ouvrir la fiche — le
                   * travailleur constate, puis remplit. Sans l'attribut, le
                   * téléphone propose les deux, et c'est lui qui décide. */}
                  {l.photo ? (
                    <div className="rounded-lg border border-gtq-filet bg-gtq-surface p-2">
                      <img
                        src={l.photo}
                        alt={'Photo jointe au risque ' + r.nom}
                        className="block max-h-56 w-full rounded-md object-contain"
                      />
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[12px] text-gtq-texte2">
                          Photo jointe · {ko(l.photo)} Ko
                        </span>
                        <button
                          type="button"
                          onClick={() => majLigne(r.id, { photo: undefined })}
                          className="inline-flex min-h-[44px] items-center gap-1.5 px-2 text-[13px] text-gtq-texte2"
                        >
                          <X size={16} aria-hidden="true" /> Retirer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gtq-filet px-3 py-3 text-[14px] text-gtq-texte2">
                      <Camera size={17} aria-hidden="true" />
                      {photoEnCours === r.id ? 'Compression en cours…' : 'Joindre une photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={photoEnCours !== null}
                        onChange={(e) => {
                          void joindrePhoto(r.id, e.target.files?.[0])
                          /* On vide le champ : sans ça, rechoisir LE MÊME
                             fichier après un retrait ne déclenche pas
                             `change` et le bouton parait mort. */
                          e.target.value = ''
                        }}
                      />
                    </label>
                  )}
                  {erreurPhoto && (
                    <p className="flex items-start gap-1.5 text-[13px] text-gtq-orange">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {erreurPhoto}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* ------------------------------------------------ les travailleurs */}
      <Bloc titre="Travailleurs" className="mt-7">
        <ul className="space-y-3">
          {d.travailleurs.map((t, i) => (
            <li key={i} className="rounded-xl border border-gtq-filet bg-gtq-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-medium text-gtq-texte2">
                  Travailleur {i + 1}
                </span>
                {d.travailleurs.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Retirer le travailleur ${i + 1}`}
                    onClick={() =>
                      setD({ ...d, travailleurs: d.travailleurs.filter((_, j) => j !== i) })
                    }
                    className="rounded-lg p-1.5 text-gtq-texte2"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={t.nom}
                  onChange={(e) => {
                    const l = [...d.travailleurs]
                    l[i] = { ...l[i], nom: e.target.value }
                    setD({ ...d, travailleurs: l })
                  }}
                  placeholder="Nom"
                />
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={t.initiales}
                    onChange={(e) => {
                      const l = [...d.travailleurs]
                      l[i] = { ...l[i], initiales: e.target.value }
                      setD({ ...d, travailleurs: l })
                    }}
                    placeholder="Initiales"
                    className="!w-2/5"
                  />
                  <input
                    type="date"
                    value={t.date}
                    onChange={(e) => {
                      const l = [...d.travailleurs]
                      l[i] = { ...l[i], date: e.target.value }
                      setD({ ...d, travailleurs: l })
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() =>
            setD({
              ...d,
              travailleurs: [...d.travailleurs, { nom: '', initiales: '', date: aujourdhui() }]
            })
          }
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gtq-filet px-3.5 py-2.5 text-[14px] text-gtq-texte"
        >
          <Plus size={17} aria-hidden="true" /> Ajouter un travailleur
        </button>
      </Bloc>

      {/* -------------------------------------------------- barre d'action */}
      <div className="safe-bas fixed inset-x-0 bottom-[64px] z-30 border-t border-gtq-filet bg-gtq-fond/95 px-4 py-3 backdrop-blur">
        {message && (
          <p className="mb-2 text-center text-[13px] text-gtq-vert">{message}</p>
        )}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={nouveau}
            aria-label="Nouvelle fiche"
            className="shrink-0 rounded-xl border border-gtq-filet px-3.5 py-3 text-gtq-texte2"
          >
            <RotateCcw size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={enregistrer}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gtq-bleu px-3 py-3.5 text-[15px] font-semibold encre-pastille"
          >
            <Save size={18} aria-hidden="true" /> Enregistrer
          </button>
          <button
            type="button"
            onClick={demanderEnvoi}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gtq-filet px-3 py-3.5 text-[15px] font-semibold text-gtq-texte"
          >
            {/* Le bouton annonce ce qu’il va VRAIMENT faire : sur un poste il
                ouvre « Enregistrer sous », sur un téléphone le menu de
                partage. Deux gestes différents ne portent pas le même mot. */}
            {surPoste ? (
              <>
                <Download size={18} aria-hidden="true" /> Enregistrer le PDF
              </>
            ) : (
              <>
                <Share2 size={18} aria-hidden="true" /> Envoyer
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[12px] text-gtq-texte2">
          {presents} risque{presents > 1 ? 's' : ''} présent{presents > 1 ? 's' : ''} ·{' '}
          {RISQUES.length - repondus} sans réponse
        </p>
      </div>

      {controle && (
        <ControleEnvoi
          manques={controle}
          onCompleter={() => setControle(null)}
          onTransmettre={() => void transmettre()}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------- éléments */

/**
 * L'ÉCRAN DE CONTRÔLE — ce qui manque, avant de laisser partir la fiche.
 *
 * Il AVERTIT, il n'interdit pas : « Transmettre quand même » est toujours là.
 * Un outil de chantier qui bloque se contourne, et une fiche non transmise ne
 * protège personne. Mais l'ordre des deux boutons n'est pas neutre —
 * « Compléter » est le bouton plein, celui qu'on touche sans réfléchir.
 */
function ControleEnvoi({
  manques,
  onCompleter,
  onTransmettre
}: {
  manques: Manque[]
  onCompleter: () => void
  onTransmettre: () => void
}) {
  const durs = manques.filter((m) => m.gravite === 'bloquant')
  const doux = manques.filter((m) => m.gravite === 'avertissement')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Contrôle avant transmission"
      onClick={onCompleter}
    >
      <div
        className="safe-bas max-h-[85%] w-full overflow-y-auto rounded-t-2xl border-t border-gtq-filet bg-gtq-surface px-4 pb-4 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* La poignée : elle dit « ça se tire vers le bas » sans un mot. */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gtq-filet" />

        <h2 className="text-[18px] font-semibold text-gtq-texte">Avant de transmettre</h2>
        <p className="mt-1 text-[13px] text-gtq-texte2">
          {durs.length
            ? 'Un PAR 5 incomplet se retourne contre l’équipe qui l’a signé.'
            : 'La fiche est complète sur l’essentiel. Deux ou trois détails la rendraient plus utile.'}
        </p>

        <ul className="mt-4 space-y-2.5">
          {durs.map((m, i) => (
            <li key={'d' + i} className="flex items-start gap-2.5">
              <AlertTriangle
                size={17}
                className="mt-0.5 shrink-0 text-gtq-orange"
                aria-hidden="true"
              />
              <span className="text-[14px] leading-snug text-gtq-texte">{m.texte}</span>
            </li>
          ))}
          {doux.map((m, i) => (
            <li key={'a' + i} className="flex items-start gap-2.5">
              <Info size={17} className="mt-0.5 shrink-0 text-gtq-texte2" aria-hidden="true" />
              <span className="text-[14px] leading-snug text-gtq-texte2">{m.texte}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={onCompleter}
            className="w-full rounded-xl bg-gtq-bleu px-4 py-3.5 text-[15px] font-semibold encre-pastille"
          >
            Compléter la fiche
          </button>
          <button
            type="button"
            onClick={onTransmettre}
            className="w-full rounded-xl border border-gtq-filet px-4 py-3.5 text-[15px] font-medium text-gtq-texte2"
          >
            Transmettre quand même
          </button>
        </div>
      </div>
    </div>
  )
}

function Bloc({
  titre,
  children,
  className = ''
}: {
  titre: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <h2 className="mb-2.5 text-[17px] font-semibold text-gtq-texte">{titre}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Champ({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-gtq-texte2">{libelle}</span>
      {children}
    </label>
  )
}

function BoutonReponse({
  actif,
  ton,
  onClick,
  children
}: {
  actif: boolean
  ton: 'neutre' | 'alerte'
  onClick: () => void
  children: React.ReactNode
}) {
  const base = 'flex-1 rounded-lg border px-3 py-3 text-[15px] font-semibold min-h-[48px]'
  const style = actif
    ? ton === 'alerte'
      ? 'border-gtq-orange bg-gtq-orange encre-pastille'
      : 'border-gtq-texte2 bg-gtq-texte2 encre-pastille'
    : 'border-gtq-filet bg-gtq-surface text-gtq-texte2'
  return (
    <button type="button" onClick={onClick} aria-pressed={actif} className={`${base} ${style}`}>
      {children}
    </button>
  )
}
