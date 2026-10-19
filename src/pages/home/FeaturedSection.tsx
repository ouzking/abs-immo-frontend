import { ArrowRight, Building2 } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Container, SectionHeading, StateMessage } from '@/components/ui/primitives'
import { PropertyCard, PropertyCardSkeleton, PropertyGrid } from '@/features/properties/components/PropertyCard'
import { useFeaturedProperties } from '@/features/properties/hooks'
import { useI18n } from '@/i18n/context'

export function FeaturedSection() {
  const { data, status, error, refetch } = useFeaturedProperties(6)
  const { t } = useI18n()
  const f = t.home.featured

  return (
    <section aria-labelledby="featured-title" className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          id="featured-title"
          eyebrow={f.eyebrow}
          title={f.title}
          description={f.description}
          action={
            <ButtonLink to="/biens" variant="outline" iconRight={<ArrowRight aria-hidden="true" className="size-4" />}>
              {f.all}
            </ButtonLink>
          }
        />

        <div className="mt-12" aria-busy={status === 'loading'}>
          {status === 'loading' && (
            <PropertyGrid>
              {Array.from({ length: 3 }, (_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </PropertyGrid>
          )}
          {status === 'error' && <ErrorState error={error} onRetry={refetch} title={f.error} />}
          {status === 'success' && data?.length === 0 && (
            <StateMessage
              icon={<Building2 aria-hidden="true" className="size-6" />}
              title={f.emptyTitle}
              description={f.emptyText}
              action={<ButtonLink to="/contact">{f.emptyCta}</ButtonLink>}
            />
          )}
          {status === 'success' && data && data.length > 0 && (
            <PropertyGrid>
              {data.map((p, i) => (
                <PropertyCard key={p.id} property={p} priority={i < 3} />
              ))}
            </PropertyGrid>
          )}
        </div>
      </Container>
    </section>
  )
}
