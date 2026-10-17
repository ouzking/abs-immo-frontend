import { ArrowRight, ClipboardCheck, Eye, MessagesSquare } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Photo, PhotoCredit } from '@/components/ui/Photo'
import { Container } from '@/components/ui/primitives'
import { PHOTOS } from '@/config/photos'

const PILLARS = [
  {
    icon: MessagesSquare,
    title: 'Une écoute attentive',
    text: 'Nous prenons le temps de comprendre votre projet, votre budget et vos contraintes avant de vous proposer quoi que ce soit.',
  },
  {
    icon: Eye,
    title: 'Des informations claires',
    text: 'Prix, statut, caractéristiques : chaque annonce présente les informations disponibles, sans approximation.',
  },
  {
    icon: ClipboardCheck,
    title: 'Un suivi de bout en bout',
    text: 'Visites, échanges avec les propriétaires, démarches : un interlocuteur vous accompagne jusqu’à la conclusion.',
  },
]

export function AgencySection() {
  return (
    <section aria-labelledby="agency-title" className="overflow-hidden bg-mist-50 py-20 lg:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
        <figure className="relative lg:col-span-5">
          <div aria-hidden="true" className="absolute -top-5 -left-5 h-2/3 w-2/3 rounded-[2rem] bg-brand-red-600/90 sm:-top-6 sm:-left-6" />
          <div className="relative overflow-hidden rounded-[2rem] shadow-lift">
            <Photo
              photo={PHOTOS.quartiers}
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="aspect-4/5 w-full"
            />
          </div>
          <figcaption className="mt-3 text-mist-500">
            <PhotoCredit photo={PHOTOS.quartiers} />
          </figcaption>
        </figure>

        <div className="lg:col-span-7">
          <p className="eyebrow">L’agence</p>
          <h2 id="agency-title" className="font-display mt-3 text-3xl leading-[1.12] font-medium text-navy-900 sm:text-4xl lg:text-[2.75rem]">
            Un accompagnement immobilier sérieux, de la première visite à la signature.
          </h2>
          <div className="prose-abs mt-6">
            <p>
              ABS IMMO & SERVICES accompagne particuliers, familles, entreprises et investisseurs, au Sénégal comme
              depuis l’étranger, dans l’achat, la location et la mise en valeur de leurs biens.
            </p>
            <p>
              Notre approche est simple : vous présenter des biens réellement disponibles, vous informer avec
              transparence et rester à vos côtés à chaque étape de votre projet.
            </p>
          </div>

          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-navy-700 shadow-soft ring-1 ring-mist-200">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-4 font-bold text-navy-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-mist-600">{text}</p>
              </li>
            ))}
          </ul>

          <ButtonLink to="/a-propos" variant="ghost" className="mt-10 -ml-5" iconRight={<ArrowRight aria-hidden="true" className="size-4" />}>
            Découvrir l’agence
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}
