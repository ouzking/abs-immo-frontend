import { Seo } from '@/components/seo/Seo'
import { SITE } from '@/config/site'
import { useAgency } from '@/features/agency/agencyService'
import { agencyJsonLd } from '@/features/seo/structuredData'
import { AgencySection } from './home/AgencySection'
import { CallToActionSection } from './home/CallToActionSection'
import { FeaturedSection } from './home/FeaturedSection'
import { HeroSection } from './home/HeroSection'
import { JourneysSection } from './home/JourneysSection'
import { TrustSection } from './home/TrustSection'

export default function HomePage() {
  const { data: agency } = useAgency()
  return (
    <>
      <Seo
        title={agency?.seoTitle ?? undefined}
        description={agency?.seoDescription ?? SITE.defaultDescription}
        canonicalPath="/"
        jsonLd={agencyJsonLd(agency)}
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
