# Mega-Prompt Cursor — RBAC JWT Critique

**Date** : 2026-06-06
**Projet** : Kayvila Diamant Noir (diamant-noir)
**Contexte** : À exécuter AVANT le mega-prompt des 16 bugs. Sans ce fix, tout proprio peut devenir admin via JWT manipulation.

---

## Le piège JWT

Dans Supabase, `auth.jwt() ->> 'role'` = rôle **DB** (`authenticated`).  
Le rôle **métier** est dans `auth.jwt() -> 'user_metadata' ->> 'role'`.

8 policies utilisent le mauvais claim → n'importe quel utilisateur authentifié passe les checks admin.

---

## Bug RBAC-1 — 8 policies RLS avec le mauvais claim

### Fichier : `supabase/migrations/20260501_rls_audit.sql`

**Code actuel** (pattern répété 8 fois) :
```sql
auth.jwt() ->> 'role' = 'admin'
```

**Problème** : `auth.jwt() ->> 'role'` = `'authenticated'` pour TOUS les utilisateurs connectés. Les admins réels (user_metadata.role = 'admin') ne matchent jamais.

**Correction** — remplacer CHAQUE occurrence par :
```sql
auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
```

**Règle absolue pour tout le projet** :  
❌ `auth.jwt() ->> 'role'`  
✅ `auth.jwt() -> 'user_metadata' ->> 'role'`

**Policies à corriger** (chercher avec grep `auth.jwt() ->> 'role'`) :
- `contact_requests` → policy `select_admin`
- `villa_events` → policy `select_admin`
- `villa_submissions` → policies `select_admin`, `update_admin`
- `admin_chat_logs` → policy `select_admin`
- `ai_action_logs` → policies `insert_admin`, `select_admin`
- `villas` → policy `select_admin` (si existante)
- `bookings` → policy `select_admin` (si existante)
- `stripe_connect_accounts` → policy `select_admin` (si existante)

**Vérification** : `grep -rn "auth.jwt() ->> 'role'" supabase/` doit retourner ZÉRO résultat.

---

## Bug RBAC-2 — `create-villa` bloqué pour les proprios

### Fichier : `app/api/dashboard/create-villa/route.ts`

**Problème** : La route utilise probablement `requireAdmin()` — les propriétaires légitimes ne peuvent pas créer leur villa.

**Correction** :
```typescript
// Actuel (probable)
const session = await requireAdmin();

// Remplacer par
const session = await requireAuth(); // N'importe quel utilisateur connecté
// Le owner_id sera set automatiquement à session.user.id lors de l'INSERT
```

**ET vérifier dans le INSERT** :
```typescript
owner_id: session.user.id, // Forcé serveur, pas depuis le body
```

---

## Bug RBAC-3 — `delete-villa` bloqué pour les proprios

### Fichier : `app/api/dashboard/delete-villa/route.ts`

**Problème** : Même cause — `requireAdmin()` uniquement.

**Correction** : Pattern `isAdmin || owner_id` comme dans `update-villa` :
```typescript
const session = await requireAuth();
const { villaId } = await request.json();

// Vérifier que l'utilisateur est admin OU proprio
const { data: villa } = await supabase
  .from("villas")
  .select("owner_id")
  .eq("id", villaId)
  .single();

const isAdmin = session.user.user_metadata?.role === "admin";
const isOwner = villa?.owner_id === session.user.id;

if (!isAdmin && !isOwner) {
  return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
}

// DELETE...
```

---

## Bug RBAC-4 — Vérification cross-cutting : toutes les policies

### Fichier : `supabase/migrations/20260528_security_hardening.sql`

Ce fichier utilise déjà le bon pattern. S'en inspirer pour toute nouvelle policy.

**Action** : Relire toutes les policies de ce fichier et s'assurer qu'aucune n'utilise l'ancien pattern.

---

## Checklist

- [ ] `grep -rn "auth.jwt() ->> 'role'" supabase/` → 0 résultat
- [ ] `grep -rn "user_metadata.*role.*admin" supabase/` → 8+ résultats
- [ ] `create-villa` → proprio peut créer
- [ ] `delete-villa` → proprio peut supprimer sa propre villa
- [ ] `npm run build` passe
- [ ] Test : connexion en tant que proprio → création de villa OK
- [ ] Test : connexion en tant que user normal → accès admin refusé
