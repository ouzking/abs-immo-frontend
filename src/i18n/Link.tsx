import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  type LinkProps,
  type NavLinkProps,
  type To,
} from 'react-router'
import { useI18n } from './context'

function localize(to: To, path: (p: string) => string): To {
  if (typeof to === 'string') return path(to)
  return to.pathname ? { ...to, pathname: path(to.pathname) } : to
}

/** Lien interne qui conserve la langue courante (/en/…, /wo/…). */
export function Link({ to, ...rest }: LinkProps) {
  const { path } = useI18n()
  return <RouterLink to={localize(to, path)} {...rest} />
}

export function NavLink({ to, end, ...rest }: NavLinkProps) {
  const { path, locale } = useI18n()
  // L'accueil d'une langue (/en) ne doit être « actif » que sur lui-même.
  return <RouterNavLink to={localize(to, path)} end={end ?? (to === '/' && locale !== 'fr')} {...rest} />
}
