import { useI18n } from '@/i18n/context'
import { Link } from '@/i18n/Link'
import { cn } from '@/lib/cn'

/**
 * Logo officiel (fichier fourni par l'agence, fond rendu transparent sans
 * déformation). La ligne du numéro WhatsApp, illisible à petite taille, est
 * retirée dans cette déclinaison ; le logo complet reste dans
 * public/assets/brand/logo-abs-immo-services-full.png.
 * Proportions d'origine : 1065 × 605.
 */
export function LogoImage({ className, eager = false }: { className?: string; eager?: boolean }) {
  return (
    <picture>
      <source
        type="image/webp"
        srcSet="/assets/brand/logo-abs-immo-services-96.webp 169w, /assets/brand/logo-abs-immo-services-160.webp 282w"
        sizes="96px"
      />
      <img
        src="/assets/brand/logo-abs-immo-services-160.png"
        alt="ABS IMMO & SERVICES"
        width={282}
        height={160}
        className={cn('h-auto w-auto object-contain', className)}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...(eager ? { fetchPriority: 'high' as const } : {})}
      />
    </picture>
  )
}

export function Logo({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <Link to="/" className={cn('inline-flex shrink-0 items-center', className)} aria-label={t.nav.homeLink}>
      <LogoImage eager className="h-11 sm:h-12" />
    </Link>
  )
}
