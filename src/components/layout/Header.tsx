import { useRef } from 'react'
import { useLocation } from 'react-router'
import { Menu, Phone, X } from 'lucide-react'
import { MAIN_NAV } from '@/config/site'
import { useAgency } from '@/features/agency/agencyService'
import { useScrolled } from '@/hooks/useScrolled'
import { splitLocale } from '@/i18n/config'
import { useI18n } from '@/i18n/context'
import { NavLink } from '@/i18n/Link'
import { cn } from '@/lib/cn'
import { formatPhone, telHref } from '@/lib/format'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/primitives'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo, LogoImage } from './Logo'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'relative px-1 py-2 text-[0.9375rem] font-semibold transition-colors duration-150',
    'after:absolute after:inset-x-1 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-brand-red-600 after:transition-transform after:duration-300',
    isActive ? 'text-navy-900 after:scale-x-100' : 'text-mist-600 hover:text-navy-800 after:scale-x-0 hover:after:scale-x-100',
  )
}

export function Header() {
  const scrolled = useScrolled()
  const { data: agency } = useAgency()
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { path: currentPath } = splitLocale(useLocation().pathname)

  const openMenu = () => dialogRef.current?.showModal()
  const closeMenu = () => dialogRef.current?.close()

  return (
    <header
      className={cn(
        // Fond plein (pas de backdrop-filter) : le flou rendait translucides les menus qui débordent de l'en-tête.
        'sticky top-0 z-40 border-b bg-white transition-[box-shadow,border-color] duration-300',
        scrolled ? 'border-mist-200 shadow-[0_8px_30px_-18px_rgb(11_29_46/0.35)]' : 'border-transparent',
      )}
    >
      {t.common.languageNotice && (
        <p className="bg-navy-50 px-4 py-1.5 text-center text-xs font-semibold text-navy-800">{t.common.languageNotice}</p>
      )}
      <Container className={cn('flex items-center justify-between gap-6 transition-[height] duration-300', scrolled ? 'h-16' : 'h-20')}>
        <Logo />

        <nav aria-label={t.nav.main} className="hidden lg:block">
          <ul className="flex items-center gap-6 xl:gap-7">
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={navLinkClass}>
                  {t.nav[item.key]}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {agency?.phone && (
            <a
              href={telHref(agency.phone)}
              className="hidden items-center gap-2 text-sm font-semibold text-navy-800 hover:text-brand-red-600 2xl:inline-flex"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-navy-50">
                <Phone aria-hidden="true" className="size-4" />
              </span>
              {formatPhone(agency.phone)}
            </a>
          )}
          <LanguageSwitcher className="max-lg:hidden" />
          <ButtonLink to="/contact" size="md" className="max-sm:hidden">
            {t.nav.contactCta}
          </ButtonLink>
          <button
            type="button"
            onClick={openMenu}
            aria-haspopup="dialog"
            aria-controls="menu-mobile"
            className="inline-flex size-11 items-center justify-center rounded-full text-navy-900 hover:bg-navy-50 lg:hidden"
          >
            <Menu aria-hidden="true" className="size-6" />
            <span className="sr-only">{t.nav.openMenu}</span>
          </button>
        </div>
      </Container>

      {/* Menu mobile : <dialog> natif => piège de focus, Échap et retour du focus gérés par le navigateur. */}
      <dialog
        ref={dialogRef}
        id="menu-mobile"
        aria-label={t.nav.menu}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-sm bg-white p-0 backdrop:bg-navy-950/50 backdrop:backdrop-blur-sm open:animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMenu()
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-mist-200 px-5">
            <LogoImage className="h-10" />
            <button
              type="button"
              onClick={closeMenu}
              className="inline-flex size-11 items-center justify-center rounded-full text-navy-900 hover:bg-navy-50"
            >
              <X aria-hidden="true" className="size-6" />
              <span className="sr-only">{t.nav.closeMenu}</span>
            </button>
          </div>
          <nav aria-label={t.nav.mobile} className="flex-1 overflow-y-auto px-5 py-6">
            <ul className="space-y-1">
              {MAIN_NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-semibold',
                        isActive ? 'bg-navy-50 text-navy-900' : 'text-mist-700 hover:bg-mist-50',
                      )
                    }
                  >
                    {t.nav[item.key]}
                    {(item.end ? currentPath === item.to : currentPath.startsWith(item.to)) && (
                      <span aria-hidden="true" className="size-2 rounded-full bg-brand-red-600" />
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-3 border-t border-mist-200 p-5">
            <LanguageSwitcher onSelect={closeMenu} placement="up" className="flex justify-center" />
            <ButtonLink to="/contact" onClick={closeMenu} className="w-full" size="lg">
              {t.nav.contactCta}
            </ButtonLink>
            {agency?.phone && (
              <a
                href={telHref(agency.phone)}
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-navy-200 font-semibold text-navy-800"
              >
                <Phone aria-hidden="true" className="size-4" />
                {formatPhone(agency.phone)}
              </a>
            )}
          </div>
        </div>
      </dialog>
    </header>
  )
}
