# Retours P0 Richard (CGV · Hero search · Chatbot scroll) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger 3 retours P0 de Richard — checkbox CGV obligatoire au checkout, régression du bloc recherche hero, et scroll parasite du chatbot proprio.

**Architecture:** Trois corrections indépendantes, un commit par tâche. (1) CGV : migration `bookings` + texte légal en source unique (`lib/legal.ts`) consommé par les pages ET un modal maison, checkbox bloquante côté client + Zod côté serveur. (2) Hero : retrait du `overflow-hidden` régressif sur la `<section>` et confinement du parallax dans une couche interne sur-dimensionnée. (3) Chatbot : scroll interne au conteneur de messages au lieu de `scrollIntoView` (qui défilait `window`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, HeroUI, Supabase, Stripe, Zod, Playwright.

## Global Constraints

- Repo : `diamant-noir` (Kayvila Conciergerie). Branche de travail : `fix/richard-p0-cgv-hero-chatbot`.
- **3 commits minimum, 1 par tâche.** Messages de commit **en français**.
- **Tests Playwright obligatoires : ≥ 18 tests exécutés via `npx playwright test`** (pas une checklist).
- Ne **pas** casser les tests existants (`tests/a11y.spec.ts`, `tests/booking.spec.ts`, `tests/login.spec.ts`, `tests/search.spec.ts`).
- **`npx tsc --noEmit` doit être vert avant chaque push.**
- Table réelle = **`bookings`** (PAS `reservations`).
- `cgv_version` = **`"2026-06-21"`** (version datée, fixée côté serveur, jamais envoyée par le client).
- Idiome modal du repo = **maison** (`fixed inset-0` + `role="dialog"`, cf. `VillaQuickView.tsx`) — **pas** de HeroUI Modal, pas de nouvelle dépendance.
- Apostrophes françaises dans les strings TS : utiliser des **guillemets doubles** (`"l'acceptation"`), jamais des quotes simples.
- Migration SQL : **appliquée manuellement** via le SQL Editor Supabase (projet `wsdawdxucyuyopkpgjij`) — la sandbox bloque Postgres direct.

---

### Task 1 : Checkbox CGV obligatoire

**Files:**
- Create: `supabase/migrations/20260621_bookings_cgv.sql`
- Create: `lib/legal.ts`
- Create: `components/legal/CgvContent.tsx`
- Create: `components/legal/ConfidentialiteContent.tsx`
- Create: `components/legal/LegalModal.tsx`
- Modify: `app/cgv/page.tsx` (texte sourcé depuis `lib/legal.ts`)
- Modify: `app/confidentialite/page.tsx` (texte sourcé depuis `lib/legal.ts`)
- Modify: `components/booking/CheckoutView.tsx` (checkbox + garde + boutons désactivés + body POST)
- Modify: `types/stripe.ts` (`BookingRequestSchema` + `cgvAccepted`)
- Modify: `app/api/booking/route.ts` (écriture `cgv_accepted_at` + `cgv_version`)
- Test: `tests/cgv-checkout.spec.ts`

**Interfaces:**
- Produces: `CGV_VERSION: string`, `CGV_TEXT: { objet; reservationPaiement; annulation; responsabilite }`, `CONFIDENTIALITE_TEXT: { protection; rgpd }` (depuis `lib/legal.ts`).
- Produces: `<CgvContent />`, `<ConfidentialiteContent />` (composants prose sans props).
- Produces: `<LegalModal open onClose title>{children}</LegalModal>`.
- Consumes (existant) : `BookingRequestSchema` (Zod), insert `bookings` dans `app/api/booking/route.ts`, route checkout `/book?villaId=&checkin=&checkout=&guests=`.

---

- [ ] **Step 1 : Migration SQL (colonnes CGV sur `bookings`)**

Créer `supabase/migrations/20260621_bookings_cgv.sql` :

```sql
-- Retour P0 Richard : traçabilité acceptation CGV au checkout
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cgv_accepted_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cgv_version text;

COMMENT ON COLUMN bookings.cgv_accepted_at IS 'Horodatage ISO de l''acceptation des CGV par le client (réservation directe).';
COMMENT ON COLUMN bookings.cgv_version IS 'Version des CGV acceptées (ex. 2026-06-21).';
```

> ⚠️ Étape manuelle : appliquer ce SQL dans le SQL Editor Supabase (projet `wsdawdxucyuyopkpgjij`) avant de tester l'insert en conditions réelles. Le fichier reste versionné dans le repo.

- [ ] **Step 2 : Source de vérité du texte légal (`lib/legal.ts`)**

Créer `lib/legal.ts` (texte repris **verbatim** des pages existantes, apostrophes réelles en guillemets doubles) :

```ts
/** Version courante des CGV/confidentialité — tracée en base à chaque acceptation. */
export const CGV_VERSION = "2026-06-21";

/** Texte des Conditions Générales de Vente (source unique : pages /cgv + modal checkout). */
export const CGV_TEXT = {
  objet:
    "Les présentes conditions régissent la réservation de séjours dans les villas proposées par Kayvila. Toute réservation implique l'acceptation pleine et entière des présentes conditions.",
  reservationPaiement:
    "La réservation est confirmée après validation du paiement sécurisé. Les tarifs sont indiqués en euros, toutes taxes comprises, et incluent les frais de service précisés lors de la commande.",
  annulation:
    "Les conditions d'annulation propres à chaque villa sont indiquées sur sa fiche au moment de la réservation. Nous vous invitons à en prendre connaissance avant de valider votre séjour.",
  responsabilite:
    "Kayvila agit en qualité d'intermédiaire entre les voyageurs et les propriétaires. Le voyageur s'engage à respecter le règlement intérieur de la villa louée.",
} as const;

/** Texte de la Politique de confidentialité (source unique : page /confidentialite + modal checkout). */
export const CONFIDENTIALITE_TEXT = {
  protection:
    "Kayvila s'engage à protéger vos données personnelles. Les informations collectées via les formulaires (réservation, contact, soumission villa) sont utilisées uniquement pour traiter vos demandes et améliorer nos services. Nous ne vendons pas vos données à des tiers.",
  rgpd:
    "Conformément au RGPD, vous pouvez demander l'accès, la rectification ou la suppression de vos données en nous contactant.",
} as const;
```

- [ ] **Step 3 : Composants de contenu prose (réutilisés page + modal)**

Créer `components/legal/CgvContent.tsx` :

```tsx
import { CGV_TEXT } from "@/lib/legal";

/** Contenu prose des CGV — utilisé par la page /cgv (variante simple) et le modal checkout. */
export function CgvContent() {
  return (
    <div className="text-navy/70">
      <h2 className="mb-2 mt-6 font-display text-lg text-navy first:mt-0">Objet</h2>
      <p className="mb-6">{CGV_TEXT.objet}</p>
      <h2 className="mb-2 mt-6 font-display text-lg text-navy">Réservation &amp; paiement</h2>
      <p className="mb-6">{CGV_TEXT.reservationPaiement}</p>
      <h2 className="mb-2 mt-6 font-display text-lg text-navy">Annulation</h2>
      <p className="mb-6">{CGV_TEXT.annulation}</p>
      <h2 className="mb-2 mt-6 font-display text-lg text-navy">Responsabilité</h2>
      <p className="mb-6">{CGV_TEXT.responsabilite}</p>
    </div>
  );
}
```

Créer `components/legal/ConfidentialiteContent.tsx` :

```tsx
import { CONFIDENTIALITE_TEXT } from "@/lib/legal";

/** Contenu prose de la politique de confidentialité — page /confidentialite + modal checkout. */
export function ConfidentialiteContent() {
  return (
    <div className="text-navy/70">
      <p className="mb-6">{CONFIDENTIALITE_TEXT.protection}</p>
      <p className="mb-6 text-sm text-navy/80">{CONFIDENTIALITE_TEXT.rgpd}</p>
    </div>
  );
}
```

- [ ] **Step 4 : Modal légal maison (`LegalModal.tsx`)**

Créer `components/legal/LegalModal.tsx` (idiome `VillaQuickView` : overlay + dialog centré, fermeture overlay/Échap/croix) :

```tsx
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function LegalModal({ open, onClose, title, children }: LegalModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[1050] bg-navy/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-1/2 top-1/2 z-[1060] flex max-h-[85dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-5 py-4">
          <h2 className="font-display text-xl text-navy">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center border border-navy/15 text-navy/50 transition-colors hover:border-navy/30 hover:text-navy"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </>
  );
}
```

- [ ] **Step 5 : Brancher les pages légales sur la source unique**

Dans `app/cgv/page.tsx` : remplacer le corps de `CgvSimple` (les 4 blocs `<h2>`/`<p>` entre le `<h1>` et le `<Link>`) par `<CgvContent />`, et dans la variante `LandingShell` remplacer le texte de chaque `<p>` par la constante correspondante (`{CGV_TEXT.objet}`, `{CGV_TEXT.reservationPaiement}`, `{CGV_TEXT.annulation}`, `{CGV_TEXT.responsabilite}`). Ajouter en haut : `import { CgvContent } from "@/components/legal/CgvContent";` et `import { CGV_TEXT } from "@/lib/legal";`.

Exemple (variante simple) :

```tsx
<div className="mx-auto max-w-3xl">
  <h1 className="mb-5 font-display text-2xl text-navy sm:text-3xl">Conditions générales de vente</h1>
  <CgvContent />
  <Link href="/contact" className="font-medium text-gold hover:underline">
    Nous contacter
  </Link>
  <br />
  <Link href="/" className="mt-6 inline-block font-medium text-gold hover:underline">
    Retour à l&apos;accueil
  </Link>
</div>
```

Exemple (variante LandingShell, 1er bloc) :

```tsx
<LandingSectionNarrow bg="white">
  <LandingBlockTitle eyebrow="Objet" title="Champ d'application" />
  <p className="text-navy/80 leading-relaxed">{CGV_TEXT.objet}</p>
</LandingSectionNarrow>
```

Faire l'équivalent dans `app/confidentialite/page.tsx` (import `ConfidentialiteContent` + `CONFIDENTIALITE_TEXT`, variante simple = `<ConfidentialiteContent />`, variante LandingShell = `{CONFIDENTIALITE_TEXT.protection}` / `{CONFIDENTIALITE_TEXT.rgpd}`).

- [ ] **Step 6 : Schéma Zod serveur (`types/stripe.ts`)**

Ajouter le champ à `BookingRequestSchema` (après `serviceFeePercent`) :

```ts
export const BookingRequestSchema = z.object({
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  villaId: z.string().uuid("ID de villa invalide"),
  guests: z.number().int().positive().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email("Email invalide").optional().nullable(),
  serviceFeePercent: z.number().min(0).max(100).optional().default(5),
  cgvAccepted: z.literal(true, { message: "Acceptation des CGV requise" }),
});
```

> Note : conserver les lignes existantes telles quelles (ne recopier que pour situer `cgvAccepted`). `z.literal(true)` rejette `false`/absent → 400 automatique.

- [ ] **Step 7 : Écrire la traçabilité à l'insert (`app/api/booking/route.ts`)**

En haut du fichier, ajouter l'import : `import { CGV_VERSION } from "@/lib/legal";`

Dans l'objet passé à `.from("bookings").insert({ ... })` (~ligne 262), ajouter deux champs :

```ts
        guests: guestCount,
        cgv_accepted_at: new Date().toISOString(),
        cgv_version: CGV_VERSION,
```

- [ ] **Step 8 : UI checkout — checkbox + modals + garde + boutons (`components/booking/CheckoutView.tsx`)**

8a. Imports en tête : `import { LegalModal } from "@/components/legal/LegalModal";`, `import { CgvContent } from "@/components/legal/CgvContent";`, `import { ConfidentialiteContent } from "@/components/legal/ConfidentialiteContent";`

8b. Nouveaux states (après `isLoggedIn`) :

```tsx
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [openLegal, setOpenLegal] = useState<null | "cgv" | "confidentialite">(null);
```

8c. Garde en tête de `handleConfirmBooking` (après les validations email/nom, avant `setCheckoutLoading(true)`) :

```tsx
    if (!cgvAccepted) {
      setError("Veuillez accepter les CGV pour continuer");
      return;
    }
```

8d. Ajouter `cgvAccepted: true` au body du `fetch("/api/booking")` :

```tsx
        body: JSON.stringify({
          startDate: checkin,
          endDate: checkout,
          villaId: villa.id,
          guests: guestsCount,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          cgvAccepted: true,
        }),
```

8e. Bloc checkbox — l'insérer dans la section « Paiement desktop » juste **avant** le `KayvilaPressableButton` desktop (~ligne 383), et ajouter une copie compacte dans le bloc sticky mobile avant le bouton « Payer ». Pour éviter la duplication, définir le JSX une fois dans une `const` au-dessus du `return` :

```tsx
  const cgvCheckbox = (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-navy/70">
      <input
        type="checkbox"
        checked={cgvAccepted}
        onChange={(e) => setCgvAccepted(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-navy"
        data-testid="cgv-checkbox"
      />
      <span>
        J&apos;ai lu et j&apos;accepte les{" "}
        <button
          type="button"
          onClick={() => setOpenLegal("cgv")}
          className="text-[#B8860B] underline-offset-2 hover:underline"
        >
          Conditions Générales de Vente
        </button>{" "}
        et la{" "}
        <button
          type="button"
          onClick={() => setOpenLegal("confidentialite")}
          className="text-[#B8860B] underline-offset-2 hover:underline"
        >
          Politique de confidentialité
        </button>{" "}
        de Kayvila Conciergerie.
      </span>
    </label>
  );
```

Rendre `{cgvCheckbox}` avant le bouton desktop et avant le bouton mobile.

8f. **Garder les deux boutons cliquables** (NE PAS les désactiver) : la garde de `handleConfirmBooking` (Step 8c) affiche le message et bloque le POST. C'est ce que la spec demande — « afficher le message si tentative sans cocher ». Laisser `disabled={checkoutLoading}` tel quel sur les deux `KayvilaPressableButton` (desktop + sticky mobile).

8g. Monter les modals à la fin du composant, juste avant la fermeture du `</div>` racine :

```tsx
      <LegalModal
        open={openLegal === "cgv"}
        onClose={() => setOpenLegal(null)}
        title="Conditions Générales de Vente"
      >
        <CgvContent />
      </LegalModal>
      <LegalModal
        open={openLegal === "confidentialite"}
        onClose={() => setOpenLegal(null)}
        title="Politique de confidentialité"
      >
        <ConfidentialiteContent />
      </LegalModal>
```

- [ ] **Step 9 : Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 10 : Tests Playwright CGV (`tests/cgv-checkout.spec.ts`)**

Créer le fichier. Les tests UI passent par un vrai checkout (`/book?villaId=...`) — l'id de villa est récupéré depuis `/villas` ; on `test.skip` si aucune villa n'est publiée (résilient, comme `booking.spec.ts`). Le test serveur tape `/api/booking` en direct.

```ts
import { test, expect, type Page } from "@playwright/test";

function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Ouvre un checkout réel ; skip si aucune villa publiée. Retourne false si skip. */
async function gotoCheckout(page: Page): Promise<boolean> {
  await page.goto("/villas");
  await page.waitForTimeout(2000);
  const href = await page.locator("a[href*='/villas/']").first().getAttribute("href").catch(() => null);
  const id = href?.match(/\/villas\/([^/?#]+)/)?.[1];
  if (!id) return false;
  await page.goto(`/book?villaId=${id}&checkin=${isoPlusDays(30)}&checkout=${isoPlusDays(33)}&guests=2`);
  const checkbox = page.getByTestId("cgv-checkbox");
  if (!(await checkbox.isVisible().catch(() => false))) return false;
  return true;
}

test.describe("Checkout — CGV obligatoire", () => {
  test("la checkbox CGV est décochée par défaut", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await expect(page.getByTestId("cgv-checkbox")).not.toBeChecked();
  });

  test("valider sans cocher affiche le message d'erreur CGV", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    const cta = page.getByRole("button", { name: /payer|réserver|confirmer|finaliser/i }).first();
    await cta.click();
    await expect(page.getByText("Veuillez accepter les CGV pour continuer")).toBeVisible();
  });

  test("cocher les CGV fait disparaître l'erreur (pas de blocage CGV)", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    const cta = page.getByRole("button", { name: /payer|réserver|confirmer|finaliser/i }).first();
    await cta.click();
    await expect(page.getByText("Veuillez accepter les CGV pour continuer")).toBeVisible();
    await page.getByTestId("cgv-checkbox").check();
    await cta.click();
    // la garde CGV ne doit plus bloquer (un autre message lié au paiement peut apparaître)
    await expect(page.getByText("Veuillez accepter les CGV pour continuer")).toBeHidden();
  });

  test("ouvre puis ferme le modal CGV", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await page.getByRole("button", { name: "Conditions Générales de Vente" }).click();
    const dialog = page.getByRole("dialog", { name: "Conditions Générales de Vente" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Fermer" }).click();
    await expect(dialog).toBeHidden();
  });

  test("ouvre puis ferme le modal Confidentialité", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await page.getByRole("button", { name: "Politique de confidentialité" }).click();
    const dialog = page.getByRole("dialog", { name: "Politique de confidentialité" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("le modal CGV ferme via clic overlay", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    await page.getByRole("button", { name: "Conditions Générales de Vente" }).click();
    const dialog = page.getByRole("dialog", { name: "Conditions Générales de Vente" });
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5); // coin = overlay
    await expect(dialog).toBeHidden();
  });

  test("la checkbox se coche et se décoche", async ({ page }) => {
    test.skip(!(await gotoCheckout(page)), "Aucune villa publiée");
    const checkbox = page.getByTestId("cgv-checkbox");
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test("le serveur rejette un POST /api/booking sans cgvAccepted (400)", async ({ request, baseURL }) => {
    const res = await request.post("/api/booking", {
      headers: { Origin: baseURL || "http://localhost:3000" },
      data: {
        startDate: isoPlusDays(30),
        endDate: isoPlusDays(33),
        villaId: "00000000-0000-0000-0000-000000000000",
        guests: 2,
        guestEmail: "test@example.com",
      },
    });
    expect(res.status()).toBe(400);
    expect(await res.text()).toContain("CGV");
  });
});
```

- [ ] **Step 11 : Exécuter les tests CGV**

Run: `npx playwright test tests/cgv-checkout.spec.ts`
Expected: tous PASS (ou `skipped` si la base n'a pas de villa publiée ; le test serveur 400 doit toujours PASS).

- [ ] **Step 12 : Commit Task 1**

```bash
git add supabase/migrations/20260621_bookings_cgv.sql lib/legal.ts components/legal/ app/cgv/page.tsx app/confidentialite/page.tsx components/booking/CheckoutView.tsx types/stripe.ts app/api/booking/route.ts tests/cgv-checkout.spec.ts
git commit -m "feat(checkout): case CGV obligatoire + modals CGV/confidentialité + traçabilité en base

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2 : Bloc recherche Hero (régression overflow-hidden)

**Files:**
- Modify: `app/page.tsx:108` (retrait `overflow-hidden` de la section hero)
- Modify: `components/home/HeroBackgroundMedia.tsx:69-110` (parallax dans une couche interne)
- Test: `tests/hero-search.spec.ts`

**Interfaces:**
- Consumes : `HeroSearchWidget` (dropdown `sm:absolute sm:top-full`, déjà en `z-[9999]`), `HeroDateRangePicker` (RangeCalendar HeroUI).
- Produces : aucun nouvel export ; correction purement structurelle.

- [ ] **Step 1 : Retirer `overflow-hidden` de la section hero**

Dans `app/page.tsx`, ligne ~108, retirer le token `overflow-hidden` de la `className` de la `<section>` :

```tsx
      <section
        className="relative flex min-h-[50dvh] w-full flex-col justify-center bg-navy pt-24 md:min-h-[60dvh] md:py-12 md:pt-24 lg:min-h-[min(65vh,560px)]"
```

- [ ] **Step 2 : Confiner le parallax dans une couche interne sur-dimensionnée**

Dans `components/home/HeroBackgroundMedia.tsx`, remplacer le wrapper de rendu (lignes ~69-110) : le wrapper externe garde `overflow-hidden` mais devient **statique** ; une couche interne sur-dimensionnée porte le `transform` parallax. Ainsi le débordement reste clippé aux bornes de la section, sans `overflow-hidden` sur la section, et le calendrier (frère, hors de ce wrapper) n'est plus coupé.

```tsx
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden" aria-hidden>
      <div
        className="absolute inset-x-0 -top-[10%] h-[120%] w-full"
        style={
          ENABLE_PARALLAX
            ? { transform: `translateY(${scrollY * 0.06}px)`, willChange: "transform" }
            : undefined
        }
      >
        {/* Poster — toujours présent, la vidéo passe par-dessus si prête */}
        <Image
          src="/villa-hero.jpg"
          alt="Villa de luxe avec piscine en Martinique — Kayvila"
          fill
          priority
          className="object-cover opacity-70"
          sizes="100vw"
        />

        {/* Vidéo — masquée si échec autoplay ou prefers-reduced-motion */}
        {!videoFailed && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            webkit-playsinline="true"
            x-webkit-airplay="deny"
            disableRemotePlayback
            preload="metadata"
            poster="/villa-hero.jpg"
            onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              videoReady ? "opacity-70" : "opacity-0"
            }`}
            aria-hidden
          >
            <source src="/hero.webm" type="video/webm" />
          </video>
        )}
      </div>
    </div>
  );
```

> `<Image fill>` exige un parent positionné : la couche interne est `absolute` → OK. La sur-dimension (`h-[120%] -top-[10%]`) garantit qu'aucun bord n'apparaît malgré la translation.

- [ ] **Step 3 : Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4 : Tests Playwright Hero (`tests/hero-search.spec.ts`)**

```ts
import { test, expect } from "@playwright/test";

test.describe("Hero — bloc recherche", () => {
  test("le calendrier s'ouvre au clic sur Dates (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: /choisir les dates/i }).click();
    await expect(page.getByRole("application", { name: /dates de séjour/i })).toBeVisible();
  });

  test("le calendrier n'est pas clippé (entièrement dans le viewport) — desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: /choisir les dates/i }).click();
    const cal = page.getByRole("application", { name: /dates de séjour/i });
    await expect(cal).toBeVisible();
    const box = await cal.boundingBox();
    const vp = page.viewportSize();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(100); // pas écrasé à 0
    expect(box!.y + box!.height).toBeLessThanOrEqual(vp!.height + 1); // bas non coupé
  });

  test("sélectionner une plage de dates met à jour le résumé", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: /choisir les dates/i }).click();
    const enabledDays = page.locator("[role='application'] [role='gridcell'] [role='button']:not([aria-disabled='true'])");
    await enabledDays.nth(2).click();
    await enabledDays.nth(5).click();
    await expect(page.getByText(/\d+\s*nuit/i)).toBeVisible();
  });

  test("le sélecteur de voyageurs incrémente/décrémente", async ({ page }) => {
    await page.goto("/");
    const plus = page.getByRole("button", { name: /ajouter un voyageur|augmenter|\+/i }).first();
    await plus.click();
    await expect(page.getByText(/voyageurs/i).first()).toBeVisible();
  });

  test("le calendrier est visible sur viewport mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: /choisir les dates/i }).click();
    const cal = page.getByRole("application", { name: /dates de séjour/i });
    await expect(cal).toBeVisible();
    const box = await cal.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(100);
  });

  test("Rechercher navigue vers /villas avec les paramètres", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^rechercher$/i }).click();
    await page.waitForURL(/\/villas\?/);
    expect(page.url()).toContain("guests=");
  });
});
```

> Si un `name`/`role` ne matche pas exactement le markup réel (ex. le RangeCalendar HeroUI expose `role="application"` via `aria-label="Dates de séjour"`, le bouton Dates a `aria-label="Choisir les dates du séjour"`), ajuster le sélecteur en inspectant le DOM — ne pas inventer d'attributs. Le test #2 (non-clipping) est le cœur de la non-régression.

- [ ] **Step 5 : Exécuter les tests Hero**

Run: `npx playwright test tests/hero-search.spec.ts`
Expected: tous PASS.

- [ ] **Step 6 : Commit Task 2**

```bash
git add app/page.tsx components/home/HeroBackgroundMedia.tsx tests/hero-search.spec.ts
git commit -m "fix(hero): calendrier recherche non clippé — parallax confiné, overflow-hidden section retiré

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3 : Chatbot proprio — scroll parasite

**Files:**
- Modify: `components/dashboard/DashboardCopilotChat.tsx` (scroll interne au conteneur)
- Test: `tests/chatbot-scroll.spec.ts`

**Interfaces:**
- Consumes : `useCopilotContext()` (`messages`, `isLoading`, `sendMessage`, `lastActionResult`), endpoint mocké `/api/dashboard/owner-assistant`.
- Produces : correction interne ; aucun nouvel export.

- [ ] **Step 1 : Scroller le conteneur de messages, pas `window`**

Dans `components/dashboard/DashboardCopilotChat.tsx` :

1a. Ajouter un ref conteneur + un ref « collé en bas » (après `messagesEndRef`) :

```tsx
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
```

1b. Remplacer le `useEffect` de scroll (lignes ~28-31) par :

```tsx
  // Auto-scroll INTERNE au conteneur (jamais window) — n'agit que si l'utilisateur
  // est déjà collé en bas du chat, pour ne pas faire défiler la page parente.
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading, lastActionResult]);
```

1c. Mettre `focus({ preventScroll: true })` dans `handleSubmit` (ligne ~38) :

```tsx
    inputRef.current?.focus({ preventScroll: true });
```

1d. Attacher le ref + un handler de scroll au conteneur de messages (la div ligne ~67) :

```tsx
      <div
        ref={messagesContainerRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className={`overflow-y-auto px-5 py-4 ${fullHeight ? "flex-1" : ""}`}
        style={fullHeight ? undefined : { maxHeight: 400 }}
      >
```

> Le `<div ref={messagesEndRef} />` (ligne ~136) peut rester — il n'est plus utilisé pour le scroll mais ne gêne pas.

- [ ] **Step 2 : Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3 : Tests Playwright Chatbot (`tests/chatbot-scroll.spec.ts`)**

Connexion owner + mock de l'endpoint copilot (déterministe, rapide). Skip propre si l'environnement n'a pas d'owner de test ou si le chat n'est pas monté.

```ts
import { test, expect, type Page } from "@playwright/test";

const OWNER = {
  email: process.env.TEST_OWNER_EMAIL || "owner@kayvila.com",
  password: process.env.TEST_OWNER_PASSWORD || "owner123",
};

async function loginOwnerAndOpenChat(page: Page): Promise<boolean> {
  // Mock l'endpoint copilot : réponse longue et instantanée
  await page.route("**/api/dashboard/owner-assistant", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        response: "Voici une réponse de test détaillée. ".repeat(20),
        reply: "Voici une réponse de test détaillée. ".repeat(20),
        suggested_prompts: [],
        suggestedPrompts: [],
      }),
    });
  });

  await page.goto("/login");
  await page.locator("input[type='email'], input[name='email']").first().fill(OWNER.email);
  await page.locator("input[type='password']").first().fill(OWNER.password);
  await page.locator("button[type='submit']").first().click();
  const reached = await page
    .waitForURL((url) => url.pathname.startsWith("/dashboard"), { timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!reached) return false;

  const input = page.getByPlaceholder("Posez votre question...");
  if (!(await input.isVisible().catch(() => false))) return false;
  return true;
}

test.describe("Chatbot proprio — scroll isolé", () => {
  test("envoyer un message ne déplace pas le scroll de la page", async ({ page }) => {
    test.skip(!(await loginOwnerAndOpenChat(page)), "Owner de test / chat indisponible");
    const before = await page.evaluate(() => window.scrollY);
    const input = page.getByPlaceholder("Posez votre question...");
    await input.fill("Bonjour");
    await input.press("Enter");
    await expect(page.getByText(/réponse de test détaillée/i).first()).toBeVisible();
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(4);
  });

  test("la réponse s'affiche dans la boîte de chat", async ({ page }) => {
    test.skip(!(await loginOwnerAndOpenChat(page)), "Owner de test / chat indisponible");
    const input = page.getByPlaceholder("Posez votre question...");
    await input.fill("Combien de réservations ?");
    await input.press("Enter");
    await expect(page.getByText(/réponse de test détaillée/i).first()).toBeVisible();
  });

  test("le rendu de la réponse ne repousse pas la page", async ({ page }) => {
    test.skip(!(await loginOwnerAndOpenChat(page)), "Owner de test / chat indisponible");
    const input = page.getByPlaceholder("Posez votre question...");
    await input.fill("Mes revenus ce mois ?");
    const before = await page.evaluate(() => window.scrollY);
    await input.press("Enter");
    await expect(page.getByText(/réponse de test détaillée/i).first()).toBeVisible();
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(4);
  });

  test("l'input reste focus après envoi", async ({ page }) => {
    test.skip(!(await loginOwnerAndOpenChat(page)), "Owner de test / chat indisponible");
    const input = page.getByPlaceholder("Posez votre question...");
    await input.fill("Test focus");
    await input.press("Enter");
    await expect(input).toBeFocused();
  });
});
```

- [ ] **Step 4 : Exécuter les tests Chatbot**

Run: `npx playwright test tests/chatbot-scroll.spec.ts`
Expected: tous PASS (ou skipped si owner de test absent).

- [ ] **Step 5 : Commit Task 3**

```bash
git add components/dashboard/DashboardCopilotChat.tsx tests/chatbot-scroll.spec.ts
git commit -m "fix(copilot): isoler le scroll du chatbot proprio de la page dashboard

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4 : Vérification finale (suite complète)

**Files:** aucun (vérification).

- [ ] **Step 1 : Suite complète Playwright (≥ 18 tests)**

Run: `npx playwright test`
Expected: les 4 nouveaux fichiers (8 CGV + 6 hero + 4 chatbot = 18) + les tests existants passent (ou skipped pour cause de données/auth absentes), aucun échec.

- [ ] **Step 2 : Typecheck global**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3 : Rappel migration**

Confirmer que `supabase/migrations/20260621_bookings_cgv.sql` a été appliqué manuellement dans le SQL Editor Supabase (sinon l'insert booking échouera sur colonnes inconnues en prod).

---

## Notes d'exécution

- **Prérequis tests** : un serveur Next lancé (`npm run dev`, `localhost:3000`) ou `PLAYWRIGHT_BASE_URL` pointant vers un déploiement, avec au moins une villa publiée (CGV) et un owner de test (`TEST_OWNER_EMAIL`/`TEST_OWNER_PASSWORD`) pour le chatbot. Les tests dépendants de données utilisent `test.skip` plutôt que d'échouer.
- **Ordre** : Task 1 → 2 → 3 → 4. Indépendantes entre elles (aucune dépendance de code croisée), mais commits séparés par tâche comme exigé.
- **Push** : seulement sur demande de l'utilisateur (ne pas pousser automatiquement).
```