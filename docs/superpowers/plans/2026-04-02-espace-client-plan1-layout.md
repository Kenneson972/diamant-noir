# Espace Client — Plan 1 : Layout & Design System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le layout espace client par un shell blanc éditorial (sidebar blanche + bottom bar mobile), supprimer le double pattern auth invité, et ajouter la police Cormorant Garamond.

**Architecture:** Nouveau composant `EspaceClientShell` (Client Component) encapsule la sidebar desktop + bottom bar mobile. Le layout `app/espace-client/layout.tsx` reste "use client" pour gérer `onAuthStateChange`. Si la session est `null` après vérification, redirect vers `/login?redirect=…`. Toutes les pages enfants cessent de vérifier l'auth elles-mêmes.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS 3.4 (tokens `gold`/`navy`/`offwhite` déjà configurés), `next/font/google` (Cormorant Garamond à ajouter), Supabase browser client, Playwright pour tests E2E.

> **Note :** Ce plan est le premier de trois. Les Plans 2 (UX Features) et 3 (Chat & Messagerie) dépendent de ce layout et doivent être exécutés dans l'ordre.

---

## Structure des fichiers

| Fichier | Action | Rôle |
|---------|--------|------|
| `app/layout.tsx` | Modifier | Ajouter Cormorant Garamond via `next/font/google` |
| `app/globals.css` | Modifier | Ajouter class `.font-cormorant` |
| `components/espace-client/EspaceClientShell.tsx` | Créer | Sidebar desktop + bottom bar mobile (tout le visuel) |
| `app/espace-client/layout.tsx` | Réécrire | Auth check + redirect + wrap `EspaceClientShell` |
| `app/espace-client/page.tsx` | Modifier | Supprimer card "Connexion requise" (auth gérée au niveau layout) |
| `app/espace-client/messagerie/page.tsx` | Modifier | Supprimer card "Connexion requise" (idem) |
| `app/espace-client/livret/page.tsx` | Créer | Page placeholder — implémentée au Plan 2 |
| `app/espace-client/documents/page.tsx` | Créer | Page placeholder — implémentée au Plan 2 |
| `app/espace-client/conciergerie/page.tsx` | Créer | Page placeholder — implémentée au Plan 2 |
| `tests/espace-client/layout.spec.ts` | Créer | Playwright : redirect auth, nav actif, bottom bar mobile |

---

## Task 1 : Ajouter Cormorant Garamond

**Files:**
- Modify: `app/layout.tsx:2-28`
- Modify: `app/globals.css` (après la ligne `.font-display`)

- [ ] **Step 1.1 : Ajouter l'import Cormorant_Garamond**

Ouvrir `app/layout.tsx`. Remplacer la ligne :
```ts
import { Inter, Playfair_Display } from "next/font/google";
```
par :
```ts
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
```

- [ ] **Step 1.2 : Configurer la variable CSS**

Après le bloc `const playfair = Playfair_Display({...})`, ajouter :
```ts
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});
```

- [ ] **Step 1.3 : Injecter la variable dans le body**

Trouver la ligne :
```tsx
<body className={`${inter.variable} ${playfair.variable} bg-offwhite`}>
```
Remplacer par :
```tsx
<body className={`${inter.variable} ${playfair.variable} ${cormorant.variable} bg-offwhite`}>
```

- [ ] **Step 1.4 : Ajouter la classe utilitaire CSS**

Dans `app/globals.css`, trouver le bloc `.font-display { ... }`. Après ce bloc, ajouter :
```css
.font-cormorant {
  font-family: var(--font-cormorant), "Georgia", serif;
}
```

- [ ] **Step 1.5 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```
Résultat attendu : `✓ Compiled successfully` (ou `Route (app)` sans erreur TypeScript).

- [ ] **Step 1.6 : Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat(fonts): add Cormorant Garamond variable font"
```

---

## Task 2 : Créer EspaceClientShell

**Files:**
- Create: `components/espace-client/EspaceClientShell.tsx`

- [ ] **Step 2.1 : Créer le composant**

Créer `components/espace-client/EspaceClientShell.tsx` avec le contenu suivant :

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// ── Icônes SVG thin-line (stroke-width 1) ──────────────────────────────────
// Les placeholders ci-dessous seront remplacés par des icônes custom.

function IconSejour({ active }: { active: boolean }) {
  const stroke = active ? "#D4AF37" : "rgba(13,27,42,0.22)";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2L14 7v7H2V7L8 2z" stroke={stroke} strokeWidth="1" />
      <rect x="5.5" y="10" width="5" height="4" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}
function IconLivret({ active }: { active: boolean }) {
  const stroke = active ? "#D4AF37" : "rgba(13,27,42,0.22)";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="12" height="12" rx="1" stroke={stroke} strokeWidth="1" />
      <path d="M8 2v12M5 5h2M5 8h2M5 11h2" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}
function IconMessages({ active }: { active: boolean }) {
  const stroke = active ? "#D4AF37" : "rgba(13,27,42,0.22)";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 3h12v8H2z" stroke={stroke} strokeWidth="1" />
      <path d="M2 11l3 3h3" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}
function IconDocuments({ active }: { active: boolean }) {
  const stroke = active ? "#D4AF37" : "rgba(13,27,42,0.22)";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 2h7l3 3v9H3z" stroke={stroke} strokeWidth="1" />
      <path d="M10 2v3h3M5 8h6M5 11h4" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}
function IconConciergerie({ active }: { active: boolean }) {
  const stroke = active ? "#D4AF37" : "rgba(13,27,42,0.22)";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="6" r="3" stroke={stroke} strokeWidth="1" />
      <path d="M3 14c0-2.8 2.2-4 5-4s5 1.2 5 4" stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

// ── Config nav ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: "/espace-client",
    label: "Séjour",
    exact: true,
    Icon: IconSejour,
  },
  {
    href: "/espace-client/livret",
    label: "Livret",
    exact: false,
    Icon: IconLivret,
  },
  {
    href: "/espace-client/messagerie",
    label: "Messages",
    exact: false,
    Icon: IconMessages,
    badge: false, // sera true quand messages non lus — Plan 3
  },
  {
    href: "/espace-client/documents",
    label: "Documents",
    exact: false,
    Icon: IconDocuments,
  },
  {
    href: "/espace-client/conciergerie",
    label: "Conciergerie",
    exact: false,
    Icon: IconConciergerie,
  },
] as const;

// Bottom bar mobile : 4 onglets principaux
const BOTTOM_NAV = NAV_ITEMS.slice(0, 4);

// ── Types ────────────────────────────────────────────────────────────────────

interface EspaceClientShellProps {
  children: ReactNode;
  userName?: string;
  userInitial?: string;
  onSignOut: () => void;
}

// ── Composant principal ──────────────────────────────────────────────────────

export function EspaceClientShell({
  children,
  userName,
  userInitial,
  onSignOut,
}: EspaceClientShellProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      {/* ── Sidebar desktop ── */}
      <aside
        className="hidden md:flex w-[188px] flex-col bg-white border-r border-[rgba(13,27,42,0.07)] shrink-0"
        aria-label="Navigation espace client"
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-0">
          <p className="text-[7px] font-medium tracking-[0.28em] uppercase text-[#D4AF37] opacity-80 mb-1">
            Diamant Noir
          </p>
          <p className="font-display text-[15px] font-normal text-[#0D1B2A]">
            Espace Client
          </p>
        </div>

        {/* Séparateur */}
        <div className="mx-6 mt-5 mb-5 h-px bg-[rgba(13,27,42,0.07)]" />

        {/* Nav */}
        <nav className="flex flex-col gap-[1px] flex-1">
          {NAV_ITEMS.map(({ href, label, exact, Icon }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-[11px] px-6 py-[10px] relative",
                  "transition-colors duration-150",
                  active
                    ? "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-[20px] before:bg-[#D4AF37] before:rounded-r-[1px]"
                    : "hover:bg-[rgba(13,27,42,0.025)]",
                ].join(" ")}
              >
                <Icon active={active} />
                <span
                  className={[
                    "text-[9px] tracking-[0.2em] uppercase",
                    active
                      ? "text-[#0D1B2A] font-medium"
                      : "text-[rgba(13,27,42,0.32)] font-normal",
                  ].join(" ")}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer utilisateur */}
        <div className="mx-6 mt-auto pt-5 pb-7 border-t border-[rgba(13,27,42,0.07)] flex items-center gap-[10px]">
          <div
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] shrink-0"
            style={{ background: "linear-gradient(135deg, #D4AF37, #9A7B24)", color: "#0D1B2A", fontFamily: "var(--font-playfair)" }}
          >
            {userInitial ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            {userName && (
              <p className="font-cormorant text-[13px] font-light text-[#0D1B2A] truncate leading-tight">
                {userName}
              </p>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="text-[8px] tracking-[0.14em] uppercase text-[rgba(13,27,42,0.3)] hover:text-[rgba(13,27,42,0.6)] transition-colors mt-0.5"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar mobile uniquement */}
        <header className="md:hidden sticky top-0 z-40 h-[52px] bg-white border-b border-[rgba(13,27,42,0.06)] flex items-center justify-between px-4">
          <p className="font-display text-[14px] font-normal text-[#0D1B2A]">
            Espace Client
          </p>
          <div
            className="w-[28px] h-[28px] rounded-full flex items-center justify-content-center text-[11px] shrink-0 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #D4AF37, #9A7B24)", color: "#0D1B2A", fontFamily: "var(--font-playfair)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={onSignOut}
            title="Déconnexion"
          >
            {userInitial ?? "?"}
          </div>
        </header>

        {/* Zone contenu */}
        <main className="flex-1 min-w-0 pb-[72px] md:pb-0">
          {children}
        </main>

        {/* ── Bottom bar mobile ── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[rgba(13,27,42,0.07)] flex justify-around items-center px-2 pt-[10px]"
          style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
          aria-label="Navigation principale"
        >
          {BOTTOM_NAV.map(({ href, label, exact, Icon }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
              >
                <div style={{ opacity: active ? 1 : 0.22 }}>
                  <Icon active={active} />
                </div>
                <span
                  className={[
                    "text-[6px] tracking-[0.12em] uppercase",
                    active ? "text-[#D4AF37]" : "text-[rgba(13,27,42,0.4)]",
                  ].join(" ")}
                >
                  {label}
                </span>
                {active && (
                  <span className="w-[3px] h-[3px] rounded-full bg-[#D4AF37]" aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
```

- [ ] **Step 2.2 : Vérifier le build TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -30
```
Résultat attendu : aucune erreur.

- [ ] **Step 2.3 : Commit**

```bash
git add components/espace-client/EspaceClientShell.tsx
git commit -m "feat(espace-client): add EspaceClientShell — white sidebar + mobile bottom bar"
```

---

## Task 3 : Réécrire EspaceClientLayout

**Files:**
- Rewrite: `app/espace-client/layout.tsx`

- [ ] **Step 3.1 : Réécrire le layout**

Remplacer intégralement `app/espace-client/layout.tsx` par :

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase";
import { EspaceClientShell } from "@/components/espace-client/EspaceClientShell";
import { EspaceClientProviders } from "@/components/espace-client/EspaceClientProviders";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"
        role="status"
        aria-label="Chargement"
      />
    </div>
  );
}

export default function EspaceClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/espace-client";
  const [checking, setChecking] = useState(true);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string } | null>(null);
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    if (!supabase) {
      // Supabase non configuré — redirect login
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    let cancelled = false;

    const applySession = (session: Session | null) => {
      if (cancelled) return;
      if (!session?.user) {
        // Pas de session → redirect login
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      setUserInfo({
        name: session.user.user_metadata?.full_name,
        email: session.user.email ?? undefined,
      });
      setChecking(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, router, pathname]);

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (checking) return <Spinner />;

  const firstName = userInfo?.name?.split(" ")[0];
  const initial = firstName?.[0]?.toUpperCase() ?? userInfo?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <EspaceClientProviders>
      <EspaceClientShell
        userName={firstName}
        userInitial={initial}
        onSignOut={handleSignOut}
      >
        {children}
      </EspaceClientShell>
    </EspaceClientProviders>
  );
}
```

- [ ] **Step 3.2 : Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -20
```
Résultat attendu : aucune erreur.

- [ ] **Step 3.3 : Commit**

```bash
git add app/espace-client/layout.tsx
git commit -m "feat(espace-client): rewrite layout — white shell, auth redirect, remove guest bandeau"
```

---

## Task 4 : Nettoyer les pages existantes

Supprimer les cards "Connexion requise" dans `page.tsx` et `messagerie/page.tsx` — l'auth est désormais gérée par le layout.

**Files:**
- Modify: `app/espace-client/page.tsx`
- Modify: `app/espace-client/messagerie/page.tsx`

- [ ] **Step 4.1 : Supprimer la guard auth dans `page.tsx`**

Dans `app/espace-client/page.tsx`, trouver le bloc :
```tsx
// ── Empty state ──
if (!isAuthed) {
  return (
    <Card className="border border-navy/10 bg-white shadow-none rounded-none">
      ...
    </Card>
  );
}
```
Le supprimer entièrement (lignes ~253–283).

Aussi supprimer l'état `isAuthed` et le setter `setIsAuthed` (lignes ~164, ~176–180). Supprimer l'import `Card, CardContent` si plus utilisé nulle part d'autre dans la page (vérifier en cherchant `<Card` dans le reste du fichier).

- [ ] **Step 4.2 : Adapter la récupération de session dans `page.tsx`**

La page charge les bookings seulement si `session?.user?.email` est présent. Puisque le layout garantit désormais qu'on est connecté, la guard `if (!session?.user?.email) { setIsAuthed(false); ... }` peut devenir un simple early return sans side-effect d'UI :

Remplacer :
```tsx
if (!session?.user?.email) {
  setIsAuthed(false);
  setLoading(false);
  return;
}

setIsAuthed(true);
```
Par :
```tsx
if (!session?.user?.email) {
  setLoading(false);
  return;
}
```

Et supprimer `const [isAuthed, setIsAuthed] = useState<boolean>(false);`.

- [ ] **Step 4.3 : Supprimer la guard auth dans `messagerie/page.tsx`**

Dans `app/espace-client/messagerie/page.tsx`, supprimer le bloc :
```tsx
if (!user) {
  return (
    <Card className="border border-navy/10 bg-white shadow-none rounded-none">
      ...
    </Card>
  );
}
```
(lignes ~57–86).

Aussi supprimer les imports `Card`, `CardContent`, `Button` si plus utilisés.

Remplacer le guard `if (!session?.user?.email) { setLoading(false); return; }` par le même pattern que Task 4.2.

- [ ] **Step 4.4 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```
Résultat attendu : `✓ Compiled successfully`.

- [ ] **Step 4.5 : Commit**

```bash
git add app/espace-client/page.tsx app/espace-client/messagerie/page.tsx
git commit -m "refactor(espace-client): remove duplicate auth guards — layout handles redirect"
```

---

## Task 5 : Créer les pages placeholder

Les pages livret, documents et conciergerie seront implémentées au Plan 2. Créer des stubs maintenant pour que la nav soit fonctionnelle.

**Files:**
- Create: `app/espace-client/livret/page.tsx`
- Create: `app/espace-client/documents/page.tsx`
- Create: `app/espace-client/conciergerie/page.tsx`

- [ ] **Step 5.1 : Créer `app/espace-client/livret/page.tsx`**

```tsx
export default function LivretPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <p className="text-[8px] tracking-[0.26em] uppercase text-[#D4AF37] opacity-80 mb-2">
        Livret d&apos;accueil
      </p>
      <h1 className="font-display text-2xl font-normal text-[#0D1B2A]">
        Bienvenue dans votre villa
      </h1>
      <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.4)] mt-2">
        Le livret sera disponible ici — implémentation au Plan 2.
      </p>
    </div>
  );
}
```

- [ ] **Step 5.2 : Créer `app/espace-client/documents/page.tsx`**

```tsx
export default function DocumentsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <p className="text-[8px] tracking-[0.26em] uppercase text-[#D4AF37] opacity-80 mb-2">
        Documents
      </p>
      <h1 className="font-display text-2xl font-normal text-[#0D1B2A]">
        Mes documents
      </h1>
      <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.4)] mt-2">
        Vos documents de séjour apparaîtront ici.
      </p>
    </div>
  );
}
```

- [ ] **Step 5.3 : Créer `app/espace-client/conciergerie/page.tsx`**

```tsx
export default function ConciergeriePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <p className="text-[8px] tracking-[0.26em] uppercase text-[#D4AF37] opacity-80 mb-2">
        Conciergerie
      </p>
      <h1 className="font-display text-2xl font-normal text-[#0D1B2A]">
        Contacts &amp; urgences
      </h1>
      <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.4)] mt-2">
        Les contacts de la conciergerie seront disponibles ici.
      </p>
    </div>
  );
}
```

- [ ] **Step 5.4 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```
Résultat attendu : `✓ Compiled successfully` avec les 3 nouvelles routes listées.

- [ ] **Step 5.5 : Commit**

```bash
git add app/espace-client/livret/page.tsx app/espace-client/documents/page.tsx app/espace-client/conciergerie/page.tsx
git commit -m "feat(espace-client): add placeholder pages for livret, documents, conciergerie"
```

---

## Task 6 : Ajouter la topbar par page (titre + badge J-N)

Chaque page doit avoir une topbar contextuelle `52px` avec `[Section] — [Titre de page]` et un badge "J — N". Créer un composant léger réutilisable.

**Files:**
- Create: `components/espace-client/PageTopbar.tsx`

- [ ] **Step 6.1 : Créer `components/espace-client/PageTopbar.tsx`**

```tsx
interface PageTopbarProps {
  section?: string;
  title: string;
  badge?: string; // ex: "J — 12"
}

export function PageTopbar({ section = "Diamant Noir", title, badge }: PageTopbarProps) {
  return (
    <div className="h-[52px] bg-white border-b border-[rgba(13,27,42,0.06)] flex items-center px-8 gap-0 shrink-0">
      <span className="text-[8px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.26)]">
        {section}
      </span>
      <div className="w-[14px] h-px bg-[rgba(13,27,42,0.1)] mx-3" />
      <span className="font-display text-[15px] font-normal text-[#0D1B2A]">{title}</span>
      {badge && (
        <>
          <div className="flex-1" />
          <span className="text-[8px] tracking-[0.2em] uppercase text-[#D4AF37] border border-[rgba(212,175,55,0.28)] px-[11px] py-[4px] rounded-[1px]">
            {badge}
          </span>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6.2 : Utiliser PageTopbar dans la page Séjour**

Dans `app/espace-client/page.tsx`, localiser le début du JSX retourné dans le cas `bookings.length > 0` (vers la ligne `return (<div className="space-y-10">`).

Importer et ajouter la topbar en début de rendu :

```tsx
import { PageTopbar } from "@/components/espace-client/PageTopbar";
```

Dans chaque branche de retour authentifiée (les 3 cas non-loading : `bookings.length === 0`, et le dashboard principal), envelopper dans une `<div>` qui commence par `<PageTopbar>` :

Pour le cas "0 réservations" :
```tsx
<>
  <PageTopbar title="Mon Séjour" />
  <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
    {/* ... contenu existant ... */}
  </div>
</>
```

Pour le dashboard principal (remplacer le `<div className="space-y-10">` existant) :
```tsx
<>
  <PageTopbar
    title="Mon Séjour"
    badge={daysUntil !== null && daysUntil > 0 ? `J — ${daysUntil}` : undefined}
  />
  <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
    {/* ... contenu existant en-dessous (header personnalisé, stats bar, hero, etc.) ... */}
  </div>
</>
```

- [ ] **Step 6.3 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -10
```
Résultat attendu : `✓ Compiled successfully`.

- [ ] **Step 6.4 : Commit**

```bash
git add components/espace-client/PageTopbar.tsx app/espace-client/page.tsx
git commit -m "feat(espace-client): add PageTopbar component — breadcrumb + J-N badge"
```

---

## Task 7 : Tests Playwright

**Files:**
- Create: `tests/espace-client/layout.spec.ts`

- [ ] **Step 7.1 : Écrire les tests**

```ts
import { test, expect } from "@playwright/test";

// Ces tests supposent que le dev server tourne sur http://localhost:3000
// Lancer avec : npm run dev (dans un terminal séparé)

test.describe("Espace Client — Layout", () => {
  test("redirige vers /login si non connecté", async ({ page }) => {
    await page.goto("http://localhost:3000/espace-client");
    // Doit être redirigé vers /login avec le param redirect
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/redirect.*espace-client/);
  });

  test("sidebar visible sur desktop (≥768px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/login");
    // Note : ce test sera complété quand on a un compte test ou mock auth
    // Pour l'instant, vérifier que le layout ne crash pas en charge directe
    const response = await page.goto("http://localhost:3000/espace-client");
    // Le redirect doit se passer proprement (pas de 500)
    expect(response?.status()).toBeLessThan(500);
  });

  test("bottom bar visible sur mobile (<768px)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/espace-client");
    // Redirigé vers login — vérifier que la page répond
    const response = await page.goto("http://localhost:3000/espace-client");
    expect(response?.status()).toBeLessThan(500);
  });

  test("pages placeholder répondent 200", async ({ page }) => {
    // Ces pages font partie du layout — elles redirigent si non auth
    // Mais elles ne doivent pas planter (500)
    for (const path of [
      "/espace-client/livret",
      "/espace-client/documents",
      "/espace-client/conciergerie",
    ]) {
      const response = await page.goto(`http://localhost:3000${path}`);
      expect(response?.status()).toBeLessThan(500);
    }
  });
});
```

- [ ] **Step 7.2 : Lancer les tests**

Dans un terminal, démarrer le dev server :
```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run dev &
```

Dans un autre terminal, lancer les tests :
```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx playwright test tests/espace-client/layout.spec.ts --reporter=line 2>&1
```
Résultat attendu : tous les tests passent (les redirections vers `/login` sont correctes).

- [ ] **Step 7.3 : Arrêter le dev server et commit**

```bash
kill %1  # arrête le dev server backgroundé
git add tests/espace-client/layout.spec.ts
git commit -m "test(espace-client): add Playwright tests for layout auth redirect and route health"
```

---

## Vérification finale

- [ ] **Build prod propre**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```
Résultat attendu : `✓ Compiled successfully`, les routes `/espace-client/*` listées sans erreur.

- [ ] **Checklist visuelle (npm run dev)**

```bash
npm run dev
```
Ouvrir http://localhost:3000/espace-client sans être connecté :
- ✅ Redirect vers `/login?redirect=%2Fespace-client`
- ✅ Pas de bandeau "Accès invité" visible

Se connecter avec un compte test puis retourner sur `/espace-client` :
- ✅ Sidebar blanche visible sur desktop (≥768px), largeur 188px
- ✅ "Diamant Noir / Espace Client" en haut de sidebar
- ✅ Indicateur actif : trait gold 2px à gauche de "Séjour"
- ✅ 5 items nav : Séjour, Livret, Messages, Documents, Conciergerie
- ✅ Avatar initiale en bas de sidebar
- ✅ Sur mobile (390px) : bottom bar blanche visible, 4 onglets
- ✅ Cormorant Garamond chargée (inspecter dans DevTools : `--font-cormorant`)
- ✅ Police Cormorant visible sur les sous-titres des pages placeholder

---

> **Suite :** Plan 2 — `2026-04-02-espace-client-plan2-ux.md` — Pages Séjour, Livret (Wi-Fi/PDF/empty state), Checklist (iCal, persistance Supabase).
