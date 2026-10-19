/**
 * Indicateurs de confiance de la page d'accueil.
 *
 * RÈGLE : un indicateur n'est affiché que si `validated: true`, c'est-à-dire
 * après confirmation écrite de l'agence (date et auteur à renseigner dans
 * `validatedBy`). Les valeurs ci-dessous sont celles ENVISAGÉES dans le cahier
 * des charges ; elles ne sont pas confirmées et restent donc masquées.
 * Si aucun indicateur n'est validé, la section entière est masquée.
 * Libellés traduits : messages.home.trust.labels[id].
 *
 * Évolution prévue : exposer ces chiffres depuis `agency_settings` (back-office)
 * pour que l'agence les mette à jour sans redéploiement.
 */
export interface TrustIndicator {
  id: 'properties' | 'clients' | 'years' | 'satisfaction'
  value: string
  validated: boolean
  validatedBy?: string
}

export const TRUST_INDICATORS: TrustIndicator[] = [
  { id: 'properties', value: '50+', validated: false },
  { id: 'clients', value: '70+', validated: false },
  { id: 'years', value: '15+', validated: false },
  { id: 'satisfaction', value: '98 %', validated: false },
]

export const validatedTrustIndicators = (): TrustIndicator[] => TRUST_INDICATORS.filter((i) => i.validated)
