# Audit Batch — Lot 0 (Triage + Quick-wins P0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Éteindre les incendies P0 fondateurs : vulns npm (Next.js + node-ical), CORS `*`, robots `/admin/`, og-image 404.

**Architecture:** Petites modifications isolées + un helper CORS partagé (`lib/cors.ts`) réutilisé par 5 routes. L'update npm est faite en premier et isolée (rollback possible si build rouge).

**Tech Stack:** Next.js 15, TypeScript, vitest, sharp (og-image).

**Triage déjà fait (NE PAS refaire) :**
- SEO#1 sitemap → `app/sitemap.ts` existe et fonctionne. **FAUX POSITIF.**
- SEO#2 robots → `app/robots.ts` existe ; seul manque `/admin/` dans disallow (Task 3).
- SEO#3 og → réel (Task 4).

**Branche :** `fix/audit-batch-juin` (à créer depuis `main`).

---

### Task 0: Créer la branche

- [ ] **Step 1: Brancher depuis main à jour**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir"
git checkout main && git pull --ff-only
git checkout -b fix/audit-batch-juin
```

- [ ] **Step 2: Vérifier build de référence vert AVANT toute modif**

Run: `npm run build`
Expected: build réussit (0 erreur). Si rouge → corriger l'état de base avant de continuer.

---

### Task 1: Update npm (Next.js + node-ical) — Sec#3, Sec#4

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)

- [ ] **Step 1: Mettre à jour next + node-ical**

```bash
npm install next@^15.5.18 node-ical@latest
```

- [ ] **Step 2: npm audit fix (non-breaking)**

```bash
npm audit fix
```

Note : NE PAS lancer `npm audit fix --force` (breaking). Si des vulns restent, on les traitera au Lot 9.

- [ ] **Step 3: Build de validation**

Run: `npm run build`
Expected: build vert. **Si rouge** : noter l'erreur, `git checkout package.json package-lock.json`, re-`npm install`, et déplacer l'update Next vers un traitement isolé (signaler à Kenneson). Ne pas bloquer le reste du Lot 0.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "fix(audit): lot 0.1 — npm update next 15.5.18 + node-ical + audit fix (48 vulns)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Helper CORS partagé + application aux 5 routes — Sec#1

**Files:**
- Create: `lib/cors.ts`
- Test: `lib/cors.test.ts`
- Modify: `app/api/chat/route.ts:233-243`, `app/api/chat/tenant/route.ts`, `app/api/agent/owner-context/route.ts`, `app/api/agent/visitor-context/route.ts`, `app/api/agent/admin-context/route.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// lib/cors.test.ts
import { describe, it, expect } from "vitest";
import { corsHeaders } from "./cors";

describe("corsHeaders", () => {
  it("n'utilise jamais le wildcard *", () => {
    const h = corsHeaders("GET, OPTIONS");
    expect(h["Access-Control-Allow-Origin"]).not.toBe("*");
  });

  it("renvoie l'origine explicite depuis NEXT_PUBLIC_BASE_URL ou le fallback", () => {
    const h = corsHeaders("POST, OPTIONS");
    expect(h["Access-Control-Allow-Origin"]).toMatch(/^https?:\/\//);
    expect(h["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
    expect(h["Access-Control-Allow-Headers"]).toContain("Content-Type");
  });
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `npx vitest run lib/cors.test.ts`
Expected: FAIL — `Cannot find module './cors'`.

- [ ] **Step 3: Implémenter le helper**

```ts
// lib/cors.ts
const ALLOWED_ORIGIN =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://kayvila.com";

/** En-têtes CORS avec origine explicite (jamais "*" — voir audit Sec#1). */
export function corsHeaders(methods: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `npx vitest run lib/cors.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Remplacer le bloc OPTIONS dans `app/api/chat/route.ts`**

Remplacer (lignes ~233-243) :

```ts
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
```

par :

```ts
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders("POST, OPTIONS") });
}
```

(placer l'`import` en haut du fichier avec les autres imports, pas dans la fonction.)

- [ ] **Step 6: Idem pour les 4 autres routes**

Pour chaque fichier, importer `corsHeaders` en tête et remplacer l'objet `headers` du `OPTIONS` par `corsHeaders("<METHODS existants>")` :
- `app/api/chat/tenant/route.ts` → `corsHeaders("POST, OPTIONS")`
- `app/api/agent/owner-context/route.ts` → `corsHeaders("GET, OPTIONS")`
- `app/api/agent/visitor-context/route.ts` → `corsHeaders("GET, OPTIONS")`
- `app/api/agent/admin-context/route.ts` → `corsHeaders("GET, OPTIONS")`

Vérifier la méthode HTTP réelle de chaque route (`POST`/`GET`) avant de remplacer.

- [ ] **Step 7: Vérifier qu'il ne reste aucun wildcard**

Run: `grep -rn '"Access-Control-Allow-Origin": "\*"' app/`
Expected: aucune sortie.

- [ ] **Step 8: Build + commit**

```bash
npm run build
git add lib/cors.ts lib/cors.test.ts app/api/chat/route.ts app/api/chat/tenant/route.ts app/api/agent/owner-context/route.ts app/api/agent/visitor-context/route.ts app/api/agent/admin-context/route.ts
git commit -m "fix(audit): lot 0.2 — CORS explicite via lib/cors.ts (5 routes, fin du wildcard *)

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: robots.ts — disallow /admin/ — SEO#2

**Files:**
- Modify: `app/robots.ts`

- [ ] **Step 1: Ajouter /admin/ au disallow**

Remplacer la ligne `rules` :

```ts
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/login/", "/api/"] },
```

par :

```ts
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/dashboard/", "/login/", "/api/", "/espace-client/"] },
```

- [ ] **Step 2: Vérifier**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | head` (ou laisser au build final)
Expected: pas d'erreur de type sur `app/robots.ts`.

---

### Task 4: og-default.jpg 1200×630 — SEO#3

**Files:**
- Create: `public/og-default.jpg` (via script)
- Create (temporaire): `scripts/gen-og.mjs`

- [ ] **Step 1: Script de génération sharp**

```js
// scripts/gen-og.mjs
import sharp from "sharp";

await sharp("public/prestations-hero.png")
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .jpeg({ quality: 82 })
  .toFile("public/og-default.jpg");

console.log("og-default.jpg généré (1200x630)");
```

- [ ] **Step 2: Générer l'image**

Run: `node scripts/gen-og.mjs`
Expected: `og-default.jpg généré (1200x630)`.

- [ ] **Step 3: Vérifier dimensions + suppression du script temporaire**

Run: `node -e "import('sharp').then(s=>s.default('public/og-default.jpg').metadata().then(m=>console.log(m.width+'x'+m.height)))"`
Expected: `1200x630`.

```bash
rm scripts/gen-og.mjs
```

(Si `scripts/` devient vide, le laisser — ne pas créer de fichier inutile.)

---

### Task 5: Build final + commit du Lot 0 (robots + og)

- [ ] **Step 1: Build complet**

Run: `npm run build`
Expected: build vert (0 erreur).

- [ ] **Step 2: Commit**

```bash
git add app/robots.ts public/og-default.jpg
git commit -m "fix(audit): lot 0.3 — robots disallow /admin /espace-client + og-default.jpg 1200x630

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

- [ ] **Step 3: Mettre à jour le journal**

Ajouter une entrée datée dans `docs/auto-learn/LEARNINGS.md` :
- Faux positif SEO : sitemap/robots existaient déjà → toujours vérifier `app/` avant de "créer" un sitemap/robots.
- Helper CORS partagé `lib/cors.ts` = source unique des en-têtes ; jamais `*` avec Authorization.

```bash
git add docs/auto-learn/LEARNINGS.md
git commit -m "docs(learnings): lot 0 — faux positif sitemap/robots, helper CORS

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

## Definition of Done (Lot 0)
- `next`/`node-ical` à jour, `npm audit fix` passé, build vert.
- 0 occurrence de `Access-Control-Allow-Origin: "*"` dans `app/`.
- `robots.ts` bloque `/admin/` et `/espace-client/`.
- `public/og-default.jpg` existe en 1200×630.
- LEARNINGS à jour.
