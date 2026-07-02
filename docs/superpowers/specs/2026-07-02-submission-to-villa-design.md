# Spec — Soumission acceptée → villa pré-remplie auto

**Date** : 2026-07-02
**Statut** : validé par Kenneson (brainstorming du 2026-07-02, session écourtée — plan écrit, implémentation à faire)

## Constat

Quand l'admin clique « Accepter » sur une soumission (`villa_submissions`), seul le statut change + email « Bienvenue ». Aucune villa n'est créée — l'admin re-saisit tout à la main alors que la soumission contient déjà : villa_name, villa_location, chambres, salles_de_bains, surface_terrain, etages, parking, adresse_postale, airbnb_url, identité proprio (name/email/phone).

**Fuite de données à la capture** : le formulaire public envoie `equipements[]`, `surface`, `villa_type`, `photo_urls[]` (le schéma Zod `villaSubmissionSchema` les accepte) mais le POST ne les stocke pas — équipements/surface/type sont aplatis dans le texte `villa_description`, les URLs photos sont jetées (fichiers orphelins dans le bucket `villa-submissions`).

**Bug latent découvert** : le select « Collection » de l'éditeur villa propose `standard`/`premium`/`signature` mais la contrainte DB `villas_collection_tier_check` n'accepte que `signature`/`iconic` → choisir Premium fait 500-er l'autosave. À corriger dans ce chantier.

## Décisions actées

| # | Question | Décision |
|---|----------|----------|
| 1 | Déclenchement | Au clic « Accepter » : statut accepted + création immédiate de la villa brouillon (non publiée) + lien « Ouvrir dans l'éditeur ». Idempotent. |
| 2 | Propriétaire | Lookup `profiles` par email de la soumission : trouvé → `owner_id` lié ; sinon villa sans proprio (liaison manuelle Bloc 3). Pas d'invitation auto. |
| 3 | Capture | Migration : colonnes `equipements jsonb`, `surface text`, `villa_type text`, `photo_urls jsonb`, `villa_id uuid` sur `villa_submissions` + le POST les stocke. |

## Architecture (approche A validée)

Création côté serveur dans `updateSubmissionStatus` (lib/submissions/update-status.ts) — point d'entrée unique déjà partagé par le bouton admin ET le copilot admin (`UPDATE_SUBMISSION_STATUS`).

### Composants

1. **Migration** `supabase/migrations/<YYYYMMDDHHMMSS>_submission_to_villa.sql` (timestamp 14 chiffres) : 5 colonnes ci-dessus, `villa_id` référence `villas(id) on delete set null`.
2. **POST `/api/villa-submissions`** : insère aussi `equipements`, `surface`, `villa_type`, `photo_urls` (déjà présents dans le body validé).
3. **`lib/submissions/create-villa-from-submission.ts`** :
   - `mapSubmissionToVilla(submission)` — fonction PURE testable : name ← villa_name sinon « Villa de {name} » ; location ← villa_location sinon adresse_postale sinon "" ; description ← message + résumé technique (villa_description) ; bedrooms/bathrooms_count/surface_m2 ← parseInt tolérant des textes ; capacity ← bedrooms×2 (min 2) ; equipment_interior/exterior ← répartition des equipements (liste extérieure : Piscine, Jardin, Terrasse ou balcon, Barbecue, Parking gratuit, Vue mer — insensible à la casse ; le reste → intérieur) ; image_urls ← photo_urls, image_url ← photo_urls[0] ; airbnb_url ; price_per_night ← 0 (aucune contrainte DB, affiche « À remplir ») ; is_published false ; min_nights 2 ; commission_rate 22.
   - `createVillaFromSubmission(admin, submission)` — idempotent : si `submission.villa_id` non null → renvoie `{ villaId: submission.villa_id, created: false }`. Sinon lookup `profiles` par email (owner_id si trouvé), insert villa, update `villa_submissions.villa_id`, renvoie `{ villaId, created: true }`.
4. **`updateSubmissionStatus`** : si `status === "accepted"` → appelle `createVillaFromSubmission` après l'update de statut ; retour enrichi `{ submission, villaId }`. Le PATCH `/api/villa-submissions` renvoie `villaId` dans sa réponse. Échec de création ≠ échec d'acceptation : logguer l'erreur, renvoyer la soumission avec `villaCreationError` (l'admin peut re-cliquer, idempotence OK).
5. **UI** — `SubmissionActions.tsx` : après `accepted`, remplacer « ✓ Traité » par « ✓ Villa créée → <Link /admin/villas/[villaId]>Ouvrir dans l'éditeur</Link> » (villaId lu dans la réponse PATCH). Page `soumissions/[id]` : si `s.villa_id`, bandeau lien éditeur.
6. **Fix tier** — options du select Collection dans `VillaEditor.tsx` : `signature` / `iconic` uniquement (labels « Signature » / « Iconic »).

### Hors scope
- Invitation/création de compte proprio.
- Reparse des anciennes soumissions (avant migration) : elles se pré-remplissent avec leurs colonnes existantes, sans équipements/photos.
- Emails (inchangés).

### Tests
- Vitest sur `mapSubmissionToVilla` : parse textes ("3" → 3, vide → 0), répartition équipements int/ext, fallbacks nom/localisation, photos → image_urls/image_url.
- Vitest sur l'idempotence (villa_id déjà présent → pas d'insert) via mock du client Supabase.
- Vérifier build + `npm run lint`.

### Risques
- Migration à appliquer en prod via Supabase MCP (`apply_migration`) AVANT de merger le code qui écrit les nouvelles colonnes.
- `chambres`/`salles_de_bains` sont des `text` libres (« 3 », « 3 chambres ») → parse tolérant (`parseInt` sur le premier nombre trouvé, sinon 0).
- Ne jamais mettre `collection_tier`/`cancellation_template` à `""` (contraintes DB — cf. LEARNINGS 2026-07-02) : les omettre à l'insert.
