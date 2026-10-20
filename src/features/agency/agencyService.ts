import { OFFICIAL_CONTACT } from '@/config/officialContact'
import { toAppError } from '@/lib/errors'
import { useQuery } from '@/lib/query'
import { agentPhotoUrl } from '@/lib/supabase/storage'
import { getSupabase } from '@/lib/supabase/client'
import type { Json } from '@/types'

/**
 * Coordonnées officielles de l'agence : UNIQUEMENT celles saisies dans
 * `agency_settings` par le back-office. Aucune coordonnée n'est codée en dur ;
 * un champ vide n'est simplement pas affiché.
 */
export interface OpeningHours {
  days: string
  open: string
  close: string
}

export type SocialNetwork = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'x'

export interface SocialLink {
  network: SocialNetwork
  label: string
  url: string
}

export interface AgencyInfo {
  name: string
  legalName: string | null
  tagline: string | null
  description: string | null
  phone: string | null
  secondaryPhone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  openingHours: OpeningHours[]
  socialLinks: SocialLink[]
  ninea: string | null
  rccm: string | null
  seoTitle: string | null
  seoDescription: string | null
}

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
}

const AGENCY_COLUMNS =
  'agency_name,legal_name,tagline,description,phone,secondary_phone,whatsapp_phone,email,address_line,' +
  'opening_hours,social_links,ninea,rccm,seo_default_title,seo_default_description'

/** Ne retient que des URL https pointant vers un profil (pas la page d'accueil du réseau). */
export function parseSocialLinks(value: Json | null | undefined): SocialLink[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  const links: SocialLink[] = []
  for (const network of Object.keys(SOCIAL_LABELS) as SocialNetwork[]) {
    const raw = (value as Record<string, Json | undefined>)[network]
    if (typeof raw !== 'string') continue
    try {
      const url = new URL(raw)
      if (url.protocol !== 'https:' || url.pathname.replace(/\/+$/, '') === '') continue
      links.push({ network, label: SOCIAL_LABELS[network], url: url.toString() })
    } catch {
      // URL invalide : ignorée.
    }
  }
  return links
}

export function parseOpeningHours(value: Json | null | undefined): OpeningHours[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const { days, open, close } = item as Record<string, Json | undefined>
    return typeof days === 'string' && typeof open === 'string' && typeof close === 'string'
      ? [{ days, open, close }]
      : []
  })
}

export interface AgencyRow {
  agency_name: string
  legal_name: string | null
  tagline: string | null
  description: string | null
  phone: string | null
  secondary_phone: string | null
  whatsapp_phone: string | null
  email: string | null
  address_line: string | null
  opening_hours: Json
  social_links: Json
  ninea: string | null
  rccm: string | null
  seo_default_title: string | null
  seo_default_description: string | null
}

/** Coordonnées réduites aux valeurs officielles connues (backend injoignable ou ligne absente). */
export function toAgencyInfo(row: AgencyRow | null): AgencyInfo {
  return {
    name: row?.agency_name ?? 'ABS IMMO & SERVICES',
    legalName: row?.legal_name ?? null,
    tagline: row?.tagline ?? null,
    description: row?.description ?? null,
    phone: row?.phone ?? OFFICIAL_CONTACT.phone,
    secondaryPhone: row?.secondary_phone ?? null,
    whatsapp: row?.whatsapp_phone ?? OFFICIAL_CONTACT.whatsapp,
    email: row?.email ?? OFFICIAL_CONTACT.email,
    address: row?.address_line ?? null,
    openingHours: parseOpeningHours(row?.opening_hours),
    socialLinks: parseSocialLinks(row?.social_links),
    ninea: row?.ninea ?? null,
    rccm: row?.rccm ?? null,
    seoTitle: row?.seo_default_title ?? null,
    seoDescription: row?.seo_default_description ?? null,
  }
}

export async function getAgencyInfo(): Promise<AgencyInfo> {
  try {
    const { data, error } = await getSupabase().from('agency_settings').select(AGENCY_COLUMNS).limit(1).maybeSingle()
    if (error) throw toAppError(error)
    return toAgencyInfo(data as unknown as AgencyRow | null)
  } catch (error) {
    // Les visiteurs doivent toujours pouvoir joindre l'agence : repli sur le numéro officiel.
    if (import.meta.env.DEV) console.warn('[agency] agency_settings indisponible, coordonnées officielles utilisées.', error)
    return toAgencyInfo(null)
  }
}

export interface TeamMember {
  slug: string
  name: string
  jobTitle: string | null
  bio: string | null
  photoUrl: string | null
  languages: string[]
}

export async function getTeam(): Promise<TeamMember[]> {
  const { data, error } = await getSupabase()
    .from('public_agents')
    .select('slug,display_name,job_title,bio,photo_path,languages')
    .order('display_name')
  if (error) throw toAppError(error)
  return (data ?? []).flatMap((a) =>
    a.slug && a.display_name
      ? [
          {
            slug: a.slug,
            name: a.display_name,
            jobTitle: a.job_title,
            bio: a.bio,
            photoUrl: agentPhotoUrl(a.photo_path),
            languages: a.languages ?? [],
          },
        ]
      : [],
  )
}

export function useAgency() {
  return useQuery('agency', getAgencyInfo, { staleTime: 30 * 60_000 })
}

export function useTeam() {
  return useQuery('team', getTeam, { staleTime: 30 * 60_000 })
}
