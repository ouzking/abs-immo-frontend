import { AppError, toAppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase/client'
import { signPropertyImages } from '@/lib/supabase/storage'
import { SORT_TO_API, type SearchCriteria } from '@/features/search/searchParams'
import {
  PROPERTY_CARD_COLUMNS,
  type PropertyCard,
  type PropertyImage,
  type PublicFilters,
  type PublicPropertyDetail,
  type SearchPropertiesParams,
} from '@/types'

/**
 * Accès aux annonces publiques — SEUL module qui interroge les vues/RPC des biens.
 * Contrat : abs-immo-backend/docs/INTEGRATION_CONTRACT.md § 2.
 */

export interface PropertyCardView extends PropertyCard {
  /** URL signée de la photo de couverture, ou null (repli visuel). */
  coverUrl: string | null
}

export interface PropertyImageView extends PropertyImage {
  url: string | null
}

export interface PropertyDetailView extends Omit<PublicPropertyDetail, 'images'> {
  images: PropertyImageView[]
}

export interface SearchResult {
  items: PropertyCardView[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export const PAGE_SIZE = 12

async function withCovers(cards: PropertyCard[]): Promise<PropertyCardView[]> {
  if (cards.length === 0) return []
  const urls = await signPropertyImages(cards.map((c) => c.cover_image_path))
  return cards.map((c) => ({ ...c, coverUrl: c.cover_image_path ? (urls.get(c.cover_image_path) ?? null) : null }))
}

/** Arguments RPC `search_properties` à partir des critères de l'URL (fonction pure, testée). */
export function toSearchArgs(criteria: SearchCriteria): SearchPropertiesParams {
  const args: SearchPropertiesParams = { p_sort: SORT_TO_API[criteria.sort] }
  if (criteria.q) args.p_query = criteria.q
  if (criteria.transaction) args.p_transaction_type = criteria.transaction
  if (criteria.types.length) args.p_property_types = criteria.types
  if (criteria.minPrice !== null) args.p_min_price = criteria.minPrice
  if (criteria.maxPrice !== null) args.p_max_price = criteria.maxPrice
  if (criteria.minBedrooms !== null) args.p_min_bedrooms = criteria.minBedrooms
  if (criteria.availableOnly) args.p_commercial_statuses = ['available']
  // Le tri par pertinence n'a de sens qu'avec un texte ; sinon le backend retombe sur « récents ».
  return args
}

export async function searchProperties(criteria: SearchCriteria, pageSize = PAGE_SIZE): Promise<SearchResult> {
  const from = (criteria.page - 1) * pageSize
  let query = getSupabase()
    .rpc('search_properties', toSearchArgs(criteria), { count: 'exact' })
    .select(PROPERTY_CARD_COLUMNS)
  // Filtres PostgREST additionnels autorisés par le contrat (§ 2.2).
  if (criteria.city) query = query.eq('city_slug', criteria.city)
  if (criteria.neighborhood) query = query.eq('neighborhood_slug', criteria.neighborhood)

  const { data, count, error } = await query.range(from, from + pageSize - 1)
  if (error) {
    // Page au-delà du total : PostgREST répond 416 (PGRST103). On renvoie une page vide cohérente.
    if (error.code === 'PGRST103') return { items: [], total: count ?? 0, page: criteria.page, pageSize, pageCount: 0 }
    throw toAppError(error)
  }
  const total = count ?? 0
  return {
    items: await withCovers((data ?? []) as unknown as PropertyCard[]),
    total,
    page: criteria.page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  }
}

/**
 * Biens mis en avant pour l'accueil. Si l'agence en a désigné moins que `limit`,
 * la sélection est complétée par les dernières annonces disponibles.
 */
export async function getFeaturedProperties(limit = 6): Promise<PropertyCardView[]> {
  const sb = getSupabase()
  const featured = await sb
    .rpc('search_properties', { p_featured_only: true, p_sort: 'featured' })
    .select(PROPERTY_CARD_COLUMNS)
    .range(0, limit - 1)
  if (featured.error) throw toAppError(featured.error)
  const cards = (featured.data ?? []) as unknown as PropertyCard[]

  if (cards.length < limit) {
    const latest = await sb
      .rpc('search_properties', { p_sort: 'newest', p_commercial_statuses: ['available', 'reserved'] })
      .select(PROPERTY_CARD_COLUMNS)
      .range(0, limit + cards.length - 1)
    if (latest.error) throw toAppError(latest.error)
    const ids = new Set(cards.map((c) => c.id))
    for (const c of (latest.data ?? []) as unknown as PropertyCard[]) {
      if (cards.length >= limit) break
      if (!ids.has(c.id)) cards.push(c)
    }
  }
  return withCovers(cards)
}

function isDetail(value: unknown): value is PublicPropertyDetail {
  return typeof value === 'object' && value !== null && 'id' in value && 'slug' in value && 'title' in value
}

/** Fiche détaillée par slug. Lève AppError('not_found') si l'annonce n'est pas publiée. */
export async function getPropertyBySlug(slug: string): Promise<PropertyDetailView> {
  const { data: raw, error } = await getSupabase().rpc('get_public_property', { p_slug: slug })
  if (error) throw toAppError(error)
  const data: unknown = raw
  if (!isDetail(data)) throw new AppError('not_found', `Annonce introuvable : ${slug}`)

  const images = Array.isArray(data.images) ? data.images : []
  const urls = await signPropertyImages(images.map((i) => i.storage_path))
  return {
    ...data,
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
    features: Array.isArray(data.features) ? data.features : [],
    images: images.map((i) => ({ ...i, url: urls.get(i.storage_path) ?? null })),
  }
}

/** Biens similaires réellement disponibles (même transaction, même type ou même ville). */
export async function getSimilarProperties(propertyId: string, limit = 3): Promise<PropertyCardView[]> {
  const { data, error } = await getSupabase()
    .rpc('get_similar_properties', { p_property_id: propertyId, p_limit: limit })
    .select(PROPERTY_CARD_COLUMNS)
  if (error) throw toAppError(error)
  return withCovers((data ?? []) as unknown as PropertyCard[])
}

const EMPTY_FILTERS: PublicFilters = {
  transaction_types: [],
  property_types: [],
  cities: [],
  neighborhoods: [],
  price_ranges: {},
}

/** Valeurs de filtres réellement disponibles (uniquement ce qui est publié). */
export async function getPublicFilters(): Promise<PublicFilters> {
  const { data, error } = await getSupabase().rpc('get_public_filters')
  if (error) throw toAppError(error)
  if (!data || typeof data !== 'object') return EMPTY_FILTERS
  return { ...EMPTY_FILTERS, ...(data as unknown as PublicFilters) }
}
