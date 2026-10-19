import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render'
import { mockSupabase } from '@/test/supabaseMock'
import { localizePath, splitLocale } from './config'
import { createFormatters } from './format'
import { deepMerge } from './merge'
import { en } from './messages/en'
import { fr, type Messages } from './messages/fr'
import { wo } from './messages/wo'

function emptyBackend() {
  return mockSupabase({
    rpc: (fn) =>
      fn === 'search_properties'
        ? { data: [], error: null, count: 0 }
        : fn === 'get_public_filters'
          ? { data: { transaction_types: [], property_types: [], cities: [], neighborhoods: [], price_ranges: {} }, error: null }
          : { data: null, error: null },
    from: () => ({ data: null, error: null }),
  })
}

describe('chemins localisés', () => {
  it('préfixe les chemins internes sauf en français', () => {
    expect(localizePath('/biens?type=villa', 'en')).toBe('/en/biens?type=villa')
    expect(localizePath('/', 'wo')).toBe('/wo')
    expect(localizePath('/biens', 'fr')).toBe('/biens')
    expect(localizePath('https://wa.me/1', 'en')).toBe('https://wa.me/1')
  })

  it('extrait la langue du chemin', () => {
    expect(splitLocale('/en/biens/x')).toEqual({ locale: 'en', path: '/biens/x' })
    expect(splitLocale('/wo')).toEqual({ locale: 'wo', path: '/' })
    expect(splitLocale('/biens')).toEqual({ locale: 'fr', path: '/biens' })
    expect(splitLocale('/entreprise')).toEqual({ locale: 'fr', path: '/entreprise' })
  })
})

describe('dictionnaires', () => {
  it('complète le wolof par le français clé par clé', () => {
    const merged = deepMerge<Messages>(fr, wo)
    expect(merged.nav.buy).toBe('Jënd')
    expect(merged.legal.title).toBe(fr.legal.title)
    expect(merged.home.agency.pillars[0]!.title).toBe('Déglu bu baax')
    expect(merged.home.agency.pillars[0]!.text).toBe(fr.home.agency.pillars[0]!.text)
  })

  it('formate les prix selon la langue', () => {
    expect(createFormatters('fr', fr).price(150_000_000)).toBe('150 000 000 FCFA')
    expect(createFormatters('en', en).price(850_000, 'month')).toBe('850,000 FCFA / month')
    expect(createFormatters('en', en).budget(1_500_000)).toBe('1.5 M FCFA')
    expect(createFormatters('en', en).propertyType('villa', 'Villa')).toBe('Villa')
    expect(createFormatters('en', en).propertyType('land', 'Terrain')).toBe('Land')
  })
})

describe('site multilingue', () => {
  it('affiche la version anglaise sous /en avec hreflang et lang', async () => {
    emptyBackend()
    renderApp('/en/louer')
    expect(await screen.findByRole('heading', { level: 1, name: 'Rent a property' })).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Rent a property | ABS IMMO & SERVICES'))
    expect(document.documentElement.lang).toBe('en')
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.example.test/en/louer')
    expect(document.querySelector('link[hreflang="fr"]')).toHaveAttribute('href', 'https://www.example.test/louer')
    expect(document.querySelector('link[hreflang="en"]')).toHaveAttribute('href', 'https://www.example.test/en/louer')
    // Les liens internes restent dans la langue choisie.
    expect(screen.getAllByRole('link', { name: 'Contact' })[0]).toHaveAttribute('href', '/en/contact')
  })

  it('met le wolof en noindex tant que la traduction n’est pas relue', async () => {
    emptyBackend()
    renderApp('/wo/biens')
    expect(await screen.findByRole('heading', { level: 1, name: 'Sunuy alal' })).toBeInTheDocument()
    await waitFor(() => expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow'))
    expect(screen.getByText(/Firi wolof bi/)).toBeInTheDocument()
  })

  it('change de langue en conservant la page et les filtres', async () => {
    emptyBackend()
    const { router } = renderApp('/acheter?ville=dakar')
    await screen.findByRole('heading', { level: 1, name: 'Acheter un bien' })
    await userEvent.setup().click(screen.getAllByRole('link', { name: 'English' })[0]!)
    await waitFor(() => expect(router.state.location.pathname).toBe('/en/acheter'))
    expect(router.state.location.search).toBe('?ville=dakar')
    expect(await screen.findByRole('heading', { level: 1, name: 'Buy a property' })).toBeInTheDocument()
  })
})
