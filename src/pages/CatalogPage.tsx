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
  toSearchParams,
  type SearchCriteria,
  type SortOption,
} from '@/features/search/searchParams'
import { breadcrumbJsonLd } from '@/features/seo/structuredData'
import { useI18n, type I18nValue } from '@/i18n/context'
import { cn } from '@/lib/cn'
import type { PublicFilters, TransactionType } from '@/types'

interface Chip {
  key: string
  label: string
  patch: CriteriaPatch
}

const SORT_OPTIONS: SortOption[] = ['recent', 'prix-asc', 'prix-desc', 'surface', 'ancien', 'pertinence']

function activeChips(c: SearchCriteria, filters: PublicFilters | undefined, { t, fmt }: I18nValue): Chip[] {
  const chips: Chip[] = []
  if (c.q) chips.push({ key: 'q', label: t.catalog.chipQuery(c.q), patch: { q: '' } })
  for (const code of c.types) {
    const type = filters?.property_types.find((pt) => pt.code === code)
    const label = fmt.propertyType(code, type?.label ?? code, type?.label_en)
    chips.push({ key: `type-${code}`, label, patch: { types: c.types.filter((x) => x !== code) } })
  }
  if (c.city) {
    const label = filters?.cities.find((x) => x.slug === c.city)?.name ?? c.city
    chips.push({ key: 'city', label, patch: { city: null, neighborhood: null } })
  }
  if (c.neighborhood) {
    const label = filters?.neighborhoods.find((x) => x.slug === c.neighborhood)?.name ?? c.neighborhood
    chips.push({ key: 'nb', label, patch: { neighborhood: null } })
  }
  if (c.minPrice !== null) chips.push({ key: 'min', label: t.catalog.chipFrom(fmt.budget(c.minPrice)), patch: { minPrice: null } })
  if (c.maxPrice !== null) chips.push({ key: 'max', label: t.catalog.chipTo(fmt.budget(c.maxPrice)), patch: { maxPrice: null } })
  if (c.minBedrooms !== null) chips.push({ key: 'bed', label: t.catalog.chipBedrooms(c.minBedrooms), patch: { minBedrooms: null } })
  if (c.availableOnly) chips.push({ key: 'avail', label: t.catalog.chipAvailable, patch: { availableOnly: false } })
  return chips
}

export default function CatalogPage({ transaction = null }: { transaction?: TransactionType | null }) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const i18n = useI18n()
  const { t, path: localize } = i18n
  const criteria = useMemo(() => parseSearchParams(params, transaction), [params, transaction])
  const { data: filters } = usePublicFilters()
  const { data, status, error, isFetching, isPrevious, refetch } = usePropertySearch(criteria)
  const resultsRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDialogElement>(null)
  // Un seul panneau de filtres monté à la fois (identifiants et groupes radio uniques).
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const copy = t.catalog[transaction ?? 'all']
  const activeCount = countActiveFilters(criteria, transaction)
  const path = catalogPath(transaction)

  const applyCriteria = (next: SearchCriteria) => {
    const qs = toSearchParams(next, { omitTransaction: true }).toString()
    const nextPath = catalogPath(next.transaction)
    if (nextPath !== path) navigate(localize(`${nextPath}${qs ? `?${qs}` : ''}`), { preventScrollReset: true })
    else setParams(toSearchParams(next, { omitTransaction: true }), { preventScrollReset: true })
  }

  const update = (patch: CriteriaPatch) => applyCriteria({ ...criteria, ...patch, page: 1 })
  const reset = () => applyCriteria({ ...DEFAULT_CRITERIA, transaction: criteria.transaction, sort: criteria.sort })
  const hrefFor = (page: number) => {
    const qs = toSearchParams({ ...criteria, page }, { omitTransaction: true }).toString()
    return localize(`${path}${qs ? `?${qs}` : ''}`)
  }
  const scrollToResults = () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const chips = activeChips(criteria, filters, i18n)
  const total = data?.total ?? 0
  const panel = (
    <FilterPanel
      criteria={criteria}
      filters={filters}
      fixedTransaction={transaction}
      onChange={update}
      onTransactionChange={(tr) => update({ transaction: tr })}
      onReset={reset}
      activeCount={activeCount}
    />
  )

  return (
    <>
      <Seo
        title={`${copy.title}${criteria.page > 1 ? t.catalog.pageSuffix(criteria.page) : ''}`}
        description={copy.seo}
        canonicalPath={criteria.page > 1 ? `${path}?page=${criteria.page}` : path}
        jsonLd={breadcrumbJsonLd([
          { name: t.common.home, path: localize('/') },
          { name: copy.title, path: localize(path) },
        ])}
      />
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        crumbs={[{ name: t.common.home, path: '/' }, { name: copy.title }]}
      />

      <Container className="py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[18rem_1fr] lg:gap-10 xl:grid-cols-[20rem_1fr] xl:gap-14">
          <aside aria-label={t.catalog.filtersAside} className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-card bg-white p-6 ring-1 ring-mist-200 no-scrollbar">
              {isDesktop && panel}
            </div>
          </aside>

          <div ref={resultsRef} className="scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p aria-live="polite" className="text-mist-600">
                {status === 'loading' && !data ? (
                  t.catalog.searching
                ) : (
                  <>
                    <strong className="font-display text-2xl font-medium text-navy-900">{total}</strong>{' '}
                    {t.catalog.count(total)}
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
                  {t.catalog.filtersButton(activeCount)}
                </Button>
                <SelectField
                  label={t.catalog.sortBy}
                  hideLabel
                  className="flex-1 sm:w-60"
                  value={criteria.sort}
                  onChange={(e) => applyCriteria({ ...criteria, sort: e.target.value as SortOption, page: 1 })}
                >
                  {SORT_OPTIONS.filter((o) => o !== 'pertinence' || criteria.q).map((o) => (
                    <option key={o} value={o}>
                      {t.catalog.sortPrefix}
                      {t.catalog.sort[o]}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>

            {chips.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label={t.catalog.activeFilters}>
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <button
                      type="button"
                      onClick={() => update(chip.patch)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 py-1.5 pr-2.5 pl-3.5 text-sm font-semibold text-navy-800 ring-1 ring-navy-100 hover:bg-navy-100"
                    >
                      {chip.label}
                      <X aria-hidden="true" className="size-3.5" />
                      <span className="sr-only">{t.catalog.removeFilter}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8" aria-busy={isFetching}>
              {status === 'error' && !data && (
                <ErrorState error={error} onRetry={refetch} title={t.catalog.error} />
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
                  title={criteria.page > 1 && data.total > 0 ? t.catalog.pageMissing : t.catalog.emptyTitle}
                  description={
                    activeCount > 0
                      ? t.catalog.emptyFiltered
                      : t.catalog.emptyNone
                  }
                  action={
                    <>
                      {activeCount > 0 && (
                        <Button variant="outline" onClick={reset}>
                          {t.catalog.reset}
                        </Button>
                      )}
                      <ButtonLink to={`/contact?sujet=${transaction === 'rent' ? 'rent' : 'buy'}`}>{t.catalog.delegate}</ButtonLink>
                    </>
                  }
                />
              )}

              {data && data.items.length > 0 && (
                <div className={cn('transition-opacity duration-300', (isPrevious || isFetching) && 'opacity-60')}>
                  <h2 className="sr-only">{t.catalog.results}</h2>
                  <PropertyGrid className="xl:grid-cols-2 2xl:grid-cols-3">
                    {data.items.map((p, i) => (
                      <PropertyCard key={p.id} property={p} priority={i < 2} />
                    ))}
                  </PropertyGrid>
                  <div className="mt-12 flex flex-col items-center gap-3">
                    <Pagination page={criteria.page} pageCount={data.pageCount} hrefFor={hrefFor} onNavigate={scrollToResults} />
                    {data.pageCount > 1 && (
                      <p className="text-sm text-mist-500">
                        {t.catalog.pageInfo(criteria.page, data.pageCount, t.units.listings(data.total))}
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
        aria-label={t.catalog.filtersDialog}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 backdrop:bg-navy-950/50 open:animate-fade-in sm:inset-y-0 sm:right-auto sm:left-0 sm:max-w-md"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-mist-200 px-5 py-4">
            <p className="font-bold text-navy-900">{t.catalog.filtersTitle}</p>
            <button
              type="button"
              onClick={() => drawerRef.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-full hover:bg-mist-100"
            >
              <X aria-hidden="true" className="size-6" />
              <span className="sr-only">{t.catalog.closeFilters}</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">{!isDesktop && panel}</div>
          <div className="border-t border-mist-200 p-4">
            <Button className="w-full" size="lg" onClick={() => {
                drawerRef.current?.close()
                scrollToResults()
              }}>
              {status === 'loading' || isFetching ? t.catalog.searchingShort : t.catalog.showResults(t.units.results(total))}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  )
}
