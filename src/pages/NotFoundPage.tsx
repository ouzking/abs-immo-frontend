import { Compass } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/primitives'

export function NotFoundContent({
  title = 'Cette page est introuvable',
  description = 'L’adresse saisie n’existe pas ou plus. Les liens ci-dessous vous ramènent vers nos biens.',
}: {
  title?: string
  description?: string
}) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <Seo title={title} description={description} noindex />
      <span className="flex size-16 items-center justify-center rounded-full bg-navy-50 text-navy-700">
        <Compass aria-hidden="true" className="size-8" />
      </span>
      <p className="font-display mt-6 text-sm font-semibold tracking-[0.3em] text-brand-red-600">ERREUR 404</p>
      <h1 className="font-display mt-3 text-4xl font-medium text-navy-900 sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-lg text-lg text-mist-600">{description}</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/biens">Voir nos biens</ButtonLink>
        <ButtonLink to="/" variant="outline">
          Retour à l’accueil
        </ButtonLink>
      </div>
    </Container>
  )
}

export default function NotFoundPage() {
  return <NotFoundContent />
}
