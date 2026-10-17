import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { AppError } from '@/lib/errors'
import { Alert } from '@/components/ui/primitives'

export function PrivacyNotice() {
  return (
    <p className="text-xs leading-5 text-mist-500">
      Vos informations sont transmises à ABS IMMO & SERVICES uniquement pour traiter votre demande.{' '}
      <Link to="/confidentialite" className="font-semibold text-navy-700 underline underline-offset-2">
        En savoir plus sur vos données
      </Link>
      .
    </p>
  )
}

export function SubmitError({ error }: { error: AppError | null }) {
  if (!error) return null
  return (
    <Alert tone="error" title="Votre demande n’a pas été envoyée.">
      {error.kind === 'validation' ? 'Merci de corriger les champs signalés.' : error.userMessage}
    </Alert>
  )
}

export function SubmitSuccess({
  title,
  children,
  onReset,
  resetLabel = 'Envoyer une autre demande',
}: {
  title: string
  children: ReactNode
  onReset: () => void
  resetLabel?: string
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
