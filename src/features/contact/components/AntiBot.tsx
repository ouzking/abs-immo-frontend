import { useEffect, useRef } from 'react'
import { env } from '@/config/env'
import { useI18n } from '@/i18n/context'
import { loadTurnstile } from '../antiBot'

/** Champ piège : invisible et hors de l'ordre de tabulation, il doit rester vide. */
export function HoneypotField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n()
  return (
    <div className="hp-field" aria-hidden="true">
      <label>
        {t.forms.honeypot}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  )
}

/** Widget Cloudflare Turnstile ; un changement de `resetKey` crée un nouveau défi (après chaque envoi). */
export function TurnstileWidget({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { locale } = useI18n()
  const language = locale === 'en' ? 'en' : 'fr'
  const onTokenRef = useRef(onToken)
  useEffect(() => {
    onTokenRef.current = onToken
  })

  useEffect(() => {
    const siteKey = env.turnstileSiteKey
    if (!siteKey || !ref.current) return
    let widgetId: string | undefined
    let cancelled = false
    loadTurnstile()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return
        widgetId = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          language,
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        })
      })
      .catch(() => onTokenRef.current(null))
    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [resetKey, language])

  if (!env.turnstileSiteKey) return null
  return <div ref={ref} className="min-h-16.25" />
}
