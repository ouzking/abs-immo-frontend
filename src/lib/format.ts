import type { RentPeriod, SurfaceUnit } from '@/types'

const NBSP = /[\u00a0\u202f]/g

const integerFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

/** 150000000 -> "150 000 000" (espaces simples, pour un rendu identique partout). */
export function formatNumber(value: number, decimals = false): string {
  return (decimals ? decimalFormatter : integerFormatter).format(value).replace(NBSP, ' ')
}

const RENT_SUFFIX: Record<RentPeriod, string> = {
  day: ' / jour',
  week: ' / semaine',
  month: ' / mois',
  year: ' / an',
}

/** Prix en FCFA ; null => « Prix sur demande » (conforme à `formatPriceXof` du contrat). */
export function formatPrice(amount: number | null | undefined, rentPeriod?: RentPeriod | null): string {
  if (amount === null || amount === undefined) return 'Prix sur demande'
  return `${formatNumber(amount)} FCFA${rentPeriod ? RENT_SUFFIX[rentPeriod] : ''}`
}

/** Montant court pour les listes de budgets : 150000000 -> "150 M FCFA", 850000 -> "850 000 FCFA". */
export function formatBudget(amount: number): string {
  if (amount >= 1_000_000_000) return `${formatNumber(amount / 1_000_000_000, true)} Md FCFA`
  if (amount >= 1_000_000) return `${formatNumber(amount / 1_000_000, true)} M FCFA`
  return `${formatNumber(amount)} FCFA`
}

const SURFACE_UNITS: Record<SurfaceUnit, string> = { sqm: 'm²', are: 'a', hectare: 'ha' }

export function formatSurface(value: number | null | undefined, unit: SurfaceUnit | null | undefined = 'sqm'): string | null {
  if (value === null || value === undefined) return null
  return `${formatNumber(value, true)} ${SURFACE_UNITS[unit ?? 'sqm']}`
}

/** Pluriel français simple : plural(3, 'chambre') -> "3 chambres". */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : dateFormatter.format(d)
}

/**
 * Affichage lisible d'un numéro E.164 : +221770001122 -> "+221 77 000 11 22".
 * Les numéros non sénégalais sont groupés par 2 après l'indicatif présumé.
 */
export function formatPhone(e164: string | null | undefined): string | null {
  if (!e164) return null
  const sn = /^\+221(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164)
  if (sn) return `+221 ${sn[1]} ${sn[2]} ${sn[3]} ${sn[4]}`
  return e164
}

/** Lien `tel:` sans espaces. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

/** Lien WhatsApp (wa.me exige le numéro sans « + » ni espaces). */
export function whatsappHref(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
