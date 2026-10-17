import type { AgencyInfo } from '@/features/agency/agencyService'
import { agentPhotoUrl } from '@/lib/supabase/storage'
import type { PropertyDetailView } from './api/propertiesService'

/** Coordonnées à utiliser pour un bien : l'agent public du bien, sinon l'agence. */
export function propertyContact(p: PropertyDetailView, agency: AgencyInfo | undefined) {
  const agent = p.agent
  return {
    name: agent?.display_name ?? agency?.name ?? 'ABS IMMO & SERVICES',
    role: agent ? (agent.job_title ?? 'Conseiller immobilier') : 'Agence',
    photoUrl: agent ? agentPhotoUrl(agent.photo_path) : null,
    phone: agent?.public_phone ?? agency?.phone ?? null,
    whatsapp: agent?.whatsapp_phone ?? agency?.whatsapp ?? null,
    email: agent?.public_email ?? agency?.email ?? null,
  }
}

export function whatsappMessage(p: PropertyDetailView): string {
  const url = typeof window !== 'undefined' ? window.location.href.split('?')[0] : ''
  return `Bonjour, je suis intéressé(e) par le bien « ${p.title} »${p.reference ? ` (réf. ${p.reference})` : ''}. ${url}`.trim()
}
