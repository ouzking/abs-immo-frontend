import { useEffect, useEffectEvent, useState, type ReactNode } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import { CheckboxField, SelectField } from '@/components/ui/fields'
import { cn } from '@/lib/cn'
import { formatBudget } from '@/lib/format'
import type { PublicFilters, TransactionType } from '@/types'
import { buildLocationGroups } from '../locationOptions'
import { ALL_BUDGET_STEPS, BUDGET_STEPS, type SearchCriteria } from '../searchParams'

export type CriteriaPatch = Partial<Omit<SearchCriteria, 'page'>>

const BEDROOM_OPTIONS = [null, 1, 2, 3, 4, 5] as const

function Group({ title, children, as = 'fieldset' }: { title: string; children: ReactNode; as?: 'fieldset' | 'div' }) {
  const Tag = as
  return (
    <Tag className="border-b border-mist-200 py-6 first:pt-0 last:border-0 last:pb-0">
      {as === 'fieldset' ? (
        <legend className="mb-3 text-sm font-bold text-navy-900">{title}</legend>
      ) : (
        <p className="mb-3 text-sm font-bold text-navy-900">{title}</p>
      )}
      {children}
    </Tag>
  )
}

/** Champ texte : validation à l'Entrée ou après une courte pause de saisie. */
function SearchInput({ initial, onCommit }: { initial: string; onCommit: (q: string) => void }) {
  const [value, setValue] = useState(initial)
  const submit = (v: string) => {
    if (v.trim() !== initial) onCommit(v.trim())
  }
  const commitLater = useEffectEvent((v: string) => submit(v))
  useEffect(() => {
    const t = window.setTimeout(() => commitLater(value), 600)
    return () => window.clearTimeout(t)
  }, [value])

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        submit(value)
      }}
    >
      <label htmlFor="catalog-q" className="sr-only">
        Rechercher par mot-clé
      </label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist-400" />
        <input
          id="catalog-q"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Piscine, vue mer, meublé…"
          maxLength={200}
          enterKeyHint="search"
          className="h-12 w-full rounded-xl border border-mist-300 bg-white pr-4 pl-11 text-[0.9375rem] outline-none placeholder:text-mist-400 hover:border-mist-400 focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
        />
      </div>
    </form>
  )
}

export function FilterPanel({
  criteria,
  filters,
  fixedTransaction,
  onChange,
  onTransactionChange,
  onReset,
  activeCount,
}: {
  criteria: SearchCriteria
  filters: PublicFilters | undefined
  fixedTransaction: TransactionType | null
  onChange: (patch: CriteriaPatch) => void
  onTransactionChange: (t: TransactionType | null) => void
  onReset: () => void
  activeCount: number
}) {
  const transaction = criteria.transaction ?? fixedTransaction
  const types = filters?.property_types ?? []
  const groups = buildLocationGroups(filters)
  const selectedGroup = groups.find((g) => g.city.slug === criteria.city)
  const steps = transaction ? BUDGET_STEPS[transaction] : ALL_BUDGET_STEPS

  const toggleType = (code: string) =>
    onChange({
      types: criteria.types.includes(code) ? criteria.types.filter((t) => t !== code) : [...criteria.types, code],
    })

  return (
    <div>
      <div className="flex items-center justify-between pb-5">
        <h2 className="font-display text-xl font-medium text-navy-900">Affiner la recherche</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-brand-red-600 hover:bg-brand-red-50"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Réinitialiser
          </button>
        )}
      </div>

      <Group title="Mot-clé" as="div">
        <SearchInput key={criteria.q} initial={criteria.q} onCommit={(q) => onChange({ q, sort: q ? criteria.sort : criteria.sort === 'pertinence' ? 'recent' : criteria.sort })} />
      </Group>

      <Group title="Projet">
        <div className="grid grid-cols-3 gap-1 rounded-full bg-mist-100 p-1">
          {(
            [
              [null, 'Tous'],
              ['sale', 'Acheter'],
              ['rent', 'Louer'],
            ] as const
          ).map(([value, label]) => (
            <label
              key={label}
              className={cn(
                'cursor-pointer rounded-full py-2 text-center text-sm font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-red-600',
                transaction === value ? 'bg-navy-700 text-white shadow-sm' : 'text-mist-600 hover:text-navy-800',
              )}
            >
              <input
                type="radio"
                name="filter-transaction"
                className="sr-only"
                checked={transaction === value}
                onChange={() => onTransactionChange(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </Group>

      <Group title="Type de bien">
        {types.length === 0 ? (
          <p className="text-sm text-mist-500">Chargement des catégories…</p>
        ) : (
          <ul className="space-y-2.5">
            {types.map((t) => (
              <li key={t.code} className="flex items-center justify-between gap-2">
                <CheckboxField
                  label={t.label}
                  checked={criteria.types.includes(t.code)}
                  onChange={() => toggleType(t.code)}
                  disabled={t.count === 0 && !criteria.types.includes(t.code)}
                />
                <span className="text-xs font-semibold text-mist-400 tabular-nums" aria-label={`${t.count} annonces`}>
                  {t.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Group>

      <Group title="Localisation">
        <div className="space-y-3">
          <SelectField
            label="Ville"
            value={criteria.city ?? ''}
            onChange={(e) => onChange({ city: e.target.value || null, neighborhood: null })}
          >
            <option value="">Toutes les villes</option>
            {groups.map((g) => (
              <option key={g.city.slug} value={g.city.slug}>
                {g.city.name} ({g.city.count})
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Quartier"
            value={criteria.neighborhood ?? ''}
            onChange={(e) => onChange({ neighborhood: e.target.value || null })}
            disabled={!selectedGroup || selectedGroup.neighborhoods.length === 0}
            hint={!criteria.city ? 'Choisissez d’abord une ville.' : undefined}
          >
            <option value="">Tous les quartiers</option>
            {selectedGroup?.neighborhoods.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.name} ({n.count})
              </option>
            ))}
          </SelectField>
        </div>
      </Group>

      <Group title="Budget (FCFA)">
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Minimum"
            value={criteria.minPrice ?? ''}
            onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Indifférent</option>
            {steps.map((s) => (
              <option key={s} value={s} disabled={criteria.maxPrice !== null && s > criteria.maxPrice}>
                {formatBudget(s)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Maximum"
            value={criteria.maxPrice ?? ''}
            onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Indifférent</option>
            {steps.map((s) => (
              <option key={s} value={s} disabled={criteria.minPrice !== null && s < criteria.minPrice}>
                {formatBudget(s)}
              </option>
            ))}
          </SelectField>
        </div>
      </Group>

      <Group title="Chambres (minimum)">
        <div className="flex flex-wrap gap-2">
          {BEDROOM_OPTIONS.map((n) => (
            <label
              key={n ?? 'all'}
              className={cn(
                'cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-red-600',
                criteria.minBedrooms === n
                  ? 'border-navy-700 bg-navy-700 text-white'
                  : 'border-mist-300 text-mist-700 hover:border-navy-400',
              )}
            >
              <input
                type="radio"
                name="filter-bedrooms"
                className="sr-only"
                checked={criteria.minBedrooms === n}
                onChange={() => onChange({ minBedrooms: n })}
              />
              {n === null ? 'Toutes' : `${n}+`}
            </label>
          ))}
        </div>
      </Group>

      <Group title="Disponibilité" as="div">
        <CheckboxField
          label="Masquer les biens vendus, loués ou sous option"
          checked={criteria.availableOnly}
          onChange={(e) => onChange({ availableOnly: e.target.checked })}
        />
      </Group>
    </div>
  )
}
