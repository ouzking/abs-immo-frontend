import { ArrowRight, Building2, Handshake, KeyRound, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { ButtonLink } from '@/components/ui/Button'
import { Photo, PhotoCredit } from '@/components/ui/Photo'
import { Container, SectionHeading } from '@/components/ui/primitives'
import { PHOTOS } from '@/config/photos'
import { useAgency, useTeam } from '@/features/agency/agencyService'
import { breadcrumbJsonLd } from '@/features/seo/structuredData'

const SERVICES = [
  {
    icon: KeyRound,
    title: 'Achat',
    text: 'Recherche ciblée, organisation des visites, accompagnement dans la négociation et les démarches jusqu’à l’acte.',
  },
  {
    icon: Building2,
    title: 'Location',
    text: 'Logements, bureaux et commerces : sélection selon vos critères, visites et constitution du dossier.',
  },
  {
    icon: TrendingUp,
    title: 'Investissement',
    text: 'Conseil pour un premier investissement, une résidence secondaire ou un projet porté depuis l’étranger.',
  },
  {
    icon: Handshake,
    title: 'Mise en vente et en location',
    text: 'Présentation soignée de votre bien, diffusion, sélection des candidats et suivi des visites.',
  },
]

const STEPS = [
  { title: 'Écouter', text: 'Un premier échange pour comprendre votre projet, votre budget et votre calendrier.' },
  { title: 'Sélectionner', text: 'Une proposition de biens cohérente avec vos critères, sans visites inutiles.' },
  { title: 'Visiter', text: 'Des visites organisées avec vous, en présence d’un conseiller.' },
  { title: 'Concrétiser', text: 'Un accompagnement dans la négociation et les démarches jusqu’à la signature.' },
]

function Team() {
  const { data: team } = useTeam()
  if (!team || team.length === 0) return null
  return (
    <section aria-labelledby="team-title" className="py-20 lg:py-28">
      <Container>
        <SectionHeading id="team-title" eyebrow="L’équipe" title="Vos interlocuteurs" />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <li key={m.slug} className="rounded-card bg-white p-6 text-center ring-1 ring-mist-200">
              {m.photoUrl ? (
                <img src={m.photoUrl} alt="" width={96} height={96} loading="lazy" className="mx-auto size-24 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="font-display mx-auto flex size-24 items-center justify-center rounded-full bg-navy-700 text-3xl text-white">
                  {m.name.charAt(0)}
                </span>
              )}
              <h3 className="mt-5 font-bold text-navy-900">{m.name}</h3>
              {m.jobTitle && <p className="text-sm text-mist-600">{m.jobTitle}</p>}
              {m.languages.length > 0 && <p className="mt-2 text-xs text-mist-500">Langues : {m.languages.join(', ')}</p>}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

export default function AboutPage() {
  const { data: agency } = useAgency()
  return (
    <>
      <Seo
        title="À propos de l’agence"
        description="ABS IMMO & SERVICES, agence immobilière au Sénégal : achat, location, investissement et mise en valeur de biens, avec un accompagnement sérieux à chaque étape."
        jsonLd={breadcrumbJsonLd([
          { name: 'Accueil', path: '/' },
          { name: 'À propos', path: '/a-propos' },
        ])}
      />
      <PageHeader
        eyebrow="À propos"
        title="Une agence immobilière exigeante, au service de vos projets."
        crumbs={[{ name: 'Accueil', path: '/' }, { name: 'À propos' }]}
      />

      <section aria-labelledby="philo-title" className="py-20 lg:py-28">
        <Container className="grid items-start gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-7">
            <p className="eyebrow">Notre philosophie</p>
            <h2 id="philo-title" className="font-display mt-3 text-3xl leading-tight font-medium text-navy-900 sm:text-4xl">
              La confiance se construit sur la clarté et la constance.
            </h2>
            <div className="prose-abs mt-6">
              {agency?.description ? (
                <p>{agency.description}</p>
              ) : (
                <p>
                  ABS IMMO & SERVICES accompagne celles et ceux qui achètent, louent, investissent ou souhaitent confier
                  un bien au Sénégal. Résidents comme membres de la diaspora et clients internationaux trouvent auprès
                  de l’agence un interlocuteur disponible et des informations fiables.
                </p>
              )}
              <p>
                Chaque annonce publiée sur ce site affiche son statut réel — disponible, sous option, vendu ou loué — et
                uniquement les informations confirmées par l’agence. Notre rôle : vous faire gagner du temps et sécuriser
                chacune de vos décisions.
              </p>
            </div>
          </div>
          <figure className="lg:col-span-5">
            <div className="overflow-hidden rounded-[2rem] shadow-lift">
              <Photo photo={PHOTOS.quartiers} sizes="(min-width: 1024px) 36vw, 90vw" className="aspect-4/5 w-full" />
            </div>
            <figcaption className="mt-3 text-mist-500">
              <PhotoCredit photo={PHOTOS.quartiers} />
            </figcaption>
          </figure>
        </Container>
      </section>

      <section aria-labelledby="services-title" className="bg-mist-50 py-20 lg:py-28">
        <Container>
          <SectionHeading id="services-title" eyebrow="Nos services" title="Un accompagnement complet" align="center" />
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-card bg-white p-7 ring-1 ring-mist-200">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-red-50 text-brand-red-600">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="font-display mt-6 text-xl font-medium text-navy-900">{title}</h3>
                <p className="mt-3 leading-7 text-mist-600">{text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="method-title" className="py-20 lg:py-28">
        <Container>
          <SectionHeading id="method-title" eyebrow="Notre méthode" title="Quatre étapes, un seul interlocuteur" />
          <ol className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative border-t-2 border-navy-100 pt-6">
                <span aria-hidden="true" className="absolute -top-0.5 left-0 h-0.5 w-12 bg-brand-red-600" />
                <span className="font-display text-sm font-semibold text-brand-red-600">Étape {i + 1}</span>
                <h3 className="font-display mt-2 text-2xl font-medium text-navy-900">{s.title}</h3>
                <p className="mt-3 leading-7 text-mist-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Team />

      <section className="bg-navy-900 py-16 text-white">
        <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <h2 className="font-display max-w-xl text-3xl font-medium">Un projet immobilier au Sénégal ? Parlons-en.</h2>
          <ButtonLink to="/contact" size="lg" iconRight={<ArrowRight aria-hidden="true" className="size-5" />}>
            Contacter l’agence
          </ButtonLink>
        </Container>
      </section>
    </>
  )
}
