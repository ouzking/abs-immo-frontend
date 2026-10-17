import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render'
import { mockSupabase } from '@/test/supabaseMock'

const filters = {
  transaction_types: [{ value: 'sale', count: 2 }],
  property_types: [
    { code: 'villa', label: 'Villa', label_plural: 'Villas', count: 1 },
    { code: 'land', label: 'Terrain', label_plural: 'Terrains', count: 1 },
  ],
  cities: [{ id: 'c1', name: 'Dakar', slug: 'dakar', region_name: 'Dakar', count: 2 }],
  neighborhoods: [{ id: 'n1', name: 'Almadies', slug: 'almadies', city_id: 'c1', count: 1 }],
  price_ranges: {},
}

const villa = {
  id: 'v1',
  reference: 'ABS-V-2600001',
  slug: 'villa-almadies',
  title: 'Villa avec piscine',
  property_type: 'villa',
  property_type_label: 'Villa',
  transaction_type: 'sale',
  price_amount: 450_000_000,
  rent_period: null,
  surface_area: 600,
  surface_unit: 'sqm',
  bedrooms: 5,
  bathrooms: 4,
  city_name: 'Dakar',
  neighborhood_name: 'Almadies',
  commercial_status: 'available',
  is_featured: true,
  cover_image_path: null,
}

function backend(searchResult: { data: unknown[]; count: number }) {
  return mockSupabase({
    rpc: (fn) => {
      if (fn === 'get_public_filters') return { data: filters, error: null }
      if (fn === 'search_properties') return { data: searchResult.data, error: null, count: searchResult.count }
      return { data: null, error: null }
    },
    from: () => ({ data: null, error: null }),
  })
}

describe('Catalogue', () => {
  it('affiche le nombre réel de résultats et applique la transaction de /acheter', async () => {
    const { calls } = backend({ data: [villa], count: 1 })
    renderApp('/acheter?ville=dakar')
    expect(await screen.findByRole('heading', { level: 1, name: 'Acheter un bien' })).toBeInTheDocument()
    expect(await screen.findByText('Villa avec piscine')).toBeInTheDocument()
    expect(screen.getByText(/bien correspond à votre recherche/)).toBeInTheDocument()

    const search = calls.find((c) => c.name === 'search_properties')!
    expect(search.args).toMatchObject({ p_transaction_type: 'sale' })
    expect(search.eq).toEqual([['city_slug', 'dakar']])
  })

  it('reporte les filtres dans l’URL et propose de les retirer', async () => {
    backend({ data: [], count: 0 })
    const { router } = renderApp('/biens')
    expect(await screen.findByText('Aucun bien ne correspond à ces critères')).toBeInTheDocument()

    // Le panneau mobile (jsdom = petit écran) contient les filtres.
    const user = userEvent.setup()
    await user.click(await screen.findByLabelText('Villa'))
    await waitFor(() => expect(router.state.location.search).toBe('?type=villa'))

    const chips = await screen.findByRole('list', { name: 'Filtres actifs' })
    await user.click(within(chips).getByRole('button', { name: /Villa/ }))
    await waitFor(() => expect(router.state.location.search).toBe(''))
  })

  it('affiche un état d’erreur avec possibilité de réessayer', async () => {
    mockSupabase({
      rpc: (fn) =>
        fn === 'search_properties' ? { data: null, error: { code: 'XX000', message: 'boom' } } : { data: filters, error: null },
    })
    renderApp('/biens')
    expect(await screen.findByText('La recherche n’a pas pu aboutir')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })
})

describe('Fiche et 404', () => {
  it('affiche une page dédiée pour une annonce retirée', async () => {
    mockSupabase({ rpc: () => ({ data: null, error: null }), from: () => ({ data: null, error: null }) })
    renderApp('/biens/annonce-retiree')
    expect(await screen.findByRole('heading', { name: 'Cette annonce n’est plus en ligne' })).toBeInTheDocument()
    await waitFor(() => expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow'))
  })

  it('affiche la page 404 pour une URL inconnue', async () => {
    mockSupabase({ from: () => ({ data: null, error: null }) })
    renderApp('/page-inexistante')
    expect(await screen.findByRole('heading', { name: 'Cette page est introuvable' })).toBeInTheDocument()
  })

  it('met à jour le titre, la description et l’URL canonique', async () => {
    backend({ data: [], count: 0 })
    renderApp('/louer')
    await waitFor(() => expect(document.title).toBe('Louer un bien | ABS IMMO & SERVICES'))
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.example.test/louer')
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute('content', 'Louer un bien | ABS IMMO & SERVICES')
  })
})
