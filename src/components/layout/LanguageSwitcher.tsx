import { Link as RouterLink, useLocation } from 'react-router'
import { LOCALE_META, LOCALES, localizePath, splitLocale } from '@/i18n/config'
import { useI18n } from '@/i18n/context'
import { cn } from '@/lib/cn'

/** Sélecteur de langue : reste sur la même page (et les mêmes filtres) dans l'autre langue. */
export function LanguageSwitcher({ className, onSelect }: { className?: string; onSelect?: () => void }) {
  const { locale, t } = useI18n()
  const { pathname, search } = useLocation()
  const { path } = splitLocale(pathname)

  return (
    <nav aria-label={t.common.language} className={className}>
      <ul className="flex items-center gap-0.5 rounded-full bg-mist-100 p-0.5">
        {LOCALES.map((l) => (
          <li key={l}>
            <RouterLink
              to={`${localizePath(path, l)}${search}`}
              lang={LOCALE_META[l].htmlLang}
              hrefLang={LOCALE_META[l].htmlLang}
              aria-current={l === locale ? 'true' : undefined}
              title={LOCALE_META[l].label}
              onClick={onSelect}
              className={cn(
                'block rounded-full px-2.5 py-1 text-xs font-bold transition-colors',
                l === locale ? 'bg-white text-navy-900 shadow-sm' : 'text-mist-600 hover:text-navy-800',
              )}
            >
              <span aria-hidden="true">{LOCALE_META[l].short}</span>
              <span className="sr-only">{LOCALE_META[l].label}</span>
            </RouterLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
