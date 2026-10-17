import type { PhotoAsset } from '@/config/photos'
import { cn } from '@/lib/cn'

function srcSet(photo: PhotoAsset, ext: string) {
  return photo.widths.map((w) => `/assets/photos/${photo.name}-${w}.${ext} ${w}w`).join(', ')
}

export function Photo({
  photo,
  sizes,
  className,
  priority = false,
  decorative = false,
}: {
  photo: PhotoAsset
  sizes: string
  className?: string
  priority?: boolean
  decorative?: boolean
}) {
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(photo, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(photo, 'webp')} sizes={sizes} />
      <img
        src={`/assets/photos/${photo.name}-${photo.fallbackWidth}.jpg`}
        alt={decorative ? '' : photo.alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        {...(priority ? { fetchPriority: 'high' as const } : {})}
        className={cn('object-cover', className)}
      />
    </picture>
  )
}

export function PhotoCredit({ photo, className }: { photo: PhotoAsset; className?: string }) {
  return (
    <p className={cn('text-[0.6875rem] leading-4', className)}>
      Photo d’illustration : {photo.credit.author},{' '}
      <a href={photo.credit.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline underline-offset-2">
        {photo.credit.license}
      </a>
    </p>
  )
}
