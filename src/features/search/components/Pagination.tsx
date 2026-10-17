import { Link } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { pageWindow } from '../pagination'

/**
 * Pagination par liens réels (?page=n) : partageable, explorable par les robots,
 * utilisable au clavier. `hrefFor` construit l'URL d'une page.
 */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  onNavigate,
}: {
  page: number
  pageCount: number
  hrefFor: (page: number) => string
  onNavigate?: () => void
}) {
  if (pageCount <= 1) return null
  const base =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors'
  const linkProps = { preventScrollReset: true, onClick: onNavigate }

  return (
    <nav aria-label="Pagination des résultats" className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link to={hrefFor(page - 1)} rel="prev" className={cn(base, 'text-navy-800 hover:bg-navy-50')} {...linkProps}>
          <ChevronLeft aria-hidden="true" className="size-5" />
          <span className="sr-only sm:not-sr-only sm:ml-1">Précédent</span>
        </Link>
      ) : (
        <span className={cn(base, 'text-mist-300')} aria-hidden="true">
          <ChevronLeft className="size-5" />
        </span>
      )}

      <ol className="flex items-center gap-1">
        {pageWindow(page, pageCount).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-mist-400">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                to={hrefFor(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={cn(base, p === page ? 'bg-navy-700 text-white' : 'text-navy-800 hover:bg-navy-50')}
                {...linkProps}
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ol>

      {page < pageCount ? (
        <Link to={hrefFor(page + 1)} rel="next" className={cn(base, 'text-navy-800 hover:bg-navy-50')} {...linkProps}>
          <span className="sr-only sm:not-sr-only sm:mr-1">Suivant</span>
          <ChevronRight aria-hidden="true" className="size-5" />
        </Link>
      ) : (
        <span className={cn(base, 'text-mist-300')} aria-hidden="true">
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  )
}
