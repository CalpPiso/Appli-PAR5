import { useEffect, useRef, useState } from 'react'
import logoUrl from '@/assets/logo-genitique.png'

/**
 * ÉCRAN D'OUVERTURE — le logo en grand sur fond noir, qui se rétracte pour
 * devenir la barre du haut.
 *
 * L'IDÉE (reprise de l'app JGT) : l'écran d'ouverture est de la MÊME couleur
 * que la barre de l'application. Il occupe tout l'écran, logo au centre, puis
 * il se rétracte vers le haut jusqu'à la hauteur exacte de la barre et
 * s'efface. Comme la vraie barre se trouve juste dessous, au même endroit et de
 * la même couleur, on ne voit aucune coupure : l'écran d'ouverture « devient »
 * la barre. Aucune position en pixels à mesurer, donc rien à recaler selon la
 * taille de l'écran — ce qui compte sur téléphone.
 *
 * ⚠ La rétraction est faite en CSS, PAS avec `motion`. Mesuré sur cette page :
 * un `animate={{ height }}` de motion posait bien la hauteur de départ puis ne
 * repartait jamais, alors que le composant se rendait bien une deuxième fois
 * avec la bonne cible (relevé : rendu à t=1083 ms avec ferme=true, mais
 * `style.height` resté à 812px jusqu'au démontage). Deux valeurs en pixels et
 * une transition CSS : rien à interpréter, et c'est le compositeur du téléphone
 * qui travaille.
 *
 * Respects tenus :
 *  · une touche ou un toucher passe l'animation — on ne fait pas attendre ;
 *  · `prefers-reduced-motion` → aucune animation, l'app s'ouvre directement ;
 *  · l'écran n'est jamais bloquant, il se retire tout seul.
 */

/** Hauteur de la barre du haut — la cible de la rétraction. */
export const HAUTEUR_BARRE = 56

/*
 * Une ouverture PLUS LENTE, demandée pour la présentation à la direction.
 * 550/450/620 ms devient 900/800/1000 : 2,7 s en tout au lieu de 1,62 s.
 * Le « PAR 5 » entre à 320 ms après le logo, donc il a le temps de se lire
 * avant la rétraction — c est ce que 1,6 s ne permettait pas.
 */
const ENTREE = 900
const PAUSE = 800
const RETRACTE = 1000
const COURBE = 'cubic-bezier(0.65, 0, 0.35, 1)'

function mouvementReduit(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function SplashGtq({ onFini }: { onFini: () => void }) {
  const [sansMouvement] = useState(mouvementReduit)
  /* Hauteur de départ en PIXELS : une transition n'interpole pas « 100% »
     vers une valeur en pixels. */
  const [hauteurDepart] = useState(() => window.innerHeight)
  const [entre, setEntre] = useState(false)
  const [ferme, setFerme] = useState(false)
  const deja = useRef(false)

  const fermer = (immediat = false): void => {
    if (deja.current) return
    deja.current = true
    setFerme(true)
    window.setTimeout(onFini, immediat ? 0 : RETRACTE + 60)
  }

  /* Le logo entre au premier cadre, puis l'écran se rétracte. */
  useEffect(() => {
    if (sansMouvement) {
      fermer(true)
      return
    }
    // Deux déclencheurs pour la même entrée, et c'est VOULU.
    // `requestAnimationFrame` est le bon (il attend la première image peinte),
    // mais il est SUSPENDU quand l'onglet est en arrière-plan — mesuré le
    // 2026-08-25 : 0 image par seconde alors que les minuteurs en font 61.
    // Sans le repli, ouvrir l'app dans un onglet non actif donnait 1,8 s
    // d'écran noir SANS logo, puis l'app d'un coup. Le premier des deux qui
    // arrive gagne ; quand rAF fonctionne, l'animation est inchangée.
    const a = window.requestAnimationFrame(() => setEntre(true))
    const repli = window.setTimeout(() => setEntre(true), 32)
    const t = window.setTimeout(() => fermer(), ENTREE + PAUSE)
    return () => {
      window.cancelAnimationFrame(a)
      window.clearTimeout(repli)
      window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const passer = (): void => fermer()
    window.addEventListener('keydown', passer)
    return () => window.removeEventListener('keydown', passer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (sansMouvement) return null

  return (
    <div
      className="absolute inset-x-0 top-0 z-50 overflow-hidden bg-gtq-noir"
      onClick={() => fermer()}
      onTouchStart={() => fermer()}
      aria-hidden="true"
      style={{
        height: ferme ? HAUTEUR_BARRE : hauteurDepart,
        transition: `height ${RETRACTE}ms ${COURBE}`
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        <img
          src={logoUrl}
          alt=""
          draggable={false}
          className="h-16 w-auto"
          style={{
            opacity: ferme ? 0 : entre ? 1 : 0,
            transform: `translateY(${ferme ? -30 : entre ? 0 : 16}px) scale(${
              ferme ? 0.4 : entre ? 1 : 0.96
            })`,
            transition: ferme
              ? `opacity ${Math.round(RETRACTE * 0.6)}ms ease-in, transform ${Math.round(
                  RETRACTE * 0.8
                )}ms ${COURBE}`
              : `opacity ${ENTREE}ms ease-out, transform ${ENTREE}ms cubic-bezier(0.22, 1, 0.36, 1)`
          }}
        />

        {/* Le filet tricolore se tire sous le logo — la signature de marque. */}
        <div
          className="barre-gtq"
          /* Le filet est là DÈS LA PREMIÈRE IMAGE : pleine largeur, pleine
             opacité, aucun délai, aucune animation d'entrée. Avant, il partait
             de 0 px avec 220 ms de retard puis se tirait sur 550 ms — il
             n'était plein que 230 ms avant que la rétraction commence. Seule
             la SORTIE reste animée. */
          style={{
            width: ferme ? 0 : 168,
            opacity: ferme ? 0 : 1,
            transition: ferme ? 'width 200ms ease-in, opacity 200ms ease-in' : 'none'
          }}
        />

        {/*
         * « PAR 5 » sous le logo — l'écran d'ouverture dit ce qu'on ouvre.
         *
         * Il arrive APRÈS le filet, jamais en même temps : trois choses qui
         * apparaissent ensemble ne se lisent pas, elles clignotent. Capitales
         * à 22 px avec un interlettrage de 0,18 em — au-delà de 18 px et sur
         * un usage unique, les capitales espacées tiennent (relevé mesuré sur
         * Tranché : 20 px à 0,125 em). En micro, ce serait le tic classique.
         */}
        <div
          style={{
            fontSize: 22,
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: '0.18em',
            /* le retrait compense l'interlettrage de la dernière lettre */
            textIndent: '0.18em',
            color: 'rgba(255,255,255,0.92)',
            opacity: ferme || !entre ? 0 : 1,
            transform: `translateY(${ferme ? -12 : entre ? 0 : 8}px)`,
            transition: ferme
              ? 'opacity 200ms ease-in, transform 200ms ease-in'
              : `opacity ${ENTREE}ms ease-out 320ms, transform ${ENTREE}ms ease-out 320ms`
          }}
        >
          PAR 5
        </div>
      </div>
    </div>
  )
}
