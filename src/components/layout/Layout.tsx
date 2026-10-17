import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useAgency } from '@/features/agency/agencyService'
import { WhatsAppIcon } from '@/components/icons/BrandIcons'
import { Spinner } from '@/components/ui/primitives'
import { whatsappHref } from '@/lib/format'
import { Footer } from './Footer'
import { Header } from './Header'

/** Annonce le titre de la nouvelle page aux lecteurs d'écran après chaque navigation. */
function RouteAnnouncer() {
  const { pathname } = useLocation()
  const [message, setMessage] = useState('')
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    // Laisse le temps au composant Seo de mettre à jour document.title.
    const t = window.setTimeout(() => setMessage(document.title), 150)
    return () => window.clearTimeout(t)
  }, [pathname])
  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </p>
  )
}

function FloatingWhatsApp() {
  const { data: agency } = useAgency()
  const { pathname } = useLocation()
  // Les fiches de biens ont leur propre barre de contact mobile.
  if (!agency?.whatsapp || pathname.startsWith('/biens/')) return null
  return (
    <a
      href={whatsappHref(agency.whatsapp, 'Bonjour ABS IMMO & SERVICES, je souhaite échanger sur un projet immobilier.')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-30 flex size-14 items-center justify-center rounded-full bg-[#1f8f4e] text-white shadow-lift transition-transform hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
      <span className="sr-only">Écrire à l’agence sur WhatsApp (nouvel onglet)</span>
    </a>
  )
}

export function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-navy-700">
      <Spinner label="Chargement de la page…" />
    </div>
  )
}

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="fixed top-3 left-3 z-50 -translate-y-24 rounded-full bg-navy-900 px-5 py-3 font-semibold text-white transition-transform focus:translate-y-0"
      >
        Aller au contenu
      </a>
      <Header />
      <main id="contenu" tabIndex={-1} className="min-h-svh flex-1 outline-none">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <FloatingWhatsApp />
      <RouteAnnouncer />
      <ScrollRestoration />
    </div>
  )
}
