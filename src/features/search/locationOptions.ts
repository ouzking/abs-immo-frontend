import type { PublicFilters } from '@/types'

/**
 * Options de localisation construites à partir des seules localités ayant des
 * annonces publiées (`get_public_filters`). Valeur encodée : "ville" ou
 * "ville/quartier" (slugs), pour des URL lisibles.
 */
export interface LocationGroup {
  city: { slug: string; name: string; count: number; regionName: string }
  neighborhoods: Array<{ slug: string; name: string; count: number }>
}

export function buildLocationGroups(filters: PublicFilters | undefined): LocationGroup[] {
  if (!filters) return []
  return filters.cities.map((c) => ({
    city: { slug: c.slug, name: c.name, count: c.count, regionName: c.region_name },
    neighborhoods: filters.neighborhoods
      .filter((n) => n.city_id === c.id)
      .map((n) => ({ slug: n.slug, name: n.name, count: n.count })),
  }))
}

export function encodeLocation(city: string | null, neighborhood: string | null): string {
  if (!city) return ''
  return neighborhood ? `${city}/${neighborhood}` : city
}

export function decodeLocation(value: string): { city: string | null; neighborhood: string | null } {
  if (!value) return { city: null, neighborhood: null }
  const [city, neighborhood] = value.split('/')
  return { city: city || null, neighborhood: neighborhood || null }
}
