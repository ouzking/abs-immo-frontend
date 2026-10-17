import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { Container, Skeleton } from '@/components/ui/primitives'
import { LEGAL } from '@/config/legal'
import { PHOTOS } from '@/config/photos'
import { useAgency } from '@/features/agency/agencyService'
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
  const rows: Array<[string, ReactNode]> = []
  if (agency) {
    rows.push(['Dénomination', agency.legalName ?? agency.name])
    if (agency.address) rows.push(['Siège', agency.address])
    if (agency.rccm) rows.push(['RCCM', agency.rccm])
    if (agency.ninea) rows.push(['NINEA', agency.ninea])
    if (agency.phone) rows.push(['Téléphone', formatPhone(agency.phone)])
    if (agency.email) rows.push(['E-mail', agency.email])
  }
  if (LEGAL.publicationDirector) rows.push(['Directeur de la publication', LEGAL.publicationDirector])

  return (
    <>
      <Seo title="Mentions légales" description="Mentions légales du site ABS IMMO & SERVICES : éditeur, hébergement, propriété intellectuelle et crédits." />
      <PageHeader title="Mentions légales" crumbs={[{ name: 'Accueil', path: '/' }, { name: 'Mentions légales' }]} />
      <Container className="max-w-4xl py-16 lg:py-20">
        <Block title="Éditeur du site">
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
          <Block title="Hébergement">
            <p>
              {LEGAL.hostingProvider.name} — {LEGAL.hostingProvider.address} —{' '}
              <a href={LEGAL.hostingProvider.website} className="underline" target="_blank" rel="noopener noreferrer">
                {LEGAL.hostingProvider.website}
              </a>
            </p>
          </Block>
        )}

        <Block title="Annonces immobilières">
          <p>
            Les annonces sont publiées par ABS IMMO & SERVICES à partir des informations dont l’agence dispose. Elles
            sont fournies à titre indicatif, n’ont pas de valeur contractuelle et peuvent être modifiées ou retirées à
            tout moment. Le statut affiché (disponible, sous option, vendu, loué) est mis à jour par l’agence.
          </p>
          <p>
            Les adresses exactes des biens ne sont publiées qu’avec l’accord de leur propriétaire ; à défaut, seule une
            localisation approximative est indiquée.
          </p>
        </Block>

        <Block title="Propriété intellectuelle">
          <p>
            Le logo, la marque ABS IMMO & SERVICES ainsi que les photographies des biens sont la propriété de l’agence
            ou de leurs auteurs. Toute reproduction sans autorisation est interdite.
          </p>
        </Block>

        <Block title="Crédits" id="credits">
          <p>
            Les photographies de Dakar utilisées pour illustrer le site ne représentent pas des biens proposés par
            l’agence. Elles sont publiées sous licence Creative Commons :
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {Object.values(PHOTOS).map((photo) => (
              <li key={photo.name}>
                {photo.alt} — {photo.credit.author},{' '}
                <a href={photo.credit.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline">
                  {photo.credit.license}
                </a>
                , via{' '}
                <a href={photo.credit.source} target="_blank" rel="noopener noreferrer" className="underline">
                  Wikimedia Commons
                </a>{' '}
                (image recadrée et compressée).
              </li>
            ))}
          </ul>
          <p className="mt-4">
            Icônes : Lucide (licence ISC) et Simple Icons (CC0). Polices : Fraunces et Manrope (SIL Open Font License).
          </p>
        </Block>
      </Container>
    </>
  )
}
