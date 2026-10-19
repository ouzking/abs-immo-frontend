import type { ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/primitives'
import { useI18n } from '@/i18n/context'
import { Link } from '@/i18n/Link'
import type { AppError } from '@/lib/errors'

export function PrivacyNotice() {
  const { t } = useI18n()
  return (
    <p className="text-xs leading-5 text-mist-500">
      {t.forms.privacy}{' '}
      <Link to="/confidentialite" className="font-semibold text-navy-700 underline underline-offset-2">
        {t.forms.privacyLink}
      </Link>
      .
    </p>
  )
}

export function SubmitError({ error }: { error: AppError | null }) {
  const { t } = useI18n()
  if (!error) return null
  const text =
    error.kind === 'validation'
      ? t.forms.fixFields
      : error.kind === 'captcha' && error.userMessage === t.forms.captchaRequired
        ? t.forms.captchaRequired
        : t.errors[error.kind]
  return (
    <Alert tone="error" title={t.forms.notSent}>
      {text}
    </Alert>
  )
}

export function SubmitSuccess({
  title,
  children,
  onReset,
  resetLabel,
}: {
  title: string
  children: ReactNode
  onReset: () => void
  resetLabel: string
}) {
  return (
    <div role="status" className="animate-fade-in rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
      <CheckCircle2 aria-hidden="true" className="size-8 text-emerald-700" />
      <p className="mt-3 font-display text-xl font-medium">{title}</p>
      <div className="mt-2 text-sm leading-6 text-emerald-900">{children}</div>
      <Button variant="outline" size="sm" className="mt-5" onClick={onReset}>
        {resetLabel}
      </Button>
    </div>
  )
}
