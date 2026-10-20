# Types partagés du backend

Copie **non modifiée** de `abs-immo-backend/src/types/` au tag **`v1.1.0`** (contrat d'intégration
**1.1.0** : annonces bilingues).

- `database.types.ts` : généré depuis le schéma (`npm run types:gen` côté backend).
- `contracts.ts` : alias métier, formes JSON des RPC, corps des Edge Functions, codes d'erreur.

Ne modifiez jamais ces fichiers ici. À chaque nouvelle version du contrat :

```bash
npm run types:sync -- v1.2.0   # copie exacte du tag depuis ../abs_immo_backend
npm run typecheck
```

puis mettez à jour la version ci-dessus et `CONTRACT_VERSION_EXPECTED` dans `src/config/env.ts`.
