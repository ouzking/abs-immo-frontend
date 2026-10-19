import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Armchair,
  Bath,
  BedDouble,
  Building,
  CalendarDays,
  Car,
  Check,
  DoorOpen,
  FileCheck2,
  Layers,
  LandPlot,
  Ruler,
  Toilet,
} from 'lucide-react'
import { useI18n, type I18nValue } from '@/i18n/context'
import type { LegalStatus } from '@/types'
import type { PropertyDetailView } from '../api/propertiesService'

interface Fact {
  icon: LucideIcon
  label: string
  value: string
}

/** Caractéristiques chiffrées : uniquement celles renseignées par l'agence. */
function buildKeyFacts(p: PropertyDetailView, { t, fmt }: I18nValue): Fact[] {
  const f = t.property.facts
  const facts: Array<Fact | null> = [
    p.surface_area ? { icon: Ruler, label: f.surface, value: fmt.surface(p.surface_area, p.surface_unit)! } : null,
    p.land_area ? { icon: LandPlot, label: f.land, value: fmt.surface(p.land_area, 'sqm')! } : null,
    p.rooms ? { icon: DoorOpen, label: f.rooms, value: String(p.rooms) } : null,
    p.bedrooms ? { icon: BedDouble, label: f.bedrooms, value: String(p.bedrooms) } : null,
    p.bathrooms ? { icon: Bath, label: f.bathrooms, value: String(p.bathrooms) } : null,
    p.toilets ? { icon: Toilet, label: f.toilets, value: String(p.toilets) } : null,
    p.floor !== null && p.floor !== undefined
      ? {
          icon: Layers,
          label: f.floor,
          value: p.floor === 0 ? t.units.groundFloor : t.units.floor(p.floor, p.total_floors),
        }
      : null,
    p.parking_spaces ? { icon: Car, label: f.parking, value: t.units.parking(p.parking_spaces) } : null,
    p.year_built ? { icon: CalendarDays, label: f.year, value: String(p.year_built) } : null,
    p.is_furnished !== null && p.is_furnished !== undefined
      ? { icon: Armchair, label: f.furnishing, value: p.is_furnished ? f.furnished : f.unfurnished }
      : null,
    p.legal_status
      ? { icon: FileCheck2, label: f.legal, value: t.labels.legal[p.legal_status as LegalStatus] ?? p.legal_status }
      : null,
  ]
  return facts.filter((f): f is Fact => f !== null)
}

export function KeyFacts({ property }: { property: PropertyDetailView }) {
  const facts = buildKeyFacts(property, useI18n())
  if (facts.length === 0) return null
  return (
    // Bordures portées par les cellules ; la marge négative masque celles du bord : pas de case vide colorée.
    <div className="overflow-hidden rounded-card border border-mist-200 bg-white">
      <dl className="-mr-px -mb-px grid grid-cols-2 sm:grid-cols-3">
        {facts.map(({ icon: Icon, label, value }) => (
          // <div> ne contient que <dt>/<dd> (structure de liste de définitions valide) ; l'icône est dans le <dt>.
          <div key={label} className="relative border-r border-b border-mist-200 p-4 pl-12 sm:p-5 sm:pl-13">
            <dt className="text-xs font-semibold tracking-wide text-mist-500 uppercase">
              <Icon aria-hidden="true" className="absolute top-4.5 left-4 size-5 text-brand-red-600 sm:top-5.5 sm:left-5" />
              {label}
            </dt>
            <dd className="mt-0.5 font-bold text-navy-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function DetailSection({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="border-t border-mist-200 pt-10">
      <h2 id={id} className="font-display text-2xl font-medium text-navy-900 sm:text-[1.75rem]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

/** Texte saisi par l'agence : rendu en paragraphes, sans jamais interpréter de HTML. */
export function Paragraphs({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
  return (
    <div className="prose-abs">
      {blocks.map((b, i) => (
        <p key={i} className="whitespace-pre-line">
          {b}
        </p>
      ))}
    </div>
  )
}

export function AmenityList({ amenities }: { amenities: PropertyDetailView['amenities'] }) {
  const { t, fmt } = useI18n()
  const categories: Record<string, string> = t.labels.amenityCategories
  const groups = new Map<string, string[]>()
  for (const a of amenities) {
    const key = categories[a.category] ?? t.labels.amenityCategories.other
    groups.set(key, [...(groups.get(key) ?? []), fmt.amenity(a.code, a.label)])
  }
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {[...groups.entries()].map(([category, labels]) => (
        <div key={category}>
          <h3 className="text-sm font-bold tracking-wide text-mist-500 uppercase">{category}</h3>
          <ul className="mt-3 space-y-2.5">
            {labels.map((label) => (
              <li key={label} className="flex items-center gap-2.5 text-mist-700">
                <span className="flex size-6 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                  <Check aria-hidden="true" className="size-3.5" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function FeatureList({ features }: { features: PropertyDetailView['features'] }) {
  const { t } = useI18n()
  return (
    <dl className="divide-y divide-mist-200 rounded-card ring-1 ring-mist-200">
      {features.map((f, i) => (
        <div key={`${f.label}-${i}`} className="flex flex-wrap justify-between gap-2 px-5 py-3.5">
          <dt className="text-mist-600">{f.label}</dt>
          <dd className="font-semibold text-navy-900">{f.value ?? <Check aria-label={t.property.facts.yes} className="size-4" />}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Conditions financières renseignées (dépôt, honoraires, négociation). */
export function FinancialTerms({ property: p }: { property: PropertyDetailView }) {
  const { t, fmt } = useI18n()
  const rows: Array<[string, string]> = []
  if (p.deposit_amount) rows.push([t.property.terms.deposit, fmt.price(p.deposit_amount)])
  if (p.agency_fee_amount) rows.push([t.property.terms.fee, fmt.price(p.agency_fee_amount)])
  if (p.price_negotiable) rows.push([t.property.terms.price, t.property.terms.negotiable])
  if (rows.length === 0) return null
  return (
    <dl className="mt-4 space-y-2 border-t border-mist-200 pt-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3">
          <dt className="text-mist-600">{label}</dt>
          <dd className="font-semibold text-navy-900">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function LocationBlock({ property: p }: { property: PropertyDetailView }) {
  const { t } = useI18n()
  const parts = [p.address_line, p.neighborhood_name, p.commune_name, p.city_name, p.region_name].filter(
    (v, i, arr): v is string => !!v && arr.indexOf(v) === i,
  )
  const precisionNote =
    p.location_precision === 'exact'
      ? null
      : t.property.locationPrivacy
  return (
    <div className="flex gap-4 rounded-card bg-mist-50 p-5 ring-1 ring-mist-200">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-navy-700 shadow-soft">
        <Building aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="font-bold text-navy-900">{p.location_label ?? (parts.join(', ') || t.property.country)}</p>
        {p.location_label && parts.length > 0 && <p className="mt-1 text-mist-600">{parts.join(', ')}</p>}
        {precisionNote && <p className="mt-2 text-sm text-mist-500">{precisionNote}</p>}
        {p.latitude !== null && p.longitude !== null && p.location_precision !== 'hidden' && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=${p.location_precision === 'exact' ? 17 : 14}/${p.latitude}/${p.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-navy-700 underline underline-offset-2"
          >
            {t.property.map}
            {p.location_precision === 'approximate' ? t.property.mapApprox : ''}
          </a>
        )}
      </div>
    </div>
  )
}

