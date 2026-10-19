import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { absoluteUrl, SITE } from '@/config/site'
import { LOCALE_META, LOCALES, localizePath, splitLocale } from '@/i18n/config'
import { useI18n } from '@/i18n/context'

/**
 * Métadonnées de page. index.html contient des valeurs par défaut (lisibles sans
 * JavaScript) ; ce composant les MET À JOUR au lieu d'en ajouter de nouvelles,
 * pour éviter les balises en double.
 */
export interface SeoProps {
  title?: string
  description?: string
  /** Chemin canonique SANS préfixe de langue (par défaut : chemin courant). */
  canonicalPath?: string
  image?: string | null
  imageAlt?: string
  type?: 'website' | 'article'
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (content === null) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]:not([hreflang])`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function Seo({
  title,
  description,
  canonicalPath,
  image,
  imageAlt,
  type = 'website',
  noindex = false,
  jsonLd,
}: SeoProps) {
  const { pathname } = useLocation()
  const { locale, t } = useI18n()
  const basePath = canonicalPath ?? splitLocale(pathname).path
  const fullTitle = title ? `${title} | ${SITE.name}` : t.meta.defaultTitle
  const desc = description ?? t.meta.defaultDescription
  const canonical = absoluteUrl(localizePath(basePath, locale))
  const imageUrl = absoluteUrl(image ?? SITE.defaultImage)
  const robotsNoindex = noindex || !LOCALE_META[locale].indexable
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : null

  useEffect(() => {
    document.title = fullTitle
    upsertMeta('name', 'description', desc)
    upsertMeta('name', 'robots', robotsNoindex ? 'noindex, follow' : 'index, follow')
    upsertLink('canonical', canonical)
    upsertMeta('property', 'og:site_name', SITE.name)
    upsertMeta('property', 'og:locale', LOCALE_META[locale].ogLocale)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', imageUrl)
    upsertMeta('property', 'og:image:alt', imageAlt ?? fullTitle)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', desc)
    upsertMeta('name', 'twitter:image', imageUrl)
  }, [fullTitle, desc, canonical, imageUrl, imageAlt, type, robotsNoindex, locale])

  // Versions linguistiques (hreflang) : uniquement les langues indexables, x-default = français.
  useEffect(() => {
    if (noindex) return
    const links = [
      ...LOCALES.filter((l) => LOCALE_META[l].indexable).map((l) => [LOCALE_META[l].htmlLang, l] as const),
      ['x-default', 'fr'] as const,
    ].map(([hreflang, l]) => {
      const el = document.createElement('link')
      el.rel = 'alternate'
      el.hreflang = hreflang
      el.href = absoluteUrl(localizePath(basePath, l))
      document.head.appendChild(el)
      return el
    })
    return () => links.forEach((el) => el.remove())
  }, [basePath, noindex])

  useEffect(() => {
    if (!jsonLdText) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seo = 'page'
    script.textContent = jsonLdText
    document.head.appendChild(script)
    return () => script.remove()
  }, [jsonLdText])

  return null
}
