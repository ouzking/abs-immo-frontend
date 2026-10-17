import { describe, expect, it } from 'vitest'
import { addDaysIso, buildInquiryMessage, inquirySchema, normalizePhone, todayIso, viewingSchema } from './schemas'

const baseInquiry = {
  full_name: '  Awa   Diop ',
  email: '',
  phone: '77 123 45 67',
  subject: 'general' as const,
  message: 'Je cherche un F3 à Mermoz.',
  preferred_contact: '' as const,
  consent_marketing: false,
  has_property: false,
}

describe('normalizePhone (identique au backend)', () => {
  it.each([
    ['77 123 45 67', '+221771234567'],
    ['00221 77 123 45 67', '+221771234567'],
    ['+33 6 12 34 56 78', '+33612345678'],
    ['33-800-11-22', '+221338001122'],
  ])('%s -> %s', (input, expected) => expect(normalizePhone(input)).toBe(expected))

  it('rejette un numéro invalide', () => {
    expect(normalizePhone('12')).toBeNull()
    expect(normalizePhone('abc')).toBeNull()
  })
})

describe('inquirySchema', () => {
  it('accepte une demande valide et nettoie le nom', () => {
    const r = inquirySchema.safeParse(baseInquiry)
    expect(r.success).toBe(true)
    expect(r.data?.full_name).toBe('Awa Diop')
  })

  it('exige un moyen de contact', () => {
    const r = inquirySchema.safeParse({ ...baseInquiry, phone: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues.map((i) => i.path[0])).toContain('phone')
  })

  it('exige un message hors fiche de bien, pas sur une fiche', () => {
    expect(inquirySchema.safeParse({ ...baseInquiry, message: '' }).success).toBe(false)
    expect(inquirySchema.safeParse({ ...baseInquiry, message: '', has_property: true }).success).toBe(true)
  })

  it('exige l’e-mail si la réponse est souhaitée par e-mail', () => {
    const r = inquirySchema.safeParse({ ...baseInquiry, preferred_contact: 'email' })
    expect(r.error?.issues.map((i) => i.path[0])).toContain('email')
  })
})

describe('viewingSchema', () => {
  const base = {
    full_name: 'Moussa Ba',
    email: '',
    phone: '78 000 00 00',
    preferred_date: '',
    preferred_time_slot: 'any' as const,
    message: '',
    preferred_contact: '' as const,
    consent_marketing: false,
  }

  it('exige un téléphone', () => {
    expect(viewingSchema.safeParse({ ...base, phone: '' }).success).toBe(false)
  })

  it('borne la date entre aujourd’hui et +120 jours', () => {
    const today = todayIso()
    expect(viewingSchema.safeParse({ ...base, preferred_date: addDaysIso(today, 3) }).success).toBe(true)
    expect(viewingSchema.safeParse({ ...base, preferred_date: addDaysIso(today, -1) }).success).toBe(false)
    expect(viewingSchema.safeParse({ ...base, preferred_date: addDaysIso(today, 121) }).success).toBe(false)
  })
})

describe('buildInquiryMessage', () => {
  it('précise le projet quand le type backend est « general »', () => {
    expect(buildInquiryMessage('invest', 'Budget 100 M', false)).toBe('[Je souhaite investir] Budget 100 M')
    expect(buildInquiryMessage('sell_property', 'Villa à Ngor', false)).toBe('Villa à Ngor')
    expect(buildInquiryMessage('general', '', true)).toBeNull()
  })
})
