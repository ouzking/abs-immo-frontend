/**
 * Coordonnées officielles communiquées par l'agence (numéro figurant sur le logo,
 * confirmé le 17/10/2026 ; e-mail communiqué le 20/10/2026). Elles servent de REPLI : si `agency_settings`
 * (back-office) contient une valeur, c'est elle qui est affichée, afin que
 * l'agence puisse changer de numéro sans redéploiement.
 */
export const OFFICIAL_CONTACT = {
  /** Téléphone principal, format E.164. */
  phone: '+221774308344',
  /** WhatsApp (même numéro, signalé par l'icône WhatsApp du logo). */
  whatsapp: '+221774308344',
  /** E-mail de contact. */
  email: 'elhadjisane1990@gmail.com',
} as const
