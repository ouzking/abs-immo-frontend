/**
 * Génère dist/sitemap.xml et dist/robots.txt après `vite build`.
 *
 * - Pages statiques : toujours incluses.
 * - Annonces : lues dans la vue publique `public_properties` (annonces publiées
 *   uniquement, via la clé publishable — mêmes droits qu'un visiteur).
 * - Langues : français (racine) et anglais (/en), reliés par des liens hreflang.
 *   Le wolof n'est pas listé tant que sa traduction n'est pas relue (pages noindex).
 * - Sans VITE_SITE_URL, aucun sitemap n'est produit (les URL doivent être absolues)
 *   et robots.txt n'y fait pas référence.
 *
 * Exécution : `node scripts/generate-seo-files.ts` (Node ≥ 22.18, types retirés nativement).
 * Le sitemap reflète les annonces publiées AU MOMENT DU BUILD : reconstruire (ou
 * planifier un build quotidien) pour le tenir à jour.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'

const mode = process.env.MODE ?? 'production'
const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
const siteUrl = env.VITE_SITE_URL?.trim().replace(/\/+$/, '')
const supabaseUrl = env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, '')
const supabaseKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY)?.trim()
const outDir = resolve(process.cwd(), 'dist')
const NL = '\n'

const STATIC_PAGES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/biens', priority: '0.9', changefreq: 'daily' },
  { path: '/acheter', priority: '0.9', changefreq: 'daily' },
  { path: '/louer', priority: '0.9', changefreq: 'daily' },
  { path: '/a-propos', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/mentions-legales', priority: '0.2', changefreq: 'yearly' },
  { path: '/confidentialite', priority: '0.2', changefreq: 'yearly' },
]

const INDEXED_LOCALES = ['fr', 'en'] as const
type IndexedLocale = (typeof INDEXED_LOCALES)[number]

interface ListingRow {
  slug: string
  updated_at: string | null
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function fetchListings(): Promise<ListingRow[]> {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[seo] Supabase non configuré : sitemap limité aux pages statiques.')
    return []
  }
  const rows: ListingRow[] = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const url = `${supabaseUrl}/rest/v1/public_properties?select=slug,updated_at&order=published_at.desc&offset=${offset}&limit=${pageSize}`
    const res = await fetch(url, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } })
    if (!res.ok) throw new Error(`public_properties : HTTP ${res.status} ${await res.text()}`)
    const page = (await res.json()) as ListingRow[]
    rows.push(...page.filter((r) => typeof r.slug === 'string' && r.slug.length > 0))
    if (page.length < pageSize) break
  }
  return rows
}

function localizedUrl(base: string, path: string, locale: IndexedLocale): string {
  if (locale === 'fr') return `${base}${path}`
  return `${base}/${locale}${path === '/' ? '' : path}`
}

/** Une entrée <url> par langue, chacune annonçant toutes les versions (hreflang + x-default). */
function sitemapEntries(base: string, path: string, lastmod: string | null, changefreq: string, priority: string): string[] {
  const alternates =
    INDEXED_LOCALES.map(
      (l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(localizedUrl(base, path, l))}"/>`,
    ).join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(localizedUrl(base, path, 'fr'))}"/>`
  return INDEXED_LOCALES.map(
    (l) =>
      `  <url><loc>${xmlEscape(localizedUrl(base, path, l))}</loc>${alternates}` +
      `${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
  )
}

async function main() {
  if (!existsSync(outDir)) throw new Error('dist/ introuvable : lancez `vite build` avant ce script.')

  if (!siteUrl) {
    console.warn('[seo] VITE_SITE_URL absent : pas de sitemap.xml ; robots.txt minimal.')
    writeFileSync(resolve(outDir, 'robots.txt'), ['User-agent: *', 'Allow: /', ''].join(NL))
    return
  }

  let listings: ListingRow[] = []
  try {
    listings = await fetchListings()
  } catch (error) {
    // Le build ne doit pas échouer si l'API est momentanément indisponible.
    console.warn(`[seo] Annonces non récupérées (${String(error)}) : sitemap limité aux pages statiques.`)
  }

  const today = new Date().toISOString().slice(0, 10)
  const urls = [
    ...STATIC_PAGES.flatMap((p) => sitemapEntries(siteUrl, p.path, today, p.changefreq, p.priority)),
    ...listings.flatMap((l) =>
      sitemapEntries(siteUrl, `/biens/${encodeURIComponent(l.slug)}`, l.updated_at?.slice(0, 10) ?? null, 'weekly', '0.8'),
    ),
  ]
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join(NL)
  writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap)
  writeFileSync(resolve(outDir, 'robots.txt'), ['User-agent: *', 'Allow: /', '', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join(NL))
  console.log(
    `[seo] sitemap.xml : ${STATIC_PAGES.length} pages + ${listings.length} annonces, en ${INDEXED_LOCALES.join(' et ')} (${urls.length} URL) ; robots.txt écrit.`,
  )
}

main().catch((error: unknown) => {
  console.error('[seo] Échec :', error)
  process.exit(1)
})
