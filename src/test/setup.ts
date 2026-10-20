import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { clearQueryCache } from '@/lib/query'
import { setSupabaseClientForTests } from '@/lib/supabase/client'

// Matchers jest-dom enregistrés sur l'« expect » GLOBAL : l'import « @testing-library/jest-dom/vitest »
// étendait parfois une autre instance du module vitest (« Invalid Chai property: toBeInTheDocument »).
expect.extend(matchers)

// jsdom n'implémente ni matchMedia, ni <dialog>.showModal, ni scrollIntoView.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
}
Element.prototype.scrollIntoView ??= () => {}
window.scrollTo = () => {}

// Hook global (globals: true) : importer afterEach depuis « vitest » dans un setupFile échoue sous Vitest 5.
afterEach(() => {
  cleanup()
  clearQueryCache()
  setSupabaseClientForTests(null)
})
