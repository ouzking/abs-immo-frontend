import { ArrowRight, Building2 } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Container, SectionHeading, StateMessage } from '@/components/ui/primitives'
import { PropertyCard, PropertyCardSkeleton, PropertyGrid } from '@/features/properties/components/PropertyCard'
import { useFeaturedProperties } from '@/features/properties/hooks'

export function FeaturedSection() {
  const { data, status, error, refetch } = useFeaturedProperties(6)

  return (
    <section aria-labelledby="featured-title" className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          id="featured-title"
          eyebrow="Sélection"
          title="Biens à la une"
          description="Une sélection d’annonces actuellement proposées par l’agence, mise à jour en temps réel."
          action={
            <ButtonLink to="/biens" variant="outline" iconRight={<ArrowRight aria-hidden="true" className="size-4" />}>
              Voir tous les biens
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
          {status === 'error' && <ErrorState error={error} onRetry={refetch} title="Les annonces n’ont pas pu être chargées" />}
          {status === 'success' && data?.length === 0 && (
            <StateMessage
              icon={<Building2 aria-hidden="true" className="size-6" />}
              title="De nouvelles annonces arrivent bientôt"
              description="Aucun bien n’est publié pour le moment. Décrivez-nous votre projet : nous vous informerons des opportunités correspondantes."
              action={<ButtonLink to="/contact">Décrire mon projet</ButtonLink>}
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
