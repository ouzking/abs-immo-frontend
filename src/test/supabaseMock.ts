import { setSupabaseClientForTests } from '@/lib/supabase/client'

/**
 * Double minimal du client Supabase : enregistre les appels de la chaîne
 * PostgREST (rpc/from → select → eq → range) et renvoie les réponses fournies.
 */
export interface QueryResult {
  data: unknown
  error: unknown
  count?: number | null
}

export function mockSupabase(options: {
  rpc?: (fn: string, args: unknown) => QueryResult
  from?: (table: string) => QueryResult
  invoke?: (fn: string, body: unknown) => { data: unknown; error: unknown }
  signed?: (paths: string[]) => Array<{ path: string; signedUrl: string | null; error: string | null }>
}) {
  const calls: Array<{ kind: string; name: string; args?: unknown; eq: Array<[string, unknown]>; range?: [number, number] }> = []

  function chain(kind: string, name: string, args: unknown, resolve: () => QueryResult) {
    const call = { kind, name, args, eq: [] as Array<[string, unknown]>, range: undefined as [number, number] | undefined }
    calls.push(call)
    const builder = {
      select: () => builder,
      order: () => builder,
      limit: () => builder,
      eq: (col: string, val: unknown) => {
        call.eq.push([col, val])
        return builder
      },
      range: (from: number, to: number) => {
        call.range = [from, to]
        return builder
      },
      maybeSingle: () => builder,
      then: (onFulfilled: (v: QueryResult) => unknown, onRejected?: (e: unknown) => unknown) =>
        Promise.resolve(resolve()).then(onFulfilled, onRejected),
    }
    return builder
  }

  const client = {
    rpc: vi.fn((fn: string, args: unknown) => chain('rpc', fn, args, () => options.rpc?.(fn, args) ?? { data: null, error: null })),
    from: vi.fn((table: string) => chain('from', table, undefined, () => options.from?.(table) ?? { data: [], error: null })),
    functions: {
      invoke: vi.fn(async (fn: string, opts: { body: unknown }) => options.invoke?.(fn, opts.body) ?? { data: null, error: null }),
    },
    storage: {
      from: () => ({
        createSignedUrls: async (paths: string[]) => ({
          data: options.signed?.(paths) ?? paths.map((p) => ({ path: p, signedUrl: `https://cdn.test/${p}?token=x`, error: null })),
          error: null,
        }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/public/${path}` } }),
      }),
    },
  }
  setSupabaseClientForTests(client)
  return { client, calls }
}
