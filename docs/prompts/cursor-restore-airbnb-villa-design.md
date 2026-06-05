# Mega-Prompt Cursor — Restaurer le design Airbnb des pages villas

**Date** : 2026-06-06
**Projet** : Kayvila Diamant Noir
**Contexte** : Les specs Airbnb validées le 26 mai ont été écrasées par le commit HeroUI Pro. Ce prompt les restaure ET les enrichit avec HeroUI Pro (Carousel).

**Fichiers source** : `docs/superpowers/specs/2026-05-26-villa-airbnb-stripe-design.md`, `docs/superpowers/plans/2026-05-26-villa-airbnb-stripe.md`

---

## ⚠️ RÈGLE — Ne rien casser d'existant

- Playfair Display, Sora, Instrument Sans : intouchables
- Couleurs gold/navy/offwhite : intouchables
- Le flux de réservation (BookingForm, VillaBookingWrapper, BookingBottomSheet) : intouchable
- Le commit HeroUI Pro est déjà mergé — ne pas revenir en arrière

---

## 1. Équipements catégorisés (remplace le bloc services codé en dur)

### Fichier : `app/villas/[id]/page.tsx`

**Étape 1** — Ajouter les colonnes dans le `select()` existant (~ligne 190) :
```typescript
.select("..., equipment_interior, equipment_exterior, included_services_home, included_services_collection, a_la_carte_services")
```

**Étape 2** — Créer une fonction `getEquipmentIcon(label: string)` qui retourne une icône Lucide selon le mot-clé. Étendre la fonction `getIcon()` existante. Exemples :
```typescript
function getEquipmentIcon(label: string) {
  const key = label.toLowerCase();
  if (key.includes("climatisation") || key.includes("clim")) return <Wind />;
  if (key.includes("wifi")) return <Wifi />;
  if (key.includes("cuisine")) return <Utensils />;
  if (key.includes("piscine")) return <Waves />;
  if (key.includes("barbecue") || key.includes("bbq")) return <Flame />;
  if (key.includes("jardin")) return <TreePine />;
  if (key.includes("parking")) return <Car />;
  if (key.includes("tv") || key.includes("télé")) return <Tv />;
  if (key.includes("chef")) return <ChefHat />;
  if (key.includes("bateau")) return <Ship />;
  if (key.includes("massage") || key.includes("spa")) return <Heart />;
  if (key.includes("concierge") || key.includes("accueil")) return <UserCheck />;
  if (key.includes("draps") || key.includes("linge")) return <Bed />;
  return <Check />; // fallback
}
```

**Étape 3** — Ajouter le bloc "Ce que propose ce logement" après les incontournables :
```tsx
{/* Ce que propose ce logement */}
<section className="py-12 border-t border-navy-800">
  <h2 className="font-playfair text-2xl text-navy mb-8">Ce que propose ce logement</h2>

  {[
    { title: "Intérieur", data: villa.equipment_interior },
    { title: "Extérieur", data: villa.equipment_exterior },
    { title: "Services inclus (domicile)", data: villa.included_services_home },
    { title: "Services inclus (collection)", data: villa.included_services_collection },
    { title: "Services à la carte", data: villa.a_la_carte_services },
  ].map((cat) =>
    cat.data && cat.data.length > 0 ? (
      <div key={cat.title} className="mb-8">
        <h3 className="font-sora text-lg text-navy mb-4">{cat.title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cat.data.map((item: string) => (
            <div key={item} className="flex items-center gap-2 text-navy-800">
              <span className="text-gold w-5 h-5">{getEquipmentIcon(item)}</span>
              <span className="text-sm font-instrument-sans">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null
  )}
</section>
```

---

## 2. Section hôte (VillaHostCard)

### Nouveau fichier : `components/villas/VillaHostCard.tsx`

```tsx
"use client";

import { UserCheck } from "lucide-react";

interface VillaHost {
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

export function VillaHostCard({ host }: { host: VillaHost | null }) {
  if (!host) return null;

  return (
    <section className="py-12 border-t border-navy-800">
      <h2 className="font-playfair text-2xl text-navy mb-6">Votre hôte</h2>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {host.avatar_url ? (
          <img
            src={host.avatar_url}
            alt={host.full_name ?? "Hôte"}
            className="w-14 h-14 rounded-full object-cover border-2 border-gold"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-navy-800 flex items-center justify-center text-offwhite font-sora text-xl">
            {host.full_name?.charAt(0) ?? "?"}
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <span className="font-sora text-lg text-navy">{host.full_name ?? "Hôte Kayvila"}</span>
            <span className="inline-flex items-center gap-1 text-xs text-navy bg-gold/10 px-2 py-0.5 rounded-full">
              <UserCheck className="w-3 h-3" />
              Hôte vérifié
            </span>
          </div>
          <p className="text-sm text-navy-800 mt-1">
            Hôte Kayvila depuis {new Date().getFullYear()}
          </p>
          <a
            href="/contact"
            className="inline-block mt-3 text-sm font-sora text-gold hover:text-gold/80 underline underline-offset-4"
          >
            Contacter l'hôte
          </a>
        </div>
      </div>
    </section>
  );
}
```

### Modification : `app/villas/[id]/page.tsx`

**Étape 1** — Ajouter le join `profiles` dans la query :
```typescript
.select("..., owner:owner_id(full_name, avatar_url, role)")
```

**Étape 2** — Ajouter `host` dans le type `VillaDetails`.

**Étape 3** — Insérer `<VillaHostCard host={villa.host} />` entre les équipements et les avis.

---

## 3. WishlistButton à côté du titre

### Fichier : `app/villas/[id]/page.tsx`

À côté du `<h1>` du titre de la villa (ligne ~243), ajouter :
```tsx
<WishlistButton villaId={villa.id} />
```

Le composant existe déjà : `components/villas/WishlistButton.tsx`.

---

## 4. Services à la carte dynamiques

### Fichier : `app/villas/[id]/page.tsx`

Dans le bloc "L'expérience Kayvila", remplacer le tableau codé en dur par :
```tsx
{villa.a_la_carte_services && villa.a_la_carte_services.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {villa.a_la_carte_services.map((service: string) => (
      <div key={service} className="flex items-center gap-2 text-navy-800">
        <span className="text-gold">{getEquipmentIcon(service)}</span>
        <span className="font-instrument-sans">{service}</span>
      </div>
    ))}
  </div>
) : (
  <p className="text-navy-800">Services disponibles sur demande. Contactez notre conciergerie.</p>
)}
```

---

## 5. Galerie Carousel HeroUI Pro (bonus — nouveau)

### Fichier : `app/villas/[id]/page.tsx`

Remplacer la grille d'images actuelle par le Carousel HeroUI :
```tsx
import { Carousel } from "@heroui-pro/react/carousel";

{/* Galerie */}
{villa.image_urls && villa.image_urls.length > 0 && (
  <Carousel
    images={villa.image_urls.map((url) => ({ src: url, alt: villa.name }))}
    showThumbnails
    autoPlay
    interval={5000}
    classNames={{
      wrapper: "rounded-2xl overflow-hidden shadow-2xl",
      thumbnail: "border-2 border-transparent data-[selected=true]:border-gold rounded-lg overflow-hidden",
    }}
    className="mb-12"
  />
)}
```

---

## Checklist

- [ ] Colonnes `equipment_*`, `a_la_carte_services` dans le select
- [ ] `getEquipmentIcon()` créé avec 15+ mots-clés
- [ ] Bloc "Ce que propose ce logement" avec 5 catégories
- [ ] `VillaHostCard.tsx` créé
- [ ] Join `profiles` dans la query + type `host`
- [ ] WishlistButton à côté du titre
- [ ] Services à la carte dynamiques
- [ ] Carousel HeroUI Pro (si les images sont dispo)
- [ ] Playfair Display intacte
- [ ] `npm run build` passe
