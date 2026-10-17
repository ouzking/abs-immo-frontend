import type { SearchSort, TransactionType } from '@/types'

/**
 * Critères de recherche du catalogue et leur représentation dans l'URL.
 * L'URL est la source de vérité : une recherche est partageable, survit au
 * rechargement et à la navigation arrière.
 *
 *   /biens?transaction=vente&type=villa,maison&ville=dakar&quartier=almadies
 *          &prix_min=50000000&prix_max=300000000&chambres=3&disponible=1&tri=prix-asc&page=2&q=piscine
 *
 * Les pages /acheter et /louer fixent la transaction par le chemin.
 */
export type SortOption = 'recent' | 'ancien' | 'prix-asc' | 'prix-desc' | 'surface' | 'pertinence'

export interface SearchCriteria {
  q: string
  transaction: TransactionType | null
  types: string[]
  city: string | null
  neighborhood: string | null
  minPrice: number | null
  maxPrice: number | null
  minBedrooms: number | null
  availableOnly: boolean
  sort: SortOption
  page: number
}

export const DEFAULT_CRITERIA: SearchCriteria = {
  q: '',
  transaction: null,
  types: [],
  city: null,
  neighborhood: null,
  minPrice: null,
  maxPrice: null,
  minBedrooms: null,
  availableOnly: false,
  sort: 'recent',
  page: 1,
}

export const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'prix-asc', label: 'Prix croissant' },
  { value: 'prix-desc', label: 'Prix décroissant' },
  { value: 'surface', label: 'Surface décroissante' },
  { value: 'ancien', label: 'Plus anciens' },
  { value: 'pertinence', label: 'Pertinence (recherche texte)' },
]

export const SORT_TO_API: Record<SortOption, SearchSort> = {
  recent: 'newest',
  ancien: 'oldest',
  'prix-asc': 'price_asc',
  'prix-desc': 'price_desc',
  surface: 'surface_desc',
  pertinence: 'relevance',
}

const TRANSACTION_PARAM: Record<TransactionType, string> = { sale: 'vente', rent: 'location' }
const PARAM_TRANSACTION: Record<string, TransactionType> = { vente: 'sale', location: 'rent' }

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TYPE_RE = /^[a-z_]{2,40}$/
const MAX_PRICE = 1_000_000_000_000

function parsePositiveInt(value: string | null, max = MAX_PRICE): number | null {
  if (value === null || !/^\d{1,13}$/.test(value)) return null
  const n = Number(value)
  return n > 0 && n <= max ? n : null
}

function parseSlug(value: string | null): string | null {
  const v = value?.trim().toLowerCase() ?? ''
  return SLUG_RE.test(v) && v.length <= 80 ? v : null
}

/** Lit et assainit les critères depuis l'URL (toute valeur invalide est ignorée). */
export function parseSearchParams(params: URLSearchParams, fixedTransaction?: TransactionType | null): SearchCriteria {
  const transaction = fixedTransaction ?? PARAM_TRANSACTION[params.get('transaction') ?? ''] ?? null
  const types = [
    ...new Set(
      (params.get('type') ?? '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => TYPE_RE.test(t)),
    ),
  ].slice(0, 10)
  const sortParam = params.get('tri') as SortOption | null
  const sort = sortParam && sortParam in SORT_TO_API ? sortParam : DEFAULT_CRITERIA.sort
  let minPrice = parsePositiveInt(params.get('prix_min'))
  let maxPrice = parsePositiveInt(params.get('prix_max'))
  // Le backend refuse min > max (22023) : on échange plutôt que d'échouer.
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice]
  const city = parseSlug(params.get('ville'))

  return {
    q: (params.get('q') ?? '').trim().slice(0, 200),
    transaction,
    types,
    city,
    neighborhood: city ? parseSlug(params.get('quartier')) : null,
    minPrice,
    maxPrice,
    minBedrooms: parsePositiveInt(params.get('chambres'), 20),
    availableOnly: params.get('disponible') === '1',
    sort,
    page: parsePositiveInt(params.get('page'), 10_000) ?? 1,
  }
}

/** Sérialise les critères (seules les valeurs non par défaut apparaissent dans l'URL). */
export function toSearchParams(criteria: SearchCriteria, options: { omitTransaction?: boolean } = {}): URLSearchParams {
  const p = new URLSearchParams()
  if (criteria.q) p.set('q', criteria.q)
  if (criteria.transaction && !options.omitTransaction) p.set('transaction', TRANSACTION_PARAM[criteria.transaction])
  if (criteria.types.length) p.set('type', criteria.types.join(','))
  if (criteria.city) p.set('ville', criteria.city)
  if (criteria.city && criteria.neighborhood) p.set('quartier', criteria.neighborhood)
  if (criteria.minPrice !== null) p.set('prix_min', String(criteria.minPrice))
  if (criteria.maxPrice !== null) p.set('prix_max', String(criteria.maxPrice))
  if (criteria.minBedrooms !== null) p.set('chambres', String(criteria.minBedrooms))
  if (criteria.availableOnly) p.set('disponible', '1')
  if (criteria.sort !== DEFAULT_CRITERIA.sort) p.set('tri', criteria.sort)
  if (criteria.page > 1) p.set('page', String(criteria.page))
  return p
}

/** Chemin du catalogue adapté à la transaction (/acheter, /louer ou /biens). */
export function catalogPath(transaction: TransactionType | null): string {
  if (transaction === 'sale') return '/acheter'
  if (transaction === 'rent') return '/louer'
  return '/biens'
}

/** URL complète du catalogue pour des critères donnés (utilisée par la recherche du hero). */
export function catalogUrl(criteria: Partial<SearchCriteria>): string {
  const full = { ...DEFAULT_CRITERIA, ...criteria }
  const qs = toSearchParams(full, { omitTransaction: true }).toString()
  return `${catalogPath(full.transaction)}${qs ? `?${qs}` : ''}`
}

/** Nombre de filtres actifs (hors tri et page), pour le bouton mobile « Filtres (n) ». */
export function countActiveFilters(c: SearchCriteria, fixedTransaction?: TransactionType | null): number {
  return (
    (c.q ? 1 : 0) +
    (c.transaction && !fixedTransaction ? 1 : 0) +
    c.types.length +
    (c.city ? 1 : 0) +
    (c.neighborhood ? 1 : 0) +
    (c.minPrice !== null ? 1 : 0) +
    (c.maxPrice !== null ? 1 : 0) +
    (c.minBedrooms !== null ? 1 : 0) +
    (c.availableOnly ? 1 : 0)
  )
}

/** Paliers de budget proposés dans les listes déroulantes (FCFA). */
export const BUDGET_STEPS: Record<TransactionType, number[]> = {
  sale: [
    10_000_000, 25_000_000, 50_000_000, 75_000_000, 100_000_000, 150_000_000, 200_000_000, 300_000_000, 500_000_000,
    750_000_000, 1_000_000_000,
  ],
  rent: [100_000, 200_000, 300_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000],
}

export const ALL_BUDGET_STEPS = [...new Set([...BUDGET_STEPS.rent, ...BUDGET_STEPS.sale])].sort((a, b) => a - b)
