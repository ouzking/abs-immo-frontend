import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/components/ui/primitives'
import { env } from '@/config/env'
import { LEGAL } from '@/config/legal'
import { useAgency } from '@/features/agency/agencyService'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-mist-200 py-10 first:border-0 first:pt-0">
      <h2 className="font-display text-2xl font-medium text-navy-900">{title}</h2>
      <div className="prose-abs mt-4">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  const { data: agency } = useAgency()
  const controller = agency?.legalName ?? agency?.name ?? 'ABS IMMO & SERVICES'
  return (
    <>
      <Seo
        title="Politique de confidentialité"
        description="Comment ABS IMMO & SERVICES traite les données personnelles transmises via les formulaires du site."
      />
      <PageHeader title="Confidentialité" crumbs={[{ name: 'Accueil', path: '/' }, { name: 'Confidentialité' }]} />
      <Container className="max-w-4xl py-16 lg:py-20">
        <Block title="Responsable du traitement">
          <p>
            Les données transmises via ce site sont traitées par {controller}
            {agency?.address ? `, ${agency.address}` : ''}, conformément à la loi sénégalaise n° 2008-12 du 25 janvier
            2008 sur la protection des données à caractère personnel.
            {LEGAL.cdpDeclaration ? ` Déclaration CDP : ${LEGAL.cdpDeclaration}.` : ''}
          </p>
        </Block>

        <Block title="Données collectées et finalités">
          <p>
            Lorsque vous remplissez un formulaire (demande de renseignements, demande de visite, contact), nous
            recueillons les informations que vous saisissez : nom, téléphone et/ou e-mail, message, bien concerné, date
            et créneau de visite souhaités, moyen de contact préféré.
          </p>
          <p>
            Ces données servent uniquement à répondre à votre demande et à organiser d’éventuelles visites. Elles ne
            sont utilisées pour vous adresser des propositions de biens que si vous avez coché la case prévue à cet
            effet.
          </p>
        </Block>

        <Block title="Protection contre les abus">
          <p>
            Pour limiter les envois automatisés, le service qui reçoit les formulaires enregistre une empreinte
            irréversible (hachage) de votre adresse IP et applique des limites de fréquence.
            {env.turnstileSiteKey ? ' Une vérification anti-robot Cloudflare Turnstile est également utilisée.' : ''}
          </p>
        </Block>

        <Block title="Destinataires et hébergement">
          <p>
            Vos données sont accessibles uniquement aux membres habilités de l’équipe de l’agence. Elles sont hébergées
            par notre prestataire de base de données (Supabase), sur des serveurs situés dans l’Union européenne.
          </p>
        </Block>

        <Block title="Cookies et mesure d’audience">
          <p>
            Ce site ne dépose aucun cookie publicitaire ni de mesure d’audience. Aucune donnée de navigation n’est
            conservée dans votre navigateur.
          </p>
        </Block>

        <Block title="Vos droits">
          <p>
            Vous disposez d’un droit d’accès, de rectification, d’opposition et de suppression des données vous
            concernant. Pour l’exercer, contactez l’agence
            {agency?.email ? (
              <>
                {' '}
                à l’adresse <a href={`mailto:${agency.email}`} className="underline">{agency.email}</a>
              </>
            ) : (
              <>
                {' '}
                via la <Link to="/contact" className="underline">page Contact</Link>
              </>
            )}
            . Vous pouvez également saisir la Commission de protection des données personnelles (CDP) du Sénégal.
          </p>
        </Block>
      </Container>
    </>
  )
}
