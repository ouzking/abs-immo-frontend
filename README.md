# abs-immo-frontend

Site public officiel d'**ABS IMMO & SERVICES**, agence immobilière au Sénégal : présentation de l'agence,
catalogue d'annonces filtrable, fiches détaillées, demandes de renseignements et de visite.

Le site lit et écrit **exclusivement** via le projet Supabase commun, selon le contrat publié par
[`abs-immo-backend`](../abs_immo_backend/docs/INTEGRATION_CONTRACT.md) (version **1.0.0**). Il ne crée
aucune table, aucun bucket, aucune fonction, et n'utilise aucune clé secrète.

| | |
|---|---|
| Stack | React 19, TypeScript strict, Vite 8, Tailwind CSS 4, React Router 7, supabase-js 2, React Hook Form + Zod, Lucide |
| Tests | Vitest 5 + Testing Library (65 tests) |
| Rendu | Application monopage (SPA) — voir [docs/SEO.md](docs/SEO.md) pour les limites et l'option SSR |

## Démarrage rapide

Prérequis : Node.js ≥ 20.19 (22.18+ recommandé pour les scripts `.ts`), npm.

```bash
npm ci
cp .env.example .env.local     # puis renseigner les valeurs (voir ci-dessous)
npm run dev                    # http://localhost:5173
```

### Avec la pile Supabase locale du backend (recommandé en développement)

```bash
cd ../abs_immo_backend
npm ci && npm run db:start && npm run db:reset    # Docker requis ; données de démonstration
npx supabase status                                # affiche API_URL et PUBLISHABLE_KEY
```

Puis dans `.env.local` du frontend :

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54621
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…   # valeur affichée par `supabase status`
VITE_SITE_URL=http://localhost:5173
```

Les annonces de démonstration du backend local n'ont **pas de photos** dans le Storage : les cartes
affichent alors le visuel neutre « Photo bientôt disponible ». C'est le comportement attendu pour toute
annonce dont la photo n'est pas accessible.

Sans configuration Supabase, le site démarre mais chaque bloc de données affiche un état d'erreur
explicite (aucune donnée fictive n'est injectée).

## Variables d'environnement

Toutes sont **publiques** (intégrées au JavaScript livré). Modèle : [.env.example](.env.example).

| Variable | Rôle |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase commun |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique (`sb_publishable_…`). Repli accepté : `VITE_SUPABASE_ANON_KEY` |
| `VITE_SITE_URL` | URL publique du site, sans `/` final : canonical, Open Graph, sitemap, robots |
| `VITE_TURNSTILE_SITE_KEY` | Clé de site Cloudflare Turnstile, uniquement si le CAPTCHA est activé côté backend |

Garde-fou : le site **refuse de démarrer** si une clé `sb_secret_…` ou un JWT `service_role` est fourni.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification TypeScript, build Vite, puis génération de `sitemap.xml` et `robots.txt` |
| `npm run preview` | Sert le build de production localement |
| `npm run lint` / `npm run typecheck` / `npm test` | ESLint / `tsc -b` / Vitest |
| `npm run check` | Tout ce qui précède, dans l'ordre (à lancer avant chaque PR) |
| `npm run types:sync` | Recopie les types du dépôt backend voisin (`src/types/backend/`) |

## Pages

| URL | Contenu |
|---|---|
| `/` | Hero + recherche, biens à la une, indicateurs (si validés), agence, parcours, appel à l'action |
| `/biens`, `/acheter`, `/louer` | Catalogue : texte, transaction, types, ville/quartier, budget, chambres, disponibilité, tri, pagination |
| `/biens/:slug` | Fiche : galerie, prix, référence, statut, caractéristiques, équipements, localisation autorisée, contact, demande d'informations, demande de visite, WhatsApp, biens similaires |
| `/a-propos` | Philosophie, services, méthode, équipe (agents publics du backend) |
| `/contact` | Coordonnées officielles + formulaire (`?sujet=invest`, `sell_property`… pré-sélectionne le projet) |
| `/mentions-legales`, `/confidentialite` | Informations légales, crédits photos, données personnelles |
| `*` | Page 404 (`noindex`) ; une annonce retirée affiche une page dédiée |

Les filtres du catalogue vivent dans l'URL (`/acheter?type=villa&ville=dakar&prix_max=300000000&page=2`) :
une recherche est partageable et survit au rechargement. Seules les valeurs ayant au moins une annonce
publiée sont proposées (RPC `get_public_filters`).

## Architecture

```
src/
  app/router.tsx              routes (pages intérieures chargées à la demande)
  config/                     env (validé), site, photos (crédits), indicateurs de confiance, mentions légales
  lib/
    supabase/client.ts        client unique (rôle anon, sans session)
    supabase/storage.ts       URL signées par lot + cache (bucket privé property-images)
    query.ts                  cache de requêtes minimal (déduplication, données précédentes conservées)
    errors.ts                 AppError : toute erreur technique devient un message lisible
    format.ts                 prix FCFA, surfaces, téléphones, liens tel:/WhatsApp
  types/                      réexport du contrat ; backend/ = copie non modifiée des types du backend
  features/
    properties/               service (vues/RPC), hooks, carte, galerie, détails, contact du bien
    search/                   critères ⇄ URL, recherche du hero, panneau de filtres, pagination
    contact/                  service Edge Functions, schémas Zod, formulaires, anti-robot
    agency/                   paramètres de l'agence (agency_settings), équipe (public_agents)
    seo/                      données structurées schema.org
  components/                 layout (en-tête, menu mobile, pied de page), ui, seo, icônes
  pages/                      une page par route ; home/ = sections de l'accueil
scripts/                      génération sitemap/robots, synchronisation des types
```

Règle : **aucun composant n'appelle Supabase directement.** Les accès passent par
`features/*/api/*Service.ts` (ou `agencyService.ts`), seuls modules autorisés à importer `getSupabase()`.

## Design system

- **Couleurs** relevées sur le logo : marine `#104571` (`navy-700`), rouge `#BF1522` (`brand-red-600`),
  neutres bleutés `mist-*`. **Aucun doré.** Tokens dans [src/styles/index.css](src/styles/index.css) (`@theme`).
- **Typographie** auto-hébergée : *Fraunces* (titres, axe optique) et *Manrope* (texte, interface).
- **Logo** : fichier officiel fourni, fond rendu transparent sans déformation (`public/assets/brand/`).
  La déclinaison d'en-tête retire la ligne du numéro WhatsApp, illisible en petit ; le logo complet est
  conservé (`logo-abs-immo-services-full.png`). **À demander à l'agence : une version vectorielle (SVG).**
- **Photos d'illustration** : trois vues de Dakar sous licence Creative Commons (crédits affichés sous
  chaque photo et dans les mentions légales). Elles ne représentent jamais un bien commercialisé ; les
  annonces n'affichent que leurs propres photos (ou un visuel neutre explicite).
- Composants accessibles : focus visible, champs avec libellés/aides/erreurs reliés, `<dialog>` natif
  pour le menu mobile, les filtres et le plein écran, mouvements réduits respectés.

## Contenus à valider par l'agence

Rien n'est inventé : tant qu'une information n'est pas fournie, elle n'est pas affichée.

| Élément | Où | État |
|---|---|---|
| Coordonnées, horaires, réseaux sociaux, NINEA, RCCM, description | `agency_settings` (back-office) | à saisir en production |
| Indicateurs « 50+ biens, 70+ clients, 15+ ans, 98 % » | [src/config/trustIndicators.ts](src/config/trustIndicators.ts) | **masqués** (`validated: false`) |
| Directeur de publication, hébergeur, déclaration CDP | [src/config/legal.ts](src/config/legal.ts) | à compléter avant mise en ligne |
| Numéro officiel +221 77 430 83 44 (téléphone et WhatsApp) | [src/config/officialContact.ts](src/config/officialContact.ts) | **intégré** ; utilisé si `agency_settings` ne fournit pas de numéro (ou est injoignable) |
| Logo vectoriel | `public/assets/brand/` | à fournir |

## Documentation

- [docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md) — ressources Supabase utilisées, erreurs, évolution du contrat
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — build, hébergement, en-têtes, checklist de mise en production
- [docs/SEO.md](docs/SEO.md) — ce qui est en place, limites d'une SPA, option SSR/pré-rendu

## Qualité mesurée (build de production local, Lighthouse mobile, 17/10/2026)

| Page | Performance | Accessibilité | Bonnes pratiques | SEO |
|---|---|---|---|---|
| `/` | 87 | 100 | 100 | 100 |
| `/biens` | 86 | 100 | 100 | 100 |
| `/biens/:slug` | 82 | 100 | 100 | 100 |
| `/contact` | 85 | 100 | 100 | 100 |

Mesures sur `vite preview` avec la base locale (réseau 4G simulé). Le LCP (~3,6 s simulé) est dominé
par la chaîne JavaScript propre à une SPA ; le pré-rendu décrit dans [docs/SEO.md](docs/SEO.md) est le
levier principal pour l'améliorer. À re-mesurer sur l'hébergement réel.
