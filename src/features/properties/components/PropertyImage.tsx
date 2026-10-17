import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Photo d'annonce (URL signée du bucket privé). Si la photo est absente,
 * expirée ou en erreur, on affiche un visuel neutre explicite — jamais une
 * photo d'illustration qui pourrait passer pour le bien.
 */
export function PropertyImage({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
  sizes,
}: {
  src: string | null | undefined
  alt: string
  className?: string
  imgClassName?: string
  priority?: boolean
  sizes?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const usable = src && src !== failedSrc

  return (
    <div className={cn('relative overflow-hidden bg-navy-50', className)}>
      {usable ? (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...(priority ? { fetchPriority: 'high' as const } : {})}
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
          className={cn(
            'size-full object-cover transition-opacity duration-500',
            loadedSrc === src ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      ) : (
        <ImageFallback />
      )}
      {usable && loadedSrc !== src && <div aria-hidden="true" className="skeleton absolute inset-0" />}
    </div>
  )
}

function ImageFallback() {
  return (
    <div className="@container flex size-full flex-col items-center justify-center gap-2 bg-linear-to-br from-navy-50 to-mist-100 text-navy-300">
      <svg viewBox="0 0 120 64" aria-hidden="true" className="w-28 max-w-[55%] text-navy-200" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 60h112M14 60V30l22-14 22 14v30M58 60V22l26-14 26 14v38" />
        <path d="M26 60V44h20v16M70 30h8M90 30h8M70 42h8M90 42h8" />
      </svg>
      {/* Libellé masqué dans les petites vignettes (requête de conteneur). */}
      <span className="hidden items-center gap-1.5 text-xs font-semibold tracking-wide text-navy-400 @[12rem]:flex">
        <ImageOff aria-hidden="true" className="size-3.5" />
        Photo bientôt disponible
      </span>
    </div>
  )
}
