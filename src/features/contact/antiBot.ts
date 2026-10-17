import { useState } from 'react'
import { env } from '@/config/env'

/**
 * Protections anti-abus côté navigateur, complémentaires de celles du backend
 * (limitation de débit par IP et par contact, CAPTCHA vérifié côté serveur) :
 * - champ piège `website` invisible, qui doit rester vide ;
 * - `form_started_at` : horodatage d'affichage, le backend ignore les envois trop rapides ;
 * - Cloudflare Turnstile si une clé de site est configurée.
 */
export function useFormStartedAt(): [number, () => void] {
  const [startedAt, setStartedAt] = useState(() => Date.now())
  return [startedAt, () => setStartedAt(Date.now())]
}

export const isCaptchaEnabled = (): boolean => !!env.turnstileSiteKey

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<void> | null = null

export function loadTurnstile(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      scriptPromise = null
      reject(new Error('Turnstile indisponible'))
    }
    document.head.appendChild(s)
  })
  return scriptPromise
}
