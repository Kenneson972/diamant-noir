# Spec — Phase 1 : Admin Copilot (agent C) — fondations + actions sûres + tracking modifs proprio

**Date** : 2026-06-20 · **Statut** : Design validé
**Projet** : Kayvila (Supabase `DIAMANT NOIR` = `wsdawdxucyuyopkpgjij`, prod `kayvila.vercel.app`)
**Agent C** : workflow n8n `7gtgluMV6cft6H7X` (`docs/n8n/kayvibot-agent-c-admin-fusion.json`), webhook `kayvibot-admin`

## Objectif

Donner à l'agent C (admin) le même niveau que l'agent B (copilot riche intégré + actions), avec une portée **plateforme entière** et une **sécurité renforcée** (confirmation + audit) vu les enjeux. Phase 1 = fondations + actions sûres + tracking des modifications faites par les propriétaires.

Phases suivantes (hors scope ici) : 2 = remboursement Stripe + gestion résa ; 3 = insights++ / messagerie ; 4 = actions groupées (bulk).

## Contexte vérifié (existant)

- **Pas de CopilotProvider** dans le layout admin → l'`AdminCopilotChat` gère son propre état via le hook `useCopilot`.
- **`/api/agent/admin-context`** (route, `requireAdmin`) : agrège villas, bookings, blocks, tasks, submissions, ota, reviews, profiles + occupancy/health/alerts/daily briefing, et sert le `systemPrompt`. L'agent C la fetch en HTTP avec un **token** (Edit Fields lit `body.token || header.authorization`).
- **`/api/concierge/admin`** (route, `requireAdmin` cookie) : passthrough actuel, envoie `{ message }` seulement, renvoie `data.response ?? data.output ?? JSON.stringify(data)`. Pas d'action, pas de token forward.
- Agent C "Parse Response" node : extrait `reply/action/...` mais **droppe `action_data`** (même bug que B avant fix).
- Tables existantes : `villas` (a `price_per_night`, PAS de colonne `price`), `villa_submissions`, `villa_date_blocks`, `bookings`, `notifications`, `profiles` (role `owner`/`admin`/`tenant`).
- Pattern réutilisable : `CopilotActionCard`, hook `useCopilot`, fix B (forward token + parse reply + action_data passthrough + timeout/maxDuration).

## Architecture

### A. UI — `AdminCopilotChat`

`components/dashboard/admin/AdminCopilotChat.tsx` (Client Component) :
- Utilise `useCopilot({ webhookUrl: "/api/concierge/admin" })` directement (pas de provider — instance unique).
- Rend : header "Concierge IA — Admin", zone messages scrollable pleine hauteur, `CopilotActionCard` pour les résultats, **carte de confirmation** pour les `proposed_action`, input.
- `app/(admin)/admin/concierge/page.tsx` → remplace `AgentChat` par `<AdminCopilotChat />`.
- Charte inchangée (or/navy). `AgentChat` reste pour rien d'autre côté admin → on le retire de cette page (il n'est plus utilisé nulle part après ça : vérifier et, si orphelin, le laisser sans le supprimer pour éviter régression).

### B. Tracking des modifications propriétaire

Migration SQL :
1. Table `villa_changes` :
   ```sql
   create table if not exists public.villa_changes (
     id uuid primary key default gen_random_uuid(),
     villa_id uuid not null references villas(id) on delete cascade,
     owner_id uuid,
     field text not null,
     old_value text,
     new_value text,
     actor text not null default 'system',   -- 'owner:<id>' | 'admin:<id>' | 'system'
     changed_at timestamptz not null default now()
   );
   create index if not exists idx_villa_changes_recent on public.villa_changes (changed_at desc);
   ```
2. Fonction + trigger `AFTER UPDATE` sur `villas` : pour chaque champ suivi (`price_per_night`, `name`, `description`, `capacity`, `location`, `is_published`) modifié, insère une ligne. L'`actor` est lu via `current_setting('app.actor', true)` (défaut `'system'` si absent) :
   ```sql
   create or replace function public.log_villa_change() returns trigger
   language plpgsql security definer as $$
   declare actor_val text := coalesce(nullif(current_setting('app.actor', true), ''), 'system');
   begin
     if new.price_per_night is distinct from old.price_per_night then
       insert into public.villa_changes(villa_id, owner_id, field, old_value, new_value, actor)
       values (new.id, new.owner_id, 'price_per_night', old.price_per_night::text, new.price_per_night::text, actor_val);
     end if;
     -- idem pour name, description, capacity, location, is_published
     return new;
   end $$;
   create trigger trg_log_villa_change after update on public.villas
     for each row execute function public.log_villa_change();
   ```
3. **Actor** : les chemins de modif app posent la variable avant l'UPDATE via RPC `set_config('app.actor', '<role>:<id>', true)` — ou, plus simple en Phase 1, on accepte le défaut : une modif sur une villa = imputée à son `owner_id` (champ `owner_id` de la ligne), sauf si elle provient d'une action admin loggée dans `admin_action_log` (corrélation possible). Pour distinguer proprement owner vs admin, les handlers `SET_PRICE` (owner-assistant ET admin) appelleront `set_config('app.actor', ...)` avant l'update. Les modifs via le formulaire dashboard proprio posent `owner:<id>`.
4. `admin-context` : ajouter une requête `villa_changes` (7 derniers jours) au contexte agrégé + une `adminAlert` "modif proprio récente" dans `computeAdminAlerts`.

### C. Actions (route `/api/concierge/admin` upgradée)

Mirror de `owner-assistant`, SANS restriction `ownerVillaIds` (admin = toute villa), AVEC flux de confirmation.

Type `AdminAction` : `"SHOW_STATS" | "SET_PRICE" | "BLOCK_DATE" | "SHOW_BOOKING" | "ACCEPT_SUBMISSION" | "REFUSE_SUBMISSION"`.

Flux :
- **POST normal** `{ message }` → forward à n8n (avec token admin) → réponse agent `{ reply, action, action_data }`.
  - Si `action` ∈ actions LECTURE (`SHOW_STATS`, `SHOW_BOOKING`) → exécuter immédiatement, renvoyer `{ response, action, action_result }`.
  - Si `action` ∈ actions ÉCRITURE (`SET_PRICE`, `BLOCK_DATE`, `ACCEPT_SUBMISSION`, `REFUSE_SUBMISSION`) → **NE PAS exécuter**. Renvoyer `{ response, proposed_action: { action, action_data } }`.
- **POST confirmation** `{ confirm_action: { action, action_data } }` → re-vérifier `requireAdmin`, exécuter le handler, logger dans `admin_action_log`, renvoyer `{ action_result }`. (Ne rappelle PAS n8n.)

Handlers (admin client service-role ; avant chaque écriture villa : `set_config('app.actor', 'admin:<id>', true)`):
- `SET_PRICE` : `action_data.price = { villa_id, price_per_night }` → vérifier villa existe → `update villas set price_per_night=... where id=...` (PAS de colonne `price`). `action_result = { villa, previous_price }`.
- `BLOCK_DATE` : `action_data.block = { villa_id, start_date, end_date, reason }` → insert `villa_date_blocks` (`origin='Kayvila'`, `created_by=admin.id`).
- `SHOW_BOOKING` : `action_data.booking?` (villa_id ou booking_id optionnel) → select prochaine/ en cours, toute villa. Lecture.
- `ACCEPT_SUBMISSION` : `action_data.submission = { submission_id }` → `update villa_submissions set status='accepted'` (+ logique existante si déjà présente — réutiliser le service d'acceptation si disponible). `action_result = { submission }`.
- `REFUSE_SUBMISSION` : `action_data.submission = { submission_id, reason? }` → `update villa_submissions set status='rejected'`.

### D. Sécurité — audit log

Migration SQL : table `admin_action_log` :
```sql
create table if not exists public.admin_action_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  action text not null,
  action_data jsonb default '{}',
  result jsonb default '{}',
  created_at timestamptz not null default now()
);
```
RLS service-role (comme `notifications`). Chaque exécution d'action écriture y insère une ligne.

### E. Frontend — carte de confirmation

`components/dashboard/admin/AdminActionCard.tsx` (ou extension de `CopilotActionCard`) :
- Si message assistant porte `proposed_action` → afficher une carte : icône + résumé de l'action proposée + boutons **[Confirmer]** / **[Annuler]**.
- Confirmer → `useCopilot.confirmAction(proposed_action)` envoie `{ confirm_action }` → affiche le `CopilotActionCard` résultat.
- Annuler → masque la carte.
- Le hook `useCopilot` gagne une méthode `confirmAction(action, action_data)` qui POST `{ confirm_action }` et ajoute le résultat aux messages.

### F. n8n + systemPrompt

- `admin-context` systemPrompt : ajouter la section ACTIONS (5 actions + schéma `action_data` + règles strictes : id exact depuis les données, n'exécute que sur demande explicite) + consigne : signaler proactivement les `villa_changes` récents.
- Agent C "Parse Response" node : ajouter `action_data` au passthrough (PUT via API n8n, clé owner).
- Route admin : forwarder le token admin (`getSessionUser`/session access_token) à n8n + parse `reply` + timeout 32s + `maxDuration = 35`.

## Tests

1. **Migration** : `villa_changes` + trigger + `admin_action_log` appliqués (SQL Editor, projet `wsdawdxucyuyopkpgjij`).
2. **Trigger** : un `UPDATE villas set price_per_night` (via SQL ou via copilot proprio) crée une ligne `villa_changes`.
3. **API** (Playwright, login admin `admin@diamantnoir.com`) : la page `/admin/concierge` affiche le copilot riche ; question "quels proprios ont changé leurs prix ?" → l'agent cite la modif.
4. **Action écriture E2E** : "passe Villa X à 1800€" → carte de confirmation → Confirmer → `villas.price_per_night` = 1800, ligne `admin_action_log`. Re-test "accepte la soumission de X" → confirmation → `villa_submissions.status='accepted'`.
5. **Annulation** : proposer une action → Annuler → aucune écriture.

## Dépendances / à fournir
- Clé API n8n owner-level (déjà fournie en session) pour PUT le workflow C.
- Valeur `N8N_ADMIN_WEBHOOK_URL` déjà en place sur Vercel (`kayvibot-admin`).

## Règles dures
- Zéro redesign (or/navy, radius anguleux).
- Toute action ÉCRITURE passe par confirmation explicite + audit log. L'agent PROPOSE, la route exécute après clic.
- `villas` n'a PAS de colonne `price` → n'updater que `price_per_night`.
- n8n : auth par header (jamais query), pas de `$env`/`process.env`.
- `client.config.ts` source de vérité. Apostrophes FR en double quotes dans les strings JS.
- `tsc --noEmit` avant push ; vérifier `vercel ls --prod` Ready.
