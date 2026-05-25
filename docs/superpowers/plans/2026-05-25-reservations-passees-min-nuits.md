# Réservations Passées + Minimum de Nuits — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le filtre « Passées » dans les réservations admin, un drawer d'historique par villa, et un champ `min_nights` éditable par villa avec blocage au checkout.

**Architecture:** 8 tâches — migration SQL, label constantes, filtre passées, drawer villas, champ min_nights formulaire, blocage checkout, commit final. Chaque tâche touche 1-2 fichiers max.

**Tech Stack:** Next.js 15, Supabase, TypeScript, Tailwind CSS, React hooks

**Spec:** `docs/superpowers/specs/2026-05-25-reservations-passees-min-nuits-design.md`

---

### Task 1: Migration SQL — colonne `min_nights`

**Files:**
- Create: `supabase/migration-min-nights.sql`

- [ ] **Step 1: Écrire la migration**

```sql
-- Migration: ajout min_nights aux villas
-- Date: 2026-05-25

ALTER TABLE villas ADD COLUMN IF NOT EXISTS min_nights INTEGER NOT NULL DEFAULT 1;
```

- [ ] **Step 2: Appliquer la migration via Supabase MCP**

Utiliser `mcp__claude_ai_Supabase__apply_migration` avec le project_id `zwgqikqddxbyjbbubtcg`, nom `add_min_nights_to_villas`, et la query ci-dessus.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-min-nights.sql
git commit -m "feat: add min_nights column to villas table"
```

---

### Task 2: Label « Passées » dans les constantes

**File:**
- Modify: `lib/constants.ts`

- [ ] **Step 1: Ajouter le label**

Ligne 38, dans `BOOKING_STATUS_LABELS`, ajouter :

```ts
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  paid: "Payée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  past: "Passées",
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add past label to BOOKING_STATUS_LABELS"
```

---

### Task 3: Filtre « Passées » dans la page Réservations

**File:**
- Modify: `app/(admin)/admin/reservations/page.tsx`

- [ ] **Step 1: Ajouter `"past"` dans la liste des filtres et la logique de query**

Ligne 28, après `"cancelled"`, ajouter `"past"`. Dans `fetchBookings`, ligne 31, adapter la logique :

```tsx
// Ligne 18 — ajouter le state pour le filtre villa optionnel
const [villaFilter, setVillaFilter] = useState<string | null>(null);

// Dans fetchBookings (ligne 25-31), remplacer par :
const today = new Date().toISOString().split("T")[0];

let query = supabase
  .from("bookings")
  .select("id, guest_name, guest_email, villa_id, start_date, end_date, total_price_cents, status, villas(name)", { count: "exact" })
  .order("start_date", { ascending: false })
  .range(from, to);

if (filter === "past") {
  query = query.eq("status", "confirmed").lt("end_date", today);
} else if (filter !== "all") {
  query = query.eq("status", filter);
}

if (villaFilter) {
  query = query.eq("villa_id", villaFilter);
}
```

- [ ] **Step 2: Lire le paramètre `villa` depuis l'URL au chargement**

Au début du composant, après les useState, ajouter :

```tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const villaParam = params.get("villa");
  if (villaParam) {
    setVillaFilter(villaParam);
    setFilter("past");
    setLoading(true);
  }
}, []);
```

- [ ] **Step 3: Ajouter le bouton « Passées » dans les filtres**

Remplacer la ligne 54 (le `.map` actuel) par :

```tsx
{["all", "pending", "confirmed", "cancelled", "past"].map((f) => (
  <button key={f} onClick={() => { setFilter(f); setPage(1); setLoading(true); }}
    className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] rounded-full transition-colors ${filter === f ? "bg-navy text-white" : "bg-white border border-navy/10 text-navy/50 hover:border-navy/30"}`}>
    {f === "all" ? "Tous" : BOOKING_STATUS_LABELS[f] ?? f}
  </button>
))}
```

- [ ] **Step 4: Masquer les boutons Confirmer/Annuler pour le filtre « Passées »**

Dans le `<td>` des actions (lignes 103-122), wrapper les boutons Confirmer et Annuler dans une condition :

```tsx
{filter !== "past" && (
  <>
    {b.status === "pending" && (
      <button onClick={() => handleAction(b.id, "confirmed")}
        className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
        Confirmer
      </button>
    )}
    {(b.status === "pending" || b.status === "confirmed") && (
      <button onClick={() => handleAction(b.id, "cancelled")}
        className="text-[10px] font-semibold px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">
        Annuler
      </button>
    )}
  </>
)}
```

- [ ] **Step 5: Commit**

```bash
git add app/\(admin\)/admin/reservations/page.tsx
git commit -m "feat: add past filter + villa query param to admin reservations"
```

---

### Task 4: Drawer d'historique par villa

**Files:**
- Create: `components/dashboard/VillaPastBookingsDrawer.tsx`
- Create: `components/dashboard/VillaTableRow.tsx`
- Modify: `app/(admin)/admin/villas/page.tsx`

- [ ] **Step 1: Créer le composant drawer**

```tsx
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";

interface VillaPastBookingsDrawerProps {
  villaId: string;
  villaName: string;
  open: boolean;
  onClose: () => void;
}

interface PastBooking {
  id: string;
  guest_name: string | null;
  start_date: string;
  end_date: string;
  total_price_cents: number | null;
  source: string | null;
}

export function VillaPastBookingsDrawer({ villaId, villaName, open, onClose }: VillaPastBookingsDrawerProps) {
  const [bookings, setBookings] = useState<PastBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchPastBookings = async () => {
      setLoading(true);
      const supabase = getSupabaseBrowser();
      if (!supabase) return;

      const today = new Date().toISOString().split("T")[0];

      const { data } = await supabase
        .from("bookings")
        .select("id, guest_name, start_date, end_date, total_price_cents, source")
        .eq("villa_id", villaId)
        .eq("status", "confirmed")
        .lt("end_date", today)
        .order("end_date", { ascending: false });

      setBookings(data ?? []);
      setLoading(false);
    };

    fetchPastBookings();
  }, [open, villaId]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-navy/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[480px] bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy/5 bg-white px-6 py-5">
          <div>
            <h2 className="font-display text-xl text-navy">{villaName}</h2>
            <p className="text-xs text-navy/40">Historique des réservations passées</p>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/10 text-navy/40 hover:text-navy hover:border-navy/20 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-navy/40">Aucune réservation passée pour cette villa.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-navy/5 text-[10px] font-bold uppercase tracking-[0.15em] text-navy/40">
                  <th className="pb-3 font-bold">Client</th>
                  <th className="pb-3 font-bold">Dates</th>
                  <th className="pb-3 font-bold">Nuits</th>
                  <th className="pb-3 font-bold">Montant</th>
                  <th className="pb-3 font-bold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.04]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-navy/[0.01]">
                    <td className="py-3 pr-2">
                      <span className="text-sm font-medium text-navy">{b.guest_name || "Anonyme"}</span>
                    </td>
                    <td className="py-3 pr-2">
                      <span className="text-xs text-navy/60">
                        {formatDate(b.start_date, { day: "numeric", month: "short" })} – {formatDate(b.end_date, { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="py-3 pr-2">
                      <span className="text-xs text-navy/60">
                        {Math.round((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000)} n.
                      </span>
                    </td>
                    <td className="py-3 pr-2">
                      <span className="text-sm font-medium text-navy">{formatCurrency(b.total_price_cents ?? 0)}</span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${b.source === "airbnb" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                        {b.source || "Direct"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Modifier la page Villas pour rendre la colonne Résa cliquable**

`app/(admin)/admin/villas/page.tsx` est un server component. Ajouter un wrapper client pour gérer le state du drawer.

Créer un composant inline ou wrapper. Modifier le fichier :

1. Ajouter l'import du drawer en haut :
```tsx
import { VillaPastBookingsDrawer } from "@/components/dashboard/VillaPastBookingsDrawer";
```

2. Transformer la page en composant hybride : ajouter `"use client"` en haut ET garder le fetch dans une fonction async appelée au mount via `useEffect`. Ou, plus simple : wrapper client séparé.

**Approche retenue : extraire le `<tbody>` dans un composant client `VillaTableBody`.**

Remplacer la ligne 129 (`<td className="px-4 py-3 text-gray-600">{villa.bookingCount}</td>`) par ce qui permet de cliquer. Mais comme le composant actuel est server, on va plutôt :

Créer un composant `VillaTableRow` "use client" qui gère le clic sur Résa.

**Option plus simple :** passer la page entière en client component. Le fetch initial est fait côté serveur, on le convertit en `useEffect`. Mais c'est lourd.

**Approche la plus propre :** créer `components/dashboard/VillaTableRow.tsx` :

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { VillaPastBookingsDrawer } from "@/components/dashboard/VillaPastBookingsDrawer";

interface VillaRow {
  id: string;
  name: string;
  location: string | null;
  price_per_night: number;
  capacity: number | null;
  collection_tier: string | null;
  owner_id: string | null;
  is_published: boolean;
  image_url: string | null;
  owner_name: string | null;
  bookingCount: number;
  confirmedRevenue: number;
}

export function VillaTableRow({ villa }: { villa: VillaRow }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          {villa.image_url ? (
            <img
              src={villa.image_url}
              alt=""
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-navy/5">
              <Building2 className="h-5 w-5 text-navy/20" aria-hidden />
            </div>
          )}
        </td>
        <td className="px-4 py-3 font-medium text-gray-900">{villa.name}</td>
        <td className="px-4 py-3 text-gray-600">{villa.location ?? "—"}</td>
        <td className="px-4 py-3 text-gray-900">
          {villa.price_per_night.toLocaleString("fr-FR")} €
        </td>
        <td className="px-4 py-3 text-gray-600">
          {villa.capacity != null ? `${villa.capacity} pers.` : "—"}
        </td>
        <td className="px-4 py-3">
          {villa.collection_tier ? (
            <span className="text-sm font-medium text-gold">{villa.collection_tier}</span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          {villa.owner_name ? (
            <Link
              href={`/admin/membres/${villa.owner_id}`}
              className="text-sm font-medium text-gold hover:text-gold/80 transition-colors"
            >
              {villa.owner_name}
            </Link>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              villa.is_published
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {villa.is_published ? "Oui" : "Non"}
          </span>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-sm font-medium text-gold hover:text-gold/70 transition-colors underline underline-offset-2"
          >
            {villa.bookingCount}
          </button>
        </td>
        <td className="px-4 py-3 font-medium text-gray-900">
          {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }).format(villa.confirmedRevenue)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/villas/${villa.id}`}
              className="text-sm text-gold hover:text-gold/80 font-medium"
            >
              Modifier
            </Link>
            <a
              href={`/villas/${villa.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-navy/40 hover:text-navy transition-colors"
              aria-label={`Voir ${villa.name} sur le site`}
            >
              Voir ↗
            </a>
          </div>
        </td>
      </tr>
      <VillaPastBookingsDrawer
        villaId={villa.id}
        villaName={villa.name}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
```

- [ ] **Step 3: Modifier `app/(admin)/admin/villas/page.tsx` pour utiliser le composant client**

Dans la page, remplacer le contenu du `<tbody>` (lignes 128-209) par l'import et l'utilisation de `VillaTableRow` :

En haut, ajouter l'import :
```tsx
import { VillaTableRow } from "@/components/dashboard/VillaTableRow";
```

Remplacer le `<tbody>` (lignes 128-209) par :
```tsx
<tbody className="divide-y divide-gray-100">
  {villas.map((villa) => (
    <VillaTableRow key={villa.id} villa={villa} />
  ))}
</tbody>
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/VillaPastBookingsDrawer.tsx components/dashboard/VillaTableRow.tsx app/\(admin\)/admin/villas/page.tsx
git commit -m "feat: past bookings drawer per villa in admin villas list"
```

---

### Task 5: Champ `min_nights` dans le formulaire d'édition villa

**Files:**
- Modify: `components/dashboard/villa-editor/VillaFormFields.tsx`
- Modify: `components/dashboard/proprio/VillaEditorForm.tsx`

- [ ] **Step 1: Ajouter le champ dans VillaFormFields**

Dans `VillaFormFields.tsx`, juste après le bloc « Prix par nuit » (ligne 69), ajouter :

```tsx
{/* Nuits minimum */}
<div>
  <FieldLabel htmlFor="vf-min-nights" label="Nuits minimum" />
  <Input
    id="vf-min-nights"
    type="number"
    min="1"
    max="30"
    step="1"
    defaultValue={form.min_nights as string || "1"}
    placeholder="1"
    className="text-sm"
  />
</div>
```

- [ ] **Step 2: Capturer `min_nights` dans le handleSave de VillaEditorForm**

Dans `VillaEditorForm.tsx` :

1. Ajouter `"vf-min-nights"` à la liste `fields` (ligne 41-55)

2. Ajouter un case dans le switch (ligne 69-109) :
```tsx
case "min-nights":
  payload.min_nights = Number(value) || 1;
  break;
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/villa-editor/VillaFormFields.tsx components/dashboard/proprio/VillaEditorForm.tsx
git commit -m "feat: add min_nights field to villa editor form"
```

---

### Task 6: Blocage au checkout si séjour < min_nights

**File:**
- Modify: `components/booking/CheckoutView.tsx`

- [ ] **Step 1: Ajouter la validation min_nights dans handleConfirmBooking**

Dans `CheckoutView.tsx`, dans la fonction `handleConfirmBooking` (ligne 70), après la validation email/nom (ligne 82), ajouter :

```tsx
// Validation nuit minimum
const nights = Math.round(
  (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
);
const minNights = villa?.min_nights ?? 1;
if (nights < minNights) {
  setError(`Cette villa nécessite un séjour minimum de ${minNights} nuit${minNights > 1 ? "s" : ""}.`);
  setCheckoutLoading(false);
  return;
}
```

Note : s'assurer que cette validation est placée AVANT `setCheckoutLoading(true)` pour éviter de setter loading sans le reset. Actuellement `setCheckoutLoading(true)` est à la ligne 85, donc la validation doit être AVANT cette ligne.

- [ ] **Step 2: Commit**

```bash
git add components/booking/CheckoutView.tsx
git commit -m "feat: block checkout when stay is shorter than villa min_nights"
```

---

### Task 7: Vérification et tests manuels

- [ ] **Step 1: Vérifier le serveur local**

```bash
lsof -i :3001 -P | grep LISTEN
```
Si pas de process, relancer : `npx next dev -p 3001` (via le workaround node script si nécessaire).

- [ ] **Step 2: Tester le filtre Passées**

1. Aller sur `http://localhost:3001/admin/reservations`
2. Cliquer sur « Passées » → vérifier que seules les réservations confirmed avec end_date passée s'affichent
3. Vérifier que les boutons Confirmer/Annuler sont masqués

- [ ] **Step 3: Tester le drawer villas**

1. Aller sur `http://localhost:3001/admin/villas`
2. Cliquer sur le nombre dans la colonne « Résa » d'une villa ayant des réservations passées
3. Vérifier que le drawer s'ouvre avec la liste
4. Fermer le drawer (clic ✕ ou clic extérieur)

- [ ] **Step 4: Tester min_nights édition**

1. Aller sur `http://localhost:3001/admin/villas/[id]` d'une villa
2. Vérifier que le champ « Nuits minimum » apparaît dans le formulaire
3. Modifier la valeur, sauvegarder
4. Rafraîchir et vérifier que la valeur persiste

- [ ] **Step 5: Tester le blocage checkout**

1. Aller sur la page d'une villa avec `min_nights = 3`
2. Sélectionner un séjour de 2 nuits
3. Arriver au checkout → vérifier le message d'erreur « Cette villa nécessite un séjour minimum de 3 nuits. »
4. Sélectionner un séjour de 3+ nuits → vérifier que ça passe

---

### Task 8: Commit final et nettoyage

- [ ] **Step 1: Vérifier le statut git**

```bash
git status
```

- [ ] **Step 2: Commit final si nécessaire**

```bash
git add -A
git commit -m "feat: past bookings filter + drawer + min_nights (2026-05-25)"
```
