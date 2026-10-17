import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Photo, PhotoCredit } from '@/components/ui/Photo'
import { Container } from '@/components/ui/primitives'
import { PHOTOS } from '@/config/photos'
import { HeroSearch } from '@/features/search/components/HeroSearch'

export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-navy-950">
      <Photo
        photo={PHOTOS.corniche}
        priority
        decorative
        sizes="100vw"
        className="absolute inset-0 -z-20 size-full object-[65%_center]"
      />
      {/* Voiles marine : lisibilité du texte (contraste AA) quelle que soit la zone de la photo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-r from-navy-950/95 via-navy-950/70 to-navy-950/15"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-linear-to-t from-navy-950/90 to-transparent" />

      <Container className="flex min-h-[calc(100svh-5rem)] flex-col justify-end pt-20 pb-10 sm:pt-28 lg:max-h-[960px] lg:pb-14">
        <div className="max-w-3xl">
          <p className="eyebrow animate-fade-up text-white/85">Agence immobilière · Sénégal</p>
          <h1
            id="hero-title"
            className="font-display mt-5 animate-fade-up text-[2.6rem] leading-[1.04] font-medium text-white [animation-delay:80ms] sm:text-6xl lg:text-7xl"
          >
            Votre prochain chapitre immobilier{' '}
            <span className="relative whitespace-nowrap">
              commence ici
              <span aria-hidden="true" className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-brand-red-600 sm:h-1.5" />
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl animate-fade-up text-lg leading-8 text-white/85 [animation-delay:160ms] sm:text-xl">
            Achetez, louez ou confiez votre projet immobilier à une équipe qui vous accompagne avec sérieux et
            professionnalisme.
          </p>
          <div className="mt-9 flex animate-fade-up flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <ButtonLink to="/biens" size="lg" iconRight={<ArrowRight aria-hidden="true" className="size-5" />}>
              Découvrir nos biens
            </ButtonLink>
            <ButtonLink to="/contact" size="lg" variant="outline-light">
              Confier mon projet
            </ButtonLink>
          </div>
        </div>

        <div className="mt-14 animate-fade-up [animation-delay:320ms] lg:mt-20">
          <HeroSearch />
        </div>
        <PhotoCredit photo={PHOTOS.corniche} className="mt-4 text-right text-white/55" />
      </Container>
    </section>
  )
}
