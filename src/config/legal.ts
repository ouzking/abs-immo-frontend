/**
 * Informations légales qui ne proviennent pas de `agency_settings`.
 * À COMPLÉTER par l'agence avant la mise en production : tant qu'une valeur
 * est `null`, la rubrique correspondante n'est pas affichée (aucune donnée inventée).
 */
export const LEGAL = {
  /** Responsable de la publication (nom et qualité). */
  publicationDirector: null as string | null,
  /** Hébergeur du site (adresse vérifiée sur vercel.com/legal le 20/10/2026). */
  hostingProvider: {
    name: 'Vercel Inc.',
    address: '440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis',
    website: 'https://vercel.com',
  } as { name: string; address: string; website: string } | null,
  /** Numéro de déclaration auprès de la CDP (Commission de protection des données personnelles), si obtenu. */
  cdpDeclaration: null as string | null,
}
