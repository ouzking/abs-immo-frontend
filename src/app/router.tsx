import { lazy } from 'react'
import { createBrowserRouter, isRouteErrorResponse, useRouteError } from 'react-router'
import { RefreshCw } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/primitives'
import HomePage from '@/pages/HomePage'

// Découpage du code : chaque page intérieure est un fichier JS distinct, chargé à la demande.
const CatalogPage = lazy(() => import('@/pages/CatalogPage'))
const PropertyPage = lazy(() => import('@/pages/PropertyPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const LegalPage = lazy(() => import('@/pages/LegalPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function RouteError() {
  const error = useRouteError()
  // Après un déploiement, un ancien onglet peut réclamer un fichier JS qui n'existe plus.
  const isChunkError = error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message)
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <h1 className="font-display text-3xl font-medium text-navy-900 sm:text-4xl">
        {isChunkError ? 'Le site a été mis à jour' : 'Une erreur est survenue'}
      </h1>
      <p className="mt-4 max-w-md text-mist-600">
        {isChunkError
          ? 'Rechargez la page pour profiter de la dernière version.'
          : isRouteErrorResponse(error)
            ? `${error.status} — ${error.statusText}`
            : 'Merci de recharger la page. Si le problème persiste, contactez-nous.'}
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={() => window.location.reload()} icon={<RefreshCw aria-hidden="true" className="size-4" />}>
          Recharger
        </Button>
        <ButtonLink to="/" variant="outline" reloadDocument>
          Accueil
        </ButtonLink>
      </div>
    </Container>
  )
}

export const routes = [
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
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
    ],
  },
]

export const router = createBrowserRouter(routes)
