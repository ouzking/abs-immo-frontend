import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/render'
import type { PropertyCardView } from '../api/propertiesService'
import { PropertyCard } from './PropertyCard'

const base: PropertyCardView = {
  id: '1',
  reference: 'ABS-V-2600003',
  slug: 'terrain-saly',
  title: 'Terrain titré à Saly',
  short_description: null,
  property_type: 'land',
  property_type_label: 'Terrain',
  transaction_type: 'sale',
  price_amount: 35_000_000,
  currency_code: 'XOF',
  price_on_request: false,
  rent_period: null,
  surface_area: 500,
  surface_unit: 'sqm',
  bedrooms: null,
  bathrooms: null,
  city_name: 'Saly',
  neighborhood_name: null,
  commercial_status: 'available',
  is_featured: false,
  published_at: '2026-10-16T00:00:00Z',
  cover_image_path: null,
  cover_image_alt: null,
  image_count: 0,
  coverUrl: null,
}

describe('PropertyCard', () => {
  it('affiche les informations réelles et un lien vers la fiche', () => {
    renderWithRouter(<PropertyCard property={base} />)
    expect(screen.getByRole('link', { name: 'Terrain titré à Saly' })).toHaveAttribute('href', '/biens/terrain-saly')
    expect(screen.getByText('35 000 000 FCFA')).toBeInTheDocument()
    expect(screen.getByText('À vendre')).toBeInTheDocument()
    expect(screen.getByText('500 m²')).toBeInTheDocument()
    expect(screen.getByText('Photo bientôt disponible')).toBeInTheDocument()
  })

  it('n’invente ni chambres ni salles de bain pour un terrain', () => {
    renderWithRouter(<PropertyCard property={base} />)
    expect(screen.queryByText(/chambre/)).not.toBeInTheDocument()
    expect(screen.queryByText(/salle de bain/)).not.toBeInTheDocument()
  })

  it('affiche le loyer, « Prix sur demande » et le statut réel', () => {
    renderWithRouter(
      <PropertyCard property={{ ...base, transaction_type: 'rent', rent_period: 'month', price_amount: 850_000, commercial_status: 'rented' }} />,
    )
    expect(screen.getByText('850 000 FCFA / mois')).toBeInTheDocument()
    expect(screen.getByText('Loué')).toBeInTheDocument()
  })

  it('affiche « Prix sur demande » si le prix n’est pas public', () => {
    renderWithRouter(<PropertyCard property={{ ...base, price_amount: null, price_on_request: true }} />)
    expect(screen.getByText('Prix sur demande')).toBeInTheDocument()
  })
})
