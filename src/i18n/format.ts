import { localized, type RentPeriod, type SurfaceUnit } from '@/types'
import { LOCALE_META, type Locale } from './config'
import type { Messages } from './messages/fr'

const NBSP = /[\u00a0\u202f]/g
const SURFACE_UNITS: Record<SurfaceUnit, string> = { sqm: 'm²', are: 'a', hectare: 'ha' }

/** Formateurs dépendant de la langue (nombres, prix FCFA, surfaces, dates). */
export function createFormatters(locale: Locale, t: Messages) {
  const intl = LOCALE_META[locale].intl
  const integer = new Intl.NumberFormat(intl, { maximumFractionDigits: 0 })
  const decimal = new Intl.NumberFormat(intl, { maximumFractionDigits: 2 })
  const date = new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'long', year: 'numeric' })
  const number = (value: number, decimals = false) => (decimals ? decimal : integer).format(value).replace(NBSP, ' ')

  return {
    number,
    price(amount: number | null | undefined, rentPeriod?: RentPeriod | null): string {
      if (amount === null || amount === undefined) return t.units.priceOnRequest
      return `${number(amount)} FCFA${rentPeriod ? t.units.rentSuffix[rentPeriod] : ''}`
    },
    budget(amount: number): string {
      if (amount >= 1_000_000_000) return `${number(amount / 1_000_000_000, true)} ${t.units.billion} FCFA`
      if (amount >= 1_000_000) return `${number(amount / 1_000_000, true)} ${t.units.million} FCFA`
      return `${number(amount)} FCFA`
    },
    surface(value: number | null | undefined, unit: SurfaceUnit | null | undefined = 'sqm'): string | null {
      if (value === null || value === undefined) return null
      return `${number(value, true)} ${SURFACE_UNITS[unit ?? 'sqm']}`
    },
    date(iso: string | null | undefined): string | null {
      if (!iso) return null
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? null : date.format(d)
    },
    /**
     * Libellé d'un type de bien : en anglais, libellé anglais du backend (contrat 1.1.0), puis
     * dictionnaire du site ; sinon libellé français du backend.
     */
    propertyType(code: string | null | undefined, labelFr: string | null | undefined, labelEn?: string | null): string {
      if (locale === 'en') return labelEn || (code && t.labels.propertyTypes[code]) || labelFr || ''
      return (code && t.labels.propertyTypes[code]) || labelFr || ''
    },
    amenity(code: string, labelFr: string, labelEn?: string | null): string {
      if (locale === 'en') return labelEn || t.labels.amenities[code] || labelFr
      return t.labels.amenities[code] || labelFr
    },
    /** Contenu saisi par l'agence : anglais si traduit, sinon français (wolof = français). */
    text(fr: string | null | undefined, en: string | null | undefined): string | null {
      return localized(fr ?? null, en, locale)
    },
  }
}

export type Formatters = ReturnType<typeof createFormatters>
