# Déploiement

Le site est un ensemble de fichiers statiques (`dist/`) servis par n'importe quel hébergeur capable de
renvoyer `index.html` pour les routes de l'application.

## Build

```bash
npm ci
npm run check        # lint + types + tests + build
```

Variables à définir **dans l'environnement de build** de l'hébergeur (elles sont figées dans le bundle) :
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL`, et `VITE_TURNSTILE_SITE_KEY` si
le CAPTCHA est actif.

`npm run build` produit `dist/` puis `dist/sitemap.xml` (pages + annonces publiées au moment du build)
et `dist/robots.txt`. Si l'API est injoignable, le build réussit avec un sitemap limité aux pages fixes.
**Planifier un rebuild quotidien** (ou à chaque publication) pour garder le sitemap à jour.

## Hébergeurs

| Hébergeur | Fichiers fournis | Réglages |
|---|---|---|
| Vercel | `vercel.json` (réécritures SPA, cache, en-têtes) | Framework « Other », commande `npm run build`, sortie `dist` |
| Netlify / Cloudflare Pages | `public/_redirects`, `public/_headers` | commande `npm run build`, dossier `dist` |
| Nginx | — | `try_files $uri /index.html;` + cache long sur `/assets/` |
| Apache | — | `FallbackResource /index.html` |

Les fichiers de `/assets/` générés par Vite sont versionnés par empreinte ; les photos et logos de
`public/assets/` ne le sont pas : **renommer un fichier si on le remplace** (cache d'un an).

## Côté backend (à faire par l'équipe abs-immo-backend)

1. Ajouter le domaine du site à `ALLOWED_ORIGINS` des Edge Functions
   (`npx supabase secrets set ALLOWED_ORIGINS=https://abs-immo.sn,https://www.abs-immo.sn`),
   sinon les formulaires répondent 403.
2. Si Turnstile est activé : `TURNSTILE_SECRET_KEY` côté backend + `VITE_TURNSTILE_SITE_KEY` côté site.
3. Renseigner `agency_settings` (coordonnées officielles, réseaux, NINEA/RCCM, SEO par défaut).

## Checklist de mise en production

- [ ] Variables d'environnement de production définies (clé **publishable**, jamais secrète)
- [ ] `VITE_SITE_URL` = domaine définitif (canonical, sitemap, Open Graph)
- [ ] Domaine ajouté à `ALLOWED_ORIGINS` ; envoi réel d'un formulaire testé depuis le domaine
- [ ] `agency_settings` complété ; `src/config/legal.ts` complété (directeur de publication, hébergeur)
- [ ] Indicateurs de confiance : validés par écrit ou laissés masqués
- [ ] `sitemap.xml` soumis dans Google Search Console ; indexation contrôlée avec l'outil d'inspection d'URL
- [ ] Lighthouse relancé sur l'URL de production
