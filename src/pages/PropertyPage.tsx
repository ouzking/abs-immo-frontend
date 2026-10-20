import { useState } from 'react'
import { useParams } from 'react-router'
import { Check, Info, MapPin, Phone, Share2 } from 'lucide-react'
import { Breadcrumbs } from '@/components/layout/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { WhatsAppIcon } from '@/components/icons/BrandIcons'
import { ButtonLink } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Alert, Container, SectionHeading, Skeleton } from '@/components/ui/primitives'
import { useAgency } from '@/features/agency/agencyService'
import type { PropertyDetailView } from '@/features/properties/api/propertiesService'
import { propertyContact, whatsappMessage } from '@/features/properties/contact'
import { Gallery } from '@/features/properties/components/Gallery'
import { PropertyCard, PropertyCardSkeleton, PropertyGrid } from '@/features/properties/components/PropertyCard'
import { PropertyContactCard } from '@/features/properties/components/PropertyContactCard'
import {
  AmenityList,
  DetailSection,
  FeatureList,
  FinancialTerms,
  KeyFacts,
  LocationBlock,
  Paragraphs,
} from '@/features/properties/components/PropertyDetails'
import { CommercialStatusBadge, TransactionBadge } from '@/features/properties/components/StatusBadges'
import { useProperty, useSimilarProperties } from '@/features/properties/hooks'
import { isNoLongerAvailable } from '@/features/properties/labels'
import { catalogPath } from '@/features/search/searchParams'
import { breadcrumbJsonLd, propertyJsonLd } from '@/features/seo/structuredData'
import { useI18n } from '@/i18n/context'
import { telHref, whatsappHref } from '@/lib/format'
import type { TransactionType } from '@/types'
import { NotFoundContent } from './NotFoundPage'

function ShareButton({ title }: { title: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href.split('?')[0]!
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Partage annulé par l'utilisateur : rien à faire.
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-full border border-mist-300 px-4 py-2 text-sm font-semibold text-navy-800 hover:border-navy-700"
    >
      {copied ? <Check aria-hidden="true" className="size-4 text-emerald-700" /> : <Share2 aria-hidden="true" className="size-4" />}
      <span aria-live="polite">{copied ? t.common.linkCopied : t.common.share}</span>
    </button>
  )
}

function StatusNotice({ property: p }: { property: PropertyDetailView }) {
  const { t } = useI18n()
  if (p.commercial_status === 'sold' || p.commercial_status === 'rented') {
    return (
      <Alert tone="info" title={p.commercial_status === 'sold' ? t.property.soldTitle : t.property.rentedTitle} className="mt-6">
        {t.property.unavailableText}
      </Alert>
    )
  }
  if (p.commercial_status === 'reserved') {
    return (
      <Alert tone="info" title={t.property.reservedTitle} className="mt-6">
        {t.property.reservedText}
      </Alert>
    )
  }
  return null
}

function PropertySkeleton() {
  const { t } = useI18n()
  return (
    <Container className="py-8" aria-busy="true">
      <span className="sr-only" role="status">
        {t.property.loading}
      </span>
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-8 h-10 w-3/4" />
      <Skeleton className="mt-3 h-5 w-1/3" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <Skeleton className="aspect-16/10 rounded-card" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    </Container>
  )
}

function SimilarSection({ propertyId }: { propertyId: string }) {
  const { data, status } = useSimilarProperties(propertyId)
  const { t } = useI18n()
  // Section facultative : masquée en cas d'erreur ou d'absence de résultats.
  if (status === 'error' || (status === 'success' && (!data || data.length === 0))) return null
  return (
    <section aria-labelledby="similar-title" className="border-t border-mist-200 bg-mist-50 py-16 lg:py-24">
      <Container>
        <SectionHeading id="similar-title" eyebrow={t.property.similarEyebrow} title={t.property.similarTitle} />
        <PropertyGrid className="mt-10">
          {status === 'loading'
            ? Array.from({ length: 3 }, (_, i) => <PropertyCardSkeleton key={i} />)
            : data!.map((p) => <PropertyCard key={p.id} property={p} />)}
        </PropertyGrid>
      </Container>
    </section>
  )
}

export default function PropertyPage() {
  const { slug } = useParams()
  const { data: p, status, error, refetch } = useProperty(slug)
  const { data: agency } = useAgency()
  const { t, fmt, path, locale } = useI18n()

  if (status === 'loading' || status === 'idle') return <PropertySkeleton />
  if (status === 'error' && error?.kind === 'not_found') {
    return (
      <NotFoundContent
        title={t.property.goneTitle}
        description={t.property.goneText}
      />
    )
  }
  if (status === 'error' || !p) {
    return (
      <Container className="py-20">
        <ErrorState error={error} onRetry={refetch} title={t.property.error} />
      </Container>
    )
  }

  const transaction = (p.transaction_type ?? 'sale') as TransactionType
  const listPath = catalogPath(transaction)
  const listName = transaction === 'rent' ? t.nav.rent : t.nav.buy
  const price = fmt.price(p.price_amount, transaction === 'rent' ? p.rent_period : null)
  const location = [p.neighborhood_name, p.city_name].filter(Boolean).join(', ')
  const unavailable = isNoLongerAvailable(p.commercial_status)
  const contact = propertyContact(p, agency, t)
  const typeLabel = fmt.propertyType(p.property_type, p.property_type_label, p.property_type_label_en)
  // Contrat 1.1.0 : champs anglais facultatifs, repli sur le français (le wolof utilise le français).
  const title = fmt.text(p.title, p.title_en) ?? t.property.fallbackTitle
  const shortDescription = fmt.text(p.short_description, p.short_description_en)
  const longDescription = fmt.text(p.description, p.description_en)
  const seoTitle = fmt.text(p.seo_title, p.seo_title_en)
  const seoDescription = fmt.text(p.seo_description, p.seo_description_en)
  // Contenu réellement rédigé dans la langue affichée ? (sinon les textes saisis restent en français)
  const contentInLocale = locale !== 'en' || !!p.has_english
  const autoDescription = t.property.autoDescription(typeLabel, t.labels.transaction[transaction], location, price)
  const description = contentInLocale && locale !== 'wo' ? (seoDescription ?? shortDescription ?? autoDescription) : autoDescription

  return (
    <>
      <Seo
        title={(contentInLocale && locale !== 'wo' && seoTitle) || `${title}${location ? ` — ${location}` : ''}`}
        description={description}
        canonicalPath={`/biens/${p.slug}`}
        type="article"
        jsonLd={[
          propertyJsonLd(p, path, { name: title, description: shortDescription }),
          breadcrumbJsonLd([
            { name: t.common.home, path: path('/') },
            { name: listName, path: path(listPath) },
            { name: title, path: path(`/biens/${p.slug}`) },
          ]),
        ]}
      />

      <div className="border-b border-mist-200 bg-mist-50">
        <Container className="py-4">
          <Breadcrumbs items={[{ name: t.common.home, path: '/' }, { name: listName, path: listPath }, { name: title }]} />
        </Container>
      </div>

      <Container className="pt-8 pb-28 lg:pt-12 lg:pb-20">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <TransactionBadge type={p.transaction_type} />
              <CommercialStatusBadge status={p.commercial_status} showAvailable />
              {typeLabel && <span className="text-sm font-semibold text-mist-600">{typeLabel}</span>}
            </div>
            <h1 className="font-display mt-4 text-3xl leading-[1.12] font-medium text-navy-900 sm:text-4xl lg:text-5xl">{title}</h1>
            {location && (
              <p className="mt-3 flex items-center gap-2 text-mist-600">
                <MapPin aria-hidden="true" className="size-5 shrink-0 text-brand-red-600" />
                {location}
              </p>
            )}
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mist-500">
              {p.reference && (
                <span>
                  Référence <strong className="font-mono font-semibold text-navy-800">{p.reference}</strong>
                </span>
              )}
              {fmt.date(p.published_at) && <span>{t.property.published(fmt.date(p.published_at)!)}</span>}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <p className="text-3xl font-extrabold tracking-tight text-navy-800 sm:text-4xl">{price}</p>
            <ShareButton title={title} />
          </div>
        </header>

        <StatusNotice property={p} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] xl:gap-14">
          <div className="min-w-0 space-y-10">
            <Gallery images={p.images} title={title} />
            <KeyFacts property={p} />

            {(shortDescription || longDescription) && (
              <DetailSection title={t.property.description} id="desc-title">
                {!contentInLocale && <p className="mb-4 text-sm text-mist-500">{t.property.frenchOnly}</p>}
                {shortDescription && !longDescription?.startsWith(shortDescription) && (
                  <p className="mb-5 text-lg leading-8 font-medium text-navy-900">{shortDescription}</p>
                )}
                {longDescription && <Paragraphs text={longDescription} />}
              </DetailSection>
            )}

            {p.features.length > 0 && (
              <DetailSection title={t.property.features} id="features-title">
                <FeatureList features={p.features} />
              </DetailSection>
            )}

            {p.amenities.length > 0 && (
              <DetailSection title={t.property.amenities} id="amenities-title">
                <AmenityList amenities={p.amenities} />
              </DetailSection>
            )}

            <DetailSection title={t.property.location} id="location-title">
              <LocationBlock property={p} />
            </DetailSection>

            <p className="flex gap-2 text-xs leading-5 text-mist-500">
              <Info aria-hidden="true" className="size-4 shrink-0" />
              {t.property.disclaimer}
            </p>
          </div>

          <aside aria-label={t.property.contactAside} id="contact-bien" className="scroll-mt-24">
            <div className="space-y-4">
              {/* Encadré financier seulement s'il apporte plus que le prix déjà affiché en en-tête. */}
              {(p.price_on_request || p.deposit_amount || p.agency_fee_amount || p.price_negotiable) && (
                <div className="rounded-card bg-navy-900 p-6 text-white">
                  <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
                    {transaction === 'rent' ? t.property.rentLabel : t.property.priceLabel}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold">{price}</p>
                  {p.price_on_request && <p className="mt-1 text-sm text-white/70">{t.property.priceOnRequestText}</p>}
                  <div className="[&_dd]:text-white [&_dl]:border-white/15 [&_dt]:text-white/70">
                    <FinancialTerms property={p} />
                  </div>
                </div>
              )}
              <PropertyContactCard property={p} agency={agency} />
              {unavailable && (
                <ButtonLink to={listPath} variant="outline" className="w-full">
                  {t.property.seeAvailable}
                </ButtonLink>
              )}
            </div>
          </aside>
        </div>
      </Container>

      {p.id && <SimilarSection propertyId={p.id} />}

      {/* Barre de contact mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-mist-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-mist-500">{p.reference}</p>
            <p className="truncate font-extrabold text-navy-800">{price}</p>
          </div>
          {contact.phone && (
            <a
              href={telHref(contact.phone)}
              className="flex size-12 items-center justify-center rounded-full border border-navy-200 text-navy-800"
            >
              <Phone aria-hidden="true" className="size-5" />
              <span className="sr-only">{t.common.call}</span>
            </a>
          )}
          {contact.whatsapp && (
            <a
              href={whatsappHref(contact.whatsapp, whatsappMessage(p, t))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-12 items-center justify-center rounded-full bg-[#1f8f4e] text-white"
            >
              <WhatsAppIcon className="size-5" />
              <span className="sr-only">WhatsApp {t.common.newTab}</span>
            </a>
          )}
          <a href="#contact-bien" className="inline-flex h-12 items-center rounded-full bg-brand-red-600 px-5 font-semibold text-white">
            {t.property.contactButton}
          </a>
        </div>
      </div>
    </>
  )
}
