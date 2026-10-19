import type { ComponentProps, ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { cn } from '@/lib/cn'

export function Container({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)} {...rest} />
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  id,
  className,
  action,
  tone = 'dark',
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  id?: string
  className?: string
  action?: ReactNode
  tone?: 'dark' | 'light'
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className={cn('eyebrow', tone === 'light' && 'text-white/80')}>{eyebrow}</p>}
        <h2
          id={id}
          className={cn(
            'font-display mt-3 text-3xl leading-[1.12] font-medium sm:text-4xl lg:text-[2.75rem]',
            tone === 'light' ? 'text-white' : 'text-navy-900',
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn('mt-4 text-base leading-7 sm:text-lg', tone === 'light' ? 'text-white/80' : 'text-mist-600')}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

type BadgeTone = 'navy' | 'red' | 'neutral' | 'white' | 'success' | 'warning' | 'muted'

const BADGE_TONES: Record<BadgeTone, string> = {
  navy: 'bg-navy-700 text-white',
  red: 'bg-brand-red-600 text-white',
  neutral: 'bg-mist-100 text-mist-700 ring-1 ring-inset ring-mist-200',
  white: 'bg-white/95 text-navy-800 shadow-sm backdrop-blur',
  success: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
  warning: 'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200',
  muted: 'bg-mist-700 text-white',
}

export function Badge({ tone = 'neutral', className, ...rest }: ComponentProps<'span'> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
        BADGE_TONES[tone],
        className,
      )}
      {...rest}
    />
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('skeleton rounded-lg', className)} />
}

export function Spinner({ className, label }: { className?: string; label?: string }) {
  const { t } = useI18n()
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <Loader2 aria-hidden="true" className={cn('size-5 animate-spin', className)} />
      <span className={label ? '' : 'sr-only'}>{label ?? t.common.loading}</span>
    </span>
  )
}

const ALERT_STYLES = {
  error: { box: 'border-brand-red-100 bg-brand-red-50 text-brand-red-800', Icon: AlertCircle },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', Icon: CheckCircle2 },
  info: { box: 'border-navy-100 bg-navy-50 text-navy-800', Icon: Info },
} as const

export function Alert({
  tone = 'info',
  title,
  children,
  className,
  role,
}: {
  tone?: keyof typeof ALERT_STYLES
  title?: ReactNode
  children?: ReactNode
  className?: string
  role?: 'alert' | 'status'
}) {
  const { box, Icon } = ALERT_STYLES[tone]
  return (
    <div
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={cn('flex gap-3 rounded-2xl border p-4 text-sm leading-6', box, className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-1' : undefined}>{children}</div>}
      </div>
    </div>
  )
}

export function StateMessage({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card border border-dashed border-mist-300 bg-mist-50 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-white text-navy-700 shadow-soft">
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl font-medium text-navy-900 sm:text-2xl">{title}</h3>
      {description && <div className="mt-2 max-w-md text-mist-600">{description}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}
