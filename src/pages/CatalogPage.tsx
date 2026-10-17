import { useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { SelectField } from '@/components/ui/fields'
import { Container, StateMessage } from '@/components/ui/primitives'
import { PropertyCard, PropertyCardSkeleton, PropertyGrid } from '@/features/properties/components/PropertyCard'
import { usePropertySearch, usePublicFilters } from '@/features/properties/hooks'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { FilterPanel, type CriteriaPatch } from '@/features/search/components/FilterPanel'
import { Pagination } from '@/features/search/components/Pagination'
import {
  catalogPath,
  countActiveFilters,
  DEFAULT_CRITERIA,
  parseSearchParams,
  SORT_OPTIONS,
  toSearchParams,
  type SearchCriteria,
  type SortOption,
} from '@/features/search/searchParams'
import { breadcrumbJsonLd } from '@/features/seo/structuredData'
import { cn } from '@/lib/cn'
import { formatBudget, plural } from '@/lib/format'
import type { PublicFilters, TransactionType } from '@/types'

const COPY: Record<'all' | TransactionType, { title: string; eyebrow: string; description: string; seo: string }> = {
  all: {
    title: 'Nos biens',
    eyebrow: 'Catalogue',
    description: 'Toutes les annonces publiées par l’agence, à la vente comme à la location.',
    seo: 'Toutes les annonces immobilières d’ABS IMMO & SERVICES au Sénégal : villas, appartements, terrains, bureaux et commerces, à vendre ou à louer.',
  },
  sale: {
    title: 'Acheter un bien',
    eyebrow: 'À vendre',
    description: 'Villas, appartements, terrains et locaux à vendre, présentés avec leur prix et leur statut réels.',
    seo: 'Biens immobiliers à vendre au Sénégal avec ABS IMMO & SERVICES : villas, appartements, maisons, terrains et locaux. Prix en FCFA.',
  },
  rent: {
    title: 'Louer un bien',
    eyebrow: 'À louer',
    description: 'Logements, bureaux et commerces à louer, avec loyers et conditions affichés clairement.',
    seo: 'Locations immobilières au Sénégal avec ABS IMMO & SERVICES : appartements, villas, bureaux et locaux commerciaux. Loyers en FCFA.',
  },
}

interface Chip {
  key: string
  label: string
  patch: CriteriaPatch
}

function activeChips(c: SearchCriteria, filters: PublicFilters | undefined): Chip[] {
  const chips: Chip[] = []
  if (c.q) chips.push({ key: 'q', label: `« ${c.q} »`, patch: { q: '' } })
  for (const code of c.types) {
    const label = filters?.property_types.find((t) => t.code === code)?.label ?? code
    chips.push({ key: `type-${code}`, label, patch: { types: c.types.filter((t) => t !== code) } })
  }
  if (c.city) {
    const label = filters?.cities.find((x) => x.slug === c.city)?.name ?? c.city
    chips.push({ key: 'city', label, patch: { city: null, neighborhood: null } })
  }
  if (c.neighborhood) {
    const label = filters?.neighborhoods.find((x) => x.slug === c.neighborhood)?.name ?? c.neighborhood
    chips.push({ key: 'nb', label, patch: { neighborhood: null } })
  }
  if (c.minPrice !== null) chips.push({ key: 'min', label: `Dès ${formatBudget(c.minPrice)}`, patch: { minPrice: null } })
  if (c.maxPrice !== null) chips.push({ key: 'max', label: `Jusqu’à ${formatBudget(c.maxPrice)}`, patch: { maxPrice: null } })
  if (c.minBedrooms !== null) chips.push({ key: 'bed', label: `${c.minBedrooms}+ chambres`, patch: { minBedrooms: null } })
  if (c.availableOnly) chips.push({ key: 'avail', label: 'Disponibles uniquement', patch: { availableOnly: false } })
  return chips
}

export default function CatalogPage({ transaction = null }: { transaction?: TransactionType | null }) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const criteria = useMemo(() => parseSearchParams(params, transaction), [params, transaction])
  const { data: filters } = usePublicFilters()
  const { data, status, error, isFetching, isPrevious, refetch } = usePropertySearch(criteria)
  const resultsRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDialogElement>(null)
  // Un seul panneau de filtres monté à la fois (identifiants et groupes radio uniques).
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const copy = COPY[transaction ?? 'all']
  const activeCount = countActiveFilters(criteria, transaction)
  const path = catalogPath(transaction)

  const applyCriteria = (next: SearchCriteria) => {
    const qs = toSearchParams(next, { omitTransaction: true }).toString()
    const nextPath = catalogPath(next.transaction)
    if (nextPath !== path) navigate(`${nextPath}${qs ? `?${qs}` : ''}`, { preventScrollReset: true })
    else setParams(toSearchParams(next, { omitTransaction: true }), { preventScrollReset: true })
  }

  const update = (patch: CriteriaPatch) => applyCriteria({ ...criteria, ...patch, page: 1 })
  const reset = () => applyCriteria({ ...DEFAULT_CRITERIA, transaction: criteria.transaction, sort: criteria.sort })
  const hrefFor = (page: number) => {
    const qs = toSearchParams({ ...criteria, page }, { omitTransaction: true }).toString()
    return `${path}${qs ? `?${qs}` : ''}`
  }
  const scrollToResults = () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const chips = activeChips(criteria, filters)
  const total = data?.total ?? 0
  const panel = (
    <FilterPanel
      criteria={criteria}
      filters={filters}
      fixedTransaction={transaction}
      onChange={update}
      onTransactionChange={(t) => update({ transaction: t })}
      onReset={reset}
      activeCount={activeCount}
    />
  )

  return (
    <>
      <Seo
        title={`${copy.title}${criteria.page > 1 ? ` — page ${criteria.page}` : ''}`}
        description={copy.seo}
        canonicalPath={criteria.page > 1 ? `${path}?page=${criteria.page}` : path}
        jsonLd={breadcrumbJsonLd([
          { name: 'Accueil', path: '/' },
          { name: copy.title, path },
        ])}
      />
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        crumbs={[{ name: 'Accueil', path: '/' }, { name: copy.title }]}
      />

      <Container className="py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[18rem_1fr] lg:gap-10 xl:grid-cols-[20rem_1fr] xl:gap-14">
          <aside aria-label="Filtres" className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-card bg-white p-6 ring-1 ring-mist-200 no-scrollbar">
              {isDesktop && panel}
            </div>
          </aside>

          <div ref={resultsRef} className="scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p aria-live="polite" className="text-mist-600">
                {status === 'loading' && !data ? (
                  'Recherche en cours…'
                ) : (
                  <>
                    <strong className="font-display text-2xl font-medium text-navy-900">{total}</strong>{' '}
                    {total > 1 ? 'biens correspondent' : total === 1 ? 'bien correspond' : 'bien ne correspond'} à votre recherche
                  </>
                )}
              </p>
              <div className="flex w-full items-end gap-3 sm:w-auto">
                <Button
                  variant="outline"
                  className="h-12 flex-1 lg:hidden"
                  onClick={() => drawerRef.current?.showModal()}
                  icon={<SlidersHorizontal aria-hidden="true" className="size-4" />}
                  aria-haspopup="dialog"
                >
                  Filtres{activeCount > 0 ? ` (${activeCount})` : ''}
                </Button>
                <SelectField
                  label="Trier par"
                  hideLabel
                  className="flex-1 sm:w-60"
                  value={criteria.sort}
                  onChange={(e) => applyCriteria({ ...criteria, sort: e.target.value as SortOption, page: 1 })}
                >
                  {SORT_OPTIONS.filter((o) => o.value !== 'pertinence' || criteria.q).map((o) => (
                    <option key={o.value} value={o.value}>
                      Tri : {o.label}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>

            {chips.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Filtres actifs">
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <button
                      type="button"
                      onClick={() => update(chip.patch)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 py-1.5 pr-2.5 pl-3.5 text-sm font-semibold text-navy-800 ring-1 ring-navy-100 hover:bg-navy-100"
                    >
                      {chip.label}
                      <X aria-hidden="true" className="size-3.5" />
                      <span className="sr-only">(retirer ce filtre)</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8" aria-busy={isFetching}>
              {status === 'error' && !data && (
                <ErrorState error={error} onRetry={refetch} title="La recherche n’a pas pu aboutir" />
              )}

              {status === 'loading' && !data && (
                <PropertyGrid className="xl:grid-cols-2 2xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </PropertyGrid>
              )}

              {data && data.items.length === 0 && (
                <StateMessage
                  icon={<SearchX aria-hidden="true" className="size-6" />}
                  title={criteria.page > 1 && data.total > 0 ? 'Cette page n’existe pas' : 'Aucun bien ne correspond à ces critères'}
                  description={
                    activeCount > 0
                      ? 'Élargissez votre recherche en retirant un ou plusieurs filtres, ou confiez-nous votre recherche : nous vous signalerons les biens correspondants.'
                      : 'Aucune annonce n’est publiée dans cette catégorie pour le moment.'
                  }
                  action={
                    <>
                      {activeCount > 0 && (
                        <Button variant="outline" onClick={reset}>
                          Réinitialiser les filtres
                        </Button>
                      )}
                      <ButtonLink to={`/contact?sujet=${transaction === 'rent' ? 'rent' : 'buy'}`}>Confier ma recherche</ButtonLink>
                    </>
                  }
                />
              )}

              {data && data.items.length > 0 && (
                <div className={cn('transition-opacity duration-300', (isPrevious || isFetching) && 'opacity-60')}>
                  <h2 className="sr-only">Résultats</h2>
                  <PropertyGrid className="xl:grid-cols-2 2xl:grid-cols-3">
                    {data.items.map((p, i) => (
                      <PropertyCard key={p.id} property={p} priority={i < 2} />
                    ))}
                  </PropertyGrid>
                  <div className="mt-12 flex flex-col items-center gap-3">
                    <Pagination page={criteria.page} pageCount={data.pageCount} hrefFor={hrefFor} onNavigate={scrollToResults} />
                    {data.pageCount > 1 && (
                      <p className="text-sm text-mist-500">
                        Page {criteria.page} sur {data.pageCount} · {plural(data.total, 'annonce')}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {status === 'error' && data && (
                <p role="alert" className="mt-6 text-center text-sm text-brand-red-700">
                  {error?.userMessage}{' '}
                  <button type="button" className="font-semibold underline" onClick={refetch}>
                    Réessayer
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* Panneau de filtres mobile */}
      <dialog
        ref={drawerRef}
        aria-label="Filtres de recherche"
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 backdrop:bg-navy-950/50 open:animate-fade-in sm:inset-y-0 sm:right-auto sm:left-0 sm:max-w-md"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-mist-200 px-5 py-4">
            <p className="font-bold text-navy-900">Filtres</p>
            <button
              type="button"
              onClick={() => drawerRef.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-full hover:bg-mist-100"
            >
              <X aria-hidden="true" className="size-6" />
              <span className="sr-only">Fermer les filtres</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">{!isDesktop && panel}</div>
          <div className="border-t border-mist-200 p-4">
            <Button className="w-full" size="lg" onClick={() => {
                drawerRef.current?.close()
                scrollToResults()
              }}>
              {status === 'loading' || isFetching ? 'Recherche…' : `Voir ${plural(total, 'résultat')}`}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  )
}
