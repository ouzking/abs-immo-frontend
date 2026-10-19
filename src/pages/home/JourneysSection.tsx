import { ArrowUpRight, Building2, Handshake, KeyRound, TrendingUp } from 'lucide-react'
import { Container, SectionHeading } from '@/components/ui/primitives'
import { useI18n } from '@/i18n/context'
import { Link } from '@/i18n/Link'
import { cn } from '@/lib/cn'

/** Destinations et icônes des quatre parcours ; les textes sont dans les dictionnaires (home.journeys.items). */
const JOURNEYS = [
  { to: '/acheter', icon: KeyRound },
  { to: '/louer', icon: Building2 },
  { to: '/contact?sujet=invest', icon: TrendingUp },
  { to: '/contact?sujet=sell_property', icon: Handshake },
] as const

export function JourneysSection() {
  const { t } = useI18n()
  const j = t.home.journeys
  return (
    <section aria-labelledby="journeys-title" className="py-20 lg:py-28">
      <Container>
        <SectionHeading id="journeys-title" eyebrow={j.eyebrow} title={j.title} align="center" />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEYS.map(({ to, icon: Icon }, i) => {
            const item = j.items[i]!
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    'group relative flex h-full flex-col overflow-hidden rounded-card p-7 ring-1 transition-[transform,box-shadow,background-color] duration-300',
                    'hover:-translate-y-1 hover:shadow-lift',
                    i === 0 ? 'bg-navy-800 text-white ring-navy-800' : 'bg-white text-ink ring-mist-200 hover:ring-navy-200',
                  )}
                >
                  {/* Numéro purement décoratif : rendu en pseudo-élément pour rester hors de l'arbre d'accessibilité. */}
                  <span
                    aria-hidden="true"
                    data-num={`0${i + 1}`}
                    className={cn(
                      'font-display absolute top-5 right-6 text-5xl font-medium before:content-[attr(data-num)]',
                      i === 0 ? 'text-white/10' : 'text-navy-50',
                    )}
                  />
                  <span
                    className={cn(
                      'relative flex size-12 items-center justify-center rounded-2xl',
                      i === 0 ? 'bg-white/10 text-white' : 'bg-brand-red-50 text-brand-red-600',
                    )}
                  >
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className={cn('font-display relative mt-8 text-2xl font-medium', i === 0 ? 'text-white' : 'text-navy-900')}>
                    {item.title}
                  </h3>
                  <p className={cn('relative mt-3 flex-1 leading-7', i === 0 ? 'text-white/75' : 'text-mist-600')}>{item.text}</p>
                  <span className={cn('relative mt-8 inline-flex items-center gap-1.5 text-sm font-bold', i === 0 ? 'text-white' : 'text-navy-700')}>
                    {item.cta}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
