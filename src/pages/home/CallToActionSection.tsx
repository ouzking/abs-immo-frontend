import { ArrowRight, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/BrandIcons'
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button'
import { Photo, PhotoCredit } from '@/components/ui/Photo'
import { Container } from '@/components/ui/primitives'
import { PHOTOS } from '@/config/photos'
import { useAgency } from '@/features/agency/agencyService'
import { useI18n } from '@/i18n/context'
import { formatPhone, telHref, whatsappHref } from '@/lib/format'

export function CallToActionSection() {
  const { data: agency } = useAgency()
  const { t } = useI18n()
  const c = t.home.cta
  return (
    <section aria-labelledby="cta-title" className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-4xl bg-navy-900">
        <Photo
          photo={PHOTOS.coucherSoleil}
          decorative
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="absolute inset-0 -z-20 size-full opacity-60 mix-blend-luminosity"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-br from-navy-900/95 via-navy-800/85 to-navy-700/60" />
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:items-end lg:px-16 lg:py-24">
          <div className="lg:col-span-7">
            <p className="eyebrow text-white/85">{c.eyebrow}</p>
            <h2 id="cta-title" className="font-display mt-4 text-3xl leading-tight font-medium text-white sm:text-5xl">
              {c.title}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/80">
              {c.text}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:flex-col lg:items-stretch">
            <ButtonLink to="/contact" size="lg" iconRight={<ArrowRight aria-hidden="true" className="size-5" />}>
              {c.primary}
            </ButtonLink>
            {agency?.whatsapp && (
              <ButtonAnchor
                href={whatsappHref(agency.whatsapp, c.whatsappMessage)}
                size="lg"
                variant="light"
                icon={<WhatsAppIcon className="size-5 text-[#1f8f4e]" />}
              >
                {c.whatsapp}
              </ButtonAnchor>
            )}
            {agency?.phone && (
              <ButtonAnchor href={telHref(agency.phone)} size="lg" variant="outline-light" icon={<Phone aria-hidden="true" className="size-5" />}>
                {formatPhone(agency.phone)}
              </ButtonAnchor>
            )}
          </div>
        </Container>
        <PhotoCredit photo={PHOTOS.coucherSoleil} className="absolute right-5 bottom-3 text-white/45" />
      </div>
    </section>
  )
}
