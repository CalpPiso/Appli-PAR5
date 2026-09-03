/**
 * Thème clair / sombre.
 *
 * Le choix est mémorisé sur l'appareil. Par défaut on suit le réglage du
 * téléphone : un travailleur qui a mis son téléphone en mode sombre ne veut pas
 * se faire éblouir, et celui qui est dehors en plein soleil a déjà basculé en
 * clair.
 *
 * ⚠ La barre du haut reste NOIRE dans les deux modes : le logo Génitique est un
 * détourage blanc et l'écran d'ouverture est noir. Faire varier cette barre
 * casserait la continuité de l'ouverture.
 */
export type Theme = 'clair' | 'sombre'

const CLE = 'gtq-terrain-theme'

export function themeSysteme(): Theme {
  if (typeof window === 'undefined') return 'sombre'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'clair' : 'sombre'
}

export function lireTheme(): Theme {
  try {
    const v = localStorage.getItem(CLE)
    if (v === 'clair' || v === 'sombre') return v
  } catch {
    /* stockage indisponible : on suivra le système */
  }
  return themeSysteme()
}

export function appliquerTheme(t: Theme): void {
  document.documentElement.dataset.theme = t
  /* La couleur de la barre d'état du téléphone suit le fond de l'app. */
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', '#000000')
  try {
    localStorage.setItem(CLE, t)
  } catch {
    /* rien à faire : le thème reste valable pour la session */
  }
}
