import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/components/ui/primitives'
import { env } from '@/config/env'
import { LEGAL } from '@/config/legal'
import { useAgency } from '@/features/agency/agencyService'
import { useI18n } from '@/i18n/context'
import { Link } from '@/i18n/Link'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-mist-200 py-10 first:border-0 first:pt-0">
      <h2 className="font-display text-2xl font-medium text-navy-900">{title}</h2>
      <div className="prose-abs mt-4">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  const { data: agency } = useAgency()
  const { t } = useI18n()
  const p = t.privacy
  const controller = agency?.legalName ?? agency?.name ?? 'ABS IMMO & SERVICES'
  return (
    <>
      <Seo title={p.seoTitle} description={p.seoDescription} />
      <PageHeader title={p.title} crumbs={[{ name: t.common.home, path: '/' }, { name: p.title }]} />
      <Container className="max-w-4xl py-16 lg:py-20">
        <Block title={p.controllerTitle}>
          <p>
            {p.controllerText(controller, agency?.address ?? null)}
            {LEGAL.cdpDeclaration ? p.cdp(LEGAL.cdpDeclaration) : ''}
          </p>
        </Block>

        <Block title={p.dataTitle}>
          <p>{p.dataP1}</p>
          <p>{p.dataP2}</p>
        </Block>

        <Block title={p.abuseTitle}>
          <p>
            {p.abuseText}
            {env.turnstileSiteKey ? p.abuseCaptcha : ''}
          </p>
        </Block>

        <Block title={p.recipientsTitle}>
          <p>{p.recipientsText}</p>
        </Block>

        <Block title={p.cookiesTitle}>
          <p>{p.cookiesText}</p>
        </Block>

        <Block title={p.rightsTitle}>
          <p>
            {p.rightsIntro}
            {agency?.email ? (
              <>
                {' '}
                {p.rightsEmail}{' '}
                <a href={`mailto:${agency.email}`} className="underline">
                  {agency.email}
                </a>
              </>
            ) : (
              <>
                {' '}
                {p.rightsContact}{' '}
                <Link to="/contact" className="underline">
                  {p.rightsContactLink}
                </Link>
              </>
            )}
            {p.rightsEnd}
          </p>
        </Block>
      </Container>
    </>
  )
}
