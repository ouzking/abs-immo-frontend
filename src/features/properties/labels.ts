import type { CommercialStatus, LegalStatus, TimeSlot, TransactionType } from '@/types'

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  sale: 'Vente',
  rent: 'Location',
}

/** Libellés courts pour les badges (« À vendre », « À louer »). */
export const TRANSACTION_BADGES: Record<TransactionType, string> = {
  sale: 'À vendre',
  rent: 'À louer',
}

export const COMMERCIAL_STATUS_LABELS: Record<CommercialStatus, string> = {
  available: 'Disponible',
  reserved: 'Sous option',
  sold: 'Vendu',
  rented: 'Loué',
}

/** Les valeurs d'énumération peuvent s'enrichir côté backend : affichage par défaut prévu. */
export function commercialStatusLabel(status: string | null | undefined): string | null {
  if (!status) return null
  return COMMERCIAL_STATUS_LABELS[status as CommercialStatus] ?? null
}

export function isNoLongerAvailable(status: string | null | undefined): boolean {
  return status === 'sold' || status === 'rented'
}

export const LEGAL_STATUS_LABELS: Record<LegalStatus, string> = {
  titre_foncier: 'Titre foncier',
  bail: 'Bail',
  deliberation: 'Délibération',
  permis_occuper: 'Permis d’occuper',
  autre: 'Autre',
}

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  any: 'Indifférent',
  morning: 'Matin (9 h – 12 h)',
  afternoon: 'Après-midi (12 h – 17 h)',
  evening: 'Fin de journée (17 h – 19 h)',
}

/** « Quartier, Ville » à partir des localités disponibles (null si aucune). */
export function propertyLocation(p: { neighborhood_name: string | null; city_name: string | null }): string | null {
  return [p.neighborhood_name, p.city_name].filter(Boolean).join(', ') || null
}

export const AMENITY_CATEGORY_LABELS: Record<string, string> = {
  comfort: 'Confort',
  security: 'Sécurité',
  outdoor: 'Extérieurs',
  services: 'Services',
  building: 'Bâtiment',
  utilities: 'Équipements techniques',
}
