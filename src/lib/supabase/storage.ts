import { getSupabase } from '@/lib/supabase/client'
import { STORAGE_BUCKETS } from '@/types'

/**
 * Le bucket `property-images` est PRIVÉ : le rôle anon ne peut signer que les
 * photos des annonces publiées. On signe par lot (une requête par page de
 * résultats) et on met les URL en cache jusqu'à peu avant leur expiration.
 */
const TTL_SECONDS = 60 * 60 * 6
const REUSE_MARGIN_MS = 30 * 60 * 1000

const cache = new Map<string, { url: string | null; expiresAt: number }>()
const inflight = new Map<string, Promise<void>>()

export async function signPropertyImages(paths: Array<string | null | undefined>): Promise<Map<string, string | null>> {
  const wanted = [...new Set(paths.filter((p): p is string => !!p))]
  const now = Date.now()
  const missing = wanted.filter((p) => {
    const hit = cache.get(p)
    return !hit || hit.expiresAt - REUSE_MARGIN_MS < now
  })
  const toFetch = missing.filter((p) => !inflight.has(p))

  if (toFetch.length > 0) {
    const request = (async () => {
      const { data, error } = await getSupabase()
        .storage.from(STORAGE_BUCKETS.propertyImages)
        .createSignedUrls(toFetch, TTL_SECONDS)
      const expiresAt = Date.now() + TTL_SECONDS * 1000
      if (error || !data) {
        // Échec global : on n'empêche pas l'affichage de la page, les visuels passent en repli.
        toFetch.forEach((p) => cache.set(p, { url: null, expiresAt: Date.now() + 60_000 }))
        return
      }
      for (const item of data) {
        if (item.path) cache.set(item.path, { url: item.error ? null : item.signedUrl, expiresAt })
      }
      // Chemins non renvoyés : considérés indisponibles pour une courte durée.
      toFetch.forEach((p) => {
        if (!cache.has(p)) cache.set(p, { url: null, expiresAt: Date.now() + 60_000 })
      })
    })()
    toFetch.forEach((p) => inflight.set(p, request))
    request.finally(() => toFetch.forEach((p) => inflight.delete(p)))
  }

  await Promise.all(missing.map((p) => inflight.get(p)).filter(Boolean))
  return new Map(wanted.map((p) => [p, cache.get(p)?.url ?? null]))
}

/** URL publique d'une photo d'agent (bucket public `agent-photos`). */
export function agentPhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return getSupabase().storage.from(STORAGE_BUCKETS.agentPhotos).getPublicUrl(path).data.publicUrl
}
