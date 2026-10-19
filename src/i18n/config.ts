/**
 * Langues du site. Le français est la langue par défaut (URL sans préfixe) ;
 * l'anglais et le wolof sont servis sous /en/… et /wo/…
 */
export const LOCALES = ['fr', 'en', 'wo'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'fr'

export const LOCALE_META: Record<
  Locale,
  {
    label: string
    short: string
    htmlLang: string
    ogLocale: string
    /** Locale Intl pour nombres et dates (le wolof utilise les formats français). */
    intl: string
    /** Traduction relue et validée : seules ces langues sont proposées à l'indexation. */
    indexable: boolean
  }
> = {
  fr: { label: 'Français', short: 'FR', htmlLang: 'fr', ogLocale: 'fr_SN', intl: 'fr-FR', indexable: true },
  en: { label: 'English', short: 'EN', htmlLang: 'en', ogLocale: 'en_GB', intl: 'en-GB', indexable: true },
  // Traduction wolof à faire relire par un locuteur natif avant indexation (voir docs/I18N.md).
  wo: { label: 'Wolof', short: 'WO', htmlLang: 'wo', ogLocale: 'wo_SN', intl: 'fr-FR', indexable: false },
}

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value)
}

/** « /biens » + en → « /en/biens » ; les URL externes, ancres et protocoles sont laissés tels quels. */
export function localizePath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith('/') || path.startsWith('//')) return path
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

/** « /en/biens/x » → { locale: 'en', path: '/biens/x' } */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const match = /^\/(en|wo)(\/.*)?$/.exec(pathname)
  if (!match) return { locale: DEFAULT_LOCALE, path: pathname || '/' }
  return { locale: match[1] as Locale, path: match[2] || '/' }
}
