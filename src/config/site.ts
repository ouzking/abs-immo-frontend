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

/** Titre de page : « Titre | ABS IMMO & SERVICES » (titre par défaut sur l'accueil). */
export function formatTitle(title?: string): string {
  return title ? `${title} | ${SITE.name}` : SITE.defaultTitle
}

export interface NavItem {
  to: string
  label: string
  end?: boolean
}

export const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/acheter', label: 'Acheter' },
  { to: '/louer', label: 'Louer' },
  { to: '/biens', label: 'Nos biens' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
]

export const LEGAL_NAV: NavItem[] = [
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/confidentialite', label: 'Confidentialité' },
]
