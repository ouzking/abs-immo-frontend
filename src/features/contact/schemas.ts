import { z } from 'zod'
import { fr, type Messages } from '@/i18n/messages/fr'
import type { InquiryType } from '@/types'

/**
 * Schémas de saisie alignés sur la validation des Edge Functions
 * (abs-immo-backend/supabase/functions/_shared/validation.ts). La validation
 * côté navigateur sert le confort de saisie ; le backend reste l'autorité.
 * Les messages d'erreur sont fournis dans la langue du visiteur.
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

type ValidationMessages = Messages['forms']['validation']

function fields(v: ValidationMessages) {
  return {
    full_name: z
      .string()
      .transform((s) => s.replace(/\s+/g, ' ').trim())
      .pipe(z.string().min(LIMITS.fullNameMin, v.nameRequired).max(LIMITS.fullNameMax, v.nameTooLong(LIMITS.fullNameMax))),
    email: z
      .string()
      .trim()
      .max(LIMITS.emailMax, v.emailTooLong)
      .refine((s) => s === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s), v.emailInvalid),
    phone: z
      .string()
      .trim()
      .refine((s) => s === '' || normalizePhone(s) !== null, v.phoneInvalid),
    preferred_contact: z.enum(['', 'phone', 'whatsapp', 'email']),
  }
}

function contactRules(
  v: ValidationMessages,
  values: { email: string; phone: string; preferred_contact: string },
  ctx: z.RefinementCtx,
  phoneRequired: boolean,
) {
  if (phoneRequired && values.phone === '') {
    ctx.addIssue({ code: 'custom', path: ['phone'], message: v.phoneRequiredVisit })
  }
  if (!phoneRequired && values.email === '' && values.phone === '') {
    ctx.addIssue({ code: 'custom', path: ['phone'], message: v.contactRequired })
  }
  if (values.preferred_contact === 'email' && values.email === '') {
    ctx.addIssue({ code: 'custom', path: ['email'], message: v.emailRequired })
  }
  if ((values.preferred_contact === 'phone' || values.preferred_contact === 'whatsapp') && values.phone === '') {
    ctx.addIssue({ code: 'custom', path: ['phone'], message: v.phoneRequired })
  }
}

export const INQUIRY_SUBJECTS = ['general', 'buy', 'rent', 'invest', 'sell_property', 'rent_out_property', 'other'] as const
export type InquirySubject = (typeof INQUIRY_SUBJECTS)[number]

export function isInquirySubject(value: string | null): value is InquirySubject {
  return (INQUIRY_SUBJECTS as readonly string[]).includes(value ?? '')
}

export function createInquirySchema(v: ValidationMessages) {
  return z
    .object({
      ...fields(v),
      subject: z.enum(INQUIRY_SUBJECTS),
      message: z.string().trim().max(LIMITS.inquiryMessageMax, v.tooLong(LIMITS.inquiryMessageMax)),
      consent_marketing: z.boolean(),
      /** true si la demande concerne une annonce (le message devient facultatif). */
      has_property: z.boolean(),
    })
    .superRefine((values, ctx) => {
      contactRules(v, values, ctx, false)
      if (!values.has_property && values.message.length < 2) {
        ctx.addIssue({ code: 'custom', path: ['message'], message: v.messageRequired })
      }
    })
}

export function createViewingSchema(v: ValidationMessages) {
  return z
    .object({
      ...fields(v),
      preferred_date: z.string(),
      preferred_time_slot: z.enum(['any', 'morning', 'afternoon', 'evening']),
      message: z.string().trim().max(LIMITS.viewingMessageMax, v.tooLong(LIMITS.viewingMessageMax)),
      consent_marketing: z.boolean(),
    })
    .superRefine((values, ctx) => {
      contactRules(v, values, ctx, true)
      if (values.preferred_date) {
        const today = todayIso()
        if (!/^\d{4}-\d{2}-\d{2}$/.test(values.preferred_date)) {
          ctx.addIssue({ code: 'custom', path: ['preferred_date'], message: v.dateInvalid })
        } else if (values.preferred_date < today || values.preferred_date > addDaysIso(today, LIMITS.maxDaysAhead)) {
          ctx.addIssue({ code: 'custom', path: ['preferred_date'], message: v.dateRange(LIMITS.maxDaysAhead) })
        }
      }
    })
}

/** Schémas en français (référence, utilisés par les tests). */
export const inquirySchema = createInquirySchema(fr.forms.validation)
export const viewingSchema = createViewingSchema(fr.forms.validation)

export type InquiryFormInput = z.input<typeof inquirySchema>
export type InquiryFormValues = z.output<typeof inquirySchema>
export type ViewingFormInput = z.input<typeof viewingSchema>
export type ViewingFormValues = z.output<typeof viewingSchema>

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

/**
 * Message transmis à l'agence. Le projet est rappelé en tête (toujours en
 * français, langue de travail de l'équipe) quand le type backend ne suffit pas.
 */
export function buildInquiryMessage(subject: InquirySubject, message: string, hasProperty: boolean, visitorLocale = 'fr'): string | null {
  const prefix =
    !hasProperty && SUBJECT_TO_TYPE[subject] === 'general' && subject !== 'general' ? `[${fr.forms.subjects[subject]}] ` : ''
  const lang = visitorLocale !== 'fr' && message.trim() ? `[Langue du visiteur : ${visitorLocale.toUpperCase()}] ` : ''
  const text = `${prefix}${lang}${message}`.trim()
  return text === '' ? null : text
}

/** Correspondance entre les champs renvoyés par le backend (422) et ceux du formulaire. */
export function backendFieldName(field: string): string {
  return field === 'contact' ? 'phone' : field
}
