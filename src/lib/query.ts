import { useEffect, useEffectEvent, useState, useSyncExternalStore } from 'react'
import { toAppError, type AppError } from '@/lib/errors'

/**
 * Cache de requêtes minimaliste (sans dépendance) :
 * - déduplication des requêtes simultanées sur une même clé ;
 * - données servies depuis le cache pendant `staleTime`, puis rafraîchies ;
 * - `keepPrevious` conserve le dernier résultat pendant le chargement d'une
 *   nouvelle clé (pagination / filtres sans clignotement).
 */
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error'

interface Entry<T> {
  status: QueryStatus
  data?: T
  error?: AppError
  updatedAt: number
  promise?: Promise<void>
}

const IDLE: Entry<never> = Object.freeze({ status: 'idle', updatedAt: 0 }) as Entry<never>
const entries = new Map<string, Entry<unknown>>()
const listeners = new Map<string, Set<() => void>>()

function setEntry(key: string, entry: Entry<unknown>) {
  entries.set(key, entry)
  listeners.get(key)?.forEach((l) => l())
}

function subscribe(key: string, listener: () => void) {
  let set = listeners.get(key)
  if (!set) listeners.set(key, (set = new Set()))
  set.add(listener)
  return () => {
    set.delete(listener)
  }
}

export function fetchQuery<T>(key: string, fetcher: () => Promise<T>, staleTime = 60_000): Promise<void> {
  const current = entries.get(key) as Entry<T> | undefined
  if (current?.promise) return current.promise
  if (current?.status === 'success' && Date.now() - current.updatedAt < staleTime) return Promise.resolve()

  const promise = fetcher().then(
    (data) => setEntry(key, { status: 'success', data, updatedAt: Date.now() }),
    (error: unknown) =>
      setEntry(key, { status: 'error', error: toAppError(error), data: current?.data, updatedAt: Date.now() }),
  )
  setEntry(key, {
    status: current?.status === 'success' ? 'success' : 'loading',
    data: current?.data,
    updatedAt: current?.updatedAt ?? 0,
    promise,
  })
  return promise
}

/** Vide le cache (tests, ou après une action qui rend des données obsolètes). */
export function clearQueryCache(): void {
  entries.clear()
}

export interface QueryResult<T> {
  data: T | undefined
  error: AppError | undefined
  status: QueryStatus
  /** Vrai pendant tout chargement, y compris quand des données précédentes sont affichées. */
  isFetching: boolean
  /** Vrai si `data` provient d'une clé précédente (keepPrevious). */
  isPrevious: boolean
  refetch: () => void
}

export function useQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: { staleTime?: number; keepPrevious?: boolean } = {},
): QueryResult<T> {
  const { staleTime = 60_000, keepPrevious = false } = options
  const entry = useSyncExternalStore(
    (cb) => (key ? subscribe(key, cb) : () => {}),
    () => ((key ? entries.get(key) : undefined) ?? IDLE) as Entry<T>,
    () => IDLE as Entry<T>,
  )

  const run = useEffectEvent(() => {
    if (key) void fetchQuery(key, fetcher, staleTime)
  })
  useEffect(() => {
    run()
  }, [key])

  // Mémorise le dernier résultat réussi (pattern « état dérivé du rendu précédent »).
  const [previous, setPrevious] = useState<T | undefined>(undefined)
  if (keepPrevious && entry.status === 'success' && entry.data !== previous) setPrevious(entry.data)

  const showPrevious = keepPrevious && entry.data === undefined && entry.status !== 'error' && previous !== undefined
  return {
    data: showPrevious ? previous : entry.data,
    error: entry.error,
    status: key && entry.status === 'idle' ? 'loading' : entry.status,
    isFetching: !!entry.promise || (!!key && entry.status === 'idle'),
    isPrevious: showPrevious,
    refetch: () => {
      if (!key) return
      entries.delete(key)
      void fetchQuery(key, fetcher, staleTime)
    },
  }
}
