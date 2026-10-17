/**
 * Indicateurs de confiance de la page d'accueil.
 *
 * RÈGLE : un indicateur n'est affiché que si `validated: true`, c'est-à-dire
 * après confirmation écrite de l'agence (date et auteur à renseigner dans
 * `validatedBy`). Les valeurs ci-dessous sont celles ENVISAGÉES dans le cahier
 * des charges ; elles ne sont pas confirmées et restent donc masquées.
 * Si aucun indicateur n'est validé, la section entière est masquée.
 *
 * Évolution prévue : exposer ces chiffres depuis `agency_settings` (back-office)
 * pour que l'agence les mette à jour sans redéploiement — demande à adresser à
 * l'équipe abs-immo-backend.
 */
export interface TrustIndicator {
  value: string
  label: string
  validated: boolean
  validatedBy?: string
}

export const TRUST_INDICATORS: TrustIndicator[] = [
  { value: '50+', label: 'biens accompagnés', validated: false },
  { value: '70+', label: 'clients conseillés', validated: false },
  { value: '15+', label: 'années d’expérience', validated: false },
  { value: '98 %', label: 'de clients satisfaits', validated: false },
]

export const validatedTrustIndicators = (): TrustIndicator[] => TRUST_INDICATORS.filter((i) => i.validated)
