import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/fields'
import { usePublicFilters } from '@/features/properties/hooks'
import { useI18n } from '@/i18n/context'
import { cn } from '@/lib/cn'
import type { TransactionType } from '@/types'
import { buildLocationGroups, decodeLocation } from '../locationOptions'
import { BUDGET_STEPS, catalogUrl } from '../searchParams'

/**
 * Moteur de recherche du hero. Les listes (types, lieux) ne proposent que des
 * valeurs ayant au moins une annonce publiée. La validation renvoie vers le
 * catalogue filtré (/acheter ou /louer), l'URL portant tous les critères.
 */
export function HeroSearch() {
  const navigate = useNavigate()
  const { t, fmt, path } = useI18n()
  const s = t.home.search
  const { data: filters, status } = usePublicFilters()
  const [transaction, setTransaction] = useState<TransactionType>('sale')
  const [type, setType] = useState('')
  const [location, setLocation] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const loading = status === 'loading'
  const types = (filters?.property_types ?? []).filter((pt) => pt.count > 0)
  const groups = buildLocationGroups(filters)
  const steps = BUDGET_STEPS[transaction]

  const switchTransaction = (t: TransactionType) => {
    setTransaction(t)
    // Les paliers de budget diffèrent entre vente et location.
    setMinPrice('')
    setMaxPrice('')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    let min = minPrice ? Number(minPrice) : null
    let max = maxPrice ? Number(maxPrice) : null
    if (min !== null && max !== null && min > max) [min, max] = [max, min]
    navigate(
      path(catalogUrl({
        transaction,
        types: type ? [type] : [],
        ...decodeLocation(location),
        minPrice: min,
        maxPrice: max,
      })),
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label={s.label}
      className="rounded-[1.75rem] bg-white p-3 shadow-[0_30px_80px_-30px_rgb(6_26_43/0.55)] ring-1 ring-black/5 sm:p-4"
    >
      <fieldset className="flex gap-1 rounded-full bg-mist-100 p-1 sm:inline-flex">
        <legend className="sr-only">{s.project}</legend>
        {(
          [
            ['sale', s.buy],
            ['rent', s.rent],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={cn(
              'flex-1 cursor-pointer rounded-full px-6 py-2.5 text-center text-sm font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-red-600 sm:flex-none',
              transaction === value ? 'bg-navy-700 text-white shadow-sm' : 'text-mist-600 hover:text-navy-800',
            )}
          >
            <input
              type="radio"
              name="transaction"
              value={value}
              checked={transaction === value}
              onChange={() => switchTransaction(value)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.3fr_1fr_1fr_auto] lg:items-end">
        <SelectField label={s.type} value={type} onChange={(e) => setType(e.target.value)} disabled={loading}>
          <option value="">{loading ? t.common.loading : s.allTypes}</option>
          {types.map((pt) => (
            <option key={pt.code} value={pt.code}>
              {fmt.propertyType(pt.code, pt.label, pt.label_en)}
            </option>
          ))}
        </SelectField>

        <SelectField label={s.location} value={location} onChange={(e) => setLocation(e.target.value)} disabled={loading}>
          <option value="">{loading ? t.common.loading : s.allLocations}</option>
          {groups.map((g) => (
            <optgroup key={g.city.slug} label={g.city.regionName ? `${g.city.name} (${g.city.regionName})` : g.city.name}>
              <option value={g.city.slug}>{s.allNeighborhoods(g.city.name)}</option>
              {g.neighborhoods.map((n) => (
                <option key={n.slug} value={`${g.city.slug}/${n.slug}`}>
                  {n.name}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>

        <SelectField label={s.minBudget} value={minPrice} onChange={(e) => setMinPrice(e.target.value)}>
          <option value="">{s.any}</option>
          {steps.map((step) => (
            <option key={step} value={step}>
              {fmt.budget(step)}
            </option>
          ))}
        </SelectField>

        <SelectField label={s.maxBudget} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
          <option value="">{s.any}</option>
          {steps.map((step) => (
            <option key={step} value={step}>
              {fmt.budget(step)}
            </option>
          ))}
        </SelectField>

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full sm:col-span-2 lg:col-span-1 lg:w-auto"
          icon={<Search aria-hidden="true" className="size-5" />}
        >
          {s.submit}
        </Button>
      </div>
    </form>
  )
}
