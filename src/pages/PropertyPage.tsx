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
import { isNoLongerAvailable, TRANSACTION_LABELS } from '@/features/properties/labels'
import { catalogPath } from '@/features/search/searchParams'
import { breadcrumbJsonLd, propertyJsonLd } from '@/features/seo/structuredData'
import { formatDate, formatPrice, telHref, whatsappHref } from '@/lib/format'
import type { TransactionType } from '@/types'
import { NotFoundContent } from './NotFoundPage'

function ShareButton({ title }: { title: string }) {
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
      <span aria-live="polite">{copied ? 'Lien copié' : 'Partager'}</span>
    </button>
  )
}

function StatusNotice({ property: p }: { property: PropertyDetailView }) {
  if (p.commercial_status === 'sold' || p.commercial_status === 'rented') {
    return (
      <Alert tone="info" title={p.commercial_status === 'sold' ? 'Ce bien a été vendu.' : 'Ce bien a été loué.'} className="mt-6">
        Il n’est plus disponible. Découvrez ci-dessous des biens comparables encore proposés, ou confiez-nous votre recherche.
      </Alert>
    )
  }
  if (p.commercial_status === 'reserved') {
    return (
      <Alert tone="info" title="Ce bien est actuellement sous option." className="mt-6">
        Une offre est en cours. Vous pouvez néanmoins nous contacter pour être informé si le bien redevient disponible.
      </Alert>
    )
  }
  return null
}

function PropertySkeleton() {
  return (
    <Container className="py-8" aria-busy="true">
      <span className="sr-only" role="status">
        Chargement de l’annonce…
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
  // Section facultative : masquée en cas d'erreur ou d'absence de résultats.
  if (status === 'error' || (status === 'success' && (!data || data.length === 0))) return null
  return (
    <section aria-labelledby="similar-title" className="border-t border-mist-200 bg-mist-50 py-16 lg:py-24">
      <Container>
        <SectionHeading id="similar-title" eyebrow="À découvrir aussi" title="Biens similaires disponibles" />
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

  if (status === 'loading' || status === 'idle') return <PropertySkeleton />
  if (status === 'error' && error?.kind === 'not_found') {
    return (
      <NotFoundContent
        title="Cette annonce n’est plus en ligne"
        description="Le bien a peut-être été retiré de la vente ou de la location. Découvrez les autres biens proposés par l’agence."
      />
    )
  }
  if (status === 'error' || !p) {
    return (
      <Container className="py-20">
        <ErrorState error={error} onRetry={refetch} title="L’annonce n’a pas pu être chargée" />
      </Container>
    )
  }

  const transaction = (p.transaction_type ?? 'sale') as TransactionType
  const listPath = catalogPath(transaction)
  const listName = transaction === 'rent' ? 'Louer' : 'Acheter'
  const price = formatPrice(p.price_amount, transaction === 'rent' ? p.rent_period : null)
  const location = [p.neighborhood_name, p.city_name].filter(Boolean).join(', ')
  const unavailable = isNoLongerAvailable(p.commercial_status)
  const contact = propertyContact(p, agency)
  const description =
    p.seo_description ??
    p.short_description ??
    `${p.property_type_label ?? 'Bien'} ${TRANSACTION_LABELS[transaction].toLowerCase()}${location ? ` à ${location}` : ''} — ${price}.`

  return (
    <>
      <Seo
        title={p.seo_title ?? `${p.title}${location ? ` — ${location}` : ''}`}
        description={description}
        canonicalPath={`/biens/${p.slug}`}
        type="article"
        jsonLd={[
          propertyJsonLd(p),
          breadcrumbJsonLd([
            { name: 'Accueil', path: '/' },
            { name: listName, path: listPath },
            { name: p.title ?? 'Annonce', path: `/biens/${p.slug}` },
          ]),
        ]}
      />

      <div className="border-b border-mist-200 bg-mist-50">
        <Container className="py-4">
          <Breadcrumbs items={[{ name: 'Accueil', path: '/' }, { name: listName, path: listPath }, { name: p.title ?? 'Annonce' }]} />
        </Container>
      </div>

      <Container className="pt-8 pb-28 lg:pt-12 lg:pb-20">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <TransactionBadge type={p.transaction_type} />
              <CommercialStatusBadge status={p.commercial_status} showAvailable />
              {p.property_type_label && <span className="text-sm font-semibold text-mist-600">{p.property_type_label}</span>}
            </div>
            <h1 className="font-display mt-4 text-3xl leading-[1.12] font-medium text-navy-900 sm:text-4xl lg:text-5xl">{p.title}</h1>
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
              {formatDate(p.published_at) && <span>Publié le {formatDate(p.published_at)}</span>}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <p className="text-3xl font-extrabold tracking-tight text-navy-800 sm:text-4xl">{price}</p>
            <ShareButton title={p.title ?? 'Annonce ABS IMMO & SERVICES'} />
          </div>
        </header>

        <StatusNotice property={p} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] xl:gap-14">
          <div className="min-w-0 space-y-10">
            <Gallery images={p.images} title={p.title ?? 'Bien immobilier'} />
            <KeyFacts property={p} />

            {(p.short_description || p.description) && (
              <DetailSection title="Description" id="desc-title">
                {p.short_description && !p.description?.startsWith(p.short_description) && (
                  <p className="mb-5 text-lg leading-8 font-medium text-navy-900">{p.short_description}</p>
                )}
                {p.description && <Paragraphs text={p.description} />}
              </DetailSection>
            )}

            {p.features.length > 0 && (
              <DetailSection title="Caractéristiques" id="features-title">
                <FeatureList features={p.features} />
              </DetailSection>
            )}

            {p.amenities.length > 0 && (
              <DetailSection title="Équipements" id="amenities-title">
                <AmenityList amenities={p.amenities} />
              </DetailSection>
            )}

            <DetailSection title="Localisation" id="location-title">
              <LocationBlock property={p} />
            </DetailSection>

            <p className="flex gap-2 text-xs leading-5 text-mist-500">
              <Info aria-hidden="true" className="size-4 shrink-0" />
              Informations communiquées à titre indicatif par l’agence et susceptibles d’évoluer. Elles ne constituent pas
              un document contractuel.
            </p>
          </div>

          <aside aria-label="Contacter l’agence pour ce bien" id="contact-bien" className="scroll-mt-24">
            <div className="space-y-4">
              {/* Encadré financier seulement s'il apporte plus que le prix déjà affiché en en-tête. */}
              {(p.price_on_request || p.deposit_amount || p.agency_fee_amount || p.price_negotiable) && (
                <div className="rounded-card bg-navy-900 p-6 text-white">
                  <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
                    {transaction === 'rent' ? 'Loyer' : 'Prix de vente'}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold">{price}</p>
                  {p.price_on_request && <p className="mt-1 text-sm text-white/70">Le prix vous est communiqué sur simple demande.</p>}
                  <div className="[&_dd]:text-white [&_dl]:border-white/15 [&_dt]:text-white/70">
                    <FinancialTerms property={p} />
                  </div>
                </div>
              )}
              <PropertyContactCard property={p} agency={agency} />
              {unavailable && (
                <ButtonLink to={listPath} variant="outline" className="w-full">
                  Voir les biens disponibles
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
              <span className="sr-only">Appeler</span>
            </a>
          )}
          {contact.whatsapp && (
            <a
              href={whatsappHref(contact.whatsapp, whatsappMessage(p))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-12 items-center justify-center rounded-full bg-[#1f8f4e] text-white"
            >
              <WhatsAppIcon className="size-5" />
              <span className="sr-only">WhatsApp (nouvel onglet)</span>
            </a>
          )}
          <a href="#contact-bien" className="inline-flex h-12 items-center rounded-full bg-brand-red-600 px-5 font-semibold text-white">
            Contacter
          </a>
        </div>
      </div>
    </>
  )
}
