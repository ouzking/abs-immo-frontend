import { Link } from 'react-router'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { LEGAL_NAV, MAIN_NAV } from '@/config/site'
import { useAgency } from '@/features/agency/agencyService'
import { SocialIcon, WhatsAppIcon } from '@/components/icons/BrandIcons'
import { Container } from '@/components/ui/primitives'
import { formatPhone, telHref, whatsappHref } from '@/lib/format'
import { LogoImage } from './Logo'

const PROPERTY_LINKS = [
  { to: '/acheter', label: 'Biens à vendre' },
  { to: '/louer', label: 'Biens à louer' },
  { to: '/biens?type=villa', label: 'Villas' },
  { to: '/biens?type=apartment', label: 'Appartements' },
  { to: '/biens?type=land', label: 'Terrains' },
  { to: '/biens?type=office,commercial', label: 'Bureaux et commerces' },
]

function FooterHeading({ children }: { children: string }) {
  return <h2 className="text-xs font-bold tracking-[0.18em] text-white/60 uppercase">{children}</h2>
}

export function Footer() {
  const { data: agency } = useAgency()
  const year = new Date().getFullYear()
  const linkClass = 'text-white/80 transition-colors hover:text-white'

  return (
    <footer className="bg-navy-950 text-white" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">
        Informations sur ABS IMMO & SERVICES
      </h2>
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="lg:col-span-4">
          <div className="inline-flex rounded-2xl bg-white px-5 py-4">
            <LogoImage className="h-14" />
          </div>
          {(agency?.description || agency?.tagline) && (
            <p className="mt-6 max-w-sm leading-7 text-white/75">{agency.description ?? agency.tagline}</p>
          )}
          {agency && agency.socialLinks.length > 0 && (
            <ul className="mt-6 flex gap-2" aria-label="Réseaux sociaux">
              {agency.socialLinks.map((s) => (
                <li key={s.network}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-red-600"
                  >
                    <SocialIcon network={s.network} className="size-4" />
                    <span className="sr-only">{s.label} (nouvel onglet)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Plan du site" className="lg:col-span-2">
          <FooterHeading>Navigation</FooterHeading>
          <ul className="mt-5 space-y-3">
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Catégories de biens" className="lg:col-span-3">
          <FooterHeading>Nos biens</FooterHeading>
          <ul className="mt-5 space-y-3">
            {PROPERTY_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <FooterHeading>Contact</FooterHeading>
          <address className="mt-5 space-y-4 not-italic">
            {agency?.address && (
              <p className="flex gap-3 text-white/80">
                <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-red-500" />
                {agency.address}
              </p>
            )}
            {agency?.phone && (
              <p className="flex gap-3">
                <Phone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-red-500" />
                <a href={telHref(agency.phone)} className={linkClass}>
                  {formatPhone(agency.phone)}
                </a>
              </p>
            )}
            {agency?.whatsapp && (
              <p className="flex gap-3">
                <WhatsAppIcon className="mt-0.5 size-5 shrink-0 text-brand-red-500" />
                <a href={whatsappHref(agency.whatsapp)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  WhatsApp {formatPhone(agency.whatsapp)}
                </a>
              </p>
            )}
            {agency?.email && (
              <p className="flex gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-red-500" />
                <a href={`mailto:${agency.email}`} className={`${linkClass} break-all`}>
                  {agency.email}
                </a>
              </p>
            )}
            {agency && agency.openingHours.length > 0 && (
              <div className="flex gap-3 text-white/80">
                <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-red-500" />
                <ul className="space-y-1">
                  {agency.openingHours.map((h) => (
                    <li key={h.days}>
                      <span className="text-white">{h.days}</span> · {h.open} – {h.close}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </address>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-4 py-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {agency?.legalName ?? agency?.name ?? 'ABS IMMO & SERVICES'}. Tous droits réservés.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/mentions-legales#credits" className="hover:text-white">
                Crédits photos
              </Link>
            </li>
          </ul>
        </Container>
      </div>
    </footer>
  )
}
