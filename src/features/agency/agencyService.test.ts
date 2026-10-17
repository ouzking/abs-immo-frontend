import { describe, expect, it } from 'vitest'
import { looksLikeSecretKey } from '@/config/env'
import { parseOpeningHours, parseSocialLinks } from './agencyService'

describe('parseSocialLinks', () => {
  it('ne garde que des profils https réels', () => {
    expect(
      parseSocialLinks({
        facebook: 'https://facebook.com/', // page d'accueil du réseau : ignorée
        instagram: 'https://instagram.com/absimmo',
        linkedin: 'javascript:alert(1)',
        tiktok: 'http://tiktok.com/@abs',
        unknown: 'https://example.com/x',
      }),
    ).toEqual([{ network: 'instagram', label: 'Instagram', url: 'https://instagram.com/absimmo' }])
  })

  it('tolère une valeur absente ou malformée', () => {
    expect(parseSocialLinks(null)).toEqual([])
    expect(parseSocialLinks(['x'])).toEqual([])
  })
})

describe('parseOpeningHours', () => {
  it('ignore les entrées incomplètes', () => {
    expect(parseOpeningHours([{ days: 'Lundi', open: '09:00', close: '18:00' }, { days: 'Samedi' }, 'x'])).toEqual([
      { days: 'Lundi', open: '09:00', close: '18:00' },
    ])
  })
})

describe('looksLikeSecretKey', () => {
  it('détecte les clés secrètes', () => {
    const jwt = (role: string) => `x.${btoa(JSON.stringify({ role }))}.y`
    expect(looksLikeSecretKey('sb_secret_abc')).toBe(true)
    expect(looksLikeSecretKey(jwt('service_role'))).toBe(true)
    expect(looksLikeSecretKey(jwt('anon'))).toBe(false)
    expect(looksLikeSecretKey('sb_publishable_abc')).toBe(false)
  })
})

describe('coordonnées officielles', () => {
  it('utilise le numéro officiel en repli, sans écraser une valeur du back-office', async () => {
    const { toAgencyInfo } = await import('./agencyService')
    const fallback = toAgencyInfo(null)
    expect(fallback.phone).toBe('+221774308344')
    expect(fallback.whatsapp).toBe('+221774308344')
    expect(fallback.email).toBeNull()
    const fromBackoffice = toAgencyInfo({ phone: '+221338001122', whatsapp_phone: null } as never)
    expect(fromBackoffice.phone).toBe('+221338001122')
    expect(fromBackoffice.whatsapp).toBe('+221774308344')
  })

  it('reste joignable si agency_settings est indisponible', async () => {
    const { mockSupabase } = await import('@/test/supabaseMock')
    const { getAgencyInfo } = await import('./agencyService')
    mockSupabase({ from: () => ({ data: null, error: { code: 'XX000', message: 'boom' } }) })
    await expect(getAgencyInfo()).resolves.toMatchObject({ phone: '+221774308344' })
  })
})
