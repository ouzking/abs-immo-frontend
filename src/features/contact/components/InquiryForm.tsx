import { useMemo, useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/components/ui/fields'
import { Alert, Spinner } from '@/components/ui/primitives'
import { useI18n } from '@/i18n/context'
import { AppError, toAppError } from '@/lib/errors'
import { isCaptchaEnabled, useFormStartedAt } from '../antiBot'
import { currentUtm, submitInquiry } from '../api/formsService'
import {
  backendFieldName,
  buildInquiryMessage,
  createInquirySchema,
  INQUIRY_SUBJECTS,
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
  const { t, locale } = useI18n()
  const f = t.forms
  const schema = useMemo(() => createInquirySchema(f.validation), [f.validation])
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
    resolver: zodResolver(schema),
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
      setSubmitError(new AppError('captcha', undefined, { userMessage: f.captchaRequired }))
      return
    }
    try {
      await submitInquiry({
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone ? normalizePhone(values.phone) : null,
        message: buildInquiryMessage(values.subject, values.message, !!property, locale),
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
          // Les messages de champ du backend sont en français : remplacés par un texte générique dans les autres langues.
          setError(backendFieldName(field) as Path<InquiryFormInput>, { type: 'server', message: f.validation.server || message })
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
        title={f.successTitle}
        resetLabel={f.another}
        onReset={() => {
          reset()
          restartTimer()
          setSent(false)
          setCaptchaKey((k) => k + 1)
        }}
      >
        {f.successText(property ? (property.reference ?? property.title) : '')}
      </SubmitSuccess>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <HoneypotField value={honeypot} onChange={setHoneypot} />

      <TextField label={f.fullName} autoComplete="name" required error={errors.full_name?.message} {...register('full_name')} />

      <div className={compact ? 'space-y-5' : 'grid gap-5 sm:grid-cols-2'}>
        <TextField
          label={f.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={f.phonePlaceholder}
          hint={f.phoneHint}
          error={errors.phone?.message}
          {...register('phone')}
        />
        <TextField
          label={f.email}
          type="email"
          autoComplete="email"
          placeholder={f.emailPlaceholder}
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      {!property && (
        <SelectField label={f.project} error={errors.subject?.message} {...register('subject')}>
          {INQUIRY_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {f.subjects[s]}
            </option>
          ))}
        </SelectField>
      )}

      <TextAreaField
        label={property ? f.messageOptional : f.message}
        required={!property}
        rows={compact ? 4 : 5}
        maxLength={LIMITS.inquiryMessageMax}
        placeholder={property ? f.messagePlaceholderProperty : f.messagePlaceholder}
        error={errors.message?.message}
        {...register('message')}
      />

      <SelectField label={f.preferredContact} error={errors.preferred_contact?.message} {...register('preferred_contact')}>
        <option value="">{f.contactAny}</option>
        <option value="phone">{f.contactPhone}</option>
        <option value="whatsapp">{f.contactWhatsapp}</option>
        <option value="email">{f.contactEmail}</option>
      </SelectField>

      <CheckboxField label={f.consent} {...register('consent_marketing')} />

      <TurnstileWidget onToken={setCaptchaToken} resetKey={captchaKey} />
      <SubmitError error={submitError} />
      {submitError?.kind === 'network' && <Alert tone="info">{f.networkHint}</Alert>}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
        icon={isSubmitting ? <Spinner className="size-5" label={f.sending} /> : <Send aria-hidden="true" className="size-5" />}
      >
        {isSubmitting ? null : property ? f.submitPropertyInquiry : f.submitInquiry}
      </Button>
      <PrivacyNotice />
    </form>
  )
}
