import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { PropertyImageView } from '../api/propertiesService'
import { PropertyImage } from './PropertyImage'

/**
 * Galerie de la fiche : image principale, navigation (boutons, flèches du
 * clavier, glissement tactile), vignettes et affichage plein écran (<dialog>).
 */
export function Gallery({ images, title }: { images: PropertyImageView[]; title: string }) {
  const [index, setIndex] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const swipeStart = useRef<number | null>(null)
  const count = images.length

  if (count === 0) {
    return <PropertyImage src={null} alt="" className="aspect-16/10 rounded-card" />
  }

  const current = images[Math.min(index, count - 1)]!
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count)
  const altFor = (img: PropertyImageView, i: number) => img.alt_text || `${title} — photo ${i + 1} sur ${count}`

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    }
  }
  const onPointerDown = (e: PointerEvent) => {
    swipeStart.current = e.clientX
  }
  const onPointerUp = (e: PointerEvent) => {
    if (swipeStart.current === null) return
    const dx = e.clientX - swipeStart.current
    swipeStart.current = null
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1)
  }

  const navButton = (dir: -1 | 1, large = false) => (
    <button
      type="button"
      onClick={() => go(dir)}
      className={cn(
        'absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-soft backdrop-blur transition hover:bg-white',
        large ? 'size-12' : 'size-11',
        dir === -1 ? 'left-3 sm:left-4' : 'right-3 sm:right-4',
      )}
    >
      {dir === -1 ? <ChevronLeft aria-hidden="true" className="size-6" /> : <ChevronRight aria-hidden="true" className="size-6" />}
      <span className="sr-only">{dir === -1 ? 'Photo précédente' : 'Photo suivante'}</span>
    </button>
  )

  return (
    <section aria-roledescription="carrousel" aria-label={`Photos du bien (${count})`} onKeyDown={onKeyDown}>
      <div
        className="relative overflow-hidden rounded-card bg-navy-50 select-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{ touchAction: 'pan-y' }}
      >
        <PropertyImage
          key={current.id}
          src={current.url}
          alt={altFor(current, index)}
          priority={index === 0}
          sizes="(min-width: 1280px) 820px, 100vw"
          className="aspect-4/3 sm:aspect-16/10"
          imgClassName="animate-fade-in"
        />
        {count > 1 && (
          <>
            {navButton(-1)}
            {navButton(1)}
          </>
        )}
        <div className="absolute right-3 bottom-3 flex items-center gap-2 sm:right-4 sm:bottom-4">
          <span aria-live="polite" className="rounded-full bg-navy-950/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-navy-900 shadow-soft backdrop-blur hover:bg-white"
          >
            <Expand aria-hidden="true" className="size-3.5" />
            Plein écran
          </button>
        </div>
      </div>

      {count > 1 && (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Choisir une photo">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Afficher la photo ${i + 1} sur ${count}`}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'block overflow-hidden rounded-xl ring-2 transition',
                  i === index ? 'ring-brand-red-600' : 'opacity-70 ring-transparent hover:opacity-100',
                )}
              >
                <PropertyImage src={img.url} alt="" className="h-16 w-24 sm:h-20 sm:w-28" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-label={`Photos de ${title}, plein écran`}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-navy-950 p-0 text-white backdrop:bg-navy-950"
        onKeyDown={onKeyDown}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-sm font-semibold text-white/80">
              {index + 1} / {count}
            </p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10"
            >
              <X aria-hidden="true" className="size-6" />
              <span className="sr-only">Fermer le plein écran</span>
            </button>
          </div>
          <div
            className="relative flex flex-1 items-center justify-center px-2 pb-6 sm:px-16"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            style={{ touchAction: 'pan-y' }}
          >
            {current.url ? (
              <img
                key={current.id}
                src={current.url}
                alt={altFor(current, index)}
                className="max-h-full max-w-full animate-fade-in rounded-lg object-contain"
              />
            ) : (
              <PropertyImage src={null} alt="" className="aspect-16/10 w-full max-w-4xl rounded-lg" />
            )}
            {count > 1 && (
              <>
                {navButton(-1, true)}
                {navButton(1, true)}
              </>
            )}
          </div>
        </div>
      </dialog>
    </section>
  )
}
