# Mega-Prompt Cursor — Partie Client Kayvila : les 10 finitions manquantes

**Date** : 2026-06-06
**Projet** : Kayvila Diamant Noir
**Contexte** : L'espace client est à 8.5/10. Ces 10 finitions le montent à 9.5/10.
**Règle** : Playfair Display, couleurs gold/navy, design éditorial — intouchables.

---

## 1. 🔴 HoverCard → fallback mobile (Sheet)

**Problème** : Sur mobile, le hover n'existe pas. Les utilisateurs tactiles perdent la preview.
**Solution** : Dans `VillaListingCard`, détecter le touch et afficher une Sheet au lieu d'une HoverCard.

### Fichier : `components/villas/VillaListingCard.tsx`

```tsx
"use client";

import { useMediaQuery } from "@heroui-pro/react"; // ou hook maison
import { Sheet } from "@heroui-pro/react";

export function VillaListingCard({ villa, ... }: VillaListingCardProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <button onClick={() => setSheetOpen(true)} className="...">
          {/* contenu de la carte sans HoverCard */}
        </button>
        <Sheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} snapPoints={[0.6, 0.9]}>
          <Sheet.Content className="bg-offwhite rounded-t-2xl p-6">
            <img src={previewImage} className="rounded-xl mb-4 w-full aspect-[4/3] object-cover" />
            <h3 className="font-playfair text-xl text-navy">{villa.name}</h3>
            <Rating value={villa.avg_rating} readOnly size="sm" className="mt-1" />
            <p className="text-sm text-navy-800 mt-2 line-clamp-3">{villa.description}</p>
            <div className="flex items-center gap-2 mt-3 text-navy-800 text-sm">
              <Users className="w-4 h-4" /> {villa.capacity} voyageurs
              <Maximize2 className="w-4 h-4 ml-2" /> {villa.surface_m2}m²
            </div>
            <Link href={href} className="block mt-4 bg-gold text-navy text-center py-3 rounded-full font-sora font-semibold">
              Voir la villa — {formatPrice(villa.price)}€ / nuit
            </Link>
          </Sheet.Content>
        </Sheet>
      </>
    );
  }

  // Desktop : HoverCard existante
  return (/* code HoverCard actuel */);
}
```

---

## 2. 🔴 Filtres de recherche avancés sur `/villas`

**Problème** : La page liste toutes les villas sans filtre. Si 20+ villas, injetable.
**Solution** : Ajouter une barre de filtres avec prix, capacité, dates, équipements.

### Fichier : `app/villas/page.tsx`

**Composant à créer** : `components/villas/VillaFilters.tsx`

```tsx
"use client";

import { useState } from "react";
import { Slider, Chip } from "@heroui-pro/react";
import { Users, Search } from "lucide-react";

const AMENITIES = ["Piscine", "Jacuzzi", "Vue mer", "Climatisation", "Parking", "WiFi"];

export function VillaFilters({ onFilter }: { onFilter: (f: VillaFilters) => void }) {
  return (
    <div className="bg-offwhite border border-navy-800 rounded-2xl p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Budget */}
        <div>
          <label className="font-sora text-xs uppercase tracking-wider text-navy-800 mb-2 block">Budget par nuit</label>
          <Slider
            min={100}
            max={5000}
            step={50}
            defaultValue={[100, 5000]}
            formatOptions={{ style: "currency", currency: "EUR" }}
            onChange={(v) => setBudget(v as [number, number])}
            classNames={{ track: "bg-gold" }}
          />
        </div>

        {/* Voyageurs */}
        <div>
          <label className="font-sora text-xs uppercase tracking-wider text-navy-800 mb-2 block">Voyageurs</label>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-navy-800" />
            <select className="bg-white border border-navy-800 rounded-lg px-3 py-2 font-instrument-sans text-sm">
              {[1,2,3,4,5,6,8,10,12].map(n => <option key={n} value={n}>{n}+ voyageurs</option>)}
            </select>
          </div>
        </div>

        {/* Équipements */}
        <div className="md:col-span-2">
          <label className="font-sora text-xs uppercase tracking-wider text-navy-800 mb-2 block">Équipements</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(a => (
              <Chip key={a} variant="bordered" className="border-navy-800 text-navy cursor-pointer hover:bg-gold/10">
                {a}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={applyFilters}
        className="mt-4 bg-navy text-offwhite px-6 py-2 rounded-full font-sora text-sm hover:bg-navy-900 transition-colors"
      >
        <Search className="w-4 h-4 inline mr-2" />
        Filtrer
      </button>
    </div>
  );
}
```

---

## 3. 🔴 NumberStepper voyageurs dans BookingForm

**Problème** : Le sélecteur de voyageurs utilise probablement encore un `<select>` ou `<input>` basique.
**Solution** : Remplacer par `NumberStepper` HeroUI Pro avec Number Flow.

### Fichier : `components/BookingForm.tsx`

```tsx
import { NumberStepper } from "@heroui-pro/react";
import { Users, Baby } from "lucide-react";

// Dans le formulaire, remplacer les selects voyageurs par :
<div className="space-y-4">
  <NumberStepper
    label="Adultes"
    value={adults}
    onChange={setAdults}
    min={1}
    max={villa.capacity}
    icon={<Users className="w-4 h-4" />}
    classNames={{ label: "font-sora text-sm text-navy" }}
  />
  <NumberStepper
    label="Enfants (2-12 ans)"
    value={children}
    onChange={setChildren}
    min={0}
    max={villa.capacity - adults}
  />
  <NumberStepper
    label="Bébés (< 2 ans)"
    value={infants}
    onChange={setInfants}
    min={0}
    max={2}
    icon={<Baby className="w-4 h-4" />}
  />
</div>
```

---

## 4. 🟠 Politique d'annulation visible

**Problème** : Le voyageur ne sait pas combien il serait remboursé s'il annule aujourd'hui.
**Solution** : Ajouter un calculateur dynamique dans la fiche réservation.

### Fichier : `app/espace-client/reservations/[id]/page.tsx`

```tsx
// Calcul dynamique du remboursement
function getRefundAmount(booking: Booking, today: Date): number | null {
  const checkin = new Date(booking.start_date);
  const daysUntilCheckin = Math.ceil((checkin.getTime() - today.getTime()) / 86400000);

  if (daysUntilCheckin < 0) return null; // déjà passé
  if (daysUntilCheckin > 30) return booking.total_price_cents; // 100%
  if (daysUntilCheckin > 14) return Math.round(booking.total_price_cents * 0.5); // 50%
  if (daysUntilCheckin > 7) return Math.round(booking.total_price_cents * 0.25); // 25%
  return 0; // non remboursable
}

// Dans le JSX :
{refundAmount !== null && (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
    <p className="font-sora text-sm text-amber-800">
      Si vous annulez aujourd'hui, vous seriez remboursé de{' '}
      <span className="font-bold">{formatCurrency(refundAmount)}</span>
    </p>
    <p className="text-xs text-amber-600 mt-1">
      Politique : 100% jusqu'à 30j, 50% jusqu'à 14j, 25% jusqu'à 7j avant l'arrivée.
    </p>
  </div>
)}
```

---

## 5. 🟠 Ajout au calendrier 1-clic

**Problème** : Le voyageur doit créer manuellement un événement dans son calendrier.
**Solution** : Bouton "Ajouter à mon calendrier" qui génère un fichier .ics.

### Nouveau composant : `components/booking/AddToCalendar.tsx`

```tsx
"use client";

import { CalendarPlus } from "lucide-react";

function generateICS(booking: { villa_name: string; start_date: string; end_date: string; check_in_time: string }) {
  const start = new Date(`${booking.start_date}T${booking.check_in_time || "15:00"}:00`);
  const end = new Date(`${booking.end_date}T11:00:00`);

  const format = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${format(start)}`,
    `DTEND:${format(end)}`,
    `SUMMARY:Séjour Kayvila — ${booking.villa_name}`,
    `LOCATION:${booking.villa_name}, Martinique`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
}

export function AddToCalendar({ booking }: { booking: any }) {
  const handleAdd = () => {
    const ics = generateICS(booking);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kayvila-${booking.villa_name}.ics`;
    a.click();
  };

  return (
    <button onClick={handleAdd} className="flex items-center gap-2 text-sm text-navy hover:text-gold transition-colors">
      <CalendarPlus className="w-4 h-4" />
      Ajouter à mon calendrier
    </button>
  );
}
```

---

## 6. 🟠 VillasMapView → iframe (virer Leaflet)

**Problème** : Leaflet pèse 5 Mo pour un seul composant.
**Solution** : Remplacer par un iframe OpenStreetMap.

### Fichier : `components/VillasMapView.tsx`

```tsx
// Remplacer toute la logique Leaflet par :
<iframe
  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.05},${lat-0.03},${lng+0.05},${lat+0.03}&layer=mapnik`}
  className="w-full h-[500px] rounded-2xl border border-navy-800"
  loading="lazy"
  title="Carte des villas"
/>

// Puis npm uninstall leaflet leaflet.markercluster @types/leaflet @types/leaflet.markercluster react-leaflet
```

---

## 7. 🟠 Page comparaison villas

**Problème** : `CompareButton` existe mais pas de page `/compare`.
**Solution** : Créer la page.

### Nouveau fichier : `app/compare/page.tsx`

```tsx
"use client";

import { useCompare } from "@/contexts/CompareContext";

export default function ComparePage() {
  const { comparedVillas, removeVilla } = useCompare();

  if (comparedVillas.length === 0) {
    return <KayvilaEmptyState icon={<Scale />} title="Aucune villa à comparer" description="Ajoutez des villas depuis la recherche" />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-playfair text-3xl text-navy mb-8">Comparer les villas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comparedVillas.map((villa) => (
          <div key={villa.id} className="bg-offwhite border border-navy-800 rounded-2xl p-6 relative">
            <button onClick={() => removeVilla(villa.id)} className="absolute top-4 right-4 text-navy-800 hover:text-red-500">✕</button>
            <img src={villa.image_url} className="rounded-xl mb-4 aspect-[4/3] object-cover w-full" />
            <h3 className="font-playfair text-lg text-navy">{villa.name}</h3>
            <Rating value={villa.avg_rating} readOnly size="sm" className="mt-1" />
            <div className="mt-3 space-y-2 text-sm text-navy-800">
              <div>🛏 {villa.bathrooms_count} chambres</div>
              <div>👥 {villa.capacity} voyageurs</div>
              <div>📐 {villa.surface_m2}m²</div>
              <div>🏊 {villa.amenities?.includes("Piscine") ? "✅ Piscine" : "❌ Pas de piscine"}</div>
            </div>
            <p className="font-sora text-gold text-lg mt-4">{villa.price_per_night}€ / nuit</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 8. 🟡 Guide des alentours

**Problème** : Aucune recommandation locale → le voyageur cherche sur Google.
**Solution** : Ajouter une section éditoriale dans l'espace client.

### Nouveau composant : `components/espace-client/LocalGuide.tsx`

```tsx
const RECOMMENDATIONS = [
  {
    category: "Restaurants",
    icon: "🍽️",
    items: [
      { name: "Le Petit Diamant", description: "Cuisine créole raffinée", distance: "5 min", price: "€€€" },
      { name: "Chez Carole", description: "Poisson grillé pieds dans l'eau", distance: "10 min", price: "€€" },
    ],
  },
  {
    category: "Plages",
    icon: "🏖️",
    items: [
      { name: "Plage du Diamant", description: "Sable blanc, eau turquoise", distance: "3 min" },
      { name: "Anse Noire", description: "Sable volcanique, snorkeling", distance: "20 min" },
    ],
  },
];

export function LocalGuide() {
  return (
    <section className="py-8">
      <h2 className="font-playfair text-2xl text-navy mb-6">Les recommandations Kayvila</h2>
      {RECOMMENDATIONS.map((cat) => (
        <div key={cat.category} className="mb-6">
          <h3 className="font-sora text-lg text-navy mb-3">{cat.icon} {cat.category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cat.items.map((item) => (
              <div key={item.name} className="bg-white border border-navy-800 rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="font-sora text-navy">{item.name}</span>
                  <span className="text-xs text-navy-800">{item.distance}</span>
                </div>
                <p className="text-sm text-navy-800 mt-1">{item.description}</p>
                {item.price && <span className="text-xs text-gold mt-1">{item.price}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
```

---

## 9. 🟡 Ré-réservation intelligente

**Problème** : Après un séjour, rien n'incite à revenir.
**Solution** : Section "Envie de revenir ?" avec suggestions personnalisées.

### Fichier : `app/espace-client/page.tsx`

```tsx
{/* Après la section historique, ajouter : */}
{pastBookings.length > 0 && (
  <section className="mt-12 py-8 border-t border-navy-800">
    <h2 className="font-playfair text-2xl text-navy mb-2">Envie de revenir ?</h2>
    <p className="text-navy-800 mb-6">Ces villas pourraient vous plaire</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {recommendedVillas.slice(0, 3).map((villa) => (
        <Link key={villa.id} href={`/villas/${villa.id}`} className="group">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
            <Image src={villa.image_url} alt={villa.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <h3 className="font-sora text-navy group-hover:text-gold transition-colors">{villa.name}</h3>
          <p className="text-sm text-navy-800">À partir de {villa.price_per_night}€ / nuit</p>
        </Link>
      ))}
    </div>
  </section>
)}
```

---

## 10. 🟡 Partage séjour — renforcer le token

**Problème** : Token `btoa` faible, `/share` pas public.
**Solution** : Remplacer par un token UUID stocké en base.

### Fichier : `app/espace-client/reservations/[id]/page.tsx`

```tsx
// Générer un token de partage unique
async function generateShareToken(bookingId: string) {
  const token = crypto.randomUUID();
  await supabase
    .from("booking_shares")
    .upsert({ booking_id: bookingId, token, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() });

  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/share/${token}`;
  await navigator.clipboard.writeText(shareUrl);
  alert("Lien copié ! Valable 7 jours.");
}

// Bouton :
<button onClick={() => generateShareToken(booking.id)} className="flex items-center gap-2 text-sm text-navy hover:text-gold">
  <Share2 className="w-4 h-4" />
  Partager ce séjour
</button>
```

### Nouveau fichier : `app/share/[token]/page.tsx`

```tsx
// Page publique qui affiche les infos du séjour (adresse, WiFi, check-in)
// Sans nécessiter de compte
export default async function SharePage({ params }: { params: { token: string } }) {
  const { data } = await supabaseAdmin()
    .from("booking_shares")
    .select("bookings(*, villas(name, location, wifi_ssid, wifi_password))")
    .eq("token", params.token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!data) return notFound();

  const { bookings: booking, villas } = data as any;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-playfair text-2xl text-navy">{villas.name}</h1>
      <p className="text-navy-800">{booking.start_date} → {booking.end_date}</p>
      <div className="mt-6 space-y-4">
        <div className="bg-offwhite border border-navy-800 rounded-xl p-4">
          <h2 className="font-sora text-navy">WiFi</h2>
          <p className="text-sm text-navy-800">{villas.wifi_ssid} — {villas.wifi_password}</p>
        </div>
        <div className="bg-offwhite border border-navy-800 rounded-xl p-4">
          <h2 className="font-sora text-navy">Adresse</h2>
          <p className="text-sm text-navy-800">{villas.location}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## Checklist

- [ ] 1. HoverCard → Sheet fallback mobile
- [ ] 2. Filtres recherche sur `/villas` (prix, capacité, équipements)
- [ ] 3. NumberStepper voyageurs dans BookingForm
- [ ] 4. Calculateur remboursement dans fiche réservation
- [ ] 5. Bouton "Ajouter au calendrier" (génération .ics)
- [ ] 6. VillasMapView → iframe OpenStreetMap (virer Leaflet)
- [ ] 7. Page `/compare` fonctionnelle
- [ ] 8. Guide des alentours dans espace client
- [ ] 9. Section "Envie de revenir ?" post-séjour
- [ ] 10. Partage séjour avec token UUID + page publique `/share/[token]`
- [ ] `npm run build` passe
- [ ] Playfair Display intacte
- [ ] Mobile vérifié sur chaque nouvelle fonctionnalité
