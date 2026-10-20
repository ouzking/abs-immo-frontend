# SEO : choix retenu et limites

## En place

- Titre, description, URL canonique, Open Graph et Twitter Card **par page** (`src/components/seo/Seo.tsx`),
  y compris pour chaque annonce (titre/description SEO saisis dans le back-office, sinon déduits du bien).
- Valeurs par défaut dans `index.html`, lisibles sans JavaScript ; image de partage par défaut `og-default.jpg`.
- URL propres en français (`/acheter`, `/louer`, `/biens/<slug>`), slugs fournis par le backend.
- `sitemap.xml` et `robots.txt` générés au build.
- Données structurées : `RealEstateAgent` (accueil, contact), `RealEstateListing` + `Offer` (fiche),
  `BreadcrumbList`. Uniquement des champs réels ; les photos (URL signées expirant) ne sont pas déclarées.
- 404 et annonces retirées en `noindex`.

## Aperçus de partage (WhatsApp, Facebook, LinkedIn, X…) — en place

`api/seo.ts` (fonction Vercel) répond **uniquement aux robots** (réécriture conditionnée au User-Agent
dans `vercel.json`) avec `index.html` enrichi des métadonnées de la page : titre, description, URL
canonique, `og:*`, `twitter:*`, `lang`. Pour une annonce : titre, prix, statut, quartier, référence et
photo de couverture (URL signée 7 jours). Les visiteurs humains reçoivent le site normal.

Vérifié en production le 20/10/2026 avec les User-Agents WhatsApp et Facebook (pages fixes, anglais,
annonce introuvable en `noindex`). L'aperçu d'une annonce réelle n'a pas encore pu être vérifié en ligne :
aucune annonce n'est publiée en production. Test : partager un lien d'annonce dans WhatsApp, ou
`curl -A "WhatsApp/2.23" https://abs-immo-service.vercel.app/biens/<slug>`. Pour forcer Facebook à
relire un aperçu déjà en cache : https://developers.facebook.com/tools/debug/

## Limite de l'architecture actuelle (SPA)

Le HTML initial est identique pour toutes les URL ; le contenu et les balises spécifiques sont produits
par JavaScript.

- **Google** exécute le JavaScript et peut indexer les annonces, avec un délai de rendu. Ce n'est
  **pas vérifié** tant que le site n'est pas en ligne : contrôler avec l'outil d'inspection d'URL de
  Search Console.
- **Aperçus de partage** : résolus par la fonction ci-dessus (option A, adoptée).
- Performance : le premier affichage attend le JavaScript (LCP mobile simulé ≈ 3,6 s).

## Option recommandée pour la suite (non adoptée sans validation)

| Option | Avantages | Limites / changements |
|---|---|---|
| **A. Pré-rendu des aperçus d'annonces** : une fonction (Edge Function backend ou fonction de l'hébergeur) qui, pour `/biens/:slug`, renvoie `index.html` enrichi des balises `og:*` de l'annonce | Aperçus WhatsApp/Facebook corrects ; aucun changement d'architecture React | Fonction serveur à maintenir ; image OG = URL signée longue (7 j, cf. contrat § 2.4) ou image publique dédiée |
| **B. React Router en mode « framework » avec SSR** (serveur Node/edge) | HTML complet pour toutes les pages, meilleur LCP, SEO maximal | Hébergement serveur (plus d'hébergement purement statique), migration des pages vers loaders, coût d'exploitation |
| **C. Pré-rendu statique au build** (pages fixes + annonces) | Hébergement statique conservé, HTML complet | Rebuild à chaque publication/modification d'annonce ; délai de mise à jour |

Recommandation : **A** rapidement (gain fort pour le partage, faible coût), puis **B** si le référencement
naturel des annonces devient un canal prioritaire. Décision à prendre avec l'agence et l'équipe backend.
