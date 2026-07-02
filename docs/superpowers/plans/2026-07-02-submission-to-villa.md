# Soumission acceptée → Villa pré-remplie — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Au clic « Accepter » sur une soumission, créer automatiquement la villa brouillon pré-remplie (non publiée), liée au proprio si son compte existe, avec lien direct vers l'éditeur.

**Architecture:** Création côté serveur dans `updateSubmissionStatus` (point d'entrée partagé bouton admin + copilot). Mapping pur testable dans `lib/submissions/create-villa-from-submission.ts`. Migration ajoute la capture propre (equipements/surface/villa_type/photo_urls) + `villa_id` (idempotence).

**Tech Stack:** Next.js 15 App Router, Supabase (supabaseAdmin), Zod, vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-submission-to-villa-design.md`

## Global Constraints

- Strings JS en **double quotes** (apostrophes françaises cassent le build).
- Migrations : timestamp **14 chiffres** `YYYYMMDDHHMMSS` (jamais 8).
- La migration doit être **appliquée en prod via Supabase MCP (`apply_migration`, project_id `wsdawdxucyuyopkpgjij`) avant** de pousser le code qui écrit les nouvelles colonnes.
- Ne JAMAIS insérer `""` dans `collection_tier`, `cancellation_template` (check constraints) ni `owner_id` (uuid) — omettre ou `null`.
- Chemins route-groups `app/(admin)/…` : vérifier `find app -maxdepth 2 -iname "*(*" -type d` après édition.
- Après chaque commit : `git push`. Travailler sur une branche `feat/submission-to-villa`, merger sur main à la fin.
- Fin de tâche code : `npx tsc --noEmit` (les 10 erreurs préexistantes a11y.spec + .next/types sont à ignorer).
- Tout se passe dans `diamant-noir/`.

---

### Task 1: Migration `villa_submissions`

**Files:**
- Create: `supabase/migrations/<timestamp du jour, ex 20260703100000>_submission_to_villa.sql`

**Interfaces:**
- Produces: colonnes `equipements jsonb`, `surface text`, `villa_type text`, `photo_urls jsonb`, `villa_id uuid` sur `villa_submissions`.

- [ ] **Step 1: Écrire la migration**

```sql
-- Capture propre des champs du formulaire de soumission + lien vers la villa créée
alter table public.villa_submissions
  add column if not exists equipements jsonb not null default '[]'::jsonb,
  add column if not exists surface text,
  add column if not exists villa_type text,
  add column if not exists photo_urls jsonb not null default '[]'::jsonb,
  add column if not exists villa_id uuid references public.villas(id) on delete set null;

comment on column public.villa_submissions.villa_id is 'Villa créée automatiquement à l''acceptation (idempotence)';
```

- [ ] **Step 2: Appliquer en prod via Supabase MCP**

Utiliser `mcp__claude_ai_Supabase__apply_migration` (project_id `wsdawdxucyuyopkpgjij`, name `submission_to_villa`) avec le SQL ci-dessus.
Vérifier : `SELECT column_name FROM information_schema.columns WHERE table_name = 'villa_submissions' AND column_name IN ('equipements','surface','villa_type','photo_urls','villa_id');` → 5 lignes.

- [ ] **Step 3: Commit + push**

```bash
git add supabase/migrations/*_submission_to_villa.sql
git commit -m "feat(db): colonnes capture soumission (equipements, surface, type, photos) + villa_id"
git push
```

---

### Task 2: Le POST stocke les nouveaux champs

**Files:**
- Modify: `app/api/villa-submissions/route.ts` (insert lignes ~68-104)

**Interfaces:**
- Consumes: `villaSubmissionSchema` (lib/schemas.ts) — accepte déjà `equipements`, `surface`, `villa_type`, `photo_urls` ; le POST les destructure déjà (lignes 42-65).

- [ ] **Step 1: Ajouter les champs à l'insert**

Dans l'objet passé à `.insert({ ... })`, après `status: "pending",` ajouter :

```ts
        equipements: Array.isArray(equipements) ? equipements : [],
        surface: surface != null && surface !== "" ? String(surface) : null,
        villa_type: villa_type || null,
        photo_urls: Array.isArray(photo_urls) ? photo_urls : [],
```

(`villa_type` et `photo_urls` sont déjà destructurés en tête de fonction — `surface` et `equipements` aussi.)

- [ ] **Step 2: Compiler + commit + push**

```bash
npx tsc --noEmit
git add app/api/villa-submissions/route.ts
git commit -m "feat(submissions): le POST stocke equipements/surface/type/photo_urls"
git push
```

---

### Task 3: Mapping pur `mapSubmissionToVilla` (TDD)

**Files:**
- Create: `lib/submissions/create-villa-from-submission.ts`
- Test: `lib/submissions/create-villa-from-submission.test.ts`

**Interfaces:**
- Produces:
  - `type SubmissionRow = Record<string, unknown>` (ligne brute de villa_submissions)
  - `mapSubmissionToVilla(s: SubmissionRow): Record<string, unknown>` — payload d'insert villas (PURE)
  - `createVillaFromSubmission(admin: SupabaseClient, submission: SubmissionRow): Promise<{ villaId: string | null; created: boolean; error?: string }>` (Task 4 l'utilise)

- [ ] **Step 1: Écrire les tests (échec attendu)**

```ts
// lib/submissions/create-villa-from-submission.test.ts
import { describe, it, expect } from "vitest";
import { mapSubmissionToVilla } from "./create-villa-from-submission";

const base = {
  name: "Jean Proprio",
  email: "jean@test.com",
  villa_name: "Villa Azur",
  villa_location: "Trois-Îlets",
  adresse_postale: "12 rue des Cocotiers",
  chambres: "3",
  salles_de_bains: "2 sdb",
  surface: "180",
  equipements: ["Piscine", "Wi-Fi", "Climatisation", "Jardin"],
  photo_urls: ["https://x/a.jpg", "https://x/b.jpg"],
  airbnb_url: "https://airbnb.fr/rooms/1",
  message: "Belle villa familiale",
  villa_description: "Type: villa | Surface: 180 m²",
};

describe("mapSubmissionToVilla", () => {
  it("mappe les champs de base", () => {
    const v = mapSubmissionToVilla(base);
    expect(v.name).toBe("Villa Azur");
    expect(v.location).toBe("Trois-Îlets");
    expect(v.bedrooms).toBe(3);
    expect(v.bathrooms_count).toBe(2);
    expect(v.surface_m2).toBe(180);
    expect(v.capacity).toBe(6);
    expect(v.airbnb_url).toBe("https://airbnb.fr/rooms/1");
    expect(v.is_published).toBe(false);
    expect(v.price_per_night).toBe(0);
  });

  it("répartit les équipements intérieur/extérieur", () => {
    const v = mapSubmissionToVilla(base);
    expect(v.equipment_exterior).toEqual(["Piscine", "Jardin"]);
    expect(v.equipment_interior).toEqual(["Wi-Fi", "Climatisation"]);
  });

  it("photos → image_urls + image_url (cover)", () => {
    const v = mapSubmissionToVilla(base);
    expect(v.image_urls).toEqual(["https://x/a.jpg", "https://x/b.jpg"]);
    expect(v.image_url).toBe("https://x/a.jpg");
  });

  it("fallbacks : nom depuis le proprio, localisation depuis l'adresse, parse tolérant", () => {
    const v = mapSubmissionToVilla({ name: "Jean Proprio", email: "j@t.com", chambres: "pas un nombre" });
    expect(v.name).toBe("Villa de Jean Proprio");
    expect(v.bedrooms).toBe(0);
    expect(v.capacity).toBe(2);
    expect(v.image_urls).toEqual([]);
    const v2 = mapSubmissionToVilla({ name: "J", email: "j@t.com", adresse_postale: "12 rue X" });
    expect(v2.location).toBe("12 rue X");
  });

  it("description = message + résumé technique, jamais de champs interdits", () => {
    const v = mapSubmissionToVilla(base);
    expect(v.description).toContain("Belle villa familiale");
    expect(v.description).toContain("Type: villa");
    expect("collection_tier" in v).toBe(false);
    expect("cancellation_template" in v).toBe(false);
    expect("owner_id" in v).toBe(false);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run lib/submissions/create-villa-from-submission.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implémenter**

```ts
// lib/submissions/create-villa-from-submission.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type SubmissionRow = Record<string, unknown>;

const EXTERIOR_KEYWORDS = ["piscine", "jardin", "terrasse", "balcon", "barbecue", "parking", "vue mer"];

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : v != null ? String(v) : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
// Parse tolérant : premier nombre trouvé dans un texte libre ("3 chambres" → 3), sinon 0
const num = (v: unknown): number => {
  const m = str(v).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
};

export function mapSubmissionToVilla(s: SubmissionRow): Record<string, unknown> {
  const bedrooms = num(s.chambres);
  const equipements = arr(s.equipements);
  const photos = arr(s.photo_urls);
  const isExterior = (e: string) => EXTERIOR_KEYWORDS.some((k) => e.toLowerCase().includes(k));

  const description = [str(s.message), str(s.villa_description)].filter(Boolean).join("\n\n");

  return {
    name: str(s.villa_name) || `Villa de ${str(s.name) || "propriétaire"}`,
    location: str(s.villa_location) || str(s.adresse_postale) || "",
    description,
    price_per_night: 0,
    capacity: Math.max(2, bedrooms * 2),
    bedrooms,
    bathrooms_count: num(s.salles_de_bains),
    surface_m2: num(s.surface),
    equipment_interior: equipements.filter((e) => !isExterior(e)),
    equipment_exterior: equipements.filter(isExterior),
    image_urls: photos,
    image_url: photos[0] ?? "",
    airbnb_url: str(s.airbnb_url) || "",
    is_published: false,
    min_nights: 2,
    commission_rate: 22,
    // JAMAIS collection_tier / cancellation_template / owner_id ici ("" viole les contraintes DB)
  };
}

export async function createVillaFromSubmission(
  admin: SupabaseClient,
  submission: SubmissionRow,
): Promise<{ villaId: string | null; created: boolean; error?: string }> {
  // Idempotence : villa déjà créée pour cette soumission
  if (submission.villa_id) {
    return { villaId: String(submission.villa_id), created: false };
  }

  const payload = mapSubmissionToVilla(submission);

  // Lier le proprio si un compte existe avec cet email
  const email = String(submission.email ?? "").trim().toLowerCase();
  if (email) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (profile?.id) payload.owner_id = profile.id;
  }

  const { data: villa, error } = await admin.from("villas").insert(payload).select("id").single();
  if (error || !villa) {
    return { villaId: null, created: false, error: error?.message ?? "Insert villa échoué" };
  }

  await admin
    .from("villa_submissions")
    .update({ villa_id: villa.id, updated_at: new Date().toISOString() })
    .eq("id", submission.id as string);

  return { villaId: villa.id as string, created: true };
}
```

- [ ] **Step 4: Vérifier le PASS**

Run: `npx vitest run lib/submissions/create-villa-from-submission.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit + push**

```bash
git add lib/submissions/create-villa-from-submission.ts lib/submissions/create-villa-from-submission.test.ts
git commit -m "feat(submissions): mapping soumission → villa pré-remplie (pur + testé)"
git push
```

---

### Task 4: Branchement dans `updateSubmissionStatus`

**Files:**
- Modify: `lib/submissions/update-status.ts`
- Modify: `app/api/villa-submissions/route.ts` (PATCH, lignes ~247-252)

**Interfaces:**
- Consumes: `createVillaFromSubmission` (Task 3).
- Produces: `updateSubmissionStatus` renvoie désormais `{ submission, villaId?, villaCreationError?, error? }`. Le PATCH renvoie `{ ...submission, villa_id: villaId }`.

- [ ] **Step 1: Appeler la création à l'acceptation**

Dans `lib/submissions/update-status.ts` :
- Import : `import { createVillaFromSubmission } from "./create-villa-from-submission";`
- Type de retour : `Promise<{ submission: Record<string, unknown> | null; villaId?: string | null; villaCreationError?: string; error?: string }>`
- Après le bloc email/webhook, juste avant `return { submission };`, insérer :

```ts
  // Acceptation → création auto de la villa brouillon pré-remplie (idempotent)
  let villaId: string | null = null;
  let villaCreationError: string | undefined;
  if (status === "accepted") {
    const result = await createVillaFromSubmission(admin, submission);
    villaId = result.villaId;
    if (result.error) {
      villaCreationError = result.error;
      console.error("[submissions] création villa échouée:", result.error);
    }
  }

  return { submission, villaId, villaCreationError };
```

(et supprimer l'ancien `return { submission };`)

- [ ] **Step 2: Le PATCH expose villa_id**

Dans `app/api/villa-submissions/route.ts`, remplacer :

```ts
    const { submission, error } = await updateSubmissionStatus(supabase, { id, status, visit_date, owner_email });
    if (error || !submission) {
      return NextResponse.json({ error: error ?? "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json(submission);
```

par :

```ts
    const { submission, villaId, villaCreationError, error } = await updateSubmissionStatus(supabase, { id, status, visit_date, owner_email });
    if (error || !submission) {
      return NextResponse.json({ error: error ?? "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ ...submission, villa_id: villaId ?? submission.villa_id ?? null, villa_creation_error: villaCreationError ?? null });
```

- [ ] **Step 3: Vérifier les autres appelants de `updateSubmissionStatus`**

Run: `grep -rn "updateSubmissionStatus" app lib --include="*.ts" --include="*.tsx"`
Le copilot admin (route concierge/admin ou équivalent) destructure `{ submission, error }` — le retour reste compatible (champs ajoutés seulement). Ne rien casser ; si un appelant type le retour explicitement, mettre à jour son type.

- [ ] **Step 4: Compiler + tests + commit + push**

```bash
npx tsc --noEmit
npx vitest run lib/
git add lib/submissions/update-status.ts app/api/villa-submissions/route.ts
git commit -m "feat(submissions): accepter = créer la villa brouillon pré-remplie (idempotent)"
git push
```

---

### Task 5: UI — lien « Ouvrir dans l'éditeur »

**Files:**
- Modify: `app/(admin)/admin/soumissions/SubmissionActions.tsx`
- Modify: `app/(admin)/admin/soumissions/[id]/page.tsx`

**Interfaces:**
- Consumes: réponse PATCH avec `villa_id` (Task 4) ; colonne `villa_submissions.villa_id` (Task 1).

- [ ] **Step 1: SubmissionActions — capter villa_id et l'afficher**

Dans `SubmissionActions.tsx` :
- Ajouter un state : `const [villaId, setVillaId] = useState<string | null>(null);`
- Dans `call()`, remplacer le corps par :

```ts
  const call = async (status: string, extra?: Record<string, any>) => {
    setLoading(status);
    const res = await fetch("/api/villa-submissions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, owner_email: ownerEmail, ...extra }) });
    try {
      const data = await res.json();
      if (data?.villa_id) setVillaId(String(data.villa_id));
    } catch { /* réponse sans corps : on garde le comportement existant */ }
    setLoading(null);
    setDone(true);
    router.refresh();
  };
```

- Remplacer `if (done) return <span ...>✓ Traité</span>;` par :

```tsx
  if (done) {
    return villaId ? (
      <a href={`/admin/villas/${villaId}`} className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-gold/90">
        ✓ Villa créée — Ouvrir dans l&apos;éditeur
      </a>
    ) : (
      <span className="shrink-0 text-[11px] font-medium text-emerald-700">✓ Traité</span>
    );
  }
```

- [ ] **Step 2: Page détail — bandeau si villa déjà créée**

Dans `app/(admin)/admin/soumissions/[id]/page.tsx`, sous le header (après le badge statut, avant les Rows), ajouter :

```tsx
      {s.villa_id && (
        <a
          href={`/admin/villas/${s.villa_id}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gold/40 bg-gold/5 px-4 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
        >
          Villa créée à partir de cette soumission — Ouvrir dans l&apos;éditeur →
        </a>
      )}
```

(La page fait un select sur `villa_submissions` — vérifier qu'il inclut `villa_id` ; si le select est `*`, rien à faire.)

- [ ] **Step 3: Compiler + route-groups + commit + push**

```bash
npx tsc --noEmit
find app -maxdepth 2 -iname "*(*" -type d
git add "app/(admin)/admin/soumissions/SubmissionActions.tsx" "app/(admin)/admin/soumissions/[id]/page.tsx"
git commit -m "feat(admin/soumissions): lien Ouvrir dans l'éditeur après acceptation"
git push
```

---

### Task 6: Fix select Collection (signature/iconic)

**Files:**
- Modify: `components/dashboard/villa-editor/VillaEditor.tsx` (section admin, options du select `ve-admin-tier`)

- [ ] **Step 1: Aligner les options sur la contrainte DB**

Remplacer :

```tsx
            <option value="">—</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="signature">Signature</option>
```

par :

```tsx
            <option value="">—</option>
            <option value="signature">Signature</option>
            <option value="iconic">Iconic</option>
```

(La contrainte `villas_collection_tier_check` n'accepte que `signature`/`iconic` ; `standard`/`premium` faisaient 500-er l'autosave.)

- [ ] **Step 2: Compiler + commit + push**

```bash
npx tsc --noEmit
git add components/dashboard/villa-editor/VillaEditor.tsx
git commit -m "fix(villa-editor): tiers Collection alignés sur la DB (signature/iconic)"
git push
```

---

### Task 7: Vérification finale + merge

- [ ] **Step 1: Suite complète**

```bash
npx vitest run
npm run lint
npm run build
```
Expected: vitest PASS (117+), lint sans nouvelle erreur, build OK.

- [ ] **Step 2: Test E2E manuel rapide (dev server frais — redémarrer `npm run start` après build)**

1. Soumettre une villa via le formulaire public `/conciergerie` (ou POST direct) avec équipements + photos.
2. Admin → Soumissions → « Accepter » → le bouton devient « ✓ Villa créée — Ouvrir dans l'éditeur ».
3. Ouvrir l'éditeur : nom, localisation, chambres, sdb, équipements répartis, photos présentes ; villa non publiée ; prix « À remplir ».
4. Re-cliquer « Accepter » via un second PATCH → pas de doublon (idempotence).
5. Supprimer la villa + soumission de test en SQL après vérification.

- [ ] **Step 3: Merge + push**

```bash
git checkout main && git pull origin main && git merge feat/submission-to-villa
npx vitest run
git push origin main
git branch -d feat/submission-to-villa && git push origin --delete feat/submission-to-villa
```

- [ ] **Step 4: Persister les apprentissages dans `docs/auto-learn/LEARNINGS.md` + mémoire projet**
