import { DEFAULT_CRITERIA } from '@/features/search/searchParams'
import { mockSupabase } from '@/test/supabaseMock'
import { getFeaturedProperties, getPropertyBySlug, searchProperties, toSearchArgs } from './propertiesService'

const card = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  slug: `bien-${id}`,
  title: `Bien ${id}`,
  cover_image_path: `${id}/cover.jpg`,
  ...extra,
})

describe('toSearchArgs', () => {
  it('ne transmet que les critères renseignés', () => {
    expect(toSearchArgs(DEFAULT_CRITERIA)).toEqual({ p_sort: 'newest' })
    expect(
      toSearchArgs({
        ...DEFAULT_CRITERIA,
        q: 'piscine',
        transaction: 'rent',
        types: ['apartment'],
        minPrice: 100_000,
        maxPrice: 900_000,
        minBedrooms: 2,
        availableOnly: true,
        sort: 'prix-asc',
      }),
    ).toEqual({
      p_sort: 'price_asc',
      p_query: 'piscine',
      p_transaction_type: 'rent',
      p_property_types: ['apartment'],
      p_min_price: 100_000,
      p_max_price: 900_000,
      p_min_bedrooms: 2,
      p_commercial_statuses: ['available'],
    })
  })
})

describe('searchProperties', () => {
  it('pagine, filtre par slug de lieu et signe les couvertures en un seul appel', async () => {
    const { calls } = mockSupabase({ rpc: () => ({ data: [card('a'), card('b')], error: null, count: 26 }) })
    const result = await searchProperties({ ...DEFAULT_CRITERIA, city: 'dakar', neighborhood: 'almadies', page: 3 })

    expect(calls[0]).toMatchObject({
      name: 'search_properties',
      eq: [
        ['city_slug', 'dakar'],
        ['neighborhood_slug', 'almadies'],
      ],
      range: [24, 35],
    })
    expect(result.total).toBe(26)
    expect(result.pageCount).toBe(3)
    expect(result.items[0]!.coverUrl).toBe('https://cdn.test/a/cover.jpg?token=x')
  })

  it('remplace une photo non signable par null (visuel de repli)', async () => {
    mockSupabase({
      rpc: () => ({ data: [card('z')], error: null, count: 1 }),
      signed: (paths) => paths.map((p) => ({ path: p, signedUrl: null, error: 'Object not found' })),
    })
    const result = await searchProperties(DEFAULT_CRITERIA)
    expect(result.items[0]!.coverUrl).toBeNull()
  })

  it('convertit les erreurs PostgREST en AppError', async () => {
    mockSupabase({ rpc: () => ({ data: null, error: { code: '22023', message: 'Tri invalide' } }) })
    await expect(searchProperties(DEFAULT_CRITERIA)).rejects.toMatchObject({ kind: 'validation' })
  })
})

describe('getFeaturedProperties', () => {
  it('complète les biens à la une avec les dernières annonces, sans doublon', async () => {
    mockSupabase({
      rpc: (_fn, args) =>
        (args as { p_featured_only?: boolean }).p_featured_only
          ? { data: [card('f1', { is_featured: true })], error: null }
          : { data: [card('f1'), card('n1'), card('n2')], error: null },
    })
    const items = await getFeaturedProperties(3)
    expect(items.map((i) => i.id)).toEqual(['f1', 'n1', 'n2'])
  })
})

describe('getPropertyBySlug', () => {
  it('lève not_found pour une annonce absente ou non publiée', async () => {
    mockSupabase({ rpc: () => ({ data: null, error: null }) })
    await expect(getPropertyBySlug('inconnu')).rejects.toMatchObject({ kind: 'not_found' })
  })

  it('signe toutes les photos de la galerie', async () => {
    mockSupabase({
      rpc: () => ({
        data: {
          ...card('p'),
          images: [
            { id: '1', storage_path: 'p/1.jpg', alt_text: null, sort_order: 0, is_cover: true, width: null, height: null },
            { id: '2', storage_path: 'p/2.jpg', alt_text: null, sort_order: 1, is_cover: false, width: null, height: null },
          ],
          amenities: [],
          features: [],
        },
        error: null,
      }),
    })
    const p = await getPropertyBySlug('bien-p')
    expect(p.images.map((i) => i.url)).toEqual(['https://cdn.test/p/1.jpg?token=x', 'https://cdn.test/p/2.jpg?token=x'])
  })
})
