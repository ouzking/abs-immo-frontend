import { useEffect, useId, useRef, useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { LOCALE_META, LOCALES, localizePath, splitLocale } from '@/i18n/config'
import { useI18n } from '@/i18n/context'
import { cn } from '@/lib/cn'

/**
 * Sélecteur de langue : un seul bouton (langue courante) qui déroule la liste.
 * Motif « disclosure » accessible : aria-expanded, fermeture par Échap, clic
 * extérieur ou choix d'une langue ; le focus revient sur le bouton après Échap.
 * Le lien conserve la page et les filtres en cours.
 */
export function LanguageSwitcher({
  className,
  placement = 'down',
  onSelect,
}: {
  className?: string
  /** Ouverture vers le haut dans le menu mobile (bouton en bas de l'écran). */
  placement?: 'down' | 'up'
  onSelect?: () => void
}) {
  const { locale, t } = useI18n()
  const { pathname, search } = useLocation()
  const { path } = splitLocale(pathname)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Ferme seulement la liste (et non le menu mobile <dialog> qui la contient).
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-mist-200 bg-white px-3 text-sm font-bold text-navy-800 transition-colors hover:border-navy-300 hover:bg-navy-50"
      >
        <Globe aria-hidden="true" className="size-4 text-navy-500" />
        <span aria-hidden="true">{LOCALE_META[locale].short}</span>
        <span className="sr-only">
          {t.common.language} : {LOCALE_META[locale].label}
        </span>
        <ChevronDown aria-hidden="true" className={cn('size-4 text-mist-500 transition-transform', open && 'rotate-180')} />
      </button>

      <ul
        id={listId}
        hidden={!open}
        className={cn(
          'absolute right-0 z-50 min-w-44 overflow-hidden rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-mist-200',
          placement === 'up' ? 'bottom-full mb-2' : 'top-full mt-2',
        )}
      >
        {LOCALES.map((l) => {
          const current = l === locale
          return (
            <li key={l}>
              <RouterLink
                to={`${localizePath(path, l)}${search}`}
                lang={LOCALE_META[l].htmlLang}
                hrefLang={LOCALE_META[l].htmlLang}
                aria-current={current ? 'true' : undefined}
                onClick={() => {
                  setOpen(false)
                  onSelect?.()
                }}
                className={cn(
                  'flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  current ? 'bg-navy-50 text-navy-900' : 'text-mist-700 hover:bg-mist-50 hover:text-navy-900',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="w-6 text-xs font-bold text-mist-500">
                    {LOCALE_META[l].short}
                  </span>
                  {LOCALE_META[l].label}
                </span>
                {current && <Check aria-hidden="true" className="size-4 text-brand-red-600" />}
              </RouterLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
