import { Container } from '@/components/ui/primitives'
import { validatedTrustIndicators } from '@/config/trustIndicators'

/** Masquée tant qu'aucun indicateur n'a été validé par l'agence (voir config/trustIndicators.ts). */
export function TrustSection() {
  const indicators = validatedTrustIndicators()
  if (indicators.length === 0) return null
  return (
    <section aria-label="L’agence en chiffres" className="border-y border-mist-200 bg-white">
      <Container>
        <dl className="grid grid-cols-2 divide-mist-200 py-10 lg:grid-cols-4 lg:divide-x">
          {indicators.map((i) => (
            <div key={i.label} className="flex flex-col items-center px-4 py-4 text-center">
              <dt className="order-2 mt-1 text-sm font-semibold text-mist-600">{i.label}</dt>
              <dd className="font-display order-1 text-4xl font-medium text-navy-800 lg:text-5xl">{i.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
