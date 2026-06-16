# Audit Batch — Lot 1 (Sécurité HAUTE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fermer les failles sécurité HAUTE : XSS email, et durcir les 2 routes d'écriture non protégées (`villa-submissions` POST public, `create-villa`).

**Architecture:** Réutiliser les helpers existants (`lib/security.ts` : `checkCsrf`, `checkRateLimit`, `ipFromRequest`). Ajouter `escapeHtml()` et un schéma zod de soumission. Pas de nouvelle dépendance (zod ^4.4.1 déjà présent).

**Tech Stack:** Next.js 15, TypeScript, zod ^4.4.1, vitest.

**Triage (état réel vérifié) :**
- Sec#2 : `app/api/villa-submissions/route.ts` ~ligne 120 construit l'email **admin** par template literal brut (`name`, `email`, `phone`, `villa_name`, `details`, `airbnb_url`, `message`) → XSS. (2e email proprio = React Email `render()`, déjà safe.) **RÉEL.**
- Sec#5/6 : POST `villa-submissions` (public) = aucun `checkCsrf`/`checkRateLimit`/validation. **RÉEL.**
- Sec#7 : `create-villa` a déjà `withCsrf` + auth + `owner_id` forcé, mais `{ ...payload }` brut → un user authentifié non-admin peut injecter `is_published`/`commission_rate`/`collection_tier`. **RÉEL (escalade de privilège).**
- Sec#8 : git-secrets = tooling local → **note seulement** (Task 4), pas de modif de hooks git sans accord explicite.

**Branche :** `fix/audit-batch-juin` (déjà active, Lot 0 mergé dessus).

---

### Task 1: escapeHtml + sécuriser l'email admin — Sec#2

**Files:**
- Modify: `lib/security.ts` (ajout fonction)
- Test: `lib/security.test.ts`
- Modify: `app/api/villa-submissions/route.ts` (bloc email admin ~lignes 105-133)

- [ ] **Step 1: Test qui échoue — `lib/security.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { escapeHtml } from "./security";

describe("escapeHtml", () => {
  it("neutralise les balises et guillemets", () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
    expect(escapeHtml('a"b\'c&d')).toBe("a&quot;b&#39;c&amp;d");
  });
  it("gère null/undefined sans planter", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run lib/security.test.ts`
Expected: FAIL — `escapeHtml` n'est pas exporté.

- [ ] **Step 3: Implémenter `escapeHtml` dans `lib/security.ts`** (ajouter en fin de fichier)

```ts
/**
 * Échappe les caractères HTML dangereux avant interpolation dans un template
 * email/HTML construit à la main (audit Sec#2 — anti-XSS).
 */
export function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

- [ ] **Step 4: Vérifier le succès**

Run: `npx vitest run lib/security.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Appliquer dans l'email admin de `villa-submissions`**

En tête du fichier, ajouter à un import existant ou nouveau :
```ts
import { escapeHtml } from "@/lib/security";
```

Dans le bloc `html: ` de l'email admin (le `getResend().emails.send` vers `ADMIN_NOTIFICATION_EMAIL`), envelopper CHAQUE interpolation de donnée utilisateur avec `escapeHtml(...)`. Le bloc devient :

```ts
          html: `
            <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#0a1929">
              <h2 style="font-weight:400;color:#d4af37">Nouvelle soumission villa</h2>
              <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
              <p><strong>Email :</strong> ${escapeHtml(email)}</p>
              ${phone ? `<p><strong>Tél. :</strong> ${escapeHtml(phone)}</p>` : ""}
              <p style="margin-top:16px"><strong>${escapeHtml(villa_name || "Villa")}</strong></p>
              <p>${escapeHtml(details || "—")}</p>
              ${airbnb_url ? `<p><strong>Airbnb :</strong> <a href="${escapeHtml(airbnb_url)}">${escapeHtml(airbnb_url)}</a></p>` : ""}
              ${message ? `<p style="margin-top:12px;font-style:italic">« ${escapeHtml(message)} »</p>` : ""}
              <p style="margin-top:16px;font-size:11px;color:#999">Réf. ${submission.id}</p>
            </div>
          `,
```

(Ne pas toucher au `subject` ni au 2e email proprio.)

- [ ] **Step 6: Build + commit**

Run: `npm run build` (vert attendu)
```bash
git add lib/security.ts lib/security.test.ts app/api/villa-submissions/route.ts
git commit -m "fix(audit): lot 1.1 — escapeHtml + email admin villa-submissions (Sec#2 XSS)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Sécuriser POST villa-submissions (CSRF + rate limit + zod) — Sec#5, Sec#6

**Files:**
- Modify: `lib/schemas.ts` (ajout schéma zod)
- Test: `lib/schemas.test.ts`
- Modify: `app/api/villa-submissions/route.ts` (début de `POST`)

- [ ] **Step 1: Test qui échoue — `lib/schemas.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { villaSubmissionSchema } from "./schemas";

describe("villaSubmissionSchema", () => {
  it("accepte une soumission minimale valide", () => {
    const r = villaSubmissionSchema.safeParse({ name: "Jean", email: "jean@test.com" });
    expect(r.success).toBe(true);
  });
  it("rejette name manquant ou email invalide", () => {
    expect(villaSubmissionSchema.safeParse({ email: "x@y.com" }).success).toBe(false);
    expect(villaSubmissionSchema.safeParse({ name: "Jean", email: "pas-un-email" }).success).toBe(false);
  });
  it("accepte les champs optionnels (équipements, photo_urls)", () => {
    const r = villaSubmissionSchema.safeParse({
      name: "Jean", email: "jean@test.com",
      equipements: ["wifi", "bbq"], photo_urls: ["https://x.com/a.jpg"], parking_securise: true,
    });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run lib/schemas.test.ts`
Expected: FAIL — `villaSubmissionSchema` non exporté.

- [ ] **Step 3: Ajouter le schéma dans `lib/schemas.ts`** (en tête, après le commentaire de fichier)

```ts
import { z } from "zod";

/** Soumission villa publique (audit Sec#6). Champs optionnels permissifs, name+email requis. */
export const villaSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().optional(),
  villa_name: z.string().trim().optional(),
  villa_location: z.string().trim().optional(),
  villa_type: z.string().trim().optional(),
  surface: z.union([z.string(), z.number()]).optional(),
  surface_terrain: z.union([z.string(), z.number()]).optional(),
  chambres: z.union([z.string(), z.number()]).optional(),
  salles_de_bains: z.union([z.string(), z.number()]).optional(),
  etages: z.union([z.string(), z.number()]).optional(),
  parking_places: z.union([z.string(), z.number()]).optional(),
  parking_securise: z.boolean().optional(),
  equipements: z.array(z.string()).optional(),
  already_listed: z.string().optional(),
  airbnb_url: z.string().url().optional().or(z.literal("")),
  message: z.string().optional(),
  gardien_existant: z.string().optional(),
  delai_souhaite: z.string().optional(),
  adresse_postale: z.string().optional(),
  no_photos: z.boolean().optional(),
  photo_urls: z.array(z.string()).optional(),
}).passthrough();
```

(`.passthrough()` : on garde les champs additionnels éventuels — l'insert n'utilise que les champs connus, et Postgres rejette toute colonne inconnue de toute façon. Le but est de VALIDER name/email + types, pas de tout lister.)

- [ ] **Step 4: Vérifier le succès**

Run: `npx vitest run lib/schemas.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Brancher dans `POST` de `app/api/villa-submissions/route.ts`**

En tête du fichier, ajouter :
```ts
import { checkCsrf, checkRateLimit, ipFromRequest } from "@/lib/security";
import { villaSubmissionSchema } from "@/lib/schemas";
```

Remplacer le début du `try` du `POST` :
```ts
  try {
    const body = await request.json();
    const {
      name,
      email,
      ...
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nom et email sont requis." },
        { status: 400 }
      );
    }
```
par :
```ts
  try {
    // CSRF (origin) + rate limit (5 soumissions / heure / IP)
    const csrf = checkCsrf(request);
    if (csrf) return csrf;
    const ip = ipFromRequest(request);
    if (!checkRateLimit(`villa-submit:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Trop de soumissions. Réessayez dans une heure." },
        { status: 429 }
      );
    }

    const raw = await request.json();
    const parsed = villaSubmissionSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;
    const {
      name,
      email,
      phone,
      villa_name,
      villa_location,
      villa_type,
      surface,
      surface_terrain,
      chambres,
      salles_de_bains,
      etages,
      parking_places,
      parking_securise,
      equipements,
      already_listed,
      airbnb_url,
      message,
      gardien_existant,
      delai_souhaite,
      adresse_postale,
      no_photos,
      photo_urls,
    } = body as Record<string, any>;
```

(Le reste du handler — insert, emails, webhook — est inchangé et continue d'utiliser ces variables.)

- [ ] **Step 6: Build + commit**

Run: `npm run build` (vert attendu)
```bash
git add lib/schemas.ts lib/schemas.test.ts app/api/villa-submissions/route.ts
git commit -m "fix(audit): lot 1.2 — villa-submissions POST: CSRF + rate limit 5/h + zod (Sec#5,6)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: Bloquer l'escalade de privilège sur create-villa — Sec#7

**Files:**
- Modify: `app/api/dashboard/create-villa/route.ts`

- [ ] **Step 1: Lire le handler actuel**

Le handler `POST = withCsrf(...)` construit `const insertPayload = { ...payload };` puis force `owner_id`. Problème : un non-admin peut envoyer `is_published`, `commission_rate`, `collection_tier`, `owner_id`.

- [ ] **Step 2: Ajouter une constante de champs admin-only + stripping pour non-admin**

Juste avant `const insertPayload: Record<string, unknown> = { ...payload };`, insérer :

```ts
    // Champs réservés à l'admin — un non-admin ne doit pas pouvoir les fixer (Sec#7)
    const ADMIN_ONLY_FIELDS = ["is_published", "commission_rate", "collection_tier", "owner_id"] as const;
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }
```

Puis remplacer le bloc :
```ts
    const insertPayload: Record<string, unknown> = { ...payload };

    if (isAdmin) {
      if (!insertPayload.owner_id) {
        insertPayload.owner_id = user.id;
      }
    } else {
      insertPayload.owner_id = user.id;
    }
```
par :
```ts
    const insertPayload: Record<string, unknown> = { ...payload };

    if (!isAdmin) {
      for (const f of ADMIN_ONLY_FIELDS) delete insertPayload[f];
    }
    // owner_id : toujours dérivé de la session (jamais du body pour un non-admin ;
    // admin peut cibler un autre propriétaire mais défaut = lui-même)
    if (!isAdmin || !insertPayload.owner_id) {
      insertPayload.owner_id = user.id;
    }
```

- [ ] **Step 3: Build + commit**

Run: `npm run build` (vert attendu)
```bash
git add app/api/dashboard/create-villa/route.ts
git commit -m "fix(audit): lot 1.3 — create-villa: strip champs admin-only pour non-admin (Sec#7)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: git-secrets — note (pas de modif auto) — Sec#8

**Files:** aucun changement de code.

- [ ] **Step 1: Documenter la recommandation dans LEARNINGS**

Sec#8 (clés `.env` protégées seulement par `.gitignore`) = recommandation de pre-commit hook `git-secrets`. On NE modifie PAS les hooks git de Kenneson sans accord. Noter dans le journal Lot 1 (Task 5 ci-dessous) que c'est à faire manuellement :
```
git secrets --install && git secrets --register-aws  # + patterns STRIPE_/SUPABASE_/RESEND_
```
Vérifier d'abord que `.env*` est bien dans `.gitignore` :

Run: `grep -nE '^\.env' .gitignore`
Expected: au moins `.env*.local` ou `.env` présent. Si absent → l'ajouter (c'est le vrai risque).

---

### Task 5: Vérif vitest globale + journal

- [ ] **Step 1: Lancer toute la suite unitaire**

Run: `npx vitest run`
Expected: tous les tests PASS (incl. cors, escapeHtml, schemas, + suites existantes).

- [ ] **Step 2: Mettre à jour `docs/auto-learn/LEARNINGS.md`** (entrée Lot 1)

Points : email admin construit à la main = XSS (toujours `escapeHtml`) ; POST public = toujours CSRF+rate-limit+zod ; create-villa = strip admin-only fields ; git-secrets = manuel.

```bash
git add docs/auto-learn/LEARNINGS.md
git commit -m "docs(learnings): lot 1 — escapeHtml, durcissement routes publiques, strip admin-only

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

## Definition of Done (Lot 1)
- `escapeHtml` couvre l'email admin ; plus aucune interpolation brute de donnée utilisateur dans un HTML construit à la main.
- POST `villa-submissions` : CSRF + rate limit 5/h/IP + validation zod (name/email requis).
- `create-villa` : champs admin-only retirés pour les non-admins.
- `.env*` confirmé dans `.gitignore`.
- `npx vitest run` vert, `npm run build` vert.
- LEARNINGS à jour.
