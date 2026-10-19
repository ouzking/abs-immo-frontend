import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/context'
import { Link } from '@/i18n/Link'
import { ChevronRight } from 'lucide-react'
import { Container } from '@/components/ui/primitives'

export interface Crumb {
  name: string
  path?: string
}

export function Breadcrumbs({ items, tone = 'dark' }: { items: Crumb[]; tone?: 'dark' | 'light' }) {
  const { t } = useI18n()
  return (
    <nav aria-label={t.nav.breadcrumb}>
      <ol className={`flex flex-wrap items-center gap-1 text-sm ${tone === 'light' ? 'text-white/70' : 'text-mist-500'}`}>
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-1">
            {i > 0 && <ChevronRight aria-hidden="true" className="size-3.5 opacity-60" />}
            {item.path && i < items.length - 1 ? (
              <Link to={item.path} className={tone === 'light' ? 'hover:text-white' : 'hover:text-navy-800'}>
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className={`line-clamp-1 font-semibold ${tone === 'light' ? 'text-white' : 'text-navy-900'}`}>
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Bandeau de titre des pages intérieures (fond marine, motif discret). */
export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs,
  children,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  crumbs: Crumb[]
  children?: ReactNode
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-900 text-white">
      <svg aria-hidden="true" className="absolute inset-0 -z-10 size-full opacity-[0.07]">
        <defs>
          <pattern id="page-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0H0v56" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#page-grid)" />
      </svg>
      <div aria-hidden="true" className="absolute -top-40 -right-32 -z-10 size-[28rem] rounded-full bg-navy-600/40 blur-3xl" />
      <div aria-hidden="true" className="absolute right-0 bottom-0 -z-10 h-1 w-1/3 bg-brand-red-600" />
      <Container className="py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={crumbs} tone="light" />
        {eyebrow && <p className="eyebrow mt-8 text-white/80">{eyebrow}</p>}
        <h1 className="font-display mt-3 max-w-3xl text-4xl leading-[1.08] font-medium sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">{description}</p>}
        {children}
      </Container>
    </section>
  )
}
