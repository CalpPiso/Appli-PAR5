import { useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { RISQUES } from '@/data/par5'

/**
 * Définition des 16 risques — la référence du carnet Génitique, consultable
 * pendant qu'on remplit la fiche.
 *
 * Sur téléphone, les 16 descriptions bout à bout font un mur de texte : chaque
 * risque est donc replié, et un champ de recherche permet de tomber
 * directement sur le bon quand on cherche un mot précis (« cadenassage »,
 * « espace clos »). La recherche porte AUSSI sur les moyens de prévention —
 * c'est souvent par là qu'on cherche.
 */

function normalise(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function Definitions() {
  const [requete, setRequete] = useState('')
  const [ouvert, setOuvert] = useState<string | null>(null)

  const resultats = useMemo(() => {
    const q = normalise(requete.trim())
    if (!q) return RISQUES
    const mots = q.split(/\s+/)
    return RISQUES.filter((r) => {
      const foin = normalise(`${r.nom} ${r.description} ${r.moyens}`)
      return mots.every((m) => foin.includes(m))
    })
  }, [requete])

  return (
    <div className="px-4 pb-8 pt-4">
      <p className="mb-3 text-[13px] leading-snug text-gtq-texte2">
        Carnet d’analyse de risques Génitique. Touchez un risque pour voir sa définition et les
        moyens de prévention types.
      </p>

      <div className="relative mb-4">
        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gtq-texte2"
          aria-hidden="true"
        />
        <input
          type="text"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Chercher un mot…"
          aria-label="Chercher dans les risques et les moyens"
          className="!pl-10 !pr-10"
        />
        {requete && (
          <button
            type="button"
            onClick={() => setRequete('')}
            aria-label="Effacer la recherche"
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-gtq-texte2"
          >
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>

      {resultats.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-gtq-texte2">
          Aucun risque ne contient « {requete} ».
        </p>
      ) : (
        <ul className="space-y-2.5">
          {resultats.map((r) => {
            const estOuvert = ouvert === r.id
            return (
              <li key={r.id} className="overflow-hidden rounded-xl border border-gtq-filet bg-gtq-surface">
                <button
                  type="button"
                  onClick={() => setOuvert(estOuvert ? null : r.id)}
                  aria-expanded={estOuvert}
                  className="flex w-full items-center gap-2 px-3 py-3.5 text-left"
                >
                  <span className="flex-1 text-[15px] font-medium leading-snug text-gtq-texte">
                    {r.nom}
                  </span>
                  <ChevronDown
                    size={20}
                    aria-hidden="true"
                    className={`shrink-0 text-gtq-texte2 transition-transform ${
                      estOuvert ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {estOuvert && (
                  <div className="space-y-3 border-t border-gtq-filet/70 px-3 pb-4 pt-3">
                    <div>
                      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gtq-texte2">
                        Ce que ça couvre
                      </h3>
                      <p className="text-[14px] leading-relaxed text-gtq-texte">{r.description}</p>
                    </div>
                    <div>
                      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gtq-texte2">
                        Moyens de prévention types
                      </h3>
                      <p className="text-[14px] leading-relaxed text-gtq-texte">{r.moyens}</p>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
