import { siFacebook, siInstagram, siTiktok, siWhatsapp, siX, siYoutube } from 'simple-icons'
import type { SocialNetwork } from '@/features/agency/agencyService'

/** Logos de marques (simple-icons, licence CC0), rendus en SVG inline. */
function SimpleIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} fill="currentColor">
      <path d={path} />
    </svg>
  )
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return <SimpleIcon path={siWhatsapp.path} className={className} />
}

/** LinkedIn ne figure plus dans simple-icons : monogramme neutre. */
function LinkedInGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} fill="currentColor">
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <text x="12" y="17" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="Arial, sans-serif" fill="white">
        in
      </text>
    </svg>
  )
}

const PATHS: Partial<Record<SocialNetwork, string>> = {
  facebook: siFacebook.path,
  instagram: siInstagram.path,
  tiktok: siTiktok.path,
  youtube: siYoutube.path,
  x: siX.path,
}

export function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  const path = PATHS[network]
  return path ? <SimpleIcon path={path} className={className} /> : <LinkedInGlyph className={className} />
}
