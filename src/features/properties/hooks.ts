import { useQuery } from '@/lib/query'
import { toSearchParams, type SearchCriteria } from '@/features/search/searchParams'
import {
  getFeaturedProperties,
  getPropertyBySlug,
  getPublicFilters,
  getSimilarProperties,
  searchProperties,
} from './api/propertiesService'

export function usePropertySearch(criteria: SearchCriteria) {
  const key = `search:${toSearchParams(criteria).toString()}`
  return useQuery(key, () => searchProperties(criteria), { keepPrevious: true, staleTime: 60_000 })
}

export function useFeaturedProperties(limit = 6) {
  return useQuery(`featured:${limit}`, () => getFeaturedProperties(limit), { staleTime: 5 * 60_000 })
}

export function useProperty(slug: string | undefined) {
  return useQuery(slug ? `property:${slug}` : null, () => getPropertyBySlug(slug!), { staleTime: 2 * 60_000 })
}

export function useSimilarProperties(propertyId: string | undefined) {
  return useQuery(propertyId ? `similar:${propertyId}` : null, () => getSimilarProperties(propertyId!), {
    staleTime: 5 * 60_000,
  })
}

export function usePublicFilters() {
  return useQuery('filters', getPublicFilters, { staleTime: 10 * 60_000 })
}
