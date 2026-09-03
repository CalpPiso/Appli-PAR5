import { useEffect, useState } from 'react'
import { X, Download, Share } from 'lucide-react'

/**
 * L'INVITATION À INSTALLER — pour avoir l'icône sur l'écran d'accueil.
 *
 * Les deux systèmes ne se ressemblent pas, et c'est ce qui gouverne ce fichier :
 *
 *  · ANDROID donne une API. Chrome émet `beforeinstallprompt` quand la page
 *    remplit ses conditions (manifeste, agent de service avec un gestionnaire
 *    `fetch`, HTTPS). On garde l'événement et on l'ouvre au moment choisi —
 *    une bannière posée par nous, au bon endroit, plutôt que la barre grise du
 *    navigateur que personne ne lit.
 *
 *  · iOS N'EN DONNE AUCUNE. Il n'existe aucun moyen de déclencher « Sur
 *    l'écran d'accueil » depuis une page : c'est un choix d'Apple. On ne peut
 *    donc qu'EXPLIQUER le geste. D'où le pictogramme de partage dans le texte :
 *    le bouton à toucher ne porte pas de mot dans Safari, seulement cette
 *    icône-là.
 *
 * La bannière ne s'affiche jamais si l'app tourne déjà installée, ni sur une
 * page ouverte depuis le Bureau (`file://`), où rien de tout ça n'existe.
 */

const CLE_MASQUE = 'gtq-par5-installation-masquee'

type EvenementInstallation = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** L'application tourne-t-elle DÉJÀ depuis l'écran d'accueil ? */
function dejaInstallee(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  /* Le drapeau propriétaire d'iOS, qui ignore `display-mode`. */
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function surIOS(): boolean {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  /* Un iPad récent se présente comme un Mac : seul le tactile le trahit. */
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export function Installer() {
  const [invite, setInvite] = useState<EvenementInstallation | null>(null)
  const [masque, setMasque] = useState(() => {
    try {
      return localStorage.getItem(CLE_MASQUE) === '1'
    } catch {
      return false
    }
  })
  /* Calculé à chaque rendu, pas figé dans un `useState` : l'agent utilisateur
     ne change jamais en cours de route, donc figer n'économise rien — et ça
     rendait la branche iOS impossible à éprouver depuis un poste Windows. */
  const ios = surIOS()
  const [installee, setInstallee] = useState(dejaInstallee)

  useEffect(() => {
    const capter = (e: Event): void => {
      /* On empêche la barre native pour poser la nôtre à la place. */
      e.preventDefault()
      setInvite(e as EvenementInstallation)
    }
    const posee = (): void => {
      setInstallee(true)
      setInvite(null)
    }
    window.addEventListener('beforeinstallprompt', capter)
    window.addEventListener('appinstalled', posee)
    return () => {
      window.removeEventListener('beforeinstallprompt', capter)
      window.removeEventListener('appinstalled', posee)
    }
  }, [])

  function fermer(): void {
    setMasque(true)
    try {
      localStorage.setItem(CLE_MASQUE, '1')
    } catch {
      /* mémoire pleine : la bannière reviendra, ce n'est pas grave */
    }
  }

  async function installer(): Promise<void> {
    if (!invite) return
    await invite.prompt()
    const { outcome } = await invite.userChoice
    setInvite(null)
    if (outcome === 'accepted') setInstallee(true)
  }

  if (installee || masque) return null
  if (!location.protocol.startsWith('http')) return null
  /* Sur Android on attend l'événement ; sur iOS il ne viendra jamais. */
  if (!invite && !ios) return null

  return (
    <div className="shrink-0 border-b border-gtq-filet bg-gtq-surface px-4 py-2.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {ios ? (
            <p className="text-[13px] leading-snug text-gtq-texte">
              Pour garder PAR 5 sur l’écran d’accueil : touchez{' '}
              <Share size={14} className="inline align-[-2px] text-gtq-bleu" aria-hidden="true" />{' '}
              <span className="font-medium">Partager</span>, puis{' '}
              <span className="font-medium">« Sur l’écran d’accueil »</span>.
            </p>
          ) : (
            <p className="text-[13px] leading-snug text-gtq-texte">
              Installer PAR 5 sur l’écran d’accueil — l’app s’ouvre alors en plein écran et
              fonctionne sans réseau.
            </p>
          )}
        </div>

        {!ios && (
          <button
            type="button"
            onClick={() => void installer()}
            className="shrink-0 rounded-lg bg-gtq-bleu px-3 py-2 text-[13px] font-semibold encre-pastille"
          >
            <span className="flex items-center gap-1.5">
              <Download size={15} aria-hidden="true" /> Installer
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={fermer}
          aria-label="Masquer cette invitation"
          className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gtq-texte2"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
