import { Seo } from '@/components/seo/Seo'
import { useAgency } from '@/features/agency/agencyService'
import { agencyJsonLd } from '@/features/seo/structuredData'
import { useI18n } from '@/i18n/context'
import { AgencySection } from './home/AgencySection'
import { CallToActionSection } from './home/CallToActionSection'
import { FeaturedSection } from './home/FeaturedSection'
import { HeroSection } from './home/HeroSection'
import { JourneysSection } from './home/JourneysSection'
import { TrustSection } from './home/TrustSection'

export default function HomePage() {
  const { data: agency } = useAgency()
  const { locale, t, path } = useI18n()
  // Les textes SEO saisis dans le back-office sont en français : utilisés pour la version française uniquement.
  const isFr = locale === 'fr'
  return (
    <>
      <Seo
        title={(isFr ? agency?.seoTitle : t.home.seoTitle) || undefined}
        description={(isFr ? agency?.seoDescription : null) ?? t.meta.defaultDescription}
        canonicalPath="/"
        jsonLd={agencyJsonLd(agency, path)}
      />
      <HeroSection />
      <TrustSection />
      <FeaturedSection />
      <AgencySection />
      <JourneysSection />
      <CallToActionSection />
    </>
  )
}
