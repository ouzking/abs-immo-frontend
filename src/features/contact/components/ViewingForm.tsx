import { useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/ui/fields'
import { Spinner } from '@/components/ui/primitives'
import { TIME_SLOT_LABELS } from '@/features/properties/labels'
import { AppError, toAppError } from '@/lib/errors'
import type { TimeSlot } from '@/types'
import { isCaptchaEnabled, useFormStartedAt } from '../antiBot'
import { currentUtm, submitViewingRequest } from '../api/formsService'
import {
  addDaysIso,
  backendFieldName,
  LIMITS,
  normalizePhone,
  todayIso,
  viewingSchema,
  type ViewingFormInput,
  type ViewingFormValues,
} from '../schemas'
import { HoneypotField, TurnstileWidget } from './AntiBot'
import { PrivacyNotice, SubmitError, SubmitSuccess } from './FormParts'

/**
 * Demande de visite : enregistre une DEMANDE (statut « requested » côté backend).
 * La visite n'est confirmée qu'après prise de contact par un conseiller : le
 * message de succès le dit explicitement.
 */
export function ViewingForm({ property }: { property: { id: string; title: string; reference: string | null } }) {
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
    resolver: zodResolver(viewingSchema),
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
      setSubmitError(new AppError('captcha', undefined, { userMessage: 'Merci de valider la vérification anti-robot.' }))
      return
    }
    try {
      await submitViewingRequest({
        full_name: values.full_name,
        phone: normalizePhone(values.phone) ?? values.phone,
        email: values.email || null,
        property_id: property.id,
        preferred_date: values.preferred_date || null,
        preferred_time_slot: values.preferred_time_slot as TimeSlot,
        message: values.message || null,
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
          setError(backendFieldName(field) as Path<ViewingFormInput>, { type: 'server', message })
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
        title="Votre demande de visite est enregistrée."
        onReset={() => {
          reset()
          restartTimer()
          setSent(false)
          setCaptchaKey((k) => k + 1)
        }}
        resetLabel="Faire une autre demande"
      >
        La visite n’est pas encore confirmée : un conseiller vous contactera pour convenir ensemble d’un rendez-vous
        pour le bien {property.reference ?? property.title}.
      </SubmitSuccess>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <TextField label="Nom complet" autoComplete="name" required error={errors.full_name?.message} {...register('full_name')} />
      <TextField
        label="Téléphone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        placeholder="77 123 45 67"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <TextField
        label="E-mail (facultatif)"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Date souhaitée"
          type="date"
          min={today}
          max={addDaysIso(today, LIMITS.maxDaysAhead)}
          hint="Facultatif"
          error={errors.preferred_date?.message}
          {...register('preferred_date')}
        />
        <SelectField label="Créneau" error={errors.preferred_time_slot?.message} {...register('preferred_time_slot')}>
          {(Object.keys(TIME_SLOT_LABELS) as TimeSlot[]).map((slot) => (
            <option key={slot} value={slot}>
              {TIME_SLOT_LABELS[slot]}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField
        label="Précisions (facultatif)"
        rows={3}
        maxLength={LIMITS.viewingMessageMax}
        error={errors.message?.message}
        {...register('message')}
      />
      <CheckboxField
        label="J’accepte de recevoir des propositions de biens correspondant à ma recherche."
        {...register('consent_marketing')}
      />
      <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaKey} />
      <SubmitError error={submitError} />
      <Button
        type="submit"
        size="lg"
        variant="navy"
        className="w-full"
        disabled={isSubmitting}
        icon={isSubmitting ? <Spinner className="size-5" label="Envoi en cours…" /> : <CalendarCheck aria-hidden="true" className="size-5" />}
      >
        {isSubmitting ? null : 'Demander une visite'}
      </Button>
      <PrivacyNotice />
    </form>
  )
}
