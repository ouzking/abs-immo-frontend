import { useEffect, useMemo, type ReactNode } from 'react'
import { LOCALE_META, localizePath, type Locale } from './config'
import { I18nContext, type I18nValue } from './context'
import { createFormatters } from './format'
import { deepMerge } from './merge'
import { en } from './messages/en'
import { fr, type Messages } from './messages/fr'
import { wo } from './messages/wo'

const MESSAGES: Record<Locale, Messages> = { fr, en: deepMerge<Messages>(fr, en), wo: deepMerge<Messages>(fr, wo) }

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nValue>(() => {
    const t = MESSAGES[locale]
    return { locale, t, fmt: createFormatters(locale, t), path: (to) => localizePath(to, locale) }
  }, [locale])

  useEffect(() => {
    document.documentElement.lang = LOCALE_META[locale].htmlLang
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
