import type { ReactNode } from 'react'
import { BedDouble, Bath, MapPin, Ruler, Sparkles } from 'lucide-react'
import { Badge, Skeleton } from '@/components/ui/primitives'
import { useI18n } from '@/i18n/context'
import { Link } from '@/i18n/Link'
import { cn } from '@/lib/cn'
import type { PropertyCardView } from '../api/propertiesService'
import { isNoLongerAvailable, propertyLocation } from '../labels'
import { PropertyImage } from './PropertyImage'
import { CommercialStatusBadge, TransactionBadge } from './StatusBadges'

/**
 * Carte d'annonce. N'affiche que les informations réellement renseignées :
 * pas de chambres pour un terrain, pas de surface inventée, « Prix sur demande »
 * si le prix n'est pas public.
 */
export function PropertyCard({
  property: p,
  priority = false,
  headingLevel = 'h3',
}: {
  property: PropertyCardView
  priority?: boolean
  headingLevel?: 'h2' | 'h3'
}) {
  const { t, fmt } = useI18n()
  const Heading = headingLevel
  const location = propertyLocation(p)
  const title = fmt.text(p.title, p.title_en) ?? ''
  const surface = fmt.surface(p.surface_area, p.surface_unit)
  const unavailable = isNoLongerAvailable(p.commercial_status)
  const facts = [
    p.bedrooms ? { icon: BedDouble, label: t.units.bedrooms(p.bedrooms) } : null,
    p.bathrooms ? { icon: Bath, label: t.units.bathrooms(p.bathrooms) } : null,
    surface ? { icon: Ruler, label: surface } : null,
  ].filter((f): f is NonNullable<typeof f> => f !== null)

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-card bg-white ring-1 ring-mist-200',
        'shadow-soft transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:shadow-lift',
        'focus-within:ring-2 focus-within:ring-navy-700',
      )}
    >
      <div className="relative">
        <PropertyImage
          src={p.coverUrl}
          alt={p.cover_image_alt ?? title}
          priority={priority}
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
          className="aspect-4/3"
          imgClassName={cn('transition-transform duration-700 ease-out group-hover:scale-[1.04]', unavailable && 'grayscale-[60%]')}
        />
        <div className="absolute inset-x-3 top-3 flex flex-wrap items-start gap-2">
          <TransactionBadge type={p.transaction_type} />
          <CommercialStatusBadge status={p.commercial_status} />
          {p.is_featured && !unavailable && (
            <Badge tone="white" className="ml-auto">
              <Sparkles aria-hidden="true" className="size-3.5 text-brand-red-600" />{t.labels.featured}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-wide text-mist-500 uppercase">
          <span>{fmt.propertyType(p.property_type, p.property_type_label, p.property_type_label_en)}</span>
          {p.reference && <span className="font-mono text-[0.6875rem] tracking-normal normal-case">{p.reference}</span>}
        </div>
        <Heading className="font-display mt-2 line-clamp-2 text-xl leading-snug font-medium text-navy-900">
          <Link to={`/biens/${p.slug}`} className="outline-none after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </Heading>
        {location && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-mist-600">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-brand-red-600" />
            {location}
          </p>
        )}

        {facts.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-mist-700">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon aria-hidden="true" className="size-4 text-navy-400" />
                {label}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3 border-t border-mist-200 pt-4">
            <p className={cn('text-lg font-extrabold tracking-tight text-navy-800', unavailable && 'text-mist-500')}>
              {fmt.price(p.price_amount, p.transaction_type === 'rent' ? p.rent_period : null)}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-white ring-1 ring-mist-200" aria-hidden="true">
      <Skeleton className="aspect-4/3 rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-6 h-6 w-2/5" />
      </div>
    </div>
  )
}

export function PropertyGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-6 sm:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>
}
