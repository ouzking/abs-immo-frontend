/**
 * Utilitaires d'affichage des annonces. Les LIBELLÉS (transaction, statut,
 * statut juridique, créneaux, catégories…) sont traduits dans src/i18n/messages.
 */
export function isNoLongerAvailable(status: string | null | undefined): boolean {
  return status === 'sold' || status === 'rented'
}

/** « Quartier, Ville » à partir des localités disponibles (null si aucune). */
export function propertyLocation(p: { neighborhood_name: string | null; city_name: string | null }): string | null {
  return [p.neighborhood_name, p.city_name].filter(Boolean).join(', ') || null
}

const KNOWN_STATUSES = ['available', 'reserved', 'sold', 'rented'] as const
export type KnownStatus = (typeof KNOWN_STATUSES)[number]

/** Les énumérations peuvent s'enrichir côté backend : une valeur inconnue n'est simplement pas affichée. */
export function knownStatus(status: string | null | undefined): KnownStatus | null {
  return (KNOWN_STATUSES as readonly string[]).includes(status ?? '') ? (status as KnownStatus) : null
}
