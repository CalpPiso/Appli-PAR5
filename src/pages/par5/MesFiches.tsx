import { useEffect, useState } from 'react'
import { FileText, Trash2, Plus, Share2, Download, CopyPlus } from 'lucide-react'
import { listerPar5, supprimerPar5, type Par5Enregistre, retouchee } from '@/data/par5-store'
import { construirePdfPar5, envoyerPdf, peutChoisirDossier } from '@/data/pdf-par5'
import type { Ouverture } from './Par5Form'

/**
 * Les PAR 5 remplis sur ce téléphone. Rien ne sort de l'appareil : la fiche est
 * conservée localement tant que personne ne la supprime.
 */
export function MesFiches({
  onReprendre,
  onDupliquer,
  onNouveau
}: {
  onReprendre: (o: Ouverture) => void
  onDupliquer: (f: Par5Enregistre) => void
  onNouveau: () => void
}) {
  const [fiches, setFiches] = useState<Par5Enregistre[]>([])
  /* Sur un poste le bouton enregistre où l’on veut ; sur un téléphone il partage. */
  const surPoste = peutChoisirDossier()

  useEffect(() => setFiches(listerPar5()), [])

  async function envoyer(f: Par5Enregistre): Promise<void> {
    await envoyerPdf(construirePdfPar5(f.donnees, f.dateISO))
  }

  function supprimer(id: string): void {
    supprimerPar5(id)
    setFiches(listerPar5())
  }

  if (!fiches.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <FileText size={40} className="text-gtq-texte2/60" aria-hidden="true" />
        <p className="text-[15px] text-gtq-texte2">
          Aucune fiche enregistrée sur ce téléphone.
        </p>
        <button
          type="button"
          onClick={onNouveau}
          className="inline-flex items-center gap-2 rounded-xl bg-gtq-bleu px-4 py-3 text-[15px] font-semibold encre-pastille"
        >
          <Plus size={18} aria-hidden="true" /> Remplir un PAR 5
        </button>
      </div>
    )
  }

  return (
    <ul className="space-y-2.5 px-4 py-4">
      {fiches.map((f) => {
        const presents = f.donnees.lignes.filter((l) => l.present === 'oui').length
        const photos = f.donnees.lignes.filter((l) => l.photo).length
        const date = new Date(f.dateISO)
        const titre = f.donnees.tache || f.donnees.installation || 'Fiche sans titre'
        return (
          <li
            key={f.id}
            className="rounded-xl border border-gtq-filet bg-gtq-surface p-3"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onReprendre({ donnees: f.donnees, id: f.id })}
                className="min-w-0 flex-1 text-left"
              >
                <div className="truncate text-[15px] font-medium text-gtq-texte">{titre}</div>
                <div className="mt-0.5 text-[13px] text-gtq-texte2">
                  {f.donnees.noProjet ? `${f.donnees.noProjet} · ` : ''}
                  {date.toLocaleDateString('fr-CA')} ·{' '}
                  <span className={presents ? 'text-gtq-orange' : ''}>
                    {presents} risque{presents > 1 ? 's' : ''}
                  </span>
                  {photos > 0 && ` · ${photos} photo${photos > 1 ? 's' : ''}`}
                  {/* La date de l'analyse ne bouge pas ; une retouche se dit à part. */}
                  {retouchee(f) && f.majISO && (
                    <span className="text-gtq-texte2">
                      {' '}
                      · retouchée le {new Date(f.majISO).toLocaleDateString('fr-CA')}
                    </span>
                  )}
                </div>
              </button>
              <button
                type="button"
                aria-label={
                  surPoste
                    ? `Enregistrer le PDF de la fiche ${titre}`
                    : `Envoyer la fiche ${titre} en PDF`
                }
                onClick={() => void envoyer(f)}
                className="shrink-0 rounded-lg p-2.5 text-gtq-bleu"
              >
                {surPoste ? (
                  <Download size={18} aria-hidden="true" />
                ) : (
                  <Share2 size={18} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label={`Supprimer la fiche ${titre}`}
                onClick={() => supprimer(f.id)}
                className="shrink-0 rounded-lg p-2.5 text-gtq-texte2"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>

            {/*
             * REPRENDRE POUR AUJOURD'HUI.
             *
             * Une équipe fait la même tâche trois jours de suite : les seize
             * réponses sont identiques, seules les dates changent. Recocher
             * seize cases pour la troisième fois, c'est recocher vite — donc ne
             * plus relire. Le bouton ne fait pas gagner du temps, il rend à
             * l'analyse une chance d'être RELUE.
             *
             * Il est en toutes lettres et non en icône : c'est le geste qu'on
             * fait en arrivant sur le chantier, il doit se trouver sans
             * chercher, avec des gants.
             */}
            <button
              type="button"
              onClick={() => onDupliquer(f)}
              className="mt-2.5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-gtq-filet px-3 py-2.5 text-[14px] font-medium text-gtq-texte"
            >
              <CopyPlus size={16} aria-hidden="true" /> Reprendre pour aujourd’hui
            </button>
          </li>
        )
      })}
    </ul>
  )
}
