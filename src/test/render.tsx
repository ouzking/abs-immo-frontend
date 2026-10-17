import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'

/** Rend un composant isolé dans un routeur mémoire (liens, useParams, useSearchParams). */
export function renderWithRouter(ui: ReactElement, path = '/') {
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: [path] })
  return { router, ...render(<RouterProvider router={router} />) }
}

/** Rend l'application complète (vraies routes) à une URL donnée. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return { router, ...render(<RouterProvider router={router} />) }
}
