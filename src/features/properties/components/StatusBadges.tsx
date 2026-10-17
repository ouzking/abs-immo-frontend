import { Badge } from '@/components/ui/primitives'
import { commercialStatusLabel, TRANSACTION_BADGES } from '../labels'
import type { TransactionType } from '@/types'

export function TransactionBadge({ type }: { type: string | null }) {
  if (type !== 'sale' && type !== 'rent') return null
  return <Badge tone={type === 'sale' ? 'navy' : 'red'}>{TRANSACTION_BADGES[type as TransactionType]}</Badge>
}

/** Statut commercial réel. « Disponible » n'est pas répété sur les cartes (état par défaut). */
export function CommercialStatusBadge({ status, showAvailable = false }: { status: string | null; showAvailable?: boolean }) {
  const label = commercialStatusLabel(status)
  if (!label || (status === 'available' && !showAvailable)) return null
  const tone = status === 'available' ? 'success' : status === 'reserved' ? 'warning' : 'muted'
  return <Badge tone={tone}>{label}</Badge>
}
