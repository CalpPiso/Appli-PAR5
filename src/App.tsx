import { useState } from 'react'
import { ShieldAlert, FolderOpen, BookOpen, Sun, Moon } from 'lucide-react'
import { SplashGtq, HAUTEUR_BARRE } from './components/SplashGtq'
import { Logo } from './components/Logo'
import { Installer } from './components/Installer'
import { Par5Form, type Ouverture } from './pages/par5/Par5Form'
import { MesFiches } from './pages/par5/MesFiches'
import { Definitions } from './pages/par5/Definitions'
import { dupliquerPar5, type Par5Enregistre } from './data/par5-store'
import { appliquerTheme, lireTheme, type Theme } from './data/theme'

/**
 * Coque de l'application terrain.
 *
 * Un onglet = une entrée dans ONGLETS. Le premier est le PAR 5 ; les ajouts
 * suivants n'ont qu'à s'inscrire ici.
 */
const ONGLETS = [
  { id: 'par5', libelle: 'PAR 5', Icone: ShieldAlert },
  { id: 'fiches', libelle: 'Mes fiches', Icone: FolderOpen },
  { id: 'definitions', libelle: 'Définitions', Icone: BookOpen }
] as const

type OngletId = (typeof ONGLETS)[number]['id']

function aujourdhui(): string {
  const d = new Date()
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function App() {
  const [splash, setSplash] = useState(true)
  const [theme, setTheme] = useState<Theme>(lireTheme)
  const [onglet, setOnglet] = useState<OngletId>('par5')
  /** Fiche à rouvrir — ou données d'une fiche dupliquée, qui arrivent sans id. */
  const [aReprendre, setAReprendre] = useState<Ouverture | null>(null)
  /** Y a-t-il du travail non enregistré dans le formulaire ? */
  const [enCours, setEnCours] = useState(false)

  function basculerTheme(): void {
    const t: Theme = theme === 'sombre' ? 'clair' : 'sombre'
    setTheme(t)
    appliquerTheme(t)
  }

  function reprendre(o: Ouverture): void {
    setAReprendre(o)
    setOnglet('par5')
  }

  function dupliquer(f: Par5Enregistre): void {
    reprendre({ donnees: dupliquerPar5(f, aujourdhui()) })
  }

  /**
   * LE LOGO REDÉMARRE L'APPLICATION — même geste dans tous les outils Génitique.
   *
   * C'est un vrai rechargement (`location.reload`), pas une remise à zéro des
   * états : on veut retrouver l'application exactement comme au premier
   * lancement, écran d'ouverture compris. Sur un fichier HTML unique posé sur
   * le Bureau, c'est aussi la façon la plus sûre de repartir propre quand
   * quelque chose s'est mal passé.
   *
   * ⚠️ Mais on ne l'emporte JAMAIS en silence sur une fiche à moitié remplie.
   * Un PAR 5 se remplit debout, souvent avec des gants : le logo est en haut à
   * gauche, exactement là où le pouce se pose en tenant le téléphone. Sans
   * cette question, le geste le plus naturel du monde effacerait vingt minutes
   * de travail.
   */
  function redemarrer(): void {
    if (
      enCours &&
      !window.confirm(
        'Redémarrer l’application ?\n\nLa fiche en cours n’est pas enregistrée : elle sera perdue.'
      )
    )
      return
    window.location.reload()
  }

  return (
    <div className="relative flex h-full flex-col bg-gtq-fond">
      {/* Barre du haut — même noir que l'écran d'ouverture, qui s'y fond. */}
      <header className="safe-haut shrink-0 bg-gtq-noir">
        <div
          className="flex items-center gap-3 px-4"
          style={{ height: HAUTEUR_BARRE }}
        >
          <button
            type="button"
            onClick={redemarrer}
            aria-label="Redémarrer l’application"
            title="Redémarrer l’application"
            className="-ml-2 flex h-11 items-center rounded-lg px-2"
          >
            <Logo className="h-7 w-auto" />
          </button>
          <span className="h-5 w-px bg-white/15" />
          {/* Le titre cède la place avant la version : sur un téléphone de
              chantier, savoir QUELLE build on a dans les mains est la seule
              façon de diagnostiquer quoi que ce soit à distance. */}
          <div className="flex min-w-0 items-baseline gap-1.5">
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-white">
              {ONGLETS.find((o) => o.id === onglet)?.libelle}
            </h1>
            <span className="sur-noir-2 shrink-0 text-[11px] font-medium tabular-nums">
              v{__VERSION__}
            </span>
          </div>

          {/* La barre reste noire dans les deux thèmes : ses encres sont donc
              posées en blanc littéral, pas avec les jetons qui basculent. */}
          <button
            type="button"
            onClick={basculerTheme}
            aria-label={theme === 'sombre' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className="ml-auto -mr-2 flex h-11 w-11 items-center justify-center rounded-full text-white/75"
          >
            {theme === 'sombre' ? (
              <Sun size={20} aria-hidden="true" />
            ) : (
              <Moon size={20} aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="barre-gtq" />
      </header>

      {/* L’invitation à poser l’icône sur l’écran d’accueil. Elle ne s’affiche
          que là où elle a un sens : hébergée, pas déjà installée, pas masquée. */}
      <Installer />

      <main className="min-h-0 flex-1 overflow-y-auto">
        {onglet === 'par5' ? (
          <Par5Form
            reprise={aReprendre}
            onRepriseConsommee={() => setAReprendre(null)}
            onEnregistre={() => setOnglet('fiches')}
            onEnCours={setEnCours}
          />
        ) : onglet === 'fiches' ? (
          <MesFiches
            onReprendre={reprendre}
            onDupliquer={dupliquer}
            onNouveau={() => setOnglet('par5')}
          />
        ) : (
          <Definitions />
        )}
      </main>

      {/* Barre d'onglets — cibles de 56 px, atteignables au pouce. */}
      <nav className="safe-bas shrink-0 border-t border-gtq-filet bg-gtq-noir">
        <div className="flex">
          {ONGLETS.map(({ id, libelle, Icone }) => {
            const actif = id === onglet
            return (
              <button
                key={id}
                type="button"
                onClick={() => setOnglet(id)}
                aria-current={actif ? 'page' : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5"
              >
                <Icone
                  size={22}
                  strokeWidth={actif ? 2.2 : 1.7}
                  className={actif ? 'sur-noir-accent' : 'sur-noir-2'}
                  aria-hidden="true"
                />
                <span
                  className={`text-[11px] font-medium ${actif ? 'sur-noir' : 'sur-noir-2'}`}
                >
                  {libelle}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {splash && <SplashGtq onFini={() => setSplash(false)} />}
    </div>
  )
}
