# Phase A — Fondations Admin Refonte

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nettoyer le code dupliqué, fixer la sécurité RLS, supprimer les re-exports, préparer les fondations pour les Phases B et C.

**Architecture:** Extraction vers des modules partagés (`lib/constants.ts`, `lib/utils.ts`, `hooks/useActiveBooking.ts`), mise à jour des types, migration Supabase.

**Tech Stack:** Next.js 15, TypeScript, Supabase, Tailwind CSS

---

### Task 1: Centraliser les constantes dans `lib/constants.ts`

**Files:**
- Create: `lib/constants.ts`
- Modify: `components/espace-client/RequestList.tsx:15-37`
- Modify: `app/(admin)/admin/demandes/page.tsx:7-22`
- Modify: `components/dashboard/NotificationBell.tsx:57-68`
- Modify: `app/espace-client/notifications/page.tsx:9-20`

- [ ] **Step 1: Créer `lib/constants.ts`**

```typescript
// ═══ Constantes partagées Kayvila — types, statuts, configs ═══

/* ─── Types de demandes ─────────────────────────────────── */
export const REQUEST_TYPE_LABELS: Record<string, string> = {
  early_checkin: "Early check-in",
  late_checkout: "Late check-out",
  date_change: "Modification de dates",
  issue: "Problème signalé",
  service: "Service ponctuel",
  cancellation: "Demande d'annulation",
  other: "Autre",
};

/* ─── Statuts de demandes ───────────────────────────────── */
export const REQUEST_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  resolved: "Résolu",
  rejected: "Refusé",
};

/* ─── Statuts de réservations ────────────────────────────── */
export const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-gray-50 text-gray-500 border-gray-200",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  paid: "Payée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

/* ─── Statuts de parrainage ──────────────────────────────── */
export const REFERRAL_STATUS_STYLES: Record<string, string> = {
  invited: "bg-amber-50 text-amber-700",
  registered: "bg-blue-50 text-blue-700",
  booked: "bg-emerald-50 text-emerald-700",
};

export const REFERRAL_STATUS_LABELS: Record<string, string> = {
  invited: "Invité",
  registered: "Inscrit",
  booked: "A réservé",
};

/* ─── Types de notifications (icônes en string) ──────────── */
export const NOTIF_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  villa_submission:   { icon: "Building2",     color: "text-gold",        bg: "bg-gold/10" },
  booking_new:        { icon: "Calendar",      color: "text-blue-500",    bg: "bg-blue-50" },
  booking_confirmed:  { icon: "CheckCheck",    color: "text-emerald-500", bg: "bg-emerald-50" },
  ical_error:         { icon: "AlertTriangle", color: "text-red-500",     bg: "bg-red-50" },
  availability_alert: { icon: "Bell",          color: "text-amber-500",   bg: "bg-amber-50" },
  system:             { icon: "Info",          color: "text-navy/60",     bg: "bg-navy/5" },
  request_update:     { icon: "MessageCircle", color: "text-gold",        bg: "bg-gold/10" },
  checkin_reminder:   { icon: "Key",           color: "text-emerald-500", bg: "bg-emerald-50" },
  checkout_reminder:  { icon: "DoorOpen",      color: "text-amber-500",   bg: "bg-amber-50" },
  new_message:        { icon: "MessageCircle", color: "text-blue-500",    bg: "bg-blue-50" },
};
```

- [ ] **Step 2: Remplacer dans `RequestList.tsx`**

Supprimer `TYPE_LABELS`, `STATUS_STYLES`, `STATUS_LABELS` (lignes 15-37). Importer depuis `@/lib/constants` :
```typescript
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_STYLES, REQUEST_STATUS_LABELS } from "@/lib/constants";
```
Remplacer les références : `TYPE_LABELS[type]` → `REQUEST_TYPE_LABELS[type]`, etc.

- [ ] **Step 3: Remplacer dans `admin/demandes/page.tsx`**

Supprimer `TYPE_LABELS` et `STATUS_STYLES` (lignes 7-22). Importer :
```typescript
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_STYLES } from "@/lib/constants";
```
Remplacer les références.

- [ ] **Step 4: Remplacer dans `notifications/page.tsx`**

Supprimer `TYPE_CONFIG` (lignes 9-20). Importer `NOTIF_TYPE_CONFIG` :
```typescript
import { NOTIF_TYPE_CONFIG } from "@/lib/constants";
```

- [ ] **Step 5: Remplacer dans `parrainage/page.tsx`**

Supprimer `STATUS_STYLES` et `STATUS_LABELS`. Importer :
```typescript
import { REFERRAL_STATUS_STYLES, REFERRAL_STATUS_LABELS } from "@/lib/constants";
```

- [ ] **Step 6: Commit**

```bash
git add lib/constants.ts components/espace-client/RequestList.tsx app/\(admin\)/admin/demandes/page.tsx app/espace-client/notifications/page.tsx app/espace-client/parrainage/page.tsx
git commit -m "refactor: centraliser constantes dans lib/constants.ts"
```

---

### Task 2: Unifier les utilitaires dans `lib/utils.ts`

**Files:**
- Modify: `lib/utils.ts` (ajouter `timeAgo`, `formatDate`)
- Modify: `components/dashboard/NotificationBell.tsx:49-55` (supprimer `timeAgo`, importer)
- Modify: `app/espace-client/notifications/page.tsx:22-28` (supprimer `timeAgo`, importer)
- Modify: `app/espace-client/checklist/page.tsx:34-87` (supprimer `generateICS` local, utiliser `lib/generate-ics`)

- [ ] **Step 1: Ajouter `timeAgo` et `formatDate` à `lib/utils.ts`**

Ajouter en fin de fichier :
```typescript
export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", opts);
}
```

- [ ] **Step 2: Remplacer dans `NotificationBell.tsx`**

Supprimer `timeAgo` local (lignes 49-55). Importer :
```typescript
import { timeAgo } from "@/lib/utils";
```

- [ ] **Step 3: Remplacer dans `notifications/page.tsx`**

Supprimer `timeAgo` local (lignes 22-28). Importer depuis `@/lib/utils`.

- [ ] **Step 4: Nettoyer `checklist/page.tsx`**

Supprimer `formatDateICS`, `generateICS`, `downloadICS`, `googleCalendarUrl`, `outlookCalendarUrl` locaux (lignes 34-87). Importer `downloadICS` depuis `@/lib/generate-ics`. Adapter le bouton ICS pour utiliser la version canonique.

- [ ] **Step 5: Commit**

```bash
git add lib/utils.ts components/dashboard/NotificationBell.tsx app/espace-client/notifications/page.tsx app/espace-client/checklist/page.tsx
git commit -m "refactor: unifier timeAgo/formatDate dans lib/utils, supprimer doublon ICS"
```

---

### Task 3: Hook `useActiveBooking`

**Files:**
- Create: `hooks/useActiveBooking.ts`
- Modify: `app/espace-client/page.tsx` (remplacer logique inline)
- Modify: `app/espace-client/demandes/page.tsx` (idem)
- Modify: `app/espace-client/checklist/page.tsx` (idem)
- Modify: `app/espace-client/messagerie/page.tsx` (idem)
- Modify: `app/espace-client/livret/page.tsx` (idem)
- Modify: `app/espace-client/documents/page.tsx` (idem)

- [ ] **Step 1: Créer `hooks/useActiveBooking.ts`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

interface UseActiveBookingResult {
  booking: any | null;
  villa: any | null;
  loading: boolean;
}

export function useActiveBooking(): UseActiveBookingResult {
  const supabase = getSupabaseBrowser();
  const [booking, setBooking] = useState<any | null>(null);
  const [villa, setVilla] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setLoading(false); return; }
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, villa_id, start_date, end_date, status, guest_name")
        .eq("guest_email", session.user.email)
        .eq("status", "confirmed")
        .gt("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(1);
      const b = bookings?.[0] ?? null;
      setBooking(b);
      if (b) {
        const { data: villas } = await supabase
          .from("villas")
          .select("id, name, location, image_url, wifi_name, wifi_password, checkout_instructions, local_recommendations, emergency_contacts")
          .eq("id", b.villa_id)
          .single();
        setVilla(villas ?? null);
      }
      setLoading(false);
    })();
  }, [supabase]);

  return { booking, villa, loading };
}
```

- [ ] **Step 2: Remplacer dans chaque page**

Pour chaque page, remplacer le bloc `useEffect` qui fetch le booking actif (avec `guest_email`) par :
```typescript
import { useActiveBooking } from "@/hooks/useActiveBooking";
// ...
const { booking, villa, loading } = useActiveBooking();
```

Adapter les noms de variables locaux (`upcomingBooking` → `booking`, etc.).

- [ ] **Step 3: Commit**

```bash
git add hooks/useActiveBooking.ts app/espace-client/page.tsx app/espace-client/demandes/page.tsx app/espace-client/checklist/page.tsx app/espace-client/messagerie/page.tsx app/espace-client/livret/page.tsx app/espace-client/documents/page.tsx
git commit -m "refactor: extraire useActiveBooking hook partagé"
```

---

### Task 4: Types TypeScript complets

**Fichier:** Modifier `types/supabase.ts`

- [ ] **Step 1: Ajouter les tables manquantes**

Ajouter dans l'interface `Tables` de `Database['public']` :

```typescript
requests: {
  Row: {
    id: string;
    booking_id: string | null;
    guest_id: string | null;
    type: string;
    status: string;
    message: string | null;
    admin_response: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: Record<string, Json>;
  Update: Record<string, Json>;
};
reviews: {
  Row: {
    id: string;
    booking_id: string;
    guest_id: string;
    villa_id: string;
    rating: number;
    comment: string | null;
    photos: Json | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
  Insert: Record<string, Json>;
  Update: Record<string, Json>;
};
referrals: {
  Row: {
    id: string;
    referrer_id: string;
    friend_email: string;
    friend_name: string | null;
    code: string;
    status: string;
    created_at: string;
  };
  Insert: Record<string, Json>;
  Update: Record<string, Json>;
};
wishlist: {
  Row: {
    id: string;
    user_id: string;
    villa_id: string;
    created_at: string;
  };
  Insert: Record<string, Json>;
  Update: Record<string, Json>;
};
chat_messages: {
  Row: {
    id: string;
    booking_id: string | null;
    villa_id: string | null;
    sender: string;
    message: string;
    metadata: Json | null;
    created_at: string;
  };
  Insert: Record<string, Json>;
  Update: Record<string, Json>;
};
support_tickets: {
  Row: {
    id: string;
    booking_id: string | null;
    guest_email: string;
    villa_id: string | null;
    issue_type: string | null;
    description: string;
    status: string;
    created_at: string;
    resolved_at: string | null;
  };
  Insert: Record<string, Json>;
  Update: Record<string, Json>;
};
```

- [ ] **Step 2: Supprimer les `@ts-ignore`**

Dans `checklist/page.tsx:182` : remplacer `// @ts-ignore` par un type explicite :
```typescript
await supabase.from("bookings").update({ checklist_state: next as any }).eq("id", booking.id);
```

Dans `TenantChatbot.tsx:87,121` : le `@ts-ignore` peut être retiré car `chat_messages` est maintenant dans les types.

- [ ] **Step 3: Commit**

```bash
git add types/supabase.ts app/espace-client/checklist/page.tsx components/espace-client/TenantChatbot.tsx
git commit -m "fix: types TypeScript complets, suppression @ts-ignore"
```

---

### Task 5: Migration RLS `requests` + fix `villa_submissions`

**Files:**
- Create: `supabase/migrations/20260511_rls_requests.sql`
- Create: `supabase/migrations/20260511_fix_villa_submissions_rls.sql`

- [ ] **Step 1: Créer `20260511_rls_requests.sql`**

```sql
alter table public.requests enable row level security;

-- Le guest voit/modifie ses propres demandes
create policy "guest_own_requests"
  on public.requests for all
  to authenticated
  using (guest_id = auth.uid());

-- L'admin voit/modifie toutes les demandes
create policy "admin_all_requests"
  on public.requests for all
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));
```

- [ ] **Step 2: Créer `20260511_fix_villa_submissions_rls.sql`**

```sql
-- Supprimer l'ancienne policy trop permissive
drop policy if exists "villa_submissions_auth" on public.villa_submissions;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260511_rls_requests.sql supabase/migrations/20260511_fix_villa_submissions_rls.sql
git commit -m "fix: RLS requests + nettoyage villa_submissions"
```

---

### Task 6: Supprimer les 3 re-exports + menu admin

**Files:**
- Delete: `app/(admin)/admin/hub-classique/page.tsx`
- Delete: `app/(admin)/admin/assistant/page.tsx`
- Delete: `app/(admin)/admin/submissions/page.tsx`
- Modify: `components/dashboard/admin/AdminMenuItems.ts`

- [ ] **Step 1: Supprimer les 3 fichiers**

```bash
rm app/\(admin\)/admin/hub-classique/page.tsx
rm app/\(admin\)/admin/assistant/page.tsx
rm app/\(admin\)/admin/submissions/page.tsx
```

- [ ] **Step 2: Mettre à jour le menu admin**

Supprimer les 3 entrées du menu (`Hub classique`, `Assistant`, `Soumissions`) dans `AdminMenuItems.ts` :
```typescript
export const adminMenuItems: MenuItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard" },
  { label: "Villas", href: "/admin/villas", icon: "Building2" },
  { label: "Réservations", href: "/admin/reservations", icon: "CalendarDays" },
  { label: "Clients", href: "/admin/clients", icon: "UserCircle" },
  { label: "Demandes", href: "/admin/demandes", icon: "ClipboardList" },
  { label: "Avis", href: "/admin/avis", icon: "Star" },
  { label: "Messagerie", href: "/admin/messagerie", icon: "MessageCircle" },
  { label: "Revenus", href: "/admin/revenus", icon: "DollarSign" },
  { label: "Sync OTA", href: "/admin/sync-ota", icon: "Zap" },
  { label: "Paramètres", href: "/admin/parametres", icon: "Settings" },
];
```

(Sync OTA reste mais avec son propre icône, Propriétaires est retiré du menu — déplacé dans le Hub Classique futur)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: supprimer re-exports proprio, menu admin 10 entrées"
```

---

### Task 7: Conciergerie dynamique

**Files:**
- Create: `supabase/migrations/20260511_conciergerie_settings.sql`
- Modify: `app/espace-client/conciergerie/page.tsx`
- Modify: `app/(admin)/admin/parametres/page.tsx`

- [ ] **Step 1: Créer la migration**

```sql
create table if not exists public.conciergerie_settings (
  id smallint primary key default 1 check (id = 1),
  emergency_phone text not null default '+596 696 00 00 00',
  contact_phone text not null default '+596 696 00 00 00',
  contact_email text not null default 'contact@kayvila.com',
  opening_hours jsonb default '[{"day":"Lundi – Vendredi","hours":"8h00 – 20h00"},{"day":"Samedi","hours":"9h00 – 18h00"},{"day":"Dimanche & jours fériés","hours":"Urgences uniquement"}]'::jsonb,
  services jsonb default '[{"label":"Ménage supplémentaire","price":"À partir de 80 €","desc":"Nettoyage complet en cours de séjour"},{"label":"Changement de linge","price":"À partir de 40 €","desc":"Draps, serviettes, torchons renouvelés"},{"label":"Remplissage gaz / eau","price":"Sur devis","desc":"Bouteille de gaz ou bonbonne d'eau remplacée"}]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.conciergerie_settings enable row level security;
create policy "public_read" on public.conciergerie_settings for select using (true);
create policy "admin_update" on public.conciergerie_settings for update to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
```

- [ ] **Step 2: Insert initial + rendre la page conciergerie dynamique**

Modifier `app/espace-client/conciergerie/page.tsx` : remplacer les données hardcodées par un fetch Supabase. Ajouter un `useEffect` qui lit `conciergerie_settings`, avec fallback sur les valeurs hardcodées si la table est vide.

```typescript
"use client";
// ...imports existants + useEffect + useState
const [settings, setSettings] = useState<any>(null);
useEffect(() => {
  if (!supabase) return;
  supabase.from("conciergerie_settings").select("*").single().then(({ data }) => setSettings(data));
}, [supabase]);
// Remplacer CONTACTS, HOURS, services par settings.emergency_phone, settings.opening_hours, etc.
```

- [ ] **Step 3: Ajouter l'édition dans les paramètres admin**

Dans `app/(admin)/admin/parametres/page.tsx`, ajouter une section "Conciergerie" avec des champs éditables (téléphone urgence, téléphone contact, email, horaires, services) qui upsert dans `conciergerie_settings`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260511_conciergerie_settings.sql app/espace-client/conciergerie/page.tsx app/\(admin\)/admin/parametres/page.tsx
git commit -m "feat: conciergerie dynamique via conciergerie_settings"
```

---

## Vérification finale

1. `npm run build` sans erreurs
2. `grep -r "TYPE_LABELS" app/ components/` ne retourne que des imports depuis `@/lib/constants`
3. `grep -r "@ts-ignore" app/ components/` ne retourne rien
4. `grep -r "function timeAgo" app/ components/` ne retourne rien
5. `grep -r "function formatDate" app/ components/` ne retourne rien (sauf définition dans lib/utils.ts)
6. RLS activée sur `requests` (vérifier via Supabase MCP `get_advisors`)
7. Migration `conciergerie_settings` appliquée
