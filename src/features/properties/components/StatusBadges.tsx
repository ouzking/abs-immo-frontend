import { Badge } from '@/components/ui/primitives'
import { useI18n } from '@/i18n/context'
import { knownStatus } from '../labels'

export function TransactionBadge({ type }: { type: string | null }) {
  const { t } = useI18n()
  if (type !== 'sale' && type !== 'rent') return null
  return <Badge tone={type === 'sale' ? 'navy' : 'red'}>{t.labels.transactionBadge[type]}</Badge>
}

/** Statut commercial réel. « Disponible » n'est pas répété sur les cartes (état par défaut). */
export function CommercialStatusBadge({ status, showAvailable = false }: { status: string | null; showAvailable?: boolean }) {
  const { t } = useI18n()
  const known = knownStatus(status)
  if (!known || (known === 'available' && !showAvailable)) return null
  const tone = known === 'available' ? 'success' : known === 'reserved' ? 'warning' : 'muted'
  return <Badge tone={tone}>{t.labels.status[known]}</Badge>
}
