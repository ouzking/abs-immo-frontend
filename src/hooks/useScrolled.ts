import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('scroll', callback, { passive: true })
  return () => window.removeEventListener('scroll', callback)
}

/** Vrai dès que la page a défilé au-delà de `threshold` pixels. */
export function useScrolled(threshold = 12): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.scrollY > threshold,
    () => false,
  )
}
