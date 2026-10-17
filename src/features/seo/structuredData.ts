import { absoluteUrl, SITE } from '@/config/site'
import type { AgencyInfo } from '@/features/agency/agencyService'
import type { PropertyDetailView } from '@/features/properties/api/propertiesService'

/**
 * Données structurées schema.org. Règle : uniquement des informations réelles
 * et présentes ; tout champ absent est omis (jamais de valeur par défaut inventée).
 */
type JsonLd = Record<string, unknown>

function compact<T extends JsonLd>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)),
  ) as T
}

export function agencyJsonLd(agency: AgencyInfo | undefined): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': absoluteUrl('/#agence'),
    name: agency?.name ?? SITE.name,
    legalName: agency?.legalName,
    url: absoluteUrl('/'),
    logo: absoluteUrl(SITE.logo),
    image: absoluteUrl(SITE.defaultImage),
    description: agency?.description ?? agency?.tagline,
    telephone: agency?.phone,
    email: agency?.email,
    address: agency?.address
      ? { '@type': 'PostalAddress', streetAddress: agency.address, addressCountry: 'SN' }
      : undefined,
    sameAs: agency?.socialLinks.map((s) => s.url),
    areaServed: { '@type': 'Country', name: 'Sénégal' },
  })
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

const AVAILABILITY: Record<string, string> = {
  available: 'https://schema.org/InStock',
  reserved: 'https://schema.org/LimitedAvailability',
  sold: 'https://schema.org/SoldOut',
  rented: 'https://schema.org/SoldOut',
}

/**
 * Annonce : RealEstateListing + offre. Les photos (URL signées, temporaires)
 * ne sont volontairement pas déclarées : une URL expirée nuirait à l'indexation.
 */
export function propertyJsonLd(p: PropertyDetailView): JsonLd {
  const path = `/biens/${p.slug}`
  return compact({
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': absoluteUrl(path),
    url: absoluteUrl(path),
    name: p.title,
    description: p.short_description ?? p.seo_description ?? undefined,
    datePosted: p.published_at ?? undefined,
    identifier: p.reference ?? undefined,
    offers:
      p.price_amount !== null
        ? compact({
            '@type': 'Offer',
            price: p.price_amount,
            priceCurrency: p.currency_code ?? 'XOF',
            businessFunction: p.transaction_type === 'rent' ? 'https://schema.org/LeaseOut' : 'https://schema.org/Sell',
            availability: p.commercial_status ? AVAILABILITY[p.commercial_status] : undefined,
            seller: { '@id': absoluteUrl('/#agence') },
          })
        : undefined,
    contentLocation:
      p.city_name || p.neighborhood_name
        ? compact({
            '@type': 'Place',
            address: compact({
              '@type': 'PostalAddress',
              addressLocality: p.city_name ?? undefined,
              addressRegion: p.region_name ?? undefined,
              streetAddress: p.address_line ?? undefined,
              addressCountry: p.country_code ?? 'SN',
            }),
          })
        : undefined,
  })
}
