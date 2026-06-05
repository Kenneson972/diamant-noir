# Hub Admin Unifié — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unifier le hub admin villas : tableau enrichi avec métriques, éditeur complet sur `/admin/villas/[id]`, redirect depuis hub-classique, et fix API ownership pour les admins.

**Architecture:** Quatre changements indépendants et séquentiels. Tâche 1 = tableau enrichi (server component). Tâche 2 = éditeur complet `/admin/villas/[id]` (server + client component `AdminVillaEditClient`). Tâche 3 = redirect hub-classique (trivial). Tâche 4 = fix API update-villa (ownership check bypass pour admins).

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (supabaseAdmin), Tailwind CSS, composants villa-editor existants (`VillaEditorForm`, `VillaBookingsRegistry`, `VillaImageManagerWrapper`, `PlanningIcalSyncCard`, `IcalConnectivityStatus`, `VillaPublishChecklist`).

---

## File Map

| Fichier | Action |
|---|---|
| `app/(admin)/admin/villas/page.tsx` | Modifier — enrichir tableau (image, capacity, tier, résa, revenus) |
| `app/(admin)/admin/villas/[id]/page.tsx` | Modifier — remplacer read-only par éditeur complet 2 colonnes |
| `app/(admin)/admin/villas/[id]/AdminVillaEditClient.tsx` | Créer — composant client gérant état filtres bookings + iCal |
| `app/(admin)/admin/hub-classique/page.tsx` | Modifier — remplacer par redirect `/admin/villas` |
| `app/api/dashboard/update-villa/route.ts` | Modifier — bypasser check ownership pour les admins |

---

## Task 1 : Tableau enrichi `/admin/villas`

**Files:**
- Modify: `app/(admin)/admin/villas/page.tsx`

**Context:**  
Le fichier actuel fetch les villas avec `select("id, name, location, price_per_night, owner_id, is_published")` et affiche 6 colonnes (Nom, Localisation, Prix/nuit, Propriétaire, Publiée, Actions).  
On doit ajouter : vignette 40×40, capacity, collection_tier, bookingCount, confirmedRevenue, lien "Voir ↗" externe.  
La logique bookings (groupée par villa_id) vient du hub-classique actuel — même pattern `supabaseAdmin()`.

- [ ] **Step 1 : Lire le fichier actuel**

```bash
cat "app/(admin)/admin/villas/page.tsx"
```

- [ ] **Step 2 : Mettre à jour l'interface VillaRow**

Remplacer l'interface actuelle par :

```typescript
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
```

- [ ] **Step 3 : Mettre à jour `getVillas()`**

Remplacer la fonction `getVillas()` en entier par :

```typescript
async function getVillas(): Promise<VillaRow[]> {
  const supabase = supabaseAdmin();

  const { data } = await supabase
    .from("villas")
    .select("id, name, location, price_per_night, capacity, collection_tier, owner_id, is_published, image_url")
    .order("created_at", { ascending: false });

  const villas = data ?? [];
  if (villas.length === 0) return [];

  const villaIds = villas.map((v) => v.id);

  const [ownersResult, bookingsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("role", ["owner", "proprio"]),
    supabase
      .from("bookings")
      .select("villa_id, total_price_cents, status")
      .in("villa_id", villaIds),
  ]);

  const ownersMap: Record<string, string> = {};
  for (const p of ownersResult.data ?? []) {
    ownersMap[p.id] = p.full_name ?? p.email;
  }

  const bookingByVilla: Record<string, any[]> = {};
  for (const b of bookingsResult.data ?? []) {
    if (!bookingByVilla[b.villa_id]) bookingByVilla[b.villa_id] = [];
    bookingByVilla[b.villa_id].push(b);
  }

  return villas.map((v) => {
    const vBookings = bookingByVilla[v.id] ?? [];
    const confirmedRevenue =
      vBookings
        .filter((b) => b.status === "confirmed")
        .reduce((s, b) => s + (b.total_price_cents ?? 0), 0) / 100;
    return {
      ...v,
      owner_name: v.owner_id ? (ownersMap[v.owner_id] ?? null) : null,
      bookingCount: vBookings.length,
      confirmedRevenue,
    };
  });
}
```

Note : on utilise `supabaseAdmin()` directement (pas `getSupabaseServer()`) pour avoir accès aux bookings de toutes les villas via le service role. Supprimer la fonction `getOwnersMap()` (elle est absorbée dans `getVillas()`).

- [ ] **Step 4 : Mettre à jour les imports**

En tête de fichier, s'assurer que seuls ces imports sont présents (supprimer `getSupabaseServer` qui n'est plus utilisé) :

```typescript
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Building2, Home, Plus } from "lucide-react";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
```

- [ ] **Step 5 : Remplacer le JSX du tableau**

Remplacer tout le JSX `<table>` (thead + tbody) par :

```tsx
<div className="overflow-hidden rounded-lg border bg-white">
  <table className="w-full text-left text-sm">
    <thead className="bg-navy/[0.02]">
      <tr>
        <th className="px-4 py-3 font-medium text-navy w-12"></th>
        <th className="px-4 py-3 font-medium text-navy">Nom</th>
        <th className="px-4 py-3 font-medium text-navy">Localisation</th>
        <th className="px-4 py-3 font-medium text-navy">Prix / nuit</th>
        <th className="px-4 py-3 font-medium text-navy">Capacité</th>
        <th className="px-4 py-3 font-medium text-navy">Tier</th>
        <th className="px-4 py-3 font-medium text-navy">Propriétaire</th>
        <th className="px-4 py-3 font-medium text-navy">Publiée</th>
        <th className="px-4 py-3 font-medium text-navy">Résa</th>
        <th className="px-4 py-3 font-medium text-navy">Revenus</th>
        <th className="px-4 py-3 font-medium text-navy">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      {villas.map((villa) => (
        <tr key={villa.id} className="hover:bg-gray-50">
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
          <td className="px-4 py-3 text-gray-600">{villa.bookingCount}</td>
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
      ))}
    </tbody>
  </table>
</div>
```

- [ ] **Step 6 : Vérifier le build TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -30
```

Attendu : aucune erreur sur ce fichier.

- [ ] **Step 7 : Commit**

```bash
git add "app/(admin)/admin/villas/page.tsx"
git commit -m "feat(admin): tableau villas enrichi — image, capacité, tier, résa, revenus"
```

---

## Task 2 : Éditeur complet `/admin/villas/[id]`

**Files:**
- Modify: `app/(admin)/admin/villas/[id]/page.tsx`
- Create: `app/(admin)/admin/villas/[id]/AdminVillaEditClient.tsx`

**Context:**  
La page actuelle est en lecture seule (affichage des données + bouton "Éditeur complet (hub classique)" qui redirige vers `/dashboard/villas/{id}` — inaccessible aux admins).  
On va la transformer en éditeur complet 2 colonnes avec :
- Colonne principale : `VillaEditorForm` (fields + amenities + bouton save sticky) + `VillaImageManagerWrapper` + `VillaBookingsRegistry` + `PlanningIcalSyncCard` + `IcalConnectivityStatus`
- Sidebar : `VillaPublishChecklist` + bouton "Voir sur le site ↗" + lien "Retour aux villas"

Les composants `VillaBookingsRegistry`, `PlanningIcalSyncCard`, `IcalConnectivityStatus` sont clients et nécessitent de l'état (filtres bookings, iCal saving). On crée un composant client `AdminVillaEditClient` pour gérer cet état côté client. Le composant reçoit `villa` et `bookings` depuis le server component.

**Interfaces attendues :**
- `VillaEditorForm` : `{ villa: Record<string, unknown> }` — gère ses propres champs via DOM + appelle `/api/dashboard/update-villa`
- `VillaImageManagerWrapper` : `{ villaId: string, initialPhotos: string[] }`
- `VillaBookingsRegistry` : voir props complètes ci-dessous (Task 2, Step 3)
- `PlanningIcalSyncCard` : `{ lastLine, body, tone, saving, onSync }`
- `IcalConnectivityStatus` : `{ lastLine, body, tone }`
- `VillaPublishChecklist` : `{ items: VillaPublishChecklistItem[] }`

- [ ] **Step 1 : Créer `AdminVillaEditClient.tsx`**

Créer `app/(admin)/admin/villas/[id]/AdminVillaEditClient.tsx` :

```tsx
"use client";

import { useState, useCallback } from "react";
import { VillaEditorForm } from "@/components/dashboard/proprio/VillaEditorForm";
import { VillaImageManagerWrapper } from "@/components/dashboard/villa-editor/VillaImageManagerWrapper";
import { VillaBookingsRegistry } from "@/components/dashboard/villa-editor/VillaBookingsRegistry";
import type { VillaBookingRow } from "@/components/dashboard/villa-editor/VillaBookingsRegistry";
import { PlanningIcalSyncCard } from "@/components/dashboard/villa-editor/PlanningIcalSyncCard";
import { IcalConnectivityStatus } from "@/components/dashboard/villa-editor/IcalConnectivityStatus";

interface AdminVillaEditClientProps {
  villa: Record<string, unknown>;
  bookings: VillaBookingRow[];
}

export function AdminVillaEditClient({ villa, bookings }: AdminVillaEditClientProps) {
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"all" | "confirmed" | "pending">("all");
  const [bookingSourceFilter, setBookingSourceFilter] = useState<"all" | "airbnb" | "other">("all");
  const [icalSaving, setIcalSaving] = useState(false);

  const filteredBookings = bookings.filter((b) => {
    const matchSearch =
      !bookingSearch ||
      (b.guest_name ?? "").toLowerCase().includes(bookingSearch.toLowerCase());
    const matchStatus =
      bookingStatusFilter === "all" || b.status === bookingStatusFilter;
    const matchSource =
      bookingSourceFilter === "all" ||
      (bookingSourceFilter === "airbnb" ? b.source === "airbnb" : b.source !== "airbnb");
    return matchSearch && matchStatus && matchSource;
  });

  const handleExportCsv = useCallback(() => {
    const rows = filteredBookings.map((b) =>
      [b.guest_name ?? "", b.start_date, b.end_date, b.status ?? "", b.source ?? ""].join(";")
    );
    const csv = ["Nom;Arrivée;Départ;Statut;Source", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservations-${villa.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredBookings, villa.id]);

  const handleIcalSync = useCallback(async () => {
    setIcalSaving(true);
    try {
      await fetch(`/api/villa/sync-ical?villaId=${villa.id}`, { method: "POST" });
    } finally {
      setIcalSaving(false);
    }
  }, [villa.id]);

  const icalUrl = villa.ical_url as string | null | undefined;
  const icalTone = icalUrl ? "ok" : "neutral";
  const icalBody = icalUrl
    ? `URL iCal connectée : ${icalUrl}`
    : "Aucune URL iCal configurée. Renseignez-la dans les informations générales.";

  return (
    <div className="space-y-8">
      {/* Section 1 : Formulaire + équipements + save sticky */}
      <VillaEditorForm villa={villa} />

      {/* Section 2 : Photos */}
      <VillaImageManagerWrapper
        villaId={villa.id as string}
        initialPhotos={
          Array.isArray(villa.photos)
            ? (villa.photos as string[])
            : villa.image_url
              ? [villa.image_url as string]
              : []
        }
      />

      {/* Section 3 : Registre réservations */}
      <VillaBookingsRegistry
        bookingsTotal={bookings.length}
        filteredBookings={filteredBookings}
        bookingSearch={bookingSearch}
        onBookingSearchChange={setBookingSearch}
        bookingStatusFilter={bookingStatusFilter}
        onBookingStatusFilterChange={setBookingStatusFilter}
        bookingSourceFilter={bookingSourceFilter}
        onBookingSourceFilterChange={setBookingSourceFilter}
        onExportCsv={handleExportCsv}
        renderRowActions={() => null}
      />

      {/* Section 4 : iCal */}
      <PlanningIcalSyncCard
        lastLine={icalUrl ? "iCal connecté" : null}
        body={icalBody}
        tone={icalTone}
        saving={icalSaving}
        onSync={handleIcalSync}
      />
      <IcalConnectivityStatus
        lastLine={icalUrl ? "Synchronisation active" : null}
        body={icalUrl ? "Les disponibilités sont synchronisées avec Airbnb." : "Pas de synchronisation configurée."}
        tone={icalTone}
      />
    </div>
  );
}
```

- [ ] **Step 2 : Réécrire `app/(admin)/admin/villas/[id]/page.tsx`**

Remplacer le fichier entier par :

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { VillaPublishChecklist } from "@/components/dashboard/villa-editor/VillaPublishChecklist";
import type { VillaPublishChecklistItem } from "@/components/dashboard/villa-editor/VillaPublishChecklist";
import { AdminVillaEditClient } from "./AdminVillaEditClient";
import type { VillaBookingRow } from "@/components/dashboard/villa-editor/VillaBookingsRegistry";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin()
    .from("villas")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return {
    title: data?.name
      ? `${data.name} — Administration Kayvila`
      : "Villa — Administration Kayvila",
  };
}

export default async function AdminVillaEditPage({ params }: PageProps) {
  const { id } = await params;

  const [villaResult, bookingsResult] = await Promise.all([
    supabaseAdmin().from("villas").select("*").eq("id", id).single(),
    supabaseAdmin()
      .from("bookings")
      .select("id, guest_name, start_date, end_date, source, price, total_price_cents, payment_status, status")
      .eq("villa_id", id)
      .order("start_date", { ascending: false }),
  ]);

  if (villaResult.error || !villaResult.data) notFound();

  const villa = villaResult.data;
  const bookings: VillaBookingRow[] = (bookingsResult.data ?? []).map((b) => ({
    id: b.id,
    guest_name: b.guest_name,
    start_date: b.start_date,
    end_date: b.end_date,
    source: b.source,
    price: b.price ?? 0,
    total_price_cents: b.total_price_cents,
    payment_status: b.payment_status,
    status: b.status,
  }));

  const checklistItems: VillaPublishChecklistItem[] = [
    { id: "name",  ok: !!villa.name,            label: "Nom renseigné" },
    { id: "price", ok: !!villa.price_per_night,  label: "Prix par nuit défini" },
    { id: "desc",  ok: !!villa.description,      label: "Description rédigée" },
    { id: "img",   ok: !!villa.image_url,        label: "Photo principale" },
    { id: "loc",   ok: !!villa.location,         label: "Localisation" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/villas"
          className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Toutes les villas
        </Link>
        <h1 className="font-display text-2xl font-bold text-navy">{villa.name}</h1>
      </div>

      {/* Layout 2 colonnes */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2">
          <AdminVillaEditClient
            villa={villa as Record<string, unknown>}
            bookings={bookings}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <VillaPublishChecklist items={checklistItems} />

          <div className="rounded-2xl border border-navy/8 bg-white p-5 shadow-sm space-y-3">
            <a
              href={`/villas/${villa.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm font-medium text-navy transition-colors hover:border-gold hover:text-gold"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Voir sur le site
            </a>
            <Link
              href="/admin/villas"
              className="block text-center text-xs text-navy/40 hover:text-navy transition-colors"
            >
              ← Retour aux villas
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Vérifier le build TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -30
```

Attendu : aucune erreur sur ces fichiers.

- [ ] **Step 4 : Commit**

```bash
git add "app/(admin)/admin/villas/[id]/page.tsx" "app/(admin)/admin/villas/[id]/AdminVillaEditClient.tsx"
git commit -m "feat(admin): éditeur complet villa — VillaEditorForm + photos + réservations + iCal + checklist"
```

---

## Task 3 : Redirect hub-classique

**Files:**
- Modify: `app/(admin)/admin/hub-classique/page.tsx`

**Context:**  
Le hub-classique actuel est une grille de villas avec métriques. Ces métriques sont maintenant dans le tableau `/admin/villas`. On remplace la page par une redirect immédiate.

- [ ] **Step 1 : Remplacer le fichier entier**

Remplacer `app/(admin)/admin/hub-classique/page.tsx` par :

```tsx
import { redirect } from "next/navigation";

export default function HubClassiquePage() {
  redirect("/admin/villas");
}
```

- [ ] **Step 2 : Vérifier le build TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3 : Commit**

```bash
git add "app/(admin)/admin/hub-classique/page.tsx"
git commit -m "feat(admin): hub-classique redirige vers /admin/villas"
```

---

## Task 4 : Fix API `/api/dashboard/update-villa` — bypass ownership pour admins

**Files:**
- Modify: `app/api/dashboard/update-villa/route.ts`

**Context:**  
Ligne 36 du fichier actuel :
```typescript
if (villa.owner_id && villa.owner_id !== user.id) {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}
```
Un admin connecté n'est pas le `owner_id` de la villa → 403.  
Fix : fetch le profile de l'utilisateur connecté, vérifier `isStaffAdmin`, et si admin → bypasser le check.

- [ ] **Step 1 : Lire le fichier actuel**

```bash
cat "app/api/dashboard/update-villa/route.ts"
```

- [ ] **Step 2 : Ajouter l'import `isStaffAdmin`**

En haut du fichier, après les imports existants, ajouter :

```typescript
import { isStaffAdmin } from "@/lib/auth/admin-access";
```

- [ ] **Step 3 : Remplacer le bloc ownership check (ligne 36)**

Remplacer :
```typescript
if (villa.owner_id && villa.owner_id !== user.id) {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}
```

Par :
```typescript
const { data: profile } = await admin
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .maybeSingle();

const isAdmin = isStaffAdmin(
  profile?.role,
  user.user_metadata?.role as string,
  user.email
);

if (!isAdmin && villa.owner_id && villa.owner_id !== user.id) {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}
```

- [ ] **Step 4 : Vérifier le build TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -30
```

Attendu : aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add "app/api/dashboard/update-villa/route.ts"
git commit -m "fix(api): bypasser check ownership update-villa pour les admins"
```

---

## Self-Review

**Spec coverage :**
- ✅ Tableau enrichi : image, capacité, tier, propriétaire, publiée, résa, revenus, Voir ↗ (Task 1)
- ✅ `select("id, name, location, price_per_night, capacity, collection_tier, owner_id, is_published, image_url")` (Task 1 Step 3)
- ✅ `bookingCount` + `confirmedRevenue` calculés par villa (Task 1 Step 3)
- ✅ Éditeur complet 2 colonnes : VillaEditorForm + VillaImageManagerWrapper + VillaBookingsRegistry + PlanningIcalSyncCard + IcalConnectivityStatus + VillaPublishChecklist (Task 2)
- ✅ Données fetchées server-side : `villa (*)` + `bookings` avec tous les champs requis (Task 2 Step 2)
- ✅ checklistItems calculés depuis villa (Task 2 Step 2)
- ✅ Redirect hub-classique → /admin/villas (Task 3)
- ✅ Fix API ownership avec `isStaffAdmin` (Task 4)
- ✅ `AdminVillaEditClient` gère état filtres bookings + iCal saving (Task 2 Step 1)

**Placeholder scan :** Aucun TBD, TODO, ou section vague.

**Type consistency :**
- `VillaBookingRow` importé depuis `VillaBookingsRegistry` dans les deux fichiers qui l'utilisent
- `VillaPublishChecklistItem` importé depuis `VillaPublishChecklist`
- `villa as Record<string, unknown>` cohérent avec `VillaEditorForm` props
