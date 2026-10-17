import type { ComponentProps, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'navy' | 'outline' | 'ghost' | 'light' | 'outline-light'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-red-600 text-white shadow-[0_8px_20px_-8px_rgb(191_21_34/0.55)] hover:bg-brand-red-700 active:bg-brand-red-800',
  navy: 'bg-navy-700 text-white hover:bg-navy-800 active:bg-navy-900',
  outline: 'border border-navy-200 bg-white text-navy-800 hover:border-navy-700 hover:bg-navy-50',
  ghost: 'text-navy-800 hover:bg-navy-50',
  light: 'bg-white text-navy-800 hover:bg-navy-50',
  'outline-light': 'border border-white/50 text-white hover:border-white hover:bg-white/10',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-[0.9375rem] gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
}

function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string): string {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out',
    'disabled:pointer-events-none disabled:opacity-60 active:translate-y-px',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

interface CommonProps {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconRight?: ReactNode
}

export function Button({
  variant,
  size,
  icon,
  iconRight,
  className,
  children,
  type = 'button',
  ...rest
}: CommonProps & ComponentProps<'button'>) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  )
}

export function ButtonLink({ variant, size, icon, iconRight, className, children, ...rest }: CommonProps & LinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </Link>
  )
}

/** Lien externe ou protocole (tel:, mailto:, WhatsApp) avec l'apparence d'un bouton. */
export function ButtonAnchor({ variant, size, icon, iconRight, className, children, ...rest }: CommonProps & ComponentProps<'a'>) {
  const external = rest.href?.startsWith('http')
  return (
    <a
      className={buttonClasses(variant, size, className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </a>
  )
}
