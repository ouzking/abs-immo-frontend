import { useMemo, useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/ui/fields'
import { Spinner } from '@/components/ui/primitives'
import { useI18n } from '@/i18n/context'
import { AppError, toAppError } from '@/lib/errors'
import type { TimeSlot } from '@/types'
import { isCaptchaEnabled, useFormStartedAt } from '../antiBot'
import { currentUtm, submitViewingRequest } from '../api/formsService'
import {
  addDaysIso,
  backendFieldName,
  createViewingSchema,
  LIMITS,
  normalizePhone,
  todayIso,
  type ViewingFormInput,
  type ViewingFormValues,
} from '../schemas'
import { HoneypotField, TurnstileWidget } from './AntiBot'
import { PrivacyNotice, SubmitError, SubmitSuccess } from './FormParts'

const TIME_SLOTS: TimeSlot[] = ['any', 'morning', 'afternoon', 'evening']

/**
 * Demande de visite : enregistre une DEMANDE (statut « requested » côté backend).
 * La visite n'est confirmée qu'après prise de contact par un conseiller : le
 * message de succès le dit explicitement.
 */
export function ViewingForm({ property }: { property: { id: string; title: string; reference: string | null } }) {
  const { t, locale } = useI18n()
  const f = t.forms
  const schema = useMemo(() => createViewingSchema(f.validation), [f.validation])
  const [startedAt, restartTimer] = useFormStartedAt()
  const [honeypot, setHoneypot] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const [submitError, setSubmitError] = useState<AppError | null>(null)
  const [sent, setSent] = useState(false)
  const today = todayIso()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ViewingFormInput, unknown, ViewingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      preferred_date: '',
      preferred_time_slot: 'any',
      message: '',
      preferred_contact: '',
      consent_marketing: false,
    },
  })

  const onSubmit = async (values: ViewingFormValues) => {
    setSubmitError(null)
    if (isCaptchaEnabled() && !captchaToken) {
      setSubmitError(new AppError('captcha', undefined, { userMessage: f.captchaRequired }))
      return
    }
    const note = values.message.trim()
    try {
      await submitViewingRequest({
        full_name: values.full_name,
        phone: normalizePhone(values.phone) ?? values.phone,
        email: values.email || null,
        property_id: property.id,
        preferred_date: values.preferred_date || null,
        preferred_time_slot: values.preferred_time_slot as TimeSlot,
        message: note ? (locale === 'fr' ? note : `[Langue du visiteur : ${locale.toUpperCase()}] ${note}`) : null,
        preferred_contact: values.preferred_contact || null,
        consent_marketing: values.consent_marketing,
        page_url: window.location.href,
        utm: currentUtm(),
        website: honeypot,
        form_started_at: startedAt,
        captcha_token: captchaToken ?? undefined,
      })
      setSent(true)
    } catch (e) {
      const error = toAppError(e)
      if (error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          setError(backendFieldName(field) as Path<ViewingFormInput>, { type: 'server', message: f.validation.server || message })
        }
      }
      setSubmitError(error)
      setCaptchaKey((k) => k + 1)
      setCaptchaToken(null)
    }
  }

  if (sent) {
    return (
      <SubmitSuccess
        title={f.viewingSuccessTitle}
        resetLabel={f.anotherViewing}
        onReset={() => {
          reset()
          restartTimer()
          setSent(false)
          setCaptchaKey((k) => k + 1)
        }}
      >
        {f.viewingSuccessText(property.reference ?? property.title)}
      </SubmitSuccess>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <TextField label={f.fullName} autoComplete="name" required error={errors.full_name?.message} {...register('full_name')} />
      <TextField
        label={f.phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        placeholder={f.phonePlaceholder}
        error={errors.phone?.message}
        {...register('phone')}
      />
      <TextField label={f.emailOptional} type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label={f.preferredDate}
          type="date"
          min={today}
          max={addDaysIso(today, LIMITS.maxDaysAhead)}
          hint={f.optional}
          error={errors.preferred_date?.message}
          {...register('preferred_date')}
        />
        <SelectField label={f.timeSlot} error={errors.preferred_time_slot?.message} {...register('preferred_time_slot')}>
          {TIME_SLOTS.map((slot) => (
            <option key={slot} value={slot}>
              {t.labels.timeSlots[slot]}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField
        label={f.details}
        rows={3}
        maxLength={LIMITS.viewingMessageMax}
        error={errors.message?.message}
        {...register('message')}
      />
      <CheckboxField label={f.consent} {...register('consent_marketing')} />
      <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaKey} />
      <SubmitError error={submitError} />
      <Button
        type="submit"
        size="lg"
        variant="navy"
        className="w-full"
        disabled={isSubmitting}
        icon={isSubmitting ? <Spinner className="size-5" label={f.sending} /> : <CalendarCheck aria-hidden="true" className="size-5" />}
      >
        {isSubmitting ? null : f.submitViewing}
      </Button>
      <PrivacyNotice />
    </form>
  )
}
