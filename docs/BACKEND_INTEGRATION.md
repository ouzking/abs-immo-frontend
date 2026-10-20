# Intégration avec abs-immo-backend

Référence : `abs-immo-backend/docs/INTEGRATION_CONTRACT.md`, contrat **1.1.0**
(types copiés dans `src/types/backend/` depuis le tag `v1.1.0` : `npm run types:sync -- v1.1.0`).

## Principes

- Un seul projet Supabase, partagé avec le back-office. Le frontend public agit avec le rôle **`anon`**
  et la clé **publishable** ; il n'ouvre jamais de session.
- Le schéma appartient au backend : ce dépôt ne contient ni SQL, ni migration, ni politique.
- Toutes les lectures passent par les **vues publiques** et **RPC** prévues ; toutes les écritures par les
  **Edge Functions**. Les tables métier (`properties`, `leads`…) ne sont jamais interrogées.
- Les appels sont centralisés dans les services ; les composants consomment des hooks.

## Ressources utilisées

| Ressource | Module | Usage |
|---|---|---|
| RPC `search_properties` (+ `.eq('city_slug')`, `.eq('neighborhood_slug')`, `count: 'exact'`, `.range()`) | `features/properties/api/propertiesService.ts` | Catalogue, biens à la une (`p_featured_only`), complément « dernières annonces » |
| RPC `get_public_property(p_slug)` | idem | Fiche détaillée ; `null` ⇒ page « annonce retirée » |
| RPC `get_similar_properties(p_property_id, 3)` | idem | Biens similaires disponibles |
| RPC `get_public_filters()` | idem | Types, villes, quartiers réellement publiés (+ compteurs) |
| Storage `property-images` (privé) — `createSignedUrls` par lot, TTL 6 h, cache | `lib/supabase/storage.ts` | Photos des annonces |
| Storage `agent-photos` (public) — `getPublicUrl` | idem | Photos des agents |
| Table `agency_settings` (colonnes listées) | `features/agency/agencyService.ts` | Coordonnées, horaires, réseaux, NINEA/RCCM, SEO par défaut |
| Vue `public_agents` | idem | Page « À propos » (équipe) |
| Edge Function `submit-inquiry` | `features/contact/api/formsService.ts` | Contact, demande d'informations sur un bien |
| Edge Function `submit-viewing-request` | idem | Demande de visite |
| Vue `public_properties` (`slug, updated_at`) | `scripts/generate-seo-files.ts` | Sitemap au build |

Colonnes de carte : `PROPERTY_CARD_COLUMNS` du contrat (jamais `select('*')`).

## Formulaires

Corps envoyés conformes à `SubmitInquiryRequest` / `SubmitViewingRequest`, avec :

- `website` (champ piège invisible, vide), `form_started_at` (horodatage d'affichage), `captcha_token`
  si `VITE_TURNSTILE_SITE_KEY` est défini, `page_url`, `utm_*` de l'URL ;
- téléphone normalisé en E.164 avec la même règle que le backend (`77 123 45 67` ⇒ `+221771234567`) ;
- validation Zod alignée sur `supabase/functions/_shared/validation.ts` (le backend reste l'autorité).

Correspondance des sujets du formulaire de contact avec `inquiry_type` :

| Sujet affiché | `inquiry_type` | Message |
|---|---|---|
| Renseignement général / acheter / louer / investir | `general` | préfixé du projet, ex. `[Je souhaite investir] …` |
| Vendre mon bien | `sell_property` | tel quel |
| Mettre mon bien en location | `rent_out_property` | tel quel |
| Autre | `other` | tel quel |
| (fiche d'un bien) | `property_info` + `property_id` | facultatif |

La « demande de rappel » passe par `preferred_contact: "phone"` (« Être rappelé par téléphone ») : le
contrat ne prévoit pas de type dédié. Si l'agence veut un traitement distinct, demander l'ajout d'une
valeur `callback` à `inquiry_type` côté backend.

Réponses : succès affiché **uniquement** sur 200/201 avec `data.id` (un doublon 200 affiche le même
message, conformément au contrat). Une demande de visite affiche explicitement qu'elle **n'est pas
encore confirmée**.

| Réponse backend | Affichage |
|---|---|
| 422 `VALIDATION_ERROR` + `fields` | erreurs sous les champs concernés (`contact` ⇒ champ téléphone) |
| 429 `RATE_LIMITED` | invitation à patienter ou à appeler |
| 404 `PROPERTY_UNAVAILABLE` | « Ce bien n'est plus proposé à la visite » |
| 400 `CAPTCHA_FAILED` | nouvelle vérification |
| 403 `ORIGIN_NOT_ALLOWED` | message générique — **ajouter le domaine du site à `ALLOWED_ORIGINS`** |
| réseau | message de connexion + rappel des coordonnées directes |

## Erreurs de lecture

`lib/errors.ts` convertit les codes PostgREST (`42501`, `22023`, `PGRST116`…) en `AppError`. Les blocs
de données affichent un état d'erreur avec « Réessayer » ; une page au-delà du total (`PGRST103`) donne
une liste vide cohérente.

## Vérifié en local (17/10/2026, pile du backend sur le port 54621)

- lecture des 6 annonces publiées, filtres, paramètres de l'agence ;
- envoi réel d'une demande de contact (201) et d'une demande de visite (201), visibles dans `inquiries`
  et `viewing_requests` ;
- photos : les chemins du seed local n'existent pas dans le Storage ⇒ visuel de repli (attendu).

**Non vérifié** : le projet distant `sasssoloprjakfysajvt` (aucune clé fournie au frontend).

## Contrat 1.1.0 : annonces bilingues (intégré le 20/10/2026)

- Les cartes demandent `PROPERTY_CARD_COLUMNS` + `PROPERTY_CARD_COLUMNS_EN` (une seule requête, quelle que
  soit la langue) ; la fiche utilise `title_en`, `short_description_en`, `description_en`,
  `seo_title_en`, `seo_description_en`, `property_type_label_en` ; équipements et filtres `label_en`.
- Repli sur le français via `localized()` (exposé par `fmt.text()`), conformément au contrat ; le wolof
  utilise le contenu français. En anglais, une annonce non traduite (`has_english = false`) l'indique.
- La recherche texte fonctionne dans les deux langues avec le même `p_query` (vérifié : « warehouse »
  trouve les entrepôts saisis en français).
- La fonction d'aperçus `api/seo.ts` utilise aussi les champs anglais.

## Production (vérifié le 20/10/2026)

- Formulaires : seule l'origine `https://abs-immo-service.vercel.app` est acceptée (une autre origine
  reçoit `403 ORIGIN_NOT_ALLOWED`). **Envoyer le domaine définitif à l'équipe backend** dès qu'il existe.
- `agency_settings` : téléphone, WhatsApp et e-mail renseignés.

## Faire évoluer le contrat

1. Le backend publie une nouvelle version (tag `vX.Y.Z`).
2. `npm run types:sync -- vX.Y.Z` puis `npm run check`.
3. Mettre à jour `CONTRACT_VERSION_EXPECTED` (`src/config/env.ts`) et `src/types/backend/README.md`.

Les valeurs d'énumération inconnues (nouveau statut, nouvelle catégorie) sont tolérées : elles ne sont
simplement pas libellées.

## Demandes au backend

- Exposer les indicateurs de confiance validés dans `agency_settings` (actuellement en configuration frontend).
- Photos de démonstration dans le seed local (facultatif, pour les revues visuelles).
- Valeur `callback` pour `inquiry_type` si les demandes de rappel doivent être distinguées.
