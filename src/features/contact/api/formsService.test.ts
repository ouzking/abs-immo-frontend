import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { mockSupabase } from '@/test/supabaseMock'
import { currentUtm, mapFunctionError, submitInquiry } from './formsService'

const payload = { full_name: 'Awa Diop', phone: '+221771234567', message: 'Bonjour' }

describe('mapFunctionError', () => {
  it.each([
    [422, 'VALIDATION_ERROR', 'validation'],
    [429, 'RATE_LIMITED', 'rate_limited'],
    [404, 'PROPERTY_UNAVAILABLE', 'unavailable'],
    [400, 'CAPTCHA_FAILED', 'captcha'],
    [403, 'ORIGIN_NOT_ALLOWED', 'forbidden'],
    [500, 'INTERNAL_ERROR', 'unknown'],
  ])('HTTP %i %s -> %s', (status, code, kind) => {
    expect(mapFunctionError(status, { error: { code, message: 'x' } }).kind).toBe(kind)
  })

  it('transmet les erreurs par champ', () => {
    const e = mapFunctionError(422, { error: { code: 'VALIDATION_ERROR', message: 'x', fields: { email: 'Adresse e-mail invalide.' } } })
    expect(e.fields).toEqual({ email: 'Adresse e-mail invalide.' })
  })
})

describe('submitInquiry', () => {
  it('renvoie l’identifiant en cas de succès (y compris doublon)', async () => {
    mockSupabase({ invoke: () => ({ data: { data: { id: 'abc', duplicate: true } }, error: null }) })
    await expect(submitInquiry(payload)).resolves.toEqual({ id: 'abc', duplicate: true })
  })

  it('n’annonce jamais un succès sur une réponse inattendue', async () => {
    mockSupabase({ invoke: () => ({ data: { ok: true }, error: null }) })
    await expect(submitInquiry(payload)).rejects.toMatchObject({ kind: 'unknown' })
  })

  it('lit le corps d’erreur HTTP du backend', async () => {
    const response = new Response(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Trop de demandes' } }), { status: 429 })
    mockSupabase({ invoke: () => ({ data: null, error: new FunctionsHttpError(response) }) })
    await expect(submitInquiry(payload)).rejects.toMatchObject({ kind: 'rate_limited' })
  })

  it('signale une erreur réseau', async () => {
    mockSupabase({ invoke: () => ({ data: null, error: new FunctionsFetchError(new TypeError('Failed to fetch')) }) })
    await expect(submitInquiry(payload)).rejects.toMatchObject({ kind: 'network' })
  })
})

describe('currentUtm', () => {
  it('ne garde que les paramètres UTM', () => {
    expect(currentUtm('?utm_source=facebook&utm_campaign=villas&x=1')).toEqual({ utm_source: 'facebook', utm_campaign: 'villas' })
    expect(currentUtm('?x=1')).toBeUndefined()
  })
})
