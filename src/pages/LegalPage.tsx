import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { Container, Skeleton } from '@/components/ui/primitives'
import { LEGAL } from '@/config/legal'
import { PHOTOS } from '@/config/photos'
import { useAgency } from '@/features/agency/agencyService'
import { useI18n } from '@/i18n/context'
import { formatPhone } from '@/lib/format'

function Block({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="scroll-mt-28 border-t border-mist-200 py-10 first:border-0 first:pt-0">
      <h2 id={id ? `${id}-title` : undefined} className="font-display text-2xl font-medium text-navy-900">
        {title}
      </h2>
      <div className="prose-abs mt-4">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[14rem_1fr]">
      <dt className="font-semibold text-navy-900">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export default function LegalPage() {
  const { data: agency, status } = useAgency()
  const { t } = useI18n()
  const l = t.legal
  const rows: Array<[string, ReactNode]> = []
  if (agency) {
    rows.push([l.name, agency.legalName ?? agency.name])
    if (agency.address) rows.push([l.office, agency.address])
    if (agency.rccm) rows.push(['RCCM', agency.rccm])
    if (agency.ninea) rows.push(['NINEA', agency.ninea])
    if (agency.phone) rows.push([l.phone, formatPhone(agency.phone)])
    if (agency.email) rows.push([l.email, agency.email])
  }
  if (LEGAL.publicationDirector) rows.push([l.director, LEGAL.publicationDirector])

  return (
    <>
      <Seo title={l.title} description={l.seoDescription} />
      <PageHeader title={l.title} crumbs={[{ name: t.common.home, path: '/' }, { name: l.title }]} />
      <Container className="max-w-4xl py-16 lg:py-20">
        <Block title={l.publisher}>
          {status === 'loading' ? (
            <Skeleton className="h-32" />
          ) : (
            <dl className="divide-y divide-mist-200">
              {rows.map(([label, value]) => (
                <Row key={label} label={label} value={value} />
              ))}
            </dl>
          )}
        </Block>

        {LEGAL.hostingProvider && (
          <Block title={l.hosting}>
            <p>
              {LEGAL.hostingProvider.name} — {LEGAL.hostingProvider.address} —{' '}
              <a href={LEGAL.hostingProvider.website} className="underline" target="_blank" rel="noopener noreferrer">
                {LEGAL.hostingProvider.website}
              </a>
            </p>
          </Block>
        )}

        <Block title={l.listingsTitle}>
          <p>{l.listingsP1}</p>
          <p>{l.listingsP2}</p>
        </Block>

        <Block title={l.ipTitle}>
          <p>{l.ipText}</p>
        </Block>

        <Block title={l.creditsTitle} id="credits">
          <p>{l.creditsIntro}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {Object.values(PHOTOS).map((photo) => (
              <li key={photo.name}>
                {t.photos[photo.id]} — {photo.credit.author},{' '}
                <a href={photo.credit.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline">
                  {photo.credit.license}
                </a>
                , {l.creditsVia}{' '}
                <a href={photo.credit.source} target="_blank" rel="noopener noreferrer" className="underline">
                  Wikimedia Commons
                </a>{' '}
                {l.creditsEdit}
              </li>
            ))}
          </ul>
          <p className="mt-4">{l.creditsOther}</p>
        </Block>
      </Container>
    </>
  )
}
