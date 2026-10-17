import { z } from 'zod'
import type { InquiryType } from '@/types'

/**
 * Schémas de saisie alignés sur la validation des Edge Functions
 * (abs-immo-backend/supabase/functions/_shared/validation.ts). La validation
 * côté navigateur sert le confort de saisie ; le backend reste l'autorité.
 */
export const LIMITS = {
  fullNameMin: 2,
  fullNameMax: 120,
  emailMax: 254,
  inquiryMessageMax: 5000,
  viewingMessageMax: 2000,
  maxDaysAhead: 120,
} as const

const E164_RE = /^\+[1-9][0-9]{7,14}$/

/** Même normalisation que le backend : espaces/points/tirets retirés, 00 -> +, 9 chiffres SN -> +221. */
export function normalizePhone(raw: string): string | null {
  let v = raw.replace(/[\s.\-()/]/g, '')
  if (v === '') return null
  if (v.startsWith('00')) v = `+${v.slice(2)}`
  if (/^[37][0-9]{8}$/.test(v)) v = `+221${v}`
  return E164_RE.test(v) ? v : null
}

/** Date du jour au format AAAA-MM-JJ (Dakar = UTC+0, comme le backend). */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const fullName = z
  .string()
  .transform((v) => v.replace(/\s+/g, ' ').trim())
  .pipe(
    z
      .string()
      .min(LIMITS.fullNameMin, 'Merci d’indiquer votre nom.')
      .max(LIMITS.fullNameMax, `${LIMITS.fullNameMax} caractères maximum.`),
  )

const email = z
  .string()
  .trim()
  .max(LIMITS.emailMax, 'Adresse e-mail trop longue.')
  .refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Adresse e-mail invalide.')

const phone = z
  .string()
  .trim()
  .refine((v) => v === '' || normalizePhone(v) !== null, 'Numéro invalide (ex. 77 123 45 67 ou +33 6 12 34 56 78).')

const preferredContact = z.enum(['', 'phone', 'whatsapp', 'email'])

function contactRules(
  v: { email: string; phone: string; preferred_contact: string },
  ctx: z.RefinementCtx,
  options: { phoneRequired: boolean },
) {
  if (options.phoneRequired && v.phone === '') {
    ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Un numéro est nécessaire pour organiser la visite.' })
  }
  if (!options.phoneRequired && v.email === '' && v.phone === '') {
    ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Indiquez un téléphone ou un e-mail pour être recontacté.' })
  }
  if (v.preferred_contact === 'email' && v.email === '') {
    ctx.addIssue({ code: 'custom', path: ['email'], message: 'E-mail requis pour une réponse par e-mail.' })
  }
  if ((v.preferred_contact === 'phone' || v.preferred_contact === 'whatsapp') && v.phone === '') {
    ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Numéro requis pour être rappelé.' })
  }
}

export const INQUIRY_SUBJECTS = [
  { value: 'general', label: 'Renseignement général' },
  { value: 'buy', label: 'Je souhaite acheter' },
  { value: 'rent', label: 'Je souhaite louer' },
  { value: 'invest', label: 'Je souhaite investir' },
  { value: 'sell_property', label: 'Je souhaite vendre mon bien' },
  { value: 'rent_out_property', label: 'Je souhaite mettre mon bien en location' },
  { value: 'other', label: 'Autre demande' },
] as const

export type InquirySubject = (typeof INQUIRY_SUBJECTS)[number]['value']

/** Sujets sans équivalent direct dans `inquiry_type` : envoyés en `general`, précisés dans le message. */
export const SUBJECT_TO_TYPE: Record<InquirySubject, InquiryType> = {
  general: 'general',
  buy: 'general',
  rent: 'general',
  invest: 'general',
  sell_property: 'sell_property',
  rent_out_property: 'rent_out_property',
  other: 'other',
}

/** Message transmis : le projet est rappelé en tête quand le type backend ne suffit pas à le décrire. */
export function buildInquiryMessage(subject: InquirySubject, message: string, hasProperty: boolean): string | null {
  const label = INQUIRY_SUBJECTS.find((s) => s.value === subject)?.label
  const prefix = !hasProperty && SUBJECT_TO_TYPE[subject] === 'general' && subject !== 'general' ? `[${label}] ` : ''
  const text = `${prefix}${message}`.trim()
  return text === '' ? null : text
}

/** Correspondance entre les champs renvoyés par le backend (422) et ceux du formulaire. */
export function backendFieldName(field: string): string {
  return field === 'contact' ? 'phone' : field
}

export const inquirySchema = z
  .object({
    full_name: fullName,
    email,
    phone,
    subject: z.enum(INQUIRY_SUBJECTS.map((s) => s.value) as [InquirySubject, ...InquirySubject[]]),
    message: z.string().trim().max(LIMITS.inquiryMessageMax, `${LIMITS.inquiryMessageMax} caractères maximum.`),
    preferred_contact: preferredContact,
    consent_marketing: z.boolean(),
    /** true si la demande concerne une annonce (le message devient facultatif). */
    has_property: z.boolean(),
  })
  .superRefine((v, ctx) => {
    contactRules(v, ctx, { phoneRequired: false })
    if (!v.has_property && v.message.length < 2) {
      ctx.addIssue({ code: 'custom', path: ['message'], message: 'Merci de préciser votre demande.' })
    }
  })

export type InquiryFormInput = z.input<typeof inquirySchema>
export type InquiryFormValues = z.output<typeof inquirySchema>

export const viewingSchema = z
  .object({
    full_name: fullName,
    email,
    phone,
    preferred_date: z.string(),
    preferred_time_slot: z.enum(['any', 'morning', 'afternoon', 'evening']),
    message: z.string().trim().max(LIMITS.viewingMessageMax, `${LIMITS.viewingMessageMax} caractères maximum.`),
    preferred_contact: preferredContact,
    consent_marketing: z.boolean(),
  })
  .superRefine((v, ctx) => {
    contactRules(v, ctx, { phoneRequired: true })
    if (v.preferred_date) {
      const today = todayIso()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.preferred_date)) {
        ctx.addIssue({ code: 'custom', path: ['preferred_date'], message: 'Date invalide.' })
      } else if (v.preferred_date < today || v.preferred_date > addDaysIso(today, LIMITS.maxDaysAhead)) {
        ctx.addIssue({
          code: 'custom',
          path: ['preferred_date'],
          message: `Choisissez une date entre aujourd’hui et les ${LIMITS.maxDaysAhead} prochains jours.`,
        })
      }
    }
  })

export type ViewingFormInput = z.input<typeof viewingSchema>
export type ViewingFormValues = z.output<typeof viewingSchema>
