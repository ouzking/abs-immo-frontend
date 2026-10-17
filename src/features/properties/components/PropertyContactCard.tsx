import { lazy, Suspense, useId, useState, type KeyboardEvent } from 'react'
import { Mail, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/BrandIcons'
import { ButtonAnchor } from '@/components/ui/Button'
import type { AgencyInfo } from '@/features/agency/agencyService'
import { Skeleton } from '@/components/ui/primitives'
import { cn } from '@/lib/cn'
import { formatPhone, telHref, whatsappHref } from '@/lib/format'
import type { PropertyDetailView } from '../api/propertiesService'
import { propertyContact, whatsappMessage } from '../contact'
import { isNoLongerAvailable } from '../labels'

// Formulaires (zod + react-hook-form) chargés à la demande : la fiche s'affiche sans les attendre.
const InquiryForm = lazy(() => import('@/features/contact/components/InquiryForm').then((m) => ({ default: m.InquiryForm })))
const ViewingForm = lazy(() => import('@/features/contact/components/ViewingForm').then((m) => ({ default: m.ViewingForm })))

type Tab = 'info' | 'visit'

export function PropertyContactCard({ property: p, agency }: { property: PropertyDetailView; agency: AgencyInfo | undefined }) {
  const contact = propertyContact(p, agency)
  // Le backend n'accepte les visites que pour un bien disponible ou réservé.
  const canVisit = !isNoLongerAvailable(p.commercial_status)
  const [tab, setTab] = useState<Tab>('info')
  const baseId = useId()
  const formProperty = { id: p.id!, title: p.title ?? '', reference: p.reference }
  const tabs: Array<{ id: Tab; label: string }> = canVisit
    ? [
        { id: 'info', label: 'Informations' },
        { id: 'visit', label: 'Visite' },
      ]
    : [{ id: 'info', label: 'Demande d’informations' }]

  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = tab === 'info' ? 'visit' : 'info'
    if (tabs.some((t) => t.id === next)) {
      setTab(next)
      document.getElementById(`${baseId}-tab-${next}`)?.focus()
    }
  }

  return (
    <div className="overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-mist-200">
      <div className="flex items-center gap-4 border-b border-mist-200 p-5">
        {contact.photoUrl ? (
          <img src={contact.photoUrl} alt="" width={56} height={56} className="size-14 rounded-full object-cover" loading="lazy" />
        ) : (
          <span aria-hidden="true" className="font-display flex size-14 items-center justify-center rounded-full bg-navy-700 text-xl text-white">
            {contact.name.charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-mist-500 uppercase">{contact.role}</p>
          <p className="truncate font-bold text-navy-900">{contact.name}</p>
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-navy-700 hover:underline">
              <Mail aria-hidden="true" className="size-3.5 shrink-0" />
              {contact.email}
            </a>
          )}
        </div>
      </div>

      {(contact.phone || contact.whatsapp) && (
        <div className="grid grid-cols-2 gap-2 border-b border-mist-200 p-5">
          {contact.phone && (
            <ButtonAnchor
              href={telHref(contact.phone)}
              variant="outline"
              className={cn(!contact.whatsapp && 'col-span-2')}
              icon={<Phone aria-hidden="true" className="size-4" />}
              aria-label={`Appeler le ${formatPhone(contact.phone)}`}
            >
              Appeler
            </ButtonAnchor>
          )}
          {contact.whatsapp && (
            <ButtonAnchor
              href={whatsappHref(contact.whatsapp, whatsappMessage(p))}
              variant="outline"
              className={cn('text-[#16723d]', !contact.phone && 'col-span-2')}
              icon={<WhatsAppIcon className="size-4" />}
              aria-label="Écrire sur WhatsApp à propos de ce bien (nouvel onglet)"
            >
              WhatsApp
            </ButtonAnchor>
          )}
        </div>
      )}

      <div className="p-5">
        {tabs.length > 1 ? (
          <div role="tablist" aria-label="Type de demande" className="grid grid-cols-2 gap-1 rounded-full bg-mist-100 p-1" onKeyDown={onTabKey}>
            {tabs.map((t) => (
              <button
                key={t.id}
                id={`${baseId}-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`${baseId}-panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                className={cn(
                  'rounded-full px-2 py-2.5 text-[0.8125rem] font-bold transition-colors',
                  tab === t.id ? 'bg-white text-navy-900 shadow-sm' : 'text-mist-600 hover:text-navy-800',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <h2 className="font-bold text-navy-900">{tabs[0]!.label}</h2>
        )}

        <div
          id={`${baseId}-panel-${tab}`}
          role={tabs.length > 1 ? 'tabpanel' : undefined}
          aria-labelledby={tabs.length > 1 ? `${baseId}-tab-${tab}` : undefined}
          className="mt-5"
        >
          <Suspense fallback={<Skeleton className="h-96" />}>
            {tab === 'info' || !canVisit ? (
              <InquiryForm property={formProperty} compact />
            ) : (
              <ViewingForm property={formProperty} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}
