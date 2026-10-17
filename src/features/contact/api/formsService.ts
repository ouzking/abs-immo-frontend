import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { AppError } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase/client'
import type { ApiErrorBody, SubmitInquiryRequest, SubmitResponse, SubmitViewingRequest, UtmParams } from '@/types'

/**
 * Envoi des formulaires publics. Les tables de prospects ne sont pas accessibles
 * à `anon` : on passe exclusivement par les Edge Functions du backend, qui
 * appliquent validation, anti-abus (piège, délai, limitation de débit, CAPTCHA)
 * et dédoublonnage. Contrat : INTEGRATION_CONTRACT.md § 2.5.
 *
 * Règle : on ne renvoie un succès QUE si le backend a répondu 200/201 avec un
 * identifiant de demande. Toute autre issue lève une AppError.
 */
export interface SubmitResult {
  id: string
  duplicate: boolean
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorBody).error?.code === 'string'
  )
}

async function readErrorBody(error: FunctionsHttpError): Promise<{ status: number; body: unknown }> {
  const response = error.context as Response | undefined
  const status = response?.status ?? 0
  try {
    return { status, body: await response?.json() }
  } catch {
    return { status, body: null }
  }
}

/** Traduit une réponse d'erreur d'Edge Function en AppError (fonction pure, testée). */
export function mapFunctionError(status: number, body: unknown): AppError {
  const apiError = isApiErrorBody(body) ? body.error : null
  const code = apiError?.code
  const opts = { code, fields: apiError?.fields }
  switch (code) {
    case 'VALIDATION_ERROR':
      return new AppError('validation', apiError?.message, opts)
    case 'RATE_LIMITED':
      return new AppError('rate_limited', apiError?.message, opts)
    case 'PROPERTY_UNAVAILABLE':
      return new AppError('unavailable', apiError?.message, opts)
    case 'CAPTCHA_FAILED':
      return new AppError('captcha', apiError?.message, opts)
    case 'ORIGIN_NOT_ALLOWED':
      return new AppError('forbidden', apiError?.message, opts)
    default:
      if (status === 429) return new AppError('rate_limited', apiError?.message, opts)
      if (status === 422) return new AppError('validation', apiError?.message, opts)
      return new AppError('unknown', apiError?.message ?? `HTTP ${status}`, opts)
  }
}

function isSubmitResponse(value: unknown): value is SubmitResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    typeof (value as SubmitResponse).data?.id === 'string'
  )
}

async function invoke(fn: 'submit-inquiry' | 'submit-viewing-request', body: object): Promise<SubmitResult> {
  let result: Awaited<ReturnType<ReturnType<typeof getSupabase>['functions']['invoke']>>
  try {
    result = await getSupabase().functions.invoke(fn, { body })
  } catch (e) {
    if (e instanceof AppError) throw e
    throw new AppError('network', String(e), { cause: e })
  }
  const { data, error } = result
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const { status, body: errorBody } = await readErrorBody(error)
      throw mapFunctionError(status, errorBody)
    }
    if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) {
      throw new AppError('network', error.message, { cause: error })
    }
    throw new AppError('unknown', String(error), { cause: error })
  }
  if (!isSubmitResponse(data)) {
    throw new AppError('unknown', 'Réponse inattendue du service de formulaires.')
  }
  return { id: data.data.id, duplicate: data.data.duplicate === true }
}

/** Paramètres UTM de la page courante (attribution marketing transmise au backend). */
export function currentUtm(search = typeof window !== 'undefined' ? window.location.search : ''): UtmParams | undefined {
  const params = new URLSearchParams(search)
  const utm: UtmParams = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const) {
    const v = params.get(key)
    if (v) utm[key] = v.slice(0, 100)
  }
  return Object.keys(utm).length ? utm : undefined
}

export function submitInquiry(payload: SubmitInquiryRequest): Promise<SubmitResult> {
  return invoke('submit-inquiry', payload)
}

export function submitViewingRequest(payload: SubmitViewingRequest): Promise<SubmitResult> {
  return invoke('submit-viewing-request', payload)
}
