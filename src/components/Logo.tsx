import logoUrl from '@/assets/logo-genitique.png'

/**
 * Logotype Génitique — le fichier officiel, version blanche détourée.
 * On ne le redessine jamais : c'est la marque, pas une illustration.
 */
export function Logo({ className }: { className?: string }) {
  return <img src={logoUrl} alt="Génitique" className={className} draggable={false} />
}
