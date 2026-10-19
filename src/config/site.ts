import { env } from '@/config/env'

export const SITE = {
  name: 'ABS IMMO & SERVICES',
  shortName: 'ABS Immo',
  locale: 'fr_SN',
  defaultTitle: 'ABS IMMO & SERVICES — Agence immobilière au Sénégal',
  defaultDescription:
    'Achat, location et accompagnement de projets immobiliers au Sénégal. Découvrez les biens proposés par ABS IMMO & SERVICES et contactez notre équipe.',
  defaultImage: '/og-default.jpg',
  logo: '/assets/brand/logo-abs-immo-services.png',
} as const

/** URL absolue du site (VITE_SITE_URL en priorité, sinon l'origine courante). */
export function siteOrigin(): string {
  if (env.siteUrl) return env.siteUrl
  return typeof window !== 'undefined' ? window.location.origin : ''
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${siteOrigin()}${path.startsWith('/') ? path : `/${path}`}`
}

export interface NavItem {
  to: string
  /** Clé du libellé dans messages.nav */
  key: 'home' | 'buy' | 'rent' | 'properties' | 'about' | 'contact'
  end?: boolean
}

export const MAIN_NAV: NavItem[] = [
  { to: '/', key: 'home', end: true },
  { to: '/acheter', key: 'buy' },
  { to: '/louer', key: 'rent' },
  { to: '/biens', key: 'properties' },
  { to: '/a-propos', key: 'about' },
  { to: '/contact', key: 'contact' },
]

export const LEGAL_NAV: Array<{ to: string; key: 'legal' | 'privacy' }> = [
  { to: '/mentions-legales', key: 'legal' },
  { to: '/confidentialite', key: 'privacy' },
]
