# Mega-Prompt Cursor — HeroUI Pro : Composants Premium pour Kayvila

**Date** : 2026-06-06
**Projet** : Kayvila Diamant Noir
**Contexte** : HeroUI Pro est déjà installé. Il s'agit maintenant d'utiliser les composants premium pour élever l'expérience.

---

## ⚠️ RÈGLE DESIGN — Ne jamais casser l'identité Kayvila

- **Couleurs** : Gold `#D4AF37`, Navy `#0A0A0A`, Navy-900, Navy-800, Offwhite `#FAFAFA`
- **Typo** : Playfair Display (titres), Sora (sous-titres), Instrument Sans (corps)
- **Style** : Éditorial luxe, interlignage généreux, espacement respiré
- **Si un composant HeroUI force un style incompatible → l'enrober dans une classe Tailwind, ne pas forcer**

---

## Phase 1 — Dashboards Admin & Proprio (Data Grid + KPI + Charts + Widget)

### 1.1 — Data Grid (tableaux de données)

**Remplace** : Les `<table>` basiques dans les listes admin/proprio.

**Fichiers** :
- `app/(admin)/admin/reservations/page.tsx`
- `app/(admin)/admin/clients/page.tsx`
- `app/(admin)/admin/proprietaires/page.tsx`
- `app/(admin)/admin/villas/page.tsx`
- `app/(proprio)/dashboard/reservations/[villaId]/page.tsx`

**Code cible** :
```tsx
import { DataGrid } from "@heroui-pro/react/data-grid";

<DataGrid
  columns={columns}
  rows={bookings}
  sortable
  selectionMode="multiple"
  pinnedColumns={{ left: ["villa"] }}
  classNames={{
    wrapper: "bg-offwhite border border-navy-800 rounded-xl",
    th: "font-sora text-xs uppercase tracking-wider text-navy",
    td: "font-instrument-sans text-sm",
  }}
/>
```

**Fonctionnalités à activer** : sortable, selectionMode, pinnedColumns, onSelectionChange → ActionBar

---

### 1.2 — KPI + KPI Group + Trend Chip

**Remplace** : Les `<div>` de stats actuelles.

**Fichiers** :
- `app/(admin)/admin/page.tsx`
- `app/(proprio)/dashboard/page.tsx`

**Code cible** :
```tsx
import { KPI, KPIGroup } from "@heroui-pro/react/kpi";
import { TrendChip } from "@heroui-pro/react/trend-chip";

<KPIGroup>
  <KPI
    title="Revenus du mois"
    value={revenueFormatted}
    trend={<TrendChip value={12.5} direction="up" suffix="vs mois dernier" />}
    sparkline={revenueSparklineData}
  />
  <KPI
    title="Taux d'occupation"
    value={`${occupancyRate}%`}
    trend={<TrendChip value={-3.2} direction="down" suffix="vs mois dernier" />}
  />
  <KPI
    title="Réservations"
    value={totalBookings}
    trend={<TrendChip value={8} direction="up" suffix="ce mois" />}
  />
</KPIGroup>
```

---

### 1.3 — Charts (Area, Bar, Pie)

**Remplace** : Recharts (garde-le si HeroUI Charts ne couvre pas tout).

**Fichier** : Tous les composants avec `recharts`.

**Code cible** :
```tsx
import { AreaChart, BarChart, PieChart } from "@heroui-pro/react/charts";

<AreaChart
  data={monthlyRevenue}
  categories={["net", "commission"]}
  index="month"
  colors={["#D4AF37", "#132A41"]}
  valueFormatter={(v) => `${v.toLocaleString()} €`}
  className="h-64"
/>
```

---

### 1.4 — Widget

**Remplace** : Les `<div className="rounded-xl...">` conteneurs dashboard.

**Code cible** :
```tsx
import { Widget } from "@heroui-pro/react/widget";

<Widget title="Revenus" className="col-span-2">
  <AreaChart ... />
</Widget>
```

---

## Phase 2 — UX Client Premium (Carousel + Hover Card + Stepper + Rating)

### 2.1 — Carousel (galerie villa)

**Remplace** : La galerie photo actuelle dans la fiche villa.

**Fichier** : `app/villas/[id]/page.tsx`

**Code cible** :
```tsx
import { Carousel } from "@heroui-pro/react/carousel";

<Carousel
  images={villa.image_urls.map((url) => ({ src: url, alt: villa.name }))}
  showThumbnails
  autoPlay
  interval={5000}
  classNames={{
    wrapper: "rounded-2xl overflow-hidden",
    thumbnail: "border-2 border-transparent data-[selected=true]:border-gold",
  }}
/>
```

---

### 2.2 — Hover Card (preview villa)

**Remplace** : Rien (nouveau composant — à ajouter sur la grille de recherche).

**Fichier** : `app/villas/page.tsx` (ou composant `VillaCard`)

**Code cible** :
```tsx
import { HoverCard } from "@heroui-pro/react/hover-card";

<HoverCard>
  <HoverCard.Trigger>
    <VillaCard villa={villa} />
  </HoverCard.Trigger>
  <HoverCard.Content className="w-80 p-4 bg-offwhite border border-navy-800 rounded-xl shadow-2xl">
    <img src={villa.image_url} className="rounded-lg mb-2" />
    <div className="flex items-center justify-between">
      <span className="font-playfair text-lg text-navy">{villa.name}</span>
      <Rating value={villa.avg_rating} readOnly size="sm" />
    </div>
    <p className="text-sm text-navy-800 line-clamp-2 mt-1">{villa.description}</p>
    <span className="text-gold font-sora mt-2">{villa.price_per_night}€ / nuit</span>
  </HoverCard.Content>
</HoverCard>
```

---

### 2.3 — Stepper (tunnel de réservation)

**Remplace** : Le flux checkout actuel (si pas déjà en étapes).

**Fichier** : `app/book/page.tsx` (ou composant de checkout)

**Code cible** :
```tsx
import { Stepper } from "@heroui-pro/react/stepper";

const steps = [
  { title: "Dates", description: "Vos dates de séjour" },
  { title: "Voyageurs", description: "Nombre de personnes" },
  { title: "Options", description: "Services additionnels" },
  { title: "Paiement", description: "Stripe sécurisé" },
];

<Stepper
  steps={steps}
  currentStep={currentStep}
  variant="numbered"
  classNames={{
    step: "data-[completed=true]:bg-gold data-[active=true]:border-gold",
    connector: "data-[completed=true]:bg-gold",
  }}
/>
```

---

### 2.4 — Rating (étoiles dorées)

**Remplace** : Les étoiles statiques actuelles.

**Fichiers** : `components/VillaReviews.tsx`, `components/ReviewForm.tsx`

**Code cible** :
```tsx
import { Rating } from "@heroui-pro/react/rating";

// Affichage (read-only, fractionnel)
<Rating value={villa.avg_rating} readOnly fractions={2} size="lg" />

// Formulaire (interactif)
<Rating
  value={userRating}
  onChange={setUserRating}
  size="xl"
  classNames={{ star: "text-gold" }}
/>
```

---

### 2.5 — Number Stepper (sélecteur voyageurs)

**Remplace** : Les `<select>` ou `<input type="number">` pour le nombre de voyageurs.

**Fichier** : `components/BookingForm.tsx`, `components/booking/BookingBottomSheet.tsx`

**Code cible** :
```tsx
import { NumberStepper } from "@heroui-pro/react/number-stepper";

<NumberStepper
  label="Adultes"
  value={adults}
  onChange={setAdults}
  min={1}
  max={villa.capacity}
  formatOptions={{ style: "unit", unit: "person" }}
/>
```

---

## Phase 3 — Back-Office (Kanban + Command + Action Bar + Drop Zone)

### 3.1 — Kanban (pipeline réservations)

**Remplace** : Nouveau composant — remplace la vue liste simple des réservations.

**Fichier** : `app/(admin)/admin/reservations/page.tsx` (onglet Kanban)

**Code cible** :
```tsx
import { Kanban } from "@heroui-pro/react/kanban";

const columns = [
  { id: "pending", title: "En attente", items: pendingBookings },
  { id: "confirmed", title: "Confirmées", items: confirmedBookings },
  { id: "paid", title: "Payées", items: paidBookings },
  { id: "checkin", title: "Check-in", items: checkinBookings },
  { id: "completed", title: "Terminées", items: completedBookings },
];

<Kanban
  columns={columns}
  onItemMove={(item, from, to) => handleStatusChange(item.id, to)}
  renderCard={(booking) => (
    <KanbanCard
      title={`${booking.guest_name}`}
      subtitle={`${booking.villa_name} · ${booking.dates}`}
      footer={`${booking.total_price}€`}
    />
  )}
/>
```

---

### 3.2 — Command (⌘K palette admin)

**Remplace** : Nouveau composant — navigation rapide.

**Fichier** : `app/(admin)/layout.tsx`

**Code cible** :
```tsx
import { Command } from "@heroui-pro/react/command";

<Command>
  <Command.Input placeholder="Rechercher une réservation, villa, client..." />
  <Command.List>
    <Command.Group heading="Réservations">
      {bookings.map((b) => (
        <Command.Item onSelect={() => router.push(`/admin/reservations/${b.id}`)}>
          {b.guest_name} — {b.villa_name}
        </Command.Item>
      ))}
    </Command.Group>
    <Command.Group heading="Villas">
      {villas.map((v) => (
        <Command.Item onSelect={() => router.push(`/admin/villas/${v.id}`)}>
          {v.name}
        </Command.Item>
      ))}
    </Command.Group>
  </Command.List>
</Command>
```

**Raccourci** : `⌘K` ou `Ctrl+K`.

---

### 3.3 — Action Bar (actions groupées)

**Remplace** : Nouveau composant — apposé au Data Grid.

**Fichier** : `app/(admin)/admin/reservations/page.tsx`

**Code cible** :
```tsx
import { ActionBar } from "@heroui-pro/react/action-bar";

{selectedBookings.length > 0 && (
  <ActionBar
    actions={[
      { label: "Exporter", onPress: handleExport },
      { label: "Marquer payé", onPress: handleMarkPaid },
      { label: "Supprimer", onPress: handleDelete, variant: "destructive" },
    ]}
    selectedCount={selectedBookings.length}
    onClear={() => setSelectedBookings([])}
  />
)}
```

---

### 3.4 — Drop Zone (upload photos)

**Remplace** : Le drag & drop dnd-kit dans l'éditeur villa.

**Fichier** : `components/dashboard/villa-editor/VillaImageManager.tsx`

**Code cible** :
```tsx
import { DropZone } from "@heroui-pro/react/drop-zone";

<DropZone
  accept="image/*"
  maxSize={10 * 1024 * 1024}
  maxFiles={20}
  onDrop={handleUpload}
  classNames={{
    wrapper: "border-2 border-dashed border-navy-800 rounded-xl p-8 hover:border-gold transition-colors",
  }}
>
  <p className="text-navy-800 font-sora">Glissez vos photos ici</p>
  <p className="text-sm text-navy-800">PNG, JPG jusqu'à 10 Mo</p>
</DropZone>
```

---

## Phase 4 — Polish Global (Empty State + Trend Chip + Number Value + Pressable Feedback)

### 4.1 — Empty State

**Remplace** : Tous les `EmptyDashboard` et messages "Aucun résultat".

**Fichiers** : Toutes les pages avec des listes vides.

**Code cible** :
```tsx
import { EmptyState } from "@heroui-pro/react/empty-state";
import { Calendar } from "lucide-react";

<EmptyState
  icon={<Calendar className="w-12 h-12 text-navy-800" />}
  title="Aucune réservation"
  description="Les réservations apparaîtront ici une fois qu'un client aura réservé une villa."
  action={{
    label: "Voir les villas",
    onPress: () => router.push("/admin/villas"),
  }}
/>
```

---

### 4.2 — Pressable Feedback (ripple doré)

**Remplace** : Rien (à ajouter sur les boutons stratégiques).

**Code cible** :
```tsx
import { PressableFeedback } from "@heroui-pro/react/pressable-feedback";

<PressableFeedback variant="ripple" color="#D4AF37">
  <button className="bg-gold text-navy px-6 py-3 rounded-full font-sora">
    Réserver maintenant
  </button>
</PressableFeedback>
```

---

### 4.3 — Number Value (formatage premium)

**Remplace** : `toLocaleString()` éparpillés.

**Code cible** :
```tsx
import { NumberValue } from "@heroui-pro/react/number-value";

<NumberValue value={12500} format="currency" currency="EUR" /> // "12 500 €"
<NumberValue value={1234} format="compact" /> // "1,2k"
<NumberValue value={0.847} format="percent" /> // "84,7%"
```

---

## Ordre d'exécution

- [ ] **Phase 1** — Data Grid + KPI + Charts + Widget → dashboards admin/proprio
- [ ] **Phase 2** — Carousel + Hover Card + Stepper + Rating + Number Stepper → client
- [ ] **Phase 3** — Kanban + Command + Action Bar + Drop Zone → back-office
- [ ] **Phase 4** — Empty State + Pressable Feedback + Number Value + Trend Chip → global
- [ ] `npm run build` passe
- [ ] Playfair Display intacte
- [ ] Design Kayvila préservé (gold/navy/editorial)
