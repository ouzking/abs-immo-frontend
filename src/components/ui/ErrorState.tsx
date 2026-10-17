import { RefreshCw, WifiOff } from 'lucide-react'
import { env } from '@/config/env'
import type { AppError } from '@/lib/errors'
import { Button } from './Button'
import { StateMessage } from './primitives'

/** Erreur de chargement de données : message lisible + bouton « Réessayer ». */
export function ErrorState({
  error,
  onRetry,
  title = 'Impossible de charger les informations',
  className,
}: {
  error: AppError | undefined
  onRetry?: () => void
  title?: string
  className?: string
}) {
  return (
    <StateMessage
      className={className}
      icon={<WifiOff aria-hidden="true" className="size-6" />}
      title={title}
      description={
        <>
          <p>{error?.userMessage ?? 'Une erreur inattendue est survenue.'}</p>
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
            Réessayer
          </Button>
        )
      }
    />
  )
}
