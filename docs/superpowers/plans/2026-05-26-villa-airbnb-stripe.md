# Fiches villas Airbnb + Correctifs Stripe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les fiches villa Airbnb-compliant (équipements catégorisés, section hôte, WishlistButton, services à la carte réels) + correctifs Stripe (API version 2025-01-27, Customer objects, idempotence booking).

**Architecture:** Chantier 1 — modifications concentrées dans `app/villas/[id]/page.tsx` + nouveau composant `components/villas/VillaHostCard.tsx` + mise à jour `types/supabase.ts`. Chantier 2 — correctifs ponctuels dans `lib/stripe/connect.ts`, `app/api/booking/route.ts`, `app/api/webhooks/stripe/route.ts`.

**Tech Stack:** Next.js 14, React 18, TypeScript, Supabase, Stripe, Tailwind CSS, Lucide icons

---

### Task 1: Étendre le mapping d'icônes

**Files:**
- Modify: `app/villas/[id]/page.tsx`

- [ ] **Step 1: Remplacer `getIcon` par `getEquipmentIcon`**

Remplacer la fonction `getIcon` (lignes 114-123) par :

```tsx
const getEquipmentIcon = (label: string) => {
  const a = label.toLowerCase();
  if (a.includes("wifi")) return <Wifi size={16} strokeWidth={1} />;
  if (a.includes("climatisation") || a.includes("clim")) return <Wind size={16} strokeWidth={1} />;
  if (a.includes("piscine")) return <Waves size={16} strokeWidth={1} />;
  if (a.includes("jacuzzi")) return <Waves size={16} strokeWidth={1} />;
  if (a.includes("barbecue") || a.includes("bbq")) return <Flame size={16} strokeWidth={1} />;
  if (a.includes("jardin") || a.includes("terrasse") || a.includes("extérieur")) return <TreePine size={16} strokeWidth={1} />;
  if (a.includes("parking") || a.includes("garage")) return <Car size={16} strokeWidth={1} />;
  if (a.includes("cuisine") || a.includes("réfrigérateur")) return <Utensils size={16} strokeWidth={1} />;
  if (a.includes("tv") || a.includes("télé") || a.includes("écran")) return <Tv size={16} strokeWidth={1} />;
  if (a.includes("machine à laver") || a.includes("lave-linge")) return <Shirt size={16} strokeWidth={1} />;
  if (a.includes("chef") || a.includes("restauration")) return <ChefHat size={16} strokeWidth={1} />;
  if (a.includes("bateau") || a.includes("nautique") || a.includes("mer") || a.includes("vue") || a.includes("plage")) return <Ship size={16} strokeWidth={1} />;
  if (a.includes("massage") || a.includes("spa") || a.includes("bien-être")) return <Heart size={16} strokeWidth={1} />;
  if (a.includes("concierge") || a.includes("accueil") || a.includes("dédié")) return <UserCheck size={16} strokeWidth={1} />;
  if (a.includes("ménage") || a.includes("draps") || a.includes("serviettes") || a.includes("linge")) return <Bed size={16} strokeWidth={1} />;
  if (a.includes("borne") || a.includes("ev") || a.includes("électrique")) return <Zap size={16} strokeWidth={1} />;
  if (a.includes("salle de sport") || a.includes("fitness") || a.includes("gym")) return <Dumbbell size={16} strokeWidth={1} />;
  if (a.includes("sécurité") || a.includes("alarme") || a.includes("caméra")) return <Shield size={16} strokeWidth={1} />;
  if (a.includes("clé") || a.includes("autonome") || a.includes("self")) return <Key size={16} strokeWidth={1} />;
  if (a.includes("transfert") || a.includes("navette") || a.includes("transport")) return <Plane size={16} strokeWidth={1} />;
  return <Check size={16} strokeWidth={1} />;
};
```

Ajouter les imports manquants dans la liste d'imports lucide (ligne 4) :
```tsx
import { Check, Wifi, Wind, Waves, Flame, TreePine, Car, Utensils, Tv, Shirt, ChefHat, Ship, Heart, UserCheck, Bed, Zap, Dumbbell, Shield, Key, Plane, Coffee } from "lucide-react";
```

- [ ] **Step 2: Commit**

```bash
git add app/villas/\[id\]/page.tsx
git commit -m "feat(villas): extend equipment icon mapping for categorized display"
```

---

### Task 2: Ajouter la section équipements catégorisés

**Files:**
- Modify: `app/villas/[id]/page.tsx`

- [ ] **Step 1: Ajouter le composant `EquipmentSection`**

Après la fonction `getEquipmentIcon`, insérer :

```tsx
function EquipmentCategory({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-navy/40">{title}</p>
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-navy/60">{getEquipmentIcon(item)}</span>
            <span className="text-sm text-navy/70">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Insérer la section "Ce que propose ce logement"**

Après la section "Les incontournables" (après la fermeture `)}` ligne ~327), insérer :

```tsx
            {/* 3b. Ce que propose ce logement */}
            {(villa.equipment_interior && villa.equipment_interior.length > 0) ||
             (villa.equipment_exterior && villa.equipment_exterior.length > 0) ||
             (villa.included_services_home && villa.included_services_home.length > 0) ||
             (villa.included_services_collection && villa.included_services_collection.length > 0) ||
             (villa.a_la_carte_services && villa.a_la_carte_services.length > 0) ? (
              <section id="equipements" className="pt-10 border-t border-navy/10">
                <h2 className="font-display font-normal text-2xl text-navy mb-8">Ce que propose ce logement</h2>
                <div className="space-y-10">
                  {villa.equipment_interior && villa.equipment_interior.length > 0 && (
                    <EquipmentCategory title="Intérieur" items={villa.equipment_interior} />
                  )}
                  {villa.equipment_exterior && villa.equipment_exterior.length > 0 && (
                    <EquipmentCategory title="Extérieur" items={villa.equipment_exterior} />
                  )}
                  {villa.included_services_home && villa.included_services_home.length > 0 && (
                    <EquipmentCategory title="Services inclus — domicile" items={villa.included_services_home} />
                  )}
                  {villa.included_services_collection && villa.included_services_collection.length > 0 && (
                    <EquipmentCategory title="Services inclus — collection" items={villa.included_services_collection} />
                  )}
                  {villa.a_la_carte_services && villa.a_la_carte_services.length > 0 && (
                    <EquipmentCategory title="Services à la carte" items={villa.a_la_carte_services} />
                  )}
                </div>
              </section>
            ) : null}
```

- [ ] **Step 3: Commit**

```bash
git add app/villas/\[id\]/page.tsx
git commit -m "feat(villas): add categorized equipment section (Airbnb-style)"
```

---

### Task 3: Remplacer services à la carte codés en dur

**Files:**
- Modify: `app/villas/[id]/page.tsx`

- [ ] **Step 1: Rendre le bloc 04 dynamique**

Remplacer le bloc codé en dur (lignes 278-279) :

```tsx
// Avant :
{ num: "04", title: "Services à la carte", desc: "Chef à domicile, bateau, massage, transfert VIP — composez votre séjour sur mesure." },

// Après :
{ num: "04", title: "Services à la carte", desc: villa.a_la_carte_services && villa.a_la_carte_services.length > 0
    ? villa.a_la_carte_services.join(", ") + " — composez votre séjour sur mesure."
    : "Chef à domicile, bateau, massage, transfert VIP — composez votre séjour sur mesure." },
```

- [ ] **Step 2: Commit**

```bash
git add app/villas/\[id\]/page.tsx
git commit -m "feat(villas): use real a_la_carte_services data instead of hardcoded list"
```

---

### Task 4: Créer VillaHostCard

**Files:**
- Create: `components/villas/VillaHostCard.tsx`

- [ ] **Step 1: Créer le composant**

```tsx
import { User, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";

type VillaHost = {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string | null;
};

function HostAvatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <div className="w-16 h-16 shrink-0 overflow-hidden border border-navy/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-16 h-16 shrink-0 bg-gold/20 flex items-center justify-center border border-navy/10">
      <span className="text-navy font-bold text-lg">{initials}</span>
    </div>
  );
}

export function VillaHostCard({
  host,
  villaName,
}: {
  host: VillaHost | null;
  villaName: string;
}) {
  if (!host) return null;

  const name = host.full_name || "Votre hôte";
  const bio = host.role
    ? `${name}, ${host.role.toLowerCase()}, vous accueille dans ${villaName || "sa villa"}. Il sera ravi de partager ses meilleures adresses et de rendre votre séjour inoubliable.`
    : `${name} est le propriétaire de ${villaName || "cette villa d'exception"}. Passionné par sa région, il sera ravi de vous faire découvrir les trésors cachés de la Martinique.`;

  return (
    <section id="hote" className="pt-10 border-t border-navy/10">
      <h2 className="font-display font-normal text-2xl text-navy mb-6">Votre hôte</h2>
      <div className="flex flex-col sm:flex-row gap-6 items-start border border-navy/10 bg-white p-6">
        <HostAvatar name={name} url={host.avatar_url} />

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display text-xl text-navy">{name}</h3>
            <span className="inline-flex items-center gap-1.5 border border-gold/30 bg-gold/[0.06] px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-navy">
              <ShieldCheck size={11} className="text-gold" />
              Hôte vérifié
            </span>
          </div>

          <p className="text-sm text-navy/60 leading-relaxed mb-4">{bio}</p>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-navy/20 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy hover:border-navy transition-colors"
          >
            <Mail size={12} />
            Contacter l&apos;hôte
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/villas/VillaHostCard.tsx
git commit -m "feat(villas): create VillaHostCard component"
```

---

### Task 5: Ajouter le join profiles + type VillaHost

**Files:**
- Modify: `app/villas/[id]/page.tsx`
- Modify: `types/supabase.ts` (pas nécessaire — type local suffit)

- [ ] **Step 1: Mettre à jour le type `VillaDetails`**

Remplacer le type `VillaDetails` (lignes 44-74) pour ajouter le host :

```tsx
type VillaHost = {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string | null;
};

type VillaDetails = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  price: number;
  capacity: number;
  image: string | null;
  images: string[];
  amenities?: string[];
  rooms?: any[];
  cancellation_policy?: string | null;
  house_rules?: string | null;
  safety_info?: string | null;
  bathrooms_count?: number | null;
  surface_m2?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  environment?: string | null;
  nearby_points?: string[];
  equipment_interior?: string[];
  equipment_exterior?: string[];
  included_services_home?: string[];
  included_services_collection?: string[];
  a_la_carte_services?: string[];
  collection_tier?: "signature" | "iconic";
  booking_terms?: { question: string; answer: string }[];
  latitude?: number | null;
  longitude?: number | null;
  map_embed_url?: string | null;
  host: VillaHost | null;
};
```

- [ ] **Step 2: Mettre à jour la query Supabase**

Dans la fonction `VillaDetailsPage`, remplacer le `.select()` de la query villa (ligne 136) pour inclure le join profiles :

```tsx
.select("id,name,location,description,price_per_night,capacity,image_url,image_urls,amenities,rooms_details,is_published,cancellation_policy,house_rules,safety_info,bathrooms_count,surface_m2,check_in_time,check_out_time,environment,nearby_points,equipment_interior,equipment_exterior,included_services_home,included_services_collection,a_la_carte_services,collection_tier,booking_terms,latitude,longitude,map_embed_url,owner_id,profiles!villas_owner_id_fkey(full_name,avatar_url,email,role)")
```

- [ ] **Step 3: Mettre à jour le mapping de données**

Après la ligne `villa = {` (ligne 151), ajouter le host dans l'objet mappé. Après `map_embed_url: data.map_embed_url ?? null,` (ligne 189), ajouter :

```tsx
          host: data.profiles
            ? {
                full_name: (data.profiles as any).full_name ?? null,
                avatar_url: (data.profiles as any).avatar_url ?? null,
                email: (data.profiles as any).email ?? null,
                role: (data.profiles as any).role ?? null,
              }
            : null,
```

- [ ] **Step 4: Ajouter host: null dans le fallback**

Dans `fallbackVilla`, après `a_la_carte_services: [...]` (ligne 110), ajouter :
```tsx
  host: null,
```

- [ ] **Step 5: Commit**

```bash
git add app/villas/\[id\]/page.tsx
git commit -m "feat(villas): add profiles join for host data in villa detail"
```

---

### Task 6: Intégrer WishlistButton + VillaHostCard dans la page

**Files:**
- Modify: `app/villas/[id]/page.tsx`

- [ ] **Step 1: Importer les composants**

Ajouter en haut du fichier (après la ligne 15) :
```tsx
import { WishlistButton } from "@/components/villas/WishlistButton";
import { VillaHostCard } from "@/components/villas/VillaHostCard";
```

- [ ] **Step 2: Ajouter WishlistButton à côté du titre**

Dans le bloc titre (ligne 230-231), ajouter le WishlistButton à côté du h1 :

```tsx
<h1 className="font-display text-4xl md:text-5xl text-navy flex items-center gap-3">
  {villa.name}
  <WishlistButton villaId={villa.id} className="relative opacity-100" />
</h1>
```

Modifier le `WishlistButton` pour qu'il soit toujours visible sur la page détail en ajoutant `opacity-100` comme className par défaut.

- [ ] **Step 3: Insérer VillaHostCard dans la page**

Entre "Ce que propose ce logement" (fin de section équipements) et "Avis des voyageurs" (ligne 330), insérer :

```tsx
            {/* 4. Votre hôte */}
            <VillaHostCard host={villa.host} villaName={villa.name} />
```

- [ ] **Step 4: Commit**

```bash
git add app/villas/\[id\]/page.tsx
git commit -m "feat(villas): integrate WishlistButton + VillaHostCard in villa detail"
```

---

### Task 7: Build check chantier 1

**Files:**
- Check: all modified files

- [ ] **Step 1: Vérifier que le build passe**

```bash
cd diamant-noir && npm run build 2>&1 | tail -30
```
Expected: `✓ Compiled successfully` — pas d'erreur TypeScript.

- [ ] **Step 2: Corriger si nécessaire et commit**

```bash
git add -A
git commit -m "fix(villas): build corrections for Airbnb-style refactor"
```
(Skip si pas de corrections nécessaires)

---

### Task 8: Stripe — Mettre à jour l'API version

**Files:**
- Modify: `lib/stripe/connect.ts`
- Modify: `app/api/booking/route.ts`
- Modify: `app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Mettre à jour `lib/stripe/connect.ts`**

Remplacer ligne 10 :
```tsx
// Avant
apiVersion: "2023-10-16",

// Après
apiVersion: "2025-01-27",
```

- [ ] **Step 2: Mettre à jour `app/api/booking/route.ts`**

Remplacer ligne 20 :
```tsx
// Avant
apiVersion: "2023-10-16",

// Après
apiVersion: "2025-01-27",
```

- [ ] **Step 3: Mettre à jour `app/api/webhooks/stripe/route.ts`**

Remplacer ligne 10 :
```tsx
// Avant
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

// Après
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-01-27" });
```

- [ ] **Step 4: Commit**

```bash
git add lib/stripe/connect.ts app/api/booking/route.ts app/api/webhooks/stripe/route.ts
git commit -m "fix(stripe): bump API version to 2025-01-27"
```

---

### Task 9: Stripe — Customer objects

**Files:**
- Modify: `app/api/booking/route.ts`

- [ ] **Step 1: Ajouter la recherche/création Customer avant la session Checkout**

Dans `handleSubmit`, après la ligne `const sessionParams: Stripe.Checkout.SessionCreateParams = {` (ligne 196) mais avant la création de session, insérer le bloc Customer. Remplacer tout le bloc de création de session (lignes 196-256) par :

```tsx
    // Create or retrieve Stripe Customer
    let customerId: string | undefined;
    if (guestEmail && stripeInstance) {
      try {
        const customers = await stripeInstance.customers.list({ email: guestEmail, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await stripeInstance.customers.create({
            email: guestEmail,
            name: guestName || undefined,
            metadata: { source: "kayvila_booking" },
          });
          customerId = customer.id;
        }
      } catch (e) {
        console.error("Stripe customer lookup/create failed:", e);
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}${guestEmail ? `&email=${encodeURIComponent(guestEmail)}` : ""}`,
      cancel_url: `${baseUrl}/villas?canceled=true&bookingId=${booking.id}`,
      ...(customerId
        ? { customer: customerId }
        : { customer_email: guestEmail || undefined }),
      metadata: {
        bookingId: booking.id,
        villaId: villaId,
        nights: String(price.nights),
        cleaningFeeCents: String(cleaningFeeCents),
        serviceFeeCents: String(serviceFeeCents),
        ownerConnectAccountId: ownerConnectAccountId || "",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: stayCents,
            product_data: {
              name: `Séjour - ${villa.name}`,
              description: `Du ${startDate} au ${endDate} (${price.nights} nuits)`,
            },
          },
        },
        ...(cleaningFeeCents > 0 ? [{
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: cleaningFeeCents,
            product_data: {
              name: "Frais de ménage",
              description: "Ménage professionnel après votre séjour",
            },
          },
        }] : []),
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: serviceFeeCents,
            product_data: {
              name: "Frais de service Kayvila",
              description: "Protection réservation et support client",
            },
          },
        },
      ],
    };
```

- [ ] **Step 2: Commit**

```bash
git add app/api/booking/route.ts
git commit -m "feat(stripe): create or retrieve Customer object for bookings"
```

---

### Task 10: Stripe — Idempotence booking

**Files:**
- Modify: `app/api/booking/route.ts`

- [ ] **Step 1: Ajouter la vérification de doublon avant l'insert**

Avant le bloc `const { data: booking, error: bookingError } = await supabase` (ligne 153), insérer :

```tsx
    // Idempotency check: avoid duplicate bookings on double-click
    if (guestEmail) {
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id, stripe_session_id, status")
        .eq("villa_id", villaId)
        .eq("start_date", startDate)
        .eq("end_date", endDate)
        .eq("guest_email", guestEmail)
        .eq("status", "pending")
        .maybeSingle();

      if (existingBooking) {
        // Si une session Stripe existe déjà, la retourner
        if (existingBooking.stripe_session_id) {
          const stripe = getStripe();
          if (stripe) {
            try {
              const session = await stripe.checkout.sessions.retrieve(existingBooking.stripe_session_id);
              if (session.url) {
                return NextResponse.json({ url: session.url, bookingId: existingBooking.id });
              }
            } catch {
              // Session expired — fall through to create a new booking
            }
          }
        }
        // Sinon retourner l'URL de succès
        return NextResponse.json({
          url: `${baseUrl}/success?bookingId=${existingBooking.id}${guestEmail ? `&email=${encodeURIComponent(guestEmail)}` : ""}`,
          bookingId: existingBooking.id,
        });
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add app/api/booking/route.ts
git commit -m "fix(stripe): add booking idempotency to prevent double reservations"
```

---

### Task 11: Build final + vérification

**Files:**
- Check: all modified files

- [ ] **Step 1: Lancer le build**

```bash
cd diamant-noir && npm run build 2>&1 | tail -30
```
Expected: `✓ Compiled successfully`

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd diamant-noir && npx tsc --noEmit 2>&1 | head -30
```
Expected: pas d'erreur liée aux fichiers modifiés.

- [ ] **Step 3: Commit final si corrections**

```bash
git add -A
git commit -m "fix: build/type corrections for villa + stripe changes"
```
(Skip si pas de corrections)

---

### Plan Coverage Checklist

| Spec requirement | Covered by |
|---|---|
| Équipements intérieur | Task 2 |
| Équipements extérieur | Task 2 |
| Services inclus domicile | Task 2 |
| Services inclus collection | Task 2 |
| Services à la carte réels | Task 2 + Task 3 |
| Icônes Lucide étendues | Task 1 |
| Section hôte (VillaHostCard) | Task 4 |
| Join profiles sur owner_id | Task 5 |
| WishlistButton intégré | Task 6 |
| Remplacer services codés en dur | Task 3 |
| Stripe API version 2025-01-27 | Task 8 |
| Stripe Customer objects | Task 9 |
| Idempotence booking | Task 10 |
| Style Tailwind existant | Toutes les tasks |
| Pas toucher BookingForm/galerie/calendrier/dashboard | Respecté |
| Pas de migration Supabase | Respecté |
| Build doit passer | Task 7 + Task 11 |
