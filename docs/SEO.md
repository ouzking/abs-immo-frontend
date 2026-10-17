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

## Limite de l'architecture actuelle (SPA)

Le HTML initial est identique pour toutes les URL ; le contenu et les balises spécifiques sont produits
par JavaScript.

- **Google** exécute le JavaScript et peut indexer les annonces, avec un délai de rendu. Ce n'est
  **pas vérifié** tant que le site n'est pas en ligne : contrôler avec l'outil d'inspection d'URL de
  Search Console.
- **Aperçus de partage** (WhatsApp, Facebook, LinkedIn) : leurs robots n'exécutent pas JavaScript. Un lien
  d'annonce partagé affiche donc le titre et l'image **par défaut du site**, pas ceux du bien. C'est la
  principale limite pour une agence dont les annonces circulent beaucoup sur WhatsApp.
- Performance : le premier affichage attend le JavaScript (LCP mobile simulé ≈ 3,6 s).

## Option recommandée pour la suite (non adoptée sans validation)

| Option | Avantages | Limites / changements |
|---|---|---|
| **A. Pré-rendu des aperçus d'annonces** : une fonction (Edge Function backend ou fonction de l'hébergeur) qui, pour `/biens/:slug`, renvoie `index.html` enrichi des balises `og:*` de l'annonce | Aperçus WhatsApp/Facebook corrects ; aucun changement d'architecture React | Fonction serveur à maintenir ; image OG = URL signée longue (7 j, cf. contrat § 2.4) ou image publique dédiée |
| **B. React Router en mode « framework » avec SSR** (serveur Node/edge) | HTML complet pour toutes les pages, meilleur LCP, SEO maximal | Hébergement serveur (plus d'hébergement purement statique), migration des pages vers loaders, coût d'exploitation |
| **C. Pré-rendu statique au build** (pages fixes + annonces) | Hébergement statique conservé, HTML complet | Rebuild à chaque publication/modification d'annonce ; délai de mise à jour |

Recommandation : **A** rapidement (gain fort pour le partage, faible coût), puis **B** si le référencement
naturel des annonces devient un canal prioritaire. Décision à prendre avec l'agence et l'équipe backend.
