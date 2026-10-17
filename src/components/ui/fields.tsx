import { useId, type ComponentProps, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Champs de formulaire accessibles : label associé, aide et erreur reliées par
 * aria-describedby, aria-invalid, focus visible. Compatibles React Hook Form
 * (les props de `register()` sont transmises telles quelles).
 */
const CONTROL =
  'block w-full rounded-xl border bg-white px-4 text-[0.9375rem] text-ink placeholder:text-mist-400 ' +
  'transition-[border-color,box-shadow] duration-150 outline-none ' +
  'focus:border-navy-600 focus:ring-4 focus:ring-navy-100 disabled:bg-mist-50 disabled:text-mist-500'

function controlClass(invalid: boolean, extra?: string) {
  return cn(
    CONTROL,
    invalid ? 'border-brand-red-600 focus:border-brand-red-600 focus:ring-brand-red-100' : 'border-mist-300 hover:border-mist-400',
    extra,
  )
}

interface FieldShellProps {
  label: ReactNode
  error?: string
  hint?: ReactNode
  required?: boolean
  className?: string
  hideLabel?: boolean
}

function useFieldIds(error?: string, hint?: ReactNode) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return { id, hintId, errorId, describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined }
}

function Label({ htmlFor, children, required, hidden }: { htmlFor: string; children: ReactNode; required?: boolean; hidden?: boolean }) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1.5 block text-sm font-semibold text-navy-900', hidden && 'sr-only')}>
      {children}
      {required && (
        <span className="text-brand-red-600" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </label>
  )
}

function Messages({ hint, hintId, error, errorId }: { hint?: ReactNode; hintId?: string; error?: string; errorId?: string }) {
  return (
    <>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs leading-5 text-mist-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-brand-red-700">
          {error}
        </p>
      )}
    </>
  )
}

export function TextField({
  label,
  error,
  hint,
  required,
  className,
  hideLabel,
  ...input
}: FieldShellProps & Omit<ComponentProps<'input'>, 'className'>) {
  const { id, hintId, errorId, describedBy } = useFieldIds(error, hint)
  return (
    <div className={className}>
      <Label htmlFor={id} required={required} hidden={hideLabel}>
        {label}
      </Label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={controlClass(!!error, 'h-12')}
        {...input}
      />
      <Messages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  )
}

export function TextAreaField({
  label,
  error,
  hint,
  required,
  className,
  hideLabel,
  ...textarea
}: FieldShellProps & Omit<ComponentProps<'textarea'>, 'className'>) {
  const { id, hintId, errorId, describedBy } = useFieldIds(error, hint)
  return (
    <div className={className}>
      <Label htmlFor={id} required={required} hidden={hideLabel}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={controlClass(!!error, 'min-h-28 resize-y py-3 leading-6')}
        {...textarea}
      />
      <Messages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  )
}

export function SelectField({
  label,
  error,
  hint,
  required,
  className,
  hideLabel,
  children,
  size = 'md',
  ...select
}: FieldShellProps & Omit<ComponentProps<'select'>, 'className' | 'size'> & { size?: 'md' | 'lg' }) {
  const { id, hintId, errorId, describedBy } = useFieldIds(error, hint)
  return (
    <div className={className}>
      <Label htmlFor={id} required={required} hidden={hideLabel}>
        {label}
      </Label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClass(!!error, cn('appearance-none pr-10', size === 'lg' ? 'h-13' : 'h-12'))}
          {...select}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-mist-500"
        />
      </div>
      <Messages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  )
}

export function CheckboxField({
  label,
  className,
  ...input
}: { label: ReactNode; className?: string } & Omit<ComponentProps<'input'>, 'className' | 'type'>) {
  const id = useId()
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-mist-400 accent-navy-700"
        {...input}
      />
      <label htmlFor={id} className="cursor-pointer text-sm leading-6 text-mist-700">
        {label}
      </label>
    </div>
  )
}
