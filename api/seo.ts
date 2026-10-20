/**
 * Fonction Vercel : aperçus de partage et métadonnées pour les ROBOTS.
 *
 * WhatsApp, Facebook, LinkedIn, X, Telegram… n'exécutent pas JavaScript : sans
 * cette fonction, un lien d'annonce partagé afficherait le titre et l'image par
 * défaut du site. vercel.json réécrit vers /api/seo UNIQUEMENT les requêtes dont
 * le User-Agent est celui d'un robot ; les visiteurs reçoivent le site normal.
 *
 * Fonctionnement : on récupère index.html (déployé), on y injecte titre,
 * description, URL canonique, Open Graph et Twitter Card de la page demandée
 * (annonce lue via la RPC publique `get_public_property`, photo de couverture
 * signée 7 jours), puis on renvoie la page. Toute erreur => métadonnées par défaut.
 *
 * Fichier autonome (aucun import de src/) pour un empaquetage simple par Vercel.
 */

// Valeurs PUBLIQUES (identiques à .env.production) ; surchargeables par l'environnement Vercel.
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || 'https://sasssoloprjakfysajvt.supabase.co').replace(/\/+$/, '')
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_nEladw4-wUTm2X1xqIfrXQ_1_CWWx0E'
const SIGNED_URL_TTL = 7 * 24 * 3600
const SITE_NAME = 'ABS IMMO & SERVICES'

type Locale = 'fr' | 'en' | 'wo'

export interface PageMeta {
  locale: Locale
  title: string
  description: string
  url: string
  image: string
  imageAlt: string
  type: 'website' | 'article'
  noindex: boolean
}

const DEFAULTS: Record<'fr' | 'en', { title: string; description: string }> = {
  fr: {
    title: 'ABS IMMO & SERVICES — Agence immobilière au Sénégal',
    description:
      'Achat, location et accompagnement de projets immobiliers au Sénégal. Découvrez les biens proposés par ABS IMMO & SERVICES et contactez notre équipe.',
  },
  en: {
    title: 'ABS IMMO & SERVICES — Real estate agency in Senegal',
    description:
      'Buying, renting and real estate project support in Senegal. Browse the properties offered by ABS IMMO & SERVICES and get in touch with our team.',
  },
}

/** Titres et descriptions des pages fixes (repris des dictionnaires du site). */
const PAGES: Record<string, Record<'fr' | 'en', [title: string, description: string]>> = {
  '/biens': {
    fr: ['Nos biens', 'Toutes les annonces immobilières d’ABS IMMO & SERVICES au Sénégal : villas, appartements, terrains, bureaux et commerces, à vendre ou à louer.'],
    en: ['Our properties', 'All ABS IMMO & SERVICES real estate listings in Senegal: villas, apartments, land, offices and shops, for sale or for rent.'],
  },
  '/acheter': {
    fr: ['Acheter un bien', 'Biens immobiliers à vendre au Sénégal avec ABS IMMO & SERVICES : villas, appartements, maisons, terrains et locaux. Prix en FCFA.'],
    en: ['Buy a property', 'Properties for sale in Senegal with ABS IMMO & SERVICES: villas, apartments, houses, land and commercial spaces. Prices in CFA francs.'],
  },
  '/louer': {
    fr: ['Louer un bien', 'Locations immobilières au Sénégal avec ABS IMMO & SERVICES : appartements, villas, bureaux et locaux commerciaux. Loyers en FCFA.'],
    en: ['Rent a property', 'Rentals in Senegal with ABS IMMO & SERVICES: apartments, villas, offices and retail spaces. Rents in CFA francs.'],
  },
  '/a-propos': {
    fr: ['À propos de l’agence', 'ABS IMMO & SERVICES, agence immobilière au Sénégal : achat, location, investissement et mise en valeur de biens, avec un accompagnement sérieux à chaque étape.'],
    en: ['About the agency', 'ABS IMMO & SERVICES, real estate agency in Senegal: buying, renting, investing and showcasing properties, with dependable support at every step.'],
  },
  '/contact': {
    fr: ['Contact', 'Contactez ABS IMMO & SERVICES pour un achat, une location, un investissement ou pour confier votre bien. Réponse par téléphone, WhatsApp ou e-mail.'],
    en: ['Contact', 'Contact ABS IMMO & SERVICES to buy, rent, invest or list your property. We reply by phone, WhatsApp or email.'],
  },
  '/mentions-legales': {
    fr: ['Mentions légales', 'Mentions légales du site ABS IMMO & SERVICES : éditeur, hébergement, propriété intellectuelle et crédits.'],
    en: ['Legal notice', 'Legal notice of the ABS IMMO & SERVICES website: publisher, hosting, intellectual property and credits.'],
  },
  '/confidentialite': {
    fr: ['Politique de confidentialité', 'Comment ABS IMMO & SERVICES traite les données personnelles transmises via les formulaires du site.'],
    en: ['Privacy policy', 'How ABS IMMO & SERVICES processes personal data submitted through the website forms.'],
  },
}

const WORDS = {
  fr: { sale: 'À vendre', rent: 'À louer', onRequest: 'Prix sur demande', sold: 'Vendu', rented: 'Loué', month: ' / mois', year: ' / an', week: ' / semaine', day: ' / jour', in: ' à ' },
  en: { sale: 'For sale', rent: 'For rent', onRequest: 'Price on request', sold: 'Sold', rented: 'Rented', month: ' / month', year: ' / year', week: ' / week', day: ' / day', in: ' in ' },
} as const

export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const m = /^\/(en|wo)(\/.*)?$/.exec(pathname)
  if (!m) return { locale: 'fr', path: pathname || '/' }
  return { locale: m[1] as Locale, path: m[2] || '/' }
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatPrice(amount: number | null, locale: 'fr' | 'en', period: string | null): string {
  const w = WORDS[locale]
  if (amount === null || amount === undefined) return w.onRequest
  const n = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'fr-FR').format(amount).replace(/[\u00a0\u202f]/g, ' ')
  const suffix = period && period in w ? w[period as 'month' | 'year' | 'week' | 'day'] : ''
  return `${n} FCFA${suffix}`
}

export interface ListingSummary {
  title: string | null
  short_description: string | null
  seo_title: string | null
  seo_description: string | null
  /** Contrat 1.1.0 : traductions anglaises facultatives (repli sur le français). */
  title_en?: string | null
  short_description_en?: string | null
  seo_title_en?: string | null
  seo_description_en?: string | null
  transaction_type: string | null
  commercial_status: string | null
  price_amount: number | null
  rent_period: string | null
  city_name: string | null
  neighborhood_name: string | null
  reference: string | null
}

/** Métadonnées d'une page, à partir de la langue, du chemin et (pour une fiche) des données du bien. */
export function buildMeta(
  origin: string,
  pathname: string,
  listing: ListingSummary | null | undefined,
  coverUrl: string | null,
): PageMeta {
  const { locale, path } = splitLocale(pathname)
  const lang: 'fr' | 'en' = locale === 'en' ? 'en' : 'fr'
  const base: PageMeta = {
    locale,
    title: DEFAULTS[lang].title,
    description: DEFAULTS[lang].description,
    url: `${origin}${pathname === '/' ? '/' : pathname}`,
    image: `${origin}/og-default.jpg`,
    imageAlt: SITE_NAME,
    type: 'website',
    // Le wolof reste hors index tant que sa traduction n'est pas relue (comme sur le site).
    noindex: locale === 'wo',
  }

  if (path.startsWith('/biens/')) {
    if (!listing?.title) return { ...base, noindex: true }
    const w = WORDS[lang]
    const location = [listing.neighborhood_name, listing.city_name].filter(Boolean).join(', ')
    const status =
      listing.commercial_status === 'sold' ? w.sold : listing.commercial_status === 'rented' ? w.rented : null
    const kind = listing.transaction_type === 'rent' ? w.rent : w.sale
    const price = formatPrice(listing.price_amount, lang, listing.transaction_type === 'rent' ? listing.rent_period : null)
    // Anglais : champs *_en s'ils existent ; sinon titre français et résumé (prix, statut, lieu) en anglais.
    const en = lang === 'en'
    const name = (en && listing.title_en) || listing.title
    const seoTitle = en ? listing.seo_title_en : locale === 'fr' ? listing.seo_title : null
    const title = seoTitle || `${name}${location ? ` — ${location}` : ''}`
    const summary = [status ?? kind, price, location ? `${location}` : null, listing.reference].filter(Boolean).join(' · ')
    const text = en
      ? (listing.seo_description_en ?? listing.short_description_en)
      : locale === 'fr'
        ? (listing.seo_description ?? listing.short_description)
        : null
    return {
      ...base,
      title: `${title} | ${SITE_NAME}`,
      description: text ? `${summary} — ${text}` : summary,
      image: coverUrl ?? base.image,
      imageAlt: name ?? SITE_NAME,
      type: 'article',
    }
  }

  const page = PAGES[path]
  if (page) {
    const [title, description] = page[lang]
    return { ...base, title: `${title} | ${SITE_NAME}`, description }
  }
  return base
}

/** Remplace les métadonnées par défaut d'index.html par celles de la page. */
export function injectMeta(html: string, meta: PageMeta): string {
  const htmlLang = meta.locale
  const ogLocale = meta.locale === 'en' ? 'en_GB' : meta.locale === 'wo' ? 'wo_SN' : 'fr_SN'
  const e = escapeHtml
  const tags = [
    `<title>${e(meta.title)}</title>`,
    `<meta name="description" content="${e(meta.description)}" />`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow'}" />`,
    `<link rel="canonical" href="${e(meta.url)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="${ogLocale}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:title" content="${e(meta.title)}" />`,
    `<meta property="og:description" content="${e(meta.description)}" />`,
    `<meta property="og:url" content="${e(meta.url)}" />`,
    `<meta property="og:image" content="${e(meta.image)}" />`,
    `<meta property="og:image:alt" content="${e(meta.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(meta.title)}" />`,
    `<meta name="twitter:description" content="${e(meta.description)}" />`,
    `<meta name="twitter:image" content="${e(meta.image)}" />`,
  ].join('\n    ')

  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${htmlLang}">`)
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[\s\S]*?\/>\s*/g, '')
    .replace(/<link rel="canonical"[^>]*>\s*/g, '')
    .replace('</head>', `  ${tags}\n  </head>`)
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.json()
}

async function loadListing(slug: string): Promise<{ listing: ListingSummary | null; coverUrl: string | null }> {
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
  const data = (await fetchJson(`${SUPABASE_URL}/rest/v1/rpc/get_public_property`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_slug: slug }),
  })) as (ListingSummary & { cover_image_path?: string | null }) | null
  if (!data || typeof data !== 'object') return { listing: null, coverUrl: null }

  let coverUrl: string | null = null
  if (data.cover_image_path) {
    try {
      const encoded = data.cover_image_path.split('/').map(encodeURIComponent).join('/')
      const signed = (await fetchJson(`${SUPABASE_URL}/storage/v1/object/sign/property-images/${encoded}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ expiresIn: SIGNED_URL_TTL }),
      })) as { signedURL?: string }
      if (signed.signedURL) coverUrl = `${SUPABASE_URL}/storage/v1${signed.signedURL}`
    } catch {
      // Photo non signable : image par défaut du site.
    }
  }
  return { listing: data, coverUrl }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const origin = url.origin
  const raw = url.searchParams.get('path') ?? '/'
  const pathname = `/${raw.replace(/^\/+/, '')}`.replace(/\/+$/, '') || '/'

  const page = await fetch(`${origin}/index.html`, { signal: AbortSignal.timeout(4000) })
  const html = await page.text()

  let listing: ListingSummary | null = null
  let coverUrl: string | null = null
  const { path } = splitLocale(pathname)
  const slug = /^\/biens\/([^/]+)$/.exec(path)?.[1]
  if (slug) {
    try {
      ;({ listing, coverUrl } = await loadListing(decodeURIComponent(slug)))
    } catch {
      // Backend indisponible : métadonnées par défaut (la page reste utilisable).
    }
  }

  return new Response(injectMeta(html, buildMeta(origin, pathname, listing, coverUrl)), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Cache CDN court : les robots de partage revisitent rarement ; une annonce modifiée est reprise en 10 min.
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
      'X-Robots-Preview': 'abs-seo',
    },
  })
}
