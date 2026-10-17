import { useSearchParams } from 'react-router'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { WhatsAppIcon } from '@/components/icons/BrandIcons'
import { Container, Skeleton } from '@/components/ui/primitives'
import { useAgency } from '@/features/agency/agencyService'
import { InquiryForm } from '@/features/contact/components/InquiryForm'
import { INQUIRY_SUBJECTS, type InquirySubject } from '@/features/contact/schemas'
import { agencyJsonLd } from '@/features/seo/structuredData'
import { formatPhone, telHref, whatsappHref } from '@/lib/format'

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-card bg-white p-5 ring-1 ring-mist-200">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-700">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-xs font-bold tracking-wide text-mist-500 uppercase">{title}</h2>
        <div className="mt-1 text-navy-900">{children}</div>
      </div>
    </div>
  )
}

export default function ContactPage() {
  const [params] = useSearchParams()
  const { data: agency, status } = useAgency()
  const subjectParam = params.get('sujet')
  const defaultSubject = INQUIRY_SUBJECTS.some((s) => s.value === subjectParam) ? (subjectParam as InquirySubject) : 'general'
  const hasDirectContact = !!(agency?.phone || agency?.whatsapp || agency?.email || agency?.address)

  return (
    <>
      <Seo
        title="Contact"
        description="Contactez ABS IMMO & SERVICES pour un achat, une location, un investissement ou pour confier votre bien. Réponse par téléphone, WhatsApp ou e-mail."
        jsonLd={agencyJsonLd(agency)}
      />
      <PageHeader
        eyebrow="Contact"
        title="Parlons de votre projet immobilier."
        description="Décrivez votre besoin : un conseiller vous recontacte par le moyen de votre choix."
        crumbs={[{ name: 'Accueil', path: '/' }, { name: 'Contact' }]}
      />

      <Container className="grid gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
        <div className="space-y-4 lg:col-span-5">
          {status === 'loading' && (
            <>
              <Skeleton className="h-24 rounded-card" />
              <Skeleton className="h-24 rounded-card" />
            </>
          )}
          {agency?.phone && (
            <InfoCard icon={<Phone aria-hidden="true" className="size-5" />} title="Téléphone">
              <a href={telHref(agency.phone)} className="text-lg font-bold hover:text-brand-red-600">
                {formatPhone(agency.phone)}
              </a>
              {agency.secondaryPhone && (
                <a href={telHref(agency.secondaryPhone)} className="block font-semibold text-mist-700 hover:text-brand-red-600">
                  {formatPhone(agency.secondaryPhone)}
                </a>
              )}
            </InfoCard>
          )}
          {agency?.whatsapp && (
            <InfoCard icon={<WhatsAppIcon className="size-5" />} title="WhatsApp">
              <a
                href={whatsappHref(agency.whatsapp, 'Bonjour ABS IMMO & SERVICES, ')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold hover:text-brand-red-600"
              >
                {formatPhone(agency.whatsapp)}
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            </InfoCard>
          )}
          {agency?.email && (
            <InfoCard icon={<Mail aria-hidden="true" className="size-5" />} title="E-mail">
              <a href={`mailto:${agency.email}`} className="font-bold break-all hover:text-brand-red-600">
                {agency.email}
              </a>
            </InfoCard>
          )}
          {agency?.address && (
            <InfoCard icon={<MapPin aria-hidden="true" className="size-5" />} title="Adresse">
              <address className="not-italic">{agency.address}</address>
            </InfoCard>
          )}
          {agency && agency.openingHours.length > 0 && (
            <InfoCard icon={<Clock aria-hidden="true" className="size-5" />} title="Horaires d’ouverture">
              <ul className="space-y-1">
                {agency.openingHours.map((h) => (
                  <li key={h.days} className="flex justify-between gap-4">
                    <span>{h.days}</span>
                    <span className="font-semibold tabular-nums">
                      {h.open} – {h.close}
                    </span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          )}
          {status !== 'loading' && !hasDirectContact && (
            <p className="rounded-card bg-mist-50 p-5 text-mist-600 ring-1 ring-mist-200">
              Utilisez le formulaire ci-contre : votre demande est transmise directement à l’équipe de l’agence.
            </p>
          )}
        </div>

        <section aria-labelledby="form-title" className="lg:col-span-7">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-mist-200 sm:p-10">
            <h2 id="form-title" className="font-display text-2xl font-medium text-navy-900 sm:text-3xl">
              Envoyer une demande
            </h2>
            <p className="mt-2 mb-8 text-mist-600">Les champs marqués d’un astérisque (*) sont obligatoires.</p>
            <InquiryForm key={defaultSubject} defaultSubject={defaultSubject} />
          </div>
        </section>
      </Container>
    </>
  )
}
