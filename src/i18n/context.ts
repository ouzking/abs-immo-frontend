import { createContext, useContext } from 'react'
import type { Locale } from './config'
import type { Formatters } from './format'
import type { Messages } from './messages/fr'

export interface I18nValue {
  locale: Locale
  t: Messages
  fmt: Formatters
  /** Chemin interne préfixé par la langue courante (« /biens » → « /en/biens »). */
  path: (to: string) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n doit être utilisé sous <I18nProvider>.')
  return value
}
