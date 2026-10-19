import { Compass } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/primitives'
import { useI18n } from '@/i18n/context'

export function NotFoundContent({ title, description }: { title?: string; description?: string }) {
  const { t } = useI18n()
  const heading = title ?? t.notFound.title
  const text = description ?? t.notFound.description
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <Seo title={heading} description={text} noindex />
      <span className="flex size-16 items-center justify-center rounded-full bg-navy-50 text-navy-700">
        <Compass aria-hidden="true" className="size-8" />
      </span>
      <p className="font-display mt-6 text-sm font-semibold tracking-[0.3em] text-brand-red-600">{t.notFound.code}</p>
      <h1 className="font-display mt-3 text-4xl font-medium text-navy-900 sm:text-5xl">{heading}</h1>
      <p className="mt-4 max-w-lg text-lg text-mist-600">{text}</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/biens">{t.notFound.properties}</ButtonLink>
        <ButtonLink to="/" variant="outline">
          {t.notFound.home}
        </ButtonLink>
      </div>
    </Container>
  )
}

export default function NotFoundPage() {
  return <NotFoundContent />
}
