/**
 * Erreurs applicatives normalisées. Toute erreur réseau, PostgREST, Storage ou
 * Edge Function est convertie en AppError avant d'atteindre l'interface, qui
 * n'affiche que `userMessage` (jamais de détail technique brut).
 */
export type AppErrorKind =
  | 'config'
  | 'network'
  | 'not_found'
  | 'validation'
  | 'rate_limited'
  | 'unavailable'
  | 'forbidden'
  | 'captcha'
  | 'unknown'

const DEFAULT_MESSAGES: Record<AppErrorKind, string> = {
  config: 'Le site est momentanément indisponible. Merci de réessayer plus tard.',
  network: 'Connexion impossible. Vérifiez votre accès à Internet puis réessayez.',
  not_found: 'L’élément demandé est introuvable.',
  validation: 'Certaines informations sont invalides. Merci de vérifier le formulaire.',
  rate_limited:
    'Plusieurs demandes ont déjà été envoyées en peu de temps. Merci de patienter quelques minutes ou de nous appeler directement.',
  unavailable: 'Ce bien n’est plus proposé à la visite.',
  forbidden: 'Cette action n’est pas autorisée depuis ce site.',
  captcha: 'La vérification anti-robot a échoué. Merci de réessayer.',
  unknown: 'Une erreur inattendue est survenue. Merci de réessayer.',
}

export class AppError extends Error {
  readonly kind: AppErrorKind
  readonly userMessage: string
  readonly fields?: Record<string, string>
  readonly code?: string

  constructor(
    kind: AppErrorKind,
    detail?: string,
    options: { userMessage?: string; fields?: Record<string, string>; code?: string; cause?: unknown } = {},
  ) {
    super(detail ?? DEFAULT_MESSAGES[kind], { cause: options.cause })
    this.name = 'AppError'
    this.kind = kind
    this.userMessage = options.userMessage ?? DEFAULT_MESSAGES[kind]
    this.fields = options.fields
    this.code = options.code
  }
}

interface PostgrestLikeError {
  code?: string
  message?: string
  hint?: string
}

function isPostgrestLike(e: unknown): e is PostgrestLikeError {
  return typeof e === 'object' && e !== null && ('code' in e || 'message' in e)
}

const NETWORK_RE = /Failed to fetch|NetworkError|Load failed|fetch failed|network/i

/** Convertit une erreur supabase-js (PostgREST / Storage / fetch) en AppError. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (error instanceof TypeError && NETWORK_RE.test(error.message)) {
    return new AppError('network', error.message, { cause: error })
  }
  if (isPostgrestLike(error)) {
    const code = error.code ?? ''
    const message = error.message ?? ''
    if (code === 'PGRST116' || code === 'P0002') return new AppError('not_found', message, { code, cause: error })
    if (code === '42501') return new AppError('forbidden', message, { code, cause: error })
    if (code === '22023') return new AppError('validation', message, { code, cause: error })
    if (NETWORK_RE.test(message)) return new AppError('network', message, { code, cause: error })
    return new AppError('unknown', message, { code, cause: error })
  }
  return new AppError('unknown', String(error), { cause: error })
}
