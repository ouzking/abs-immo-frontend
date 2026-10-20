// Point d'entrée unique des types métier côté frontend (réexporte le contrat backend).
import type { PublicPropertyDetail } from './backend/index.ts'

export type {
  Database,
  Json,
  TransactionType,
  CommercialStatus,
  RentPeriod,
  SurfaceUnit,
  LegalStatus,
  InquiryType,
  ContactMethod,
  TimeSlot,
  PublicProperty,
  PublicAgent,
  PublicPropertyAgent,
  PropertyCard,
  PublicPropertyDetail,
  PublicFilters,
  SearchPropertiesParams,
  SearchSort,
  AgencySettings,
  SubmitInquiryRequest,
  SubmitViewingRequest,
  SubmitResponse,
  ApiErrorBody,
  ApiErrorCode,
  UtmParams,
} from './backend/index.ts'
export { PROPERTY_CARD_COLUMNS, PROPERTY_CARD_COLUMNS_EN, STORAGE_BUCKETS, CONTRACT_VERSION, localized } from './backend/index.ts'
export type { SiteLocale } from './backend/index.ts'

export type PropertyImage = PublicPropertyDetail['images'][number]
export type PropertyAmenity = PublicPropertyDetail['amenities'][number]
export type PropertyFeature = PublicPropertyDetail['features'][number]
