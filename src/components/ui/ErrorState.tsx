import { RefreshCw, WifiOff } from 'lucide-react'
import { env } from '@/config/env'
import { useI18n } from '@/i18n/context'
import type { AppError } from '@/lib/errors'
import { Button } from './Button'
import { StateMessage } from './primitives'

/** Erreur de chargement de données : message lisible (dans la langue du visiteur) + « Réessayer ». */
export function ErrorState({
  error,
  onRetry,
  title,
  className,
}: {
  error: AppError | undefined
  onRetry?: () => void
  title?: string
  className?: string
}) {
  const { t } = useI18n()
  return (
    <StateMessage
      className={className}
      icon={<WifiOff aria-hidden="true" className="size-6" />}
      title={title ?? t.errors.loadTitle}
      description={
        <>
          <p>{error ? t.errors[error.kind] : t.errors.unknown}</p>
          {env.isDev && error && (
            <p className="mt-3 font-mono text-xs break-all text-mist-500">
              [dev] {error.kind}
              {error.code ? ` ${error.code}` : ''} — {error.message}
            </p>
          )}
        </>
      }
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry} icon={<RefreshCw aria-hidden="true" className="size-4" />}>
            {t.common.retry}
          </Button>
        )
      }
    />
  )
}
