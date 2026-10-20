import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildMeta, escapeHtml, injectMeta, type ListingSummary } from './seo.ts'

const ORIGIN = 'https://abs-immo-service.vercel.app'
const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

const listing: ListingSummary = {
  title: 'Villa contemporaine avec piscine aux Almadies',
  short_description: 'Villa d’architecte avec piscine.',
  seo_title: null,
  seo_description: null,
  transaction_type: 'sale',
  commercial_status: 'available',
  price_amount: 450_000_000,
  rent_period: null,
  city_name: 'Dakar',
  neighborhood_name: 'Almadies',
  reference: 'ABS-V-2600001',
}

describe('aperçus de partage (fonction Vercel /api/seo)', () => {
  it('construit l’aperçu d’une annonce avec sa photo de couverture', () => {
    const meta = buildMeta(ORIGIN, '/biens/villa-almadies', listing, 'https://cdn.test/cover.jpg?token=x')
    expect(meta.title).toBe('Villa contemporaine avec piscine aux Almadies — Almadies, Dakar | ABS IMMO & SERVICES')
    expect(meta.description).toBe('À vendre · 450 000 000 FCFA · Almadies, Dakar · ABS-V-2600001 — Villa d’architecte avec piscine.')
    expect(meta.image).toBe('https://cdn.test/cover.jpg?token=x')
    expect(meta.url).toBe(`${ORIGIN}/biens/villa-almadies`)
    expect(meta.noindex).toBe(false)
  })

  it('traduit l’aperçu en anglais et signale un bien vendu', () => {
    const meta = buildMeta(ORIGIN, '/en/biens/x', { ...listing, commercial_status: 'sold' }, null)
    expect(meta.description).toBe('Sold · 450,000,000 FCFA · Almadies, Dakar · ABS-V-2600001')
    expect(meta.image).toBe(`${ORIGIN}/og-default.jpg`)
  })

  it('utilise la traduction anglaise de l’annonce quand elle existe (contrat 1.1.0)', () => {
    const meta = buildMeta(
      ORIGIN,
      '/en/biens/x',
      { ...listing, title_en: 'Contemporary villa with pool in Almadies', short_description_en: 'Architect-designed villa.' },
      null,
    )
    expect(meta.title).toBe('Contemporary villa with pool in Almadies — Almadies, Dakar | ABS IMMO & SERVICES')
    expect(meta.description).toBe('For sale · 450,000,000 FCFA · Almadies, Dakar · ABS-V-2600001 — Architect-designed villa.')
    // Le français reste en français.
    expect(buildMeta(ORIGIN, '/biens/x', { ...listing, title_en: 'X' }, null).title).toContain('Villa contemporaine')
  })

  it('n’indexe pas une annonce introuvable ni les pages wolof', () => {
    expect(buildMeta(ORIGIN, '/biens/inconnu', null, null).noindex).toBe(true)
    expect(buildMeta(ORIGIN, '/wo/louer', null, null).noindex).toBe(true)
    expect(buildMeta(ORIGIN, '/en/louer', null, null).title).toBe('Rent a property | ABS IMMO & SERVICES')
  })

  it('remplace les balises par défaut d’index.html sans les dupliquer', () => {
    const html = injectMeta(indexHtml, buildMeta(ORIGIN, '/en/biens/x', listing, 'https://cdn.test/c.jpg'))
    expect(html).toContain('<html lang="en">')
    expect(html.match(/<title>/g)).toHaveLength(1)
    expect(html.match(/property="og:title"/g)).toHaveLength(1)
    expect(html.match(/name="description"/g)).toHaveLength(1)
    expect(html).toContain('<meta property="og:image" content="https://cdn.test/c.jpg" />')
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/en/biens/x" />`)
    // L'application reste chargée normalement.
    expect(html).toContain('<div id="root"></div>')
    expect(html).toContain('src="/src/main.tsx"')
  })

  it('échappe le contenu saisi dans le back-office', () => {
    expect(escapeHtml('"><script>alert(1)</script>')).toBe('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;')
    const html = injectMeta(indexHtml, buildMeta(ORIGIN, '/biens/x', { ...listing, title: '<b>Villa</b> "test"' }, null))
    expect(html).not.toContain('<b>Villa</b>')
  })
})
