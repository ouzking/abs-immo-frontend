import { pageWindow } from './pagination'
import {
  catalogUrl,
  countActiveFilters,
  DEFAULT_CRITERIA,
  parseSearchParams,
  toSearchParams,
} from './searchParams'

describe('parseSearchParams', () => {
  it('lit tous les critères depuis l’URL', () => {
    const c = parseSearchParams(
      new URLSearchParams(
        'q=piscine&transaction=vente&type=villa,house&ville=dakar&quartier=almadies&prix_min=50000000&prix_max=300000000&chambres=3&disponible=1&tri=prix-asc&page=2',
      ),
    )
    expect(c).toEqual({
      q: 'piscine',
      transaction: 'sale',
      types: ['villa', 'house'],
      city: 'dakar',
      neighborhood: 'almadies',
      minPrice: 50_000_000,
      maxPrice: 300_000_000,
      minBedrooms: 3,
      availableOnly: true,
      sort: 'prix-asc',
      page: 2,
    })
  })

  it('ignore les valeurs invalides ou dangereuses', () => {
    const c = parseSearchParams(
      new URLSearchParams('transaction=troc&type=<script>,villa&ville=../x&prix_min=-5&chambres=abc&tri=hack&page=0'),
    )
    expect(c.transaction).toBeNull()
    expect(c.types).toEqual(['villa'])
    expect(c.city).toBeNull()
    expect(c.minPrice).toBeNull()
    expect(c.minBedrooms).toBeNull()
    expect(c.sort).toBe('recent')
    expect(c.page).toBe(1)
  })

  it('échange min et max inversés (le backend refuserait min > max)', () => {
    const c = parseSearchParams(new URLSearchParams('prix_min=900&prix_max=100'))
    expect([c.minPrice, c.maxPrice]).toEqual([100, 900])
  })

  it('ignore le quartier sans ville', () => {
    expect(parseSearchParams(new URLSearchParams('quartier=almadies')).neighborhood).toBeNull()
  })

  it('applique la transaction imposée par la page (/acheter, /louer)', () => {
    expect(parseSearchParams(new URLSearchParams('transaction=location'), 'sale').transaction).toBe('sale')
  })
})

describe('toSearchParams / catalogUrl', () => {
  it('fait l’aller-retour sans perte', () => {
    const params = new URLSearchParams('q=vue+mer&type=villa&ville=dakar&prix_max=100000000&tri=prix-desc&page=3')
    const roundTrip = toSearchParams(parseSearchParams(params))
    expect(parseSearchParams(roundTrip)).toEqual(parseSearchParams(params))
  })

  it('n’écrit pas les valeurs par défaut', () => {
    expect(toSearchParams(DEFAULT_CRITERIA).toString()).toBe('')
  })

  it('oriente vers /acheter ou /louer selon la transaction', () => {
    expect(catalogUrl({ transaction: 'sale', types: ['villa'], city: 'dakar' })).toBe('/acheter?type=villa&ville=dakar')
    expect(catalogUrl({ transaction: 'rent' })).toBe('/louer')
    expect(catalogUrl({})).toBe('/biens')
  })

  it('compte les filtres actifs hors transaction imposée', () => {
    const c = { ...DEFAULT_CRITERIA, transaction: 'sale' as const, types: ['villa', 'house'], availableOnly: true }
    expect(countActiveFilters(c)).toBe(4)
    expect(countActiveFilters(c, 'sale')).toBe(3)
  })
})

describe('pageWindow', () => {
  it('affiche toutes les pages quand elles sont peu nombreuses', () => {
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5])
  })
  it('insère des ellipses autour de la page courante', () => {
    expect(pageWindow(6, 20)).toEqual([1, 'gap', 5, 6, 7, 'gap', 20])
    expect(pageWindow(1, 20)).toEqual([1, 2, 'gap', 20])
  })
})
