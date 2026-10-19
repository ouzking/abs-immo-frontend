import { lazy } from 'react'
import { createBrowserRouter, isRouteErrorResponse, useLocation, useRouteError, type RouteObject } from 'react-router'
import { RefreshCw } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/primitives'
import { LOCALES, splitLocale, type Locale } from '@/i18n/config'
import { useI18n } from '@/i18n/context'
import { I18nProvider } from '@/i18n/I18nProvider'
import HomePage from '@/pages/HomePage'

// Découpage du code : chaque page intérieure est un fichier JS distinct, chargé à la demande.
const CatalogPage = lazy(() => import('@/pages/CatalogPage'))
const PropertyPage = lazy(() => import('@/pages/PropertyPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const LegalPage = lazy(() => import('@/pages/LegalPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function RouteErrorContent() {
  const error = useRouteError()
  const { t } = useI18n()
  // Après un déploiement, un ancien onglet peut réclamer un fichier JS qui n'existe plus.
  const isChunkError = error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message)
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <h1 className="font-display text-3xl font-medium text-navy-900 sm:text-4xl">
        {isChunkError ? t.errors.updatedTitle : t.errors.crashTitle}
      </h1>
      <p className="mt-4 max-w-md text-mist-600">
        {isChunkError
          ? t.errors.updatedText
          : isRouteErrorResponse(error)
            ? `${error.status} — ${error.statusText}`
            : t.errors.crashText}
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={() => window.location.reload()} icon={<RefreshCw aria-hidden="true" className="size-4" />}>
          {t.common.reload}
        </Button>
        <ButtonLink to="/" variant="outline" reloadDocument>
          {t.common.home}
        </ButtonLink>
      </div>
    </Container>
  )
}

function RouteError() {
  const { pathname } = useLocation()
  return (
    <I18nProvider locale={splitLocale(pathname).locale}>
      <RouteErrorContent />
    </I18nProvider>
  )
}

function pageRoutes(): RouteObject[] {
  return [
    { index: true, element: <HomePage /> },
    { path: 'biens', element: <CatalogPage key="all" /> },
    { path: 'acheter', element: <CatalogPage key="sale" transaction="sale" /> },
    { path: 'louer', element: <CatalogPage key="rent" transaction="rent" /> },
    { path: 'biens/:slug', element: <PropertyPage /> },
    { path: 'a-propos', element: <AboutPage /> },
    { path: 'contact', element: <ContactPage /> },
    { path: 'mentions-legales', element: <LegalPage /> },
    { path: 'confidentialite', element: <PrivacyPage /> },
    { path: '*', element: <NotFoundPage /> },
  ]
}

function localeRoute(locale: Locale): RouteObject {
  return {
    path: locale === 'fr' ? '/' : `/${locale}`,
    element: (
      <I18nProvider locale={locale}>
        <Layout />
      </I18nProvider>
    ),
    errorElement: <RouteError />,
    children: pageRoutes(),
  }
}

/** Français à la racine, anglais sous /en, wolof sous /wo (mêmes chemins de pages). */
export const routes: RouteObject[] = LOCALES.map(localeRoute)

export const router = createBrowserRouter(routes)
