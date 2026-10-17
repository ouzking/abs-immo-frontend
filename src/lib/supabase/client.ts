import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env'
import { AppError } from '@/lib/errors'
import type { Database } from '@/types'

export type AbsSupabaseClient = SupabaseClient<Database>

let client: AbsSupabaseClient | null = null

/**
 * Client Supabase unique du site public (rôle `anon`, clé publishable).
 * Aucune session : le site public n'a pas d'authentification.
 * Les composants n'appellent jamais ce client directement ; ils passent par les
 * services de `src/features/<domaine>/api`.
 */
export function getSupabase(): AbsSupabaseClient {
  if (client) return client
  if (!env.isSupabaseConfigured) {
    throw new AppError(
      'config',
      'Supabase non configuré : définissez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY.',
    )
  }
  client = createClient<Database>(env.supabaseUrl!, env.supabaseKey!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'x-client-info': 'abs-immo-frontend' } },
  })
  return client
}

/** Réservé aux tests : remplace le client par un double (null pour réinitialiser). */
export function setSupabaseClientForTests(mock: unknown): void {
  client = mock as AbsSupabaseClient | null
}
