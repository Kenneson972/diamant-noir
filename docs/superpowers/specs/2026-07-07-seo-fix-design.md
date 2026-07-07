# SEO Fix — Kayvila — 7 Juillet 2026

## Contexte

Audit SEO complet du site kayvila.com (Next.js 15 + Supabase + Vercel).
Le layout racine exporte `template: "%s | Kayvila"` (ligne 60 de `app/layout.tsx`).
Toute page qui inclut "Kayvila" dans son `title` → doublon en prod.

## Règle cardinale

**Aucun `title` de metadata ne doit contenir "Kayvila"** — le template du layout s'en charge.

## Corrections

### Vague 1 — P0 bloquants (7 fichiers)

| # | Fichier | Correctif |
|---|---------|-----------|
| 1 | `app/sitemap.ts:35,40` | `updated_at` → `created_at` (colonne inexistante) |
| 2a | `app/villas/[id]/page.tsx:60` | Title: retirer `— Kayvila`, limiter à 60 chars |
| 2b | `app/villas/[id]/page.tsx:72` | Fallback title: `"Villa"` |
| 2c | `app/villas/[id]/page.tsx` | Ajouter BreadcrumbList JSON-LD |
| 3a | `app/faq/page.tsx:12` | Title: retirer "Kayvila" |
| 3b | `app/faq/page.tsx:17` | OG image: `og-image.jpg` → `og-default.jpg` |
| 3c | `app/faq/page.tsx` | Ajouter FAQPage JSON-LD |
| 4 | `app/prestations/layout.tsx:5` | Title: retirer "Kayvila" |
| 5a | `app/prestations/services/[slug]/page.tsx:62` | Title: retirer "Kayvila" |
| 5b | `app/prestations/services/[slug]/page.tsx:66` | OG title: retirer "Kayvila" |
| 6 | `app/contact/layout.tsx:8` | OG title: retirer "Kayvila" |
| 7a | `app/soumettre-ma-villa/page.tsx:8` | Title: retirer "Kayvila Conciergerie" |
| 7b | `app/soumettre-ma-villa/page.tsx:13` | OG image: `og-image.jpg` → `og-default.jpg` |

### Vague 2 — P1 (6 fichiers)

| # | Fichier | Correctif |
|---|---------|-----------|
| 8 | `app/robots.ts` | Ajouter rules pour ChatGPT-User, PerplexityBot, Google-Extended |
| 9 | `app/success/layout.tsx:4` | Title: retirer "— Kayvila" |
| 10 | `app/update-password/layout.tsx:4` | Title: retirer "— Kayvila" |
| 11 | `app/qui-sommes-nous/page.tsx:26` | OG image: `og-image.jpg` → `og-default.jpg` |
| 12 | `app/book/page.tsx:16` | OG image: `og-image.jpg` → `og-default.jpg` |
| 13 | `app/villas/comparer/layout.tsx:9` | OG image: `og-image.jpg` → `og-default.jpg` |
| 14 | `app/villas/page.tsx:16` | OG title: retirer "\| Kayvila" |

### Vague 3 — Dashboard (10+ fichiers)

| # | Fichier | Correctif |
|---|---------|-----------|
| 15 | `app/(proprio)/dashboard/**` | Tous les `title: "... — Kayvila"` → retirer "— Kayvila" |

## Anti-spécifications

- ❌ Ne pas toucher à `template: "%s | Kayvila"` dans `app/layout.tsx`
- ❌ Ne pas modifier `metadataBase`
- ❌ Ne pas changer les `canonical`
- ❌ Ne pas toucher aux JSON-LD existants
- ❌ Ne pas modifier les `generateMetadata()` — juste corriger les titres
- ❌ Ne pas supprimer de pages du sitemap
- ❌ Ne pas changer les `revalidate`

## Vérification

```bash
curl -s https://kayvila.com/sitemap.xml | grep -c '<loc>'  # doit être >15
curl -s https://kayvila.com/faq | grep '<title>'            # pas de "Kayvila | Kayvila"
curl -s https://kayvila.com/faq | grep -c 'FAQPage'         # doit être 1
curl -s https://kayvila.com/robots.txt                      # doit avoir ChatGPT-User
```
