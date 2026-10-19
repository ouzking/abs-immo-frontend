import type { AgencyInfo } from '@/features/agency/agencyService'
import type { Messages } from '@/i18n/messages/fr'
import { agentPhotoUrl } from '@/lib/supabase/storage'
import type { PropertyDetailView } from './api/propertiesService'

/** Coordonnées à utiliser pour un bien : l'agent public du bien, sinon l'agence. */
export function propertyContact(p: PropertyDetailView, agency: AgencyInfo | undefined, t: Messages) {
  const agent = p.agent
  return {
    name: agent?.display_name ?? agency?.name ?? 'ABS IMMO & SERVICES',
    role: agent ? (agent.job_title ?? t.property.contact.agent) : t.property.contact.agency,
    photoUrl: agent ? agentPhotoUrl(agent.photo_path) : null,
    phone: agent?.public_phone ?? agency?.phone ?? null,
    whatsapp: agent?.whatsapp_phone ?? agency?.whatsapp ?? null,
    email: agent?.public_email ?? agency?.email ?? null,
  }
}

export function whatsappMessage(p: PropertyDetailView, t: Messages): string {
  const url = typeof window !== 'undefined' ? (window.location.href.split('?')[0] ?? '') : ''
  return t.property.whatsappMessage(p.title ?? '', p.reference, url).trim()
}
