# Badge messages non lus — sidebar admin & propriétaire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher un badge chiffré dans la sidebar admin (« Messages ») et propriétaire (« Mon concierge ») pour les messages/réponses non lus, sans que l'utilisateur ait besoin d'ouvrir la page pour le découvrir.

**Architecture:** Étendre le `badgeMap` déjà calculé côté serveur dans `app/(admin)/admin/layout.tsx` et `app/(proprio)/dashboard/layout.tsx` avec des comptages Supabase supplémentaires sur `owner_messages` et `tenant_messages`, réutilisant `applyMenuBadges()` (`lib/dashboard/apply-menu-badges.ts`) déjà en place — même pattern exact que les badges Réservations/Tâches/Soumissions/Avis existants.

**Tech Stack:** Next.js 14 App Router (Server Components), Supabase (RLS via `getSupabaseServer()`), Playwright pour la vérification.

## Global Constraints

- Aucune ligne insérée dans la table `notifications` — la cloche du header n'est pas concernée par ce changement (décision actée en brainstorming).
- Aucune migration RLS nécessaire — les policies `owner_messages_select_admin`, `tenant_messages_select_admin` (via `public.is_staff_admin()`) et `owner_messages_select_owner` autorisent déjà ces comptages via le client authentifié standard.
- Ne pas toucher au point doré existant sur l'onglet « Notre équipe » (`ConciergeTabs`) — il reste, complémentaire au badge sidebar.
- Ne jamais lancer `npm run build` (corrompt `.next` — règle projet). Utiliser `npx tsc --noEmit` pour vérifier les types.
- Dev server tourne sur le port 3001.

---

## Task 1: Badge « Messages » admin (messages propriétaires + locataires non lus)

**Files:**
- Modify: `app/(admin)/admin/layout.tsx:48-73`

**Interfaces:**
- Consumes: `applyMenuBadges(items, badgeMap)` de `lib/dashboard/apply-menu-badges.ts` — signature inchangée, `badgeMap: Record<string, number>`.
- Produces: rien de nouveau consommé par d'autres tasks — modification autonome.

- [ ] **Step 1: Lire l'état actuel exact du fichier avant modification**

Le bloc actuel (lignes 48-73) :

```tsx
  const [reservations, soumissions, avis, demandes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("villa_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("priority", "urgent")
      .neq("status", "resolved"),
  ]);

  const badgeMap: Record<string, number> = {
    "/admin/reservations": reservations.count ?? 0,
    "/admin/soumissions": soumissions.count ?? 0,
    "/admin/avis": avis.count ?? 0,
    "/admin/messages": demandes.count ?? 0,
  };
```

- [ ] **Step 2: Ajouter les 2 comptages et agréger dans `badgeMap`**

Remplacer le bloc ci-dessus par :

```tsx
  const [reservations, soumissions, avis, demandes, ownerMsgUnread, tenantMsgUnread] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("villa_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("priority", "urgent")
        .neq("status", "resolved"),
      supabase
        .from("owner_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_role", "owner")
        .is("read_at", null),
      supabase
        .from("tenant_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_role", "guest")
        .is("read_at", null),
    ]);

  const badgeMap: Record<string, number> = {
    "/admin/reservations": reservations.count ?? 0,
    "/admin/soumissions": soumissions.count ?? 0,
    "/admin/avis": avis.count ?? 0,
    "/admin/messages":
      (demandes.count ?? 0) + (ownerMsgUnread.count ?? 0) + (tenantMsgUnread.count ?? 0),
  };
```

- [ ] **Step 3: Vérifier les types**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | tail -15`
Expected: mêmes erreurs pré-existantes qu'avant modification (8 erreurs dans `tests/a11y.spec.ts` et `tests/espace-client/mobile-audit.spec.ts`), rien de nouveau dans `app/(admin)/admin/layout.tsx`.

- [ ] **Step 4: Insérer une donnée de test pour vérifier le comptage réel**

Utiliser un owner existant en base (ex. celui derrière `proprio1@test.com`) pour insérer un message non lu de test via le MCP Supabase (`mcp__claude_ai_Supabase__execute_sql` ou équivalent) :

```sql
-- Récupérer un owner_id de test
select id from public.profiles where role in ('owner','proprio') limit 1;
```

Puis, avec l'`id` obtenu (remplacer `<OWNER_ID>` et fournir un `sender_id` = même id, un admin réel n'est pas nécessaire ici car on insère un message envoyé PAR le propriétaire) :

```sql
insert into public.owner_messages (owner_id, subject, content, sender_role, sender_id)
values ('<OWNER_ID>', 'autre', 'Test badge admin — à supprimer', 'owner', '<OWNER_ID>')
returning id;
```

Noter l'`id` retourné pour le nettoyage (Step 7).

- [ ] **Step 5: Vérifier en navigateur que le badge apparaît**

Se connecter au dashboard admin (`/admin`), observer la sidebar : l'entrée « Messages » doit maintenant afficher un badge dont la valeur inclut au moins +1 par rapport à la valeur d'avant insertion (demandes urgentes + 1 message propriétaire non lu + messages locataires non lus existants).

- [ ] **Step 6: Confirmer le calcul exact par requête directe**

```sql
select
  (select count(*) from public.requests where priority = 'urgent' and status <> 'resolved') as demandes_urgentes,
  (select count(*) from public.owner_messages where sender_role = 'owner' and read_at is null) as owner_non_lus,
  (select count(*) from public.tenant_messages where sender_role = 'guest' and read_at is null) as tenant_non_lus;
```

Expected: la somme des 3 colonnes correspond exactement au chiffre affiché sur le badge « Messages » observé au Step 5.

- [ ] **Step 7: Nettoyer la donnée de test**

```sql
delete from public.owner_messages where id = '<ID_RETOURNÉ_STEP_4>';
```

- [ ] **Step 8: Commit**

```bash
git add "app/(admin)/admin/layout.tsx"
git commit -m "feat(admin): badge sidebar Messages inclut les messages proprios/locataires non lus"
```

---

## Task 2: Badge « Mon concierge » propriétaire (réponses admin non lues)

**Files:**
- Modify: `app/(proprio)/dashboard/layout.tsx:49-73`

**Interfaces:**
- Consumes: `applyMenuBadges()` — même signature que Task 1, aucune dépendance croisée entre les deux tasks (fichiers différents, badgeMap indépendants).
- Produces: rien de consommé ailleurs.

- [ ] **Step 1: Lire l'état actuel exact du fichier avant modification**

Le bloc actuel (lignes 49-73) :

```tsx
  // Fetch badge counts
  const ownerVillaIds = (ownerVillas ?? []).map((v) => v.id);

  const [reservations, taches] =
    ownerVillaIds.length > 0
      ? await Promise.all([
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .in("villa_id", ownerVillaIds)
            .eq("status", "pending"),
          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .in("villa_id", ownerVillaIds)
            .neq("status", "done"),
        ])
      : ([{ count: 0 }, { count: 0 }] as const);

  const badgeMap: Record<string, number> = {
    "/dashboard/reservations": reservations.count ?? 0,
    "/dashboard/taches": taches.count ?? 0,
  };
```

- [ ] **Step 2: Ajouter le comptage des réponses admin non lues, indépendant de `ownerVillaIds`**

Ce comptage ne dépend pas des villas (un propriétaire sans villa peut quand même avoir une conversation avec l'admin) — il doit être une requête séparée, pas conditionnée par `ownerVillaIds.length > 0`. Remplacer le bloc ci-dessus par :

```tsx
  // Fetch badge counts
  const ownerVillaIds = (ownerVillas ?? []).map((v) => v.id);

  const [reservations, taches, ownerMsgUnread] = await Promise.all([
    ownerVillaIds.length > 0
      ? supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in("villa_id", ownerVillaIds)
          .eq("status", "pending")
      : Promise.resolve({ count: 0 } as { count: number | null }),
    ownerVillaIds.length > 0
      ? supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .in("villa_id", ownerVillaIds)
          .neq("status", "done")
      : Promise.resolve({ count: 0 } as { count: number | null }),
    supabase
      .from("owner_messages")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("sender_role", "admin")
      .is("read_at", null),
  ]);

  const badgeMap: Record<string, number> = {
    "/dashboard/reservations": reservations.count ?? 0,
    "/dashboard/taches": taches.count ?? 0,
    "/dashboard/concierge": ownerMsgUnread.count ?? 0,
  };
```

- [ ] **Step 3: Vérifier les types**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | tail -15`
Expected: mêmes erreurs pré-existantes qu'avant modification, rien de nouveau dans `app/(proprio)/dashboard/layout.tsx`.

- [ ] **Step 4: Insérer une donnée de test (réponse admin non lue) pour le compte `proprio1@test.com`**

```sql
select id from auth.users where email = 'proprio1@test.com';
```

Avec l'`id` obtenu (`<OWNER_ID>`), insérer un message envoyé par l'admin (utiliser le même `<OWNER_ID>` pour `sender_id` n'est pas correct ici — utiliser l'id d'un compte admin existant pour `sender_id`, mais `owner_id` reste celui du propriétaire testé) :

```sql
select id from public.profiles where role = 'admin' limit 1;
```

```sql
insert into public.owner_messages (owner_id, subject, content, sender_role, sender_id)
values ('<OWNER_ID>', 'autre', 'Test badge proprio — à supprimer', 'admin', '<ADMIN_ID>')
returning id;
```

Noter l'`id` retourné pour le nettoyage (Step 7).

- [ ] **Step 5: Vérifier en navigateur que le badge apparaît**

Se connecter en `proprio1@test.com` / `Test123456!`, observer la sidebar : l'entrée « Mon concierge » (sous le groupe « SERVICES ») doit maintenant afficher un badge « 1 » (ou plus si des messages non lus préexistaient).

- [ ] **Step 6: Confirmer le calcul exact par requête directe**

```sql
select count(*) from public.owner_messages
where owner_id = '<OWNER_ID>' and sender_role = 'admin' and read_at is null;
```

Expected: résultat identique au chiffre affiché sur le badge observé au Step 5.

- [ ] **Step 7: Nettoyer la donnée de test**

```sql
delete from public.owner_messages where id = '<ID_RETOURNÉ_STEP_4>';
```

- [ ] **Step 8: Commit**

```bash
git add "app/(proprio)/dashboard/layout.tsx"
git commit -m "feat(proprio): badge sidebar Mon concierge pour les reponses admin non lues"
```

---

## Self-Review Notes

- **Spec coverage** : les deux sections de la spec (« Côté admin », « Côté propriétaire ») sont couvertes par Task 1 et Task 2 respectivement. La section « Ce qui ne change pas » (point doré `ConciergeTabs`, pas de table `notifications`, pas de migration RLS) est respectée — aucune task n'y touche. La section « Edge cases » (owner sans villa) est explicitement gérée au Task 2 Step 2 en rendant le comptage `owner_messages` indépendant de `ownerVillaIds`.
- **Cohérence des types** : `badgeMap: Record<string, number>` identique dans les deux tasks, `applyMenuBadges` non modifié — aucune dérive de signature entre tasks.
- **Pas de test automatisé dédié** ajouté, conformément à la spec (« cohérent avec les badges existants Réservations/Tâches qui n'ont pas de couverture de test spécifique ») — vérification par insertion SQL directe + contrôle visuel navigateur, avec nettoyage systématique de la donnée de test à la fin de chaque task.
