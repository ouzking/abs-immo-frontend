import { ArrowRight, ClipboardCheck, Eye, MessagesSquare } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Photo, PhotoCredit } from '@/components/ui/Photo'
import { Container } from '@/components/ui/primitives'
import { PHOTOS } from '@/config/photos'
import { useI18n } from '@/i18n/context'

const PILLAR_ICONS = [MessagesSquare, Eye, ClipboardCheck]

export function AgencySection() {
  const { t } = useI18n()
  const a = t.home.agency
  return (
    <section aria-labelledby="agency-title" className="overflow-hidden bg-mist-50 py-20 lg:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
        <figure className="relative lg:col-span-5">
          <div aria-hidden="true" className="absolute -top-5 -left-5 h-2/3 w-2/3 rounded-4xl bg-brand-red-600/90 sm:-top-6 sm:-left-6" />
          <div className="relative overflow-hidden rounded-4xl shadow-lift">
            <Photo photo={PHOTOS.quartiers} sizes="(min-width: 1024px) 40vw, 90vw" className="aspect-4/5 w-full" />
          </div>
          <figcaption className="mt-3 text-mist-500">
            <PhotoCredit photo={PHOTOS.quartiers} />
          </figcaption>
        </figure>

        <div className="lg:col-span-7">
          <p className="eyebrow">{a.eyebrow}</p>
          <h2 id="agency-title" className="font-display mt-3 text-3xl leading-[1.12] font-medium text-navy-900 sm:text-4xl lg:text-[2.75rem]">
            {a.title}
          </h2>
          <div className="prose-abs mt-6">
            <p>{a.p1}</p>
            <p>{a.p2}</p>
          </div>

          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {a.pillars.map(({ title, text }, i) => {
              const Icon = PILLAR_ICONS[i] ?? MessagesSquare
              return (
                <li key={title}>
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-navy-700 shadow-soft ring-1 ring-mist-200">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="mt-4 font-bold text-navy-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-mist-600">{text}</p>
                </li>
              )
            })}
          </ul>

          <ButtonLink to="/a-propos" variant="ghost" className="mt-10 -ml-5" iconRight={<ArrowRight aria-hidden="true" className="size-4" />}>
            {a.more}
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}
