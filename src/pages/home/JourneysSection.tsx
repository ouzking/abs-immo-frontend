import { Link } from 'react-router'
import { ArrowUpRight, Building2, Handshake, KeyRound, TrendingUp } from 'lucide-react'
import { Container, SectionHeading } from '@/components/ui/primitives'
import { cn } from '@/lib/cn'

const JOURNEYS = [
  {
    to: '/acheter',
    icon: KeyRound,
    title: 'Acheter un bien',
    text: 'Villa, appartement, terrain ou local : trouvez le bien qui correspond à votre projet de vie ou d’entreprise.',
    cta: 'Voir les biens à vendre',
  },
  {
    to: '/louer',
    icon: Building2,
    title: 'Louer un bien',
    text: 'Logements meublés ou vides, bureaux et commerces : des locations présentées avec leurs conditions réelles.',
    cta: 'Voir les biens à louer',
  },
  {
    to: '/contact?sujet=invest',
    icon: TrendingUp,
    title: 'Investir dans l’immobilier',
    text: 'Résidence secondaire, rendement locatif, investissement depuis la diaspora : parlons de votre stratégie.',
    cta: 'Parler de mon investissement',
  },
  {
    to: '/contact?sujet=sell_property',
    icon: Handshake,
    title: 'Confier un bien à l’agence',
    text: 'Vous souhaitez vendre ou louer votre bien ? Confiez-le à une équipe qui le présentera avec soin.',
    cta: 'Confier mon bien',
  },
] as const

export function JourneysSection() {
  return (
    <section aria-labelledby="journeys-title" className="py-20 lg:py-28">
      <Container>
        <SectionHeading
          id="journeys-title"
          eyebrow="Votre projet"
          title="Quel que soit votre projet, un parcours pensé pour vous."
          align="center"
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEYS.map(({ to, icon: Icon, title, text, cta }, i) => (
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
                  {title}
                </h3>
                <p className={cn('relative mt-3 flex-1 leading-7', i === 0 ? 'text-white/75' : 'text-mist-600')}>{text}</p>
                <span
                  className={cn(
                    'relative mt-8 inline-flex items-center gap-1.5 text-sm font-bold',
                    i === 0 ? 'text-white' : 'text-navy-700',
                  )}
                >
                  {cta}
                  <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
