import { useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/ui/fields'
import { Alert, Spinner } from '@/components/ui/primitives'
import { AppError, toAppError } from '@/lib/errors'
import { isCaptchaEnabled, useFormStartedAt } from '../antiBot'
import { currentUtm, submitInquiry } from '../api/formsService'
import {
  backendFieldName,
  buildInquiryMessage,
  INQUIRY_SUBJECTS,
  inquirySchema,
  LIMITS,
  normalizePhone,
  SUBJECT_TO_TYPE,
  type InquiryFormInput,
  type InquiryFormValues,
  type InquirySubject,
} from '../schemas'
import { HoneypotField, TurnstileWidget } from './AntiBot'
import { PrivacyNotice, SubmitError, SubmitSuccess } from './FormParts'

export interface InquiryFormProps {
  property?: { id: string; title: string; reference: string | null }
  defaultSubject?: InquirySubject
  defaultMessage?: string
  /** Variante compacte (colonne latérale d'une fiche). */
  compact?: boolean
}

export function InquiryForm({ property, defaultSubject = 'general', defaultMessage = '', compact = false }: InquiryFormProps) {
  const [startedAt, restartTimer] = useFormStartedAt()
  const [honeypot, setHoneypot] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const [submitError, setSubmitError] = useState<AppError | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormInput, unknown, InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      subject: defaultSubject,
      message: defaultMessage,
      preferred_contact: '',
      consent_marketing: false,
      has_property: !!property,
    },
  })

  const onSubmit = async (values: InquiryFormValues) => {
    setSubmitError(null)
    if (isCaptchaEnabled() && !captchaToken) {
      setSubmitError(new AppError('captcha', undefined, { userMessage: 'Merci de valider la vérification anti-robot.' }))
      return
    }
    try {
      await submitInquiry({
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone ? normalizePhone(values.phone) : null,
        message: buildInquiryMessage(values.subject, values.message, !!property),
        property_id: property?.id ?? null,
        inquiry_type: property ? 'property_info' : SUBJECT_TO_TYPE[values.subject],
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
          setError(backendFieldName(field) as Path<InquiryFormInput>, { type: 'server', message })
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
        title="Merci, votre demande est bien enregistrée."
        onReset={() => {
          reset()
          restartTimer()
          setSent(false)
          setCaptchaKey((k) => k + 1)
        }}
      >
        Un conseiller ABS IMMO & SERVICES prendra contact avec vous
        {property ? ` au sujet du bien ${property.reference ?? property.title}` : ''} par le moyen indiqué.
      </SubmitSuccess>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <HoneypotField value={honeypot} onChange={setHoneypot} />

      <TextField
        label="Nom complet"
        autoComplete="name"
        required
        error={errors.full_name?.message}
        {...register('full_name')}
      />

      <div className={compact ? 'space-y-5' : 'grid gap-5 sm:grid-cols-2'}>
        <TextField
          label="Téléphone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="77 123 45 67"
          hint="Numéro sénégalais ou international (+33…)."
          error={errors.phone?.message}
          {...register('phone')}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      {!property && (
        <SelectField label="Votre projet" error={errors.subject?.message} {...register('subject')}>
          {INQUIRY_SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </SelectField>
      )}

      <TextAreaField
        label={property ? 'Votre message (facultatif)' : 'Votre message'}
        required={!property}
        rows={compact ? 4 : 5}
        maxLength={LIMITS.inquiryMessageMax}
        placeholder={
          property
            ? 'Disponibilité, conditions, documents…'
            : 'Type de bien, quartier souhaité, budget, délai…'
        }
        error={errors.message?.message}
        {...register('message')}
      />

      <SelectField label="Comment souhaitez-vous être recontacté ?" error={errors.preferred_contact?.message} {...register('preferred_contact')}>
        <option value="">Peu importe</option>
        <option value="phone">Être rappelé par téléphone</option>
        <option value="whatsapp">Par WhatsApp</option>
        <option value="email">Par e-mail</option>
      </SelectField>

      <CheckboxField
        label="J’accepte de recevoir des propositions de biens correspondant à ma recherche."
        {...register('consent_marketing')}
      />

      <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaKey} />
      <SubmitError error={submitError} />
      {submitError?.kind === 'network' && (
        <Alert tone="info">Vous pouvez aussi nous joindre directement par téléphone ou WhatsApp.</Alert>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
        icon={isSubmitting ? <Spinner className="size-5" label="Envoi en cours…" /> : <Send aria-hidden="true" className="size-5" />}
      >
        {isSubmitting ? null : property ? 'Demander des informations' : 'Envoyer ma demande'}
      </Button>
      <PrivacyNotice />
    </form>
  )
}
