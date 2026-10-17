import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { absoluteUrl, formatTitle, SITE } from '@/config/site'

/**
 * Métadonnées de page. index.html contient des valeurs par défaut (lisibles sans
 * JavaScript) ; ce composant les METS À JOUR au lieu d'en ajouter de nouvelles,
 * pour éviter les balises en double.
 */
export interface SeoProps {
  title?: string
  description?: string
  /** Chemin canonique (par défaut : chemin courant sans paramètres). */
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
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function Seo({
  title,
  description = SITE.defaultDescription,
  canonicalPath,
  image,
  imageAlt,
  type = 'website',
  noindex = false,
  jsonLd,
}: SeoProps) {
  const { pathname } = useLocation()
  const fullTitle = formatTitle(title)
  const canonical = absoluteUrl(canonicalPath ?? pathname)
  const imageUrl = absoluteUrl(image ?? SITE.defaultImage)
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : null

  useEffect(() => {
    document.title = fullTitle
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow')
    upsertLink('canonical', canonical)
    upsertMeta('property', 'og:site_name', SITE.name)
    upsertMeta('property', 'og:locale', SITE.locale)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', imageUrl)
    upsertMeta('property', 'og:image:alt', imageAlt ?? fullTitle)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', imageUrl)
  }, [fullTitle, description, canonical, imageUrl, imageAlt, type, noindex])

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
