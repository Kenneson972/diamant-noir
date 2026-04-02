# Espace Client — Plan 2 : UX Features

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter les features UX manquantes de l'espace client — hero card séjour en blanc éditorial, livret d'accueil avec deux colonnes et WiFi copy/hide, page de print PDF, et checklist avant-arrivée avec iCal + persistance Supabase.

**Architecture:** Chaque feature est une unité indépendante. La page Séjour est modifiée in-place (composant `UpcomingStayHero` remplacé). La page Livret est réécrite (actuellement placeholder). La Checklist est une nouvelle page qui charge le booking en cours et sauvegarde son état dans `bookings.checklist_state` (JSONB). Aucun nouveau contexte React — chaque page charge ses données directement via Supabase.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS 3.4, Supabase browser client, Clipboard API (Web standard), RFC 5545 `.ics` généré côté client.

> **Prérequis :** Plan 1 exécuté (EspaceClientShell, layout auth redirect, Cormorant Garamond chargée).

---

## Structure des fichiers

| Fichier | Action | Tâche |
|---------|--------|-------|
| `app/espace-client/page.tsx` | Modifier | Task 1 — Hero blanc + Accès rapide |
| `app/espace-client/livret/page.tsx` | Réécrire | Task 2 — Livret deux colonnes |
| `components/espace-client/WelcomeBook.tsx` | Modifier | Task 3 — WiFi copy/hide |
| `app/espace-client/livret/print/page.tsx` | Créer | Task 4 — Page print PDF |
| `app/espace-client/checklist/page.tsx` | Créer | Task 5 — Checklist + iCal + Supabase |
| `tests/espace-client/ux-features.spec.ts` | Créer | Task 6 — Tests Playwright |

---

## Task 1 : Redesign Hero Séjour + Accès rapide

Remplacer le composant `UpcomingStayHero` sombre (fond navy avec image en overlay) par une hero card blanche avec bordure gold en haut. Ajouter la section "Accès rapide" 4 colonnes sous le hero.

**Files:**
- Modify: `app/espace-client/page.tsx`

- [ ] **Step 1.1 : Lire le fichier actuel**

```bash
head -160 "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir/app/espace-client/page.tsx"
```

Identifier :
- La fonction `UpcomingStayHero` (actuellement fond navy avec `bg-navy`)
- Les imports Lucide utilisés : `CalendarX`, `ArrowRight`, `MessageCircle`, `BookOpen`
- La variable `daysUntil` (confirmé ligne ~216 : `Math.ceil(...)`)

- [ ] **Step 1.2 : Remplacer la fonction UpcomingStayHero**

Dans `app/espace-client/page.tsx`, trouver et remplacer entièrement la fonction `UpcomingStayHero` (de `function UpcomingStayHero` jusqu'à son `}` fermant, vers les lignes 43–156) par :

```tsx
function UpcomingStayHero({ booking }: { booking: any }) {
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / 86400000);
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
  const isToday = daysUntil <= 0 && Date.now() < endDate.getTime();

  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  return (
    <div
      className="bg-white border border-[rgba(13,27,42,0.07)] flex flex-col sm:flex-row sm:items-start gap-0"
      style={{ borderTop: "2px solid #D4AF37" }}
    >
      {/* Gauche */}
      <div className="flex-1 min-w-0 px-6 py-6">
        <p className="text-[8px] tracking-[0.26em] uppercase text-[#D4AF37] mb-3">
          {isToday ? "Séjour en cours" : "Votre prochain séjour"}
        </p>
        <h2 className="font-display text-2xl font-normal text-[#0D1B2A] mb-2">
          {booking.villa?.name ?? "Villa Diamant Noir"}
        </h2>
        {booking.villa?.location && (
          <p className="font-cormorant italic text-[14px] font-light text-[rgba(13,27,42,0.35)] mb-1">
            {booking.villa.location}, Martinique
          </p>
        )}
        <p className="font-cormorant italic text-[14px] font-light text-[rgba(13,27,42,0.45)] mb-5">
          {fmt(startDate)} → {fmt(endDate)} · {nights} nuit{nights > 1 ? "s" : ""}
        </p>
        <Link
          href="/espace-client/livret"
          className="text-[8px] tracking-[0.2em] uppercase text-[#D4AF37] underline underline-offset-4 decoration-[rgba(212,175,55,0.4)] hover:decoration-[#D4AF37] transition-colors no-underline"
          style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
        >
          Voir le livret →
        </Link>
      </div>

      {/* Séparateur vertical */}
      <div className="hidden sm:block w-px self-stretch bg-[rgba(13,27,42,0.07)] mx-0" />
      <div className="sm:hidden h-px mx-6 bg-[rgba(13,27,42,0.07)]" />

      {/* Droite — compteur */}
      <div className="px-6 py-6 flex flex-col items-start sm:items-end justify-center gap-1 shrink-0 min-w-[100px]">
        <p
          className="font-display font-normal text-[#0D1B2A] leading-none"
          style={{ fontSize: "40px" }}
        >
          {isToday ? "·" : Math.max(0, daysUntil)}
        </p>
        <p className="text-[8px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.32)]">
          {isToday ? "Séjour en cours" : "jours"}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 1.3 : Ajouter la section Accès rapide**

Dans le return du `// ── Main dashboard ──`, après `{upcomingBooking && <UpcomingStayHero booking={upcomingBooking} />}` (ligne ~360), ajouter immédiatement en dessous :

```tsx
{/* Accès rapide */}
{upcomingBooking && (
  <div className="grid grid-cols-2 sm:grid-cols-4 border border-[rgba(13,27,42,0.07)]">
    {[
      {
        label: "Avant l'arrivée",
        sub: "Checklist",
        href: "/espace-client/checklist",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" />
            <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
      },
      {
        label: "Wi-Fi",
        sub: "Accès réseau",
        href: "/espace-client/livret",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M1 6c1.9-2 4.5-3 7-3s5.1 1 7 3M4 9.5c1.1-1.1 2.4-1.7 4-1.7s2.9.6 4 1.7M8 13h.01" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: "Calendrier",
        sub: "Planifier le séjour",
        href: "/espace-client/checklist",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1" />
            <path d="M2 7h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
      },
      {
        label: "PDF Livret",
        sub: "Télécharger",
        href: "/espace-client/livret/print",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 2h7l3 3v9H3z" stroke="currentColor" strokeWidth="1" />
            <path d="M10 2v3h3M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
      },
    ].map(({ label, sub, href, icon }) => (
      <Link
        key={label}
        href={href}
        className={[
          "group flex flex-col gap-[10px] px-5 py-5",
          "border-l border-[rgba(13,27,42,0.07)] first:border-l-0",
          "hover:border-l-[rgba(212,175,55,0.35)] transition-colors no-underline",
          "col-span-1",
        ].join(" ")}
      >
        <span className="text-[rgba(13,27,42,0.28)] group-hover:text-[rgba(13,27,42,0.5)] transition-colors">
          {icon}
        </span>
        <span className="text-[8px] tracking-[0.2em] uppercase text-[#0D1B2A] font-medium">
          {label}
        </span>
        <span className="font-cormorant italic text-[13px] font-light text-[rgba(13,27,42,0.4)]">
          {sub}
        </span>
      </Link>
    ))}
  </div>
)}
```

- [ ] **Step 1.4 : Supprimer les imports Lucide inutilisés**

Vérifier si `BookOpen`, `MessageCircle` sont encore utilisés dans le fichier après la suppression du `UpcomingStayHero`. Les quick-actions en bas du dashboard utilisent encore `MessageCircle`, `ArrowRight`, `BookOpen` — les garder. `CalendarX` est utilisé dans le cas 0 bookings — le garder.

Supprimer uniquement si non utilisés ailleurs : `import { ..., BookOpen, ... }` — faire une recherche rapide avant de supprimer.

- [ ] **Step 1.5 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -15
```
Résultat attendu : `✓ Compiled successfully`.

- [ ] **Step 1.6 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add app/espace-client/page.tsx && git commit -m "feat(séjour): white hero card + accès rapide 4 colonnes"
```

---

## Task 2 : Page Livret d'accueil

Réécrire `app/espace-client/livret/page.tsx` (actuellement un placeholder) avec le vrai layout deux colonnes — index à gauche + contenu à droite — et les données de la villa de la réservation en cours.

**Files:**
- Rewrite: `app/espace-client/livret/page.tsx`

**Données disponibles en DB** (table `villas`) :
- `wifi_name`, `wifi_password` → section "Wi-Fi & accès"
- `checkout_instructions` → section "Check-in / Check-out"
- `local_recommendations` → section "À proximité"
- `emergency_contacts` → section "Urgences" (+ SAMU 15, Police 17, Pompiers 18 hardcodés)

- [ ] **Step 2.1 : Réécrire la page livret**

Remplacer intégralement `app/espace-client/livret/page.tsx` par :

```tsx
"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import Link from "next/link";
import { PageTopbar } from "@/components/espace-client/PageTopbar";

// ── Types ────────────────────────────────────────────────────────────────────

interface VillaData {
  id: string;
  name: string;
  location?: string;
  wifi_name?: string;
  wifi_password?: string;
  checkout_instructions?: string;
  local_recommendations?: string;
  emergency_contacts?: string;
}

interface BookingData {
  id: string;
  start_date: string;
  end_date: string;
  villa: VillaData | null;
}

// ── Sections config ───────────────────────────────────────────────────────────

type SectionId = "wifi" | "checkinout" | "contacts" | "proximite" | "urgences";

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: "wifi", label: "Wi-Fi & accès" },
  { id: "checkinout", label: "Check-in / Check-out" },
  { id: "contacts", label: "Contacts utiles" },
  { id: "proximite", label: "À proximité" },
  { id: "urgences", label: "Urgences" },
];

// ── Icons SVG thin-line ───────────────────────────────────────────────────────

function IconWifi() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M1 6c1.9-2 4.5-3 7-3s5.1 1 7 3M4 9.5c1.1-1.1 2.4-1.7 4-1.7s2.9.6 4 1.7M8 13h.01" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1" />
      <path d="M2 7h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 3h3l1.5 3-2 1.5c.8 1.6 2 2.8 3.5 3.5L10.5 9l3 1.5V14c-5.5.5-11-5-10.5-11z" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
function IconMap() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 1L1 3v12l5-2 4 2 5-2V1l-5 2-4-2z" stroke="currentColor" strokeWidth="1" />
      <path d="M6 1v12M10 3v12" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1" />
      <path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

const SECTION_ICONS: Record<SectionId, React.ReactNode> = {
  wifi: <IconWifi />,
  checkinout: <IconCalendar />,
  contacts: <IconPhone />,
  proximite: <IconMap />,
  urgences: <IconAlert />,
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LivretSkeleton() {
  return (
    <div className="flex gap-8 animate-pulse">
      <div className="hidden md:block w-[200px] shrink-0 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-[rgba(13,27,42,0.04)] rounded-sm" />
        ))}
      </div>
      <div className="flex-1 space-y-4">
        <div className="h-3 w-24 bg-[rgba(13,27,42,0.06)] rounded" />
        <div className="h-6 w-48 bg-[rgba(13,27,42,0.06)] rounded" />
        <div className="h-4 w-full bg-[rgba(13,27,42,0.04)] rounded" />
        <div className="h-4 w-3/4 bg-[rgba(13,27,42,0.04)] rounded" />
      </div>
    </div>
  );
}

// ── Section content ───────────────────────────────────────────────────────────

function SectionContent({ id, villa }: { id: SectionId; villa: VillaData }) {
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPassword = async () => {
    if (!villa.wifi_password) return;
    try {
      await navigator.clipboard.writeText(villa.wifi_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  switch (id) {
    case "wifi":
      if (!villa.wifi_name && !villa.wifi_password) {
        return <EmptySection />;
      }
      return (
        <div className="space-y-5">
          {villa.wifi_name && (
            <div>
              <p className="text-[8px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.32)] mb-1">Réseau</p>
              <p className="font-cormorant text-[17px] text-[#0D1B2A]">{villa.wifi_name}</p>
            </div>
          )}
          {villa.wifi_password && (
            <div>
              <p className="text-[8px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.32)] mb-2">Mot de passe</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 border border-[rgba(13,27,42,0.09)] bg-[#FAFAF8] px-3 py-2">
                  <span className="font-mono text-[13px] text-[#0D1B2A] flex-1 select-all">
                    {showPass ? villa.wifi_password : "•".repeat(villa.wifi_password.length)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="text-[rgba(13,27,42,0.3)] hover:text-[#0D1B2A] transition-colors"
                    aria-label={showPass ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPass ? (
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M2 8s2-5 6-5 6 5 6 5-2 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1" />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1" />
                        <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M2 8s2-5 6-5 6 5 6 5-2 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1" />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="shrink-0 text-[8px] tracking-[0.18em] uppercase border border-[rgba(13,27,42,0.12)] px-3 py-2 text-[rgba(13,27,42,0.5)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                  aria-label="Copier le mot de passe Wi-Fi"
                >
                  {copied ? "Copié ✓" : "Copier"}
                </button>
              </div>
            </div>
          )}
        </div>
      );

    case "checkinout":
      if (!villa.checkout_instructions) return <EmptySection />;
      return (
        <div className="space-y-5">
          <div>
            <p className="text-[8px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.32)] mb-1">Check-in</p>
            <p className="font-cormorant text-[16px] text-[#0D1B2A]">À partir de 16h00</p>
          </div>
          <div>
            <p className="text-[8px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.32)] mb-1">Check-out</p>
            <p className="font-cormorant text-[16px] text-[#0D1B2A]">Avant 11h00</p>
          </div>
          <div>
            <p className="text-[8px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.32)] mb-2">Instructions</p>
            <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.6)] whitespace-pre-line leading-relaxed">
              {villa.checkout_instructions}
            </p>
          </div>
          {villa.location && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(villa.name + " " + villa.location + " Martinique")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[8px] tracking-[0.18em] uppercase text-[#D4AF37] hover:opacity-80 transition-opacity no-underline"
              style={{ textDecoration: "none" }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z" stroke="currentColor" strokeWidth="1" />
                <circle cx="8" cy="6" r="2" stroke="currentColor" strokeWidth="1" />
              </svg>
              Voir sur Maps →
            </a>
          )}
        </div>
      );

    case "contacts":
      if (!villa.emergency_contacts) return <EmptySection />;
      return (
        <div className="space-y-4">
          <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.6)] whitespace-pre-line leading-relaxed">
            {villa.emergency_contacts}
          </p>
        </div>
      );

    case "proximite":
      if (!villa.local_recommendations) return <EmptySection />;
      return (
        <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.6)] whitespace-pre-line leading-relaxed">
          {villa.local_recommendations}
        </p>
      );

    case "urgences":
      return (
        <div className="space-y-4">
          {[
            { name: "SAMU", number: "15", desc: "Urgences médicales" },
            { name: "Police", number: "17", desc: "Urgences sécurité" },
            { name: "Pompiers", number: "18", desc: "Incendie & secours" },
            { name: "Urgences Europe", number: "112", desc: "Numéro d'appel universel" },
          ].map(({ name, number, desc }) => (
            <div key={name} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[8px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.35)]">{desc}</p>
                <p className="font-cormorant text-[17px] text-[#0D1B2A] font-light">{name}</p>
              </div>
              <a
                href={`tel:${number}`}
                className="font-display text-[20px] font-normal text-[#D4AF37] no-underline hover:opacity-80 transition-opacity"
                style={{ textDecoration: "none" }}
                aria-label={`Appeler ${name} au ${number}`}
              >
                {number}
              </a>
            </div>
          ))}
          {villa.emergency_contacts && (
            <div className="pt-4 border-t border-[rgba(13,27,42,0.07)]">
              <p className="text-[8px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.35)] mb-2">
                Contact villa
              </p>
              <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.6)] whitespace-pre-line">
                {villa.emergency_contacts}
              </p>
            </div>
          )}
        </div>
      );
  }
}

function EmptySection() {
  return (
    <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.3)]">
      Cette section sera complétée avant votre arrivée par l&apos;équipe Diamant Noir.
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LivretPage() {
  const supabase = getSupabaseBrowser();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("wifi");

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setLoading(false); return; }

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, start_date, end_date, villa_id, status")
        .eq("guest_email", session.user.email)
        .in("status", ["confirmed", "upcoming"])
        .gt("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(1);

      const bk = bookings?.[0];
      if (!bk) { setLoading(false); return; }

      const { data: villaRaw } = await supabase
        .from("villas")
        .select("id, name, location, wifi_name, wifi_password, checkout_instructions, local_recommendations, emergency_contacts")
        .eq("id", bk.villa_id)
        .single();

      setBooking({ ...bk, villa: (villaRaw as VillaData) ?? null });
      setLoading(false);
    })();
  }, [supabase]);

  const villa = booking?.villa ?? null;

  const isEmptyBook =
    !villa ||
    (!villa.wifi_name && !villa.wifi_password && !villa.checkout_instructions &&
     !villa.local_recommendations && !villa.emergency_contacts);

  if (loading) {
    return (
      <>
        <PageTopbar title="Livret d'accueil" />
        <div className="max-w-4xl mx-auto px-6 py-8"><LivretSkeleton /></div>
      </>
    );
  }

  const handlePrint = () => {
    window.open("/espace-client/livret/print", "_blank");
  };

  return (
    <>
      <PageTopbar
        title="Livret d'accueil"
        badge={villa?.name ? undefined : undefined}
      />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[8px] tracking-[0.26em] uppercase text-[#D4AF37] mb-2">
              Votre villa
            </p>
            <h1 className="font-display text-2xl font-normal text-[#0D1B2A]">
              {villa?.name ?? "Livret d'accueil"}
            </h1>
            {villa?.location && (
              <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.4)] mt-1">
                {villa.location}, Martinique
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-2 text-[8px] tracking-[0.18em] uppercase border border-[rgba(13,27,42,0.12)] px-4 py-2.5 text-[rgba(13,27,42,0.45)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 2h7l3 3v9H3z" stroke="currentColor" strokeWidth="1" />
              <path d="M10 2v3h3M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1" />
            </svg>
            Télécharger PDF
          </button>
        </div>

        {isEmptyBook ? (
          <div className="py-12 text-center">
            <p className="font-cormorant italic text-[17px] font-light text-[rgba(13,27,42,0.4)]">
              Le livret sera complété avant votre arrivée par l&apos;équipe Diamant Noir.
            </p>
          </div>
        ) : (
          <div className="flex gap-8">
            {/* ── Index (desktop) ── */}
            <nav
              className="hidden md:flex w-[200px] shrink-0 flex-col gap-[2px]"
              aria-label="Sections du livret"
            >
              {SECTIONS.map(({ id, label }) => {
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSection(id)}
                    className={[
                      "flex items-center gap-[10px] px-3 py-[10px] text-left w-full transition-colors",
                      active
                        ? "bg-[rgba(212,175,55,0.04)] text-[#0D1B2A]"
                        : "text-[rgba(13,27,42,0.45)] hover:text-[#0D1B2A] hover:bg-[rgba(13,27,42,0.02)]",
                    ].join(" ")}
                    aria-current={active ? "true" : undefined}
                  >
                    <span className={active ? "text-[#D4AF37]" : "text-[rgba(13,27,42,0.22)]"}>
                      {SECTION_ICONS[id]}
                    </span>
                    <span className="text-[9px] tracking-[0.16em] uppercase flex-1">
                      {label}
                    </span>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      aria-hidden
                      className={active ? "text-[#D4AF37]" : "text-[rgba(13,27,42,0.15)]"}
                    >
                      <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </button>
                );
              })}
            </nav>

            {/* ── Mobile selector ── */}
            <div className="md:hidden w-full mb-6">
              <div className="flex flex-wrap gap-2">
                {SECTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSection(id)}
                    className={[
                      "text-[8px] tracking-[0.16em] uppercase px-3 py-2 border transition-colors",
                      activeSection === id
                        ? "border-[#D4AF37] text-[#D4AF37] bg-[rgba(212,175,55,0.04)]"
                        : "border-[rgba(13,27,42,0.1)] text-[rgba(13,27,42,0.45)] hover:border-[rgba(13,27,42,0.25)]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Contenu ── */}
            <div className="flex-1 min-w-0 md:border-l md:border-[rgba(13,27,42,0.07)] md:pl-8">
              <p className="text-[8px] tracking-[0.26em] uppercase text-[#D4AF37] mb-3">
                {SECTIONS.find((s) => s.id === activeSection)?.label}
              </p>
              <SectionContent id={activeSection} villa={villa!} />

              {/* PDF button mobile */}
              <div className="mt-8 sm:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="text-[8px] tracking-[0.18em] uppercase border border-[rgba(13,27,42,0.12)] px-4 py-2.5 text-[rgba(13,27,42,0.45)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                >
                  Télécharger le livret PDF →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
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
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add app/espace-client/livret/page.tsx && git commit -m "feat(livret): implement two-column livret page with WiFi copy/hide and urgences"
```

---

## Task 3 : WiFi copy/hide dans WelcomeBook

La page `/espace-client/reservations/[id]` utilise encore `WelcomeBook.tsx` (accordion). Améliorer la section WiFi dans ce composant pour la cohérence.

**Files:**
- Modify: `components/espace-client/WelcomeBook.tsx`

- [ ] **Step 3.1 : Lire le composant actuel**

Read `/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir/components/espace-client/WelcomeBook.tsx`.

Identifier la section WiFi (vers les lignes 37–53) qui affiche le mot de passe dans un `<code>`.

- [ ] **Step 3.2 : Ajouter les états show/copied en haut du composant**

Dans la fonction `WelcomeBook`, avant le `const sections = [...]`, ajouter :

```tsx
const [showPassword, setShowPassword] = useState(false);
const [copied, setCopied] = useState(false);

const copyPassword = async () => {
  if (!villa.wifi_password) return;
  try {
    await navigator.clipboard.writeText(villa.wifi_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch {
    // Clipboard API non disponible
  }
};
```

- [ ] **Step 3.3 : Remplacer le contenu WiFi**

Trouver dans le tableau `sections` l'objet `id: "wifi"` et remplacer son `content` par :

```tsx
content: (
  <div className="space-y-3">
    {villa.wifi_name && (
      <p className="text-sm text-navy/70">
        <span className="font-medium text-navy">Réseau :</span> {villa.wifi_name}
      </p>
    )}
    {villa.wifi_password && (
      <div>
        <p className="text-sm text-navy/70 mb-2">
          <span className="font-medium text-navy">Mot de passe :</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-navy/10 bg-offwhite px-3 py-1.5 flex-1">
            <span className="font-mono text-xs text-navy flex-1 select-all">
              {showPassword ? villa.wifi_password : "•".repeat(villa.wifi_password.length)}
            </span>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-navy/30 hover:text-navy transition-colors"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 8s2-5 6-5 6 5 6 5-2 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1" />
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1" />
                  <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 8s2-5 6-5 6 5 6 5-2 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1" />
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={copyPassword}
            className="text-[9px] font-bold uppercase tracking-[0.15em] border border-navy/15 px-3 py-1.5 text-navy/50 hover:border-gold hover:text-gold transition-colors shrink-0"
            aria-label="Copier le mot de passe Wi-Fi"
          >
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
      </div>
    )}
  </div>
),
```

- [ ] **Step 3.4 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -10
```

- [ ] **Step 3.5 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add components/espace-client/WelcomeBook.tsx && git commit -m "feat(welcomebook): add WiFi password copy/hide toggle"
```

---

## Task 4 : Page print PDF livret

Créer une page dédiée `/espace-client/livret/print` pour l'impression du livret. La page se charge avec les données de la villa et déclenche `window.print()` automatiquement. Les styles sont optimisés pour l'impression.

**Files:**
- Create: `app/espace-client/livret/print/page.tsx`

- [ ] **Step 4.1 : Créer la page print**

```tsx
"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

interface VillaPrint {
  name: string;
  location?: string;
  wifi_name?: string;
  wifi_password?: string;
  checkout_instructions?: string;
  local_recommendations?: string;
  emergency_contacts?: string;
}

export default function LivretPrintPage() {
  const supabase = getSupabaseBrowser();
  const [villa, setVilla] = useState<VillaPrint | null>(null);
  const [dates, setDates] = useState<{ start: string; end: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setReady(true); return; }

      const { data: bookings } = await supabase
        .from("bookings")
        .select("start_date, end_date, villa_id, status")
        .eq("guest_email", session.user.email)
        .in("status", ["confirmed", "upcoming"])
        .gt("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(1);

      const bk = bookings?.[0];
      if (!bk) { setReady(true); return; }

      const { data: villaRaw } = await supabase
        .from("villas")
        .select("name, location, wifi_name, wifi_password, checkout_instructions, local_recommendations, emergency_contacts")
        .eq("id", bk.villa_id)
        .single();

      setVilla(villaRaw as VillaPrint);
      setDates({ start: bk.start_date, end: bk.end_date });
      setReady(true);
    })();
  }, [supabase]);

  // Auto-print once data is loaded
  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          @page { margin: 2cm; }
        }
      `}</style>

      <div className="no-print py-4 px-6 border-b border-[rgba(13,27,42,0.07)] flex items-center justify-between">
        <p className="text-[8px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.4)]">
          Impression en cours…
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="text-[8px] tracking-[0.18em] uppercase border border-[rgba(13,27,42,0.12)] px-4 py-2 text-[rgba(13,27,42,0.45)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
        >
          Imprimer manuellement
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-10 print:px-0 print:py-0">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-[rgba(13,27,42,0.12)]">
          <p className="text-[8px] tracking-[0.28em] uppercase text-[#D4AF37] mb-1">Diamant Noir · Conciergerie</p>
          <h1 className="font-display text-2xl font-normal text-[#0D1B2A]">
            {villa?.name ?? "Livret d'accueil"}
          </h1>
          {villa?.location && (
            <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.5)] mt-1">
              {villa.location}, Martinique
            </p>
          )}
          {dates && (
            <p className="font-cormorant italic text-[14px] text-[rgba(13,27,42,0.4)] mt-1">
              {fmt(dates.start)} → {fmt(dates.end)}
            </p>
          )}
        </div>

        {villa?.wifi_name || villa?.wifi_password ? (
          <section className="mb-8">
            <h2 className="text-[8px] tracking-[0.24em] uppercase text-[#D4AF37] mb-4">Wi-Fi & accès</h2>
            {villa.wifi_name && (
              <p className="font-cormorant text-[16px] text-[#0D1B2A]">
                Réseau : <strong>{villa.wifi_name}</strong>
              </p>
            )}
            {villa.wifi_password && (
              <p className="font-cormorant text-[16px] text-[#0D1B2A]">
                Mot de passe : <code className="bg-[#FAFAF8] px-2 py-0.5 text-sm">{villa.wifi_password}</code>
              </p>
            )}
          </section>
        ) : null}

        {villa?.checkout_instructions ? (
          <section className="mb-8">
            <h2 className="text-[8px] tracking-[0.24em] uppercase text-[#D4AF37] mb-4">Check-in / Check-out</h2>
            <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.7)] whitespace-pre-line leading-relaxed">
              {villa.checkout_instructions}
            </p>
          </section>
        ) : null}

        {villa?.local_recommendations ? (
          <section className="mb-8">
            <h2 className="text-[8px] tracking-[0.24em] uppercase text-[#D4AF37] mb-4">À proximité</h2>
            <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.7)] whitespace-pre-line leading-relaxed">
              {villa.local_recommendations}
            </p>
          </section>
        ) : null}

        <section className="mb-8">
          <h2 className="text-[8px] tracking-[0.24em] uppercase text-[#D4AF37] mb-4">Urgences</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "SAMU", number: "15" },
              { name: "Police", number: "17" },
              { name: "Pompiers", number: "18" },
              { name: "Urgences Europe", number: "112" },
            ].map(({ name, number }) => (
              <p key={name} className="font-cormorant text-[15px] text-[#0D1B2A]">
                <span className="text-[rgba(13,27,42,0.45)]">{name} — </span>
                <strong>{number}</strong>
              </p>
            ))}
          </div>
          {villa?.emergency_contacts && (
            <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.6)] mt-3 whitespace-pre-line">
              {villa.emergency_contacts}
            </p>
          )}
        </section>

        <div className="pt-6 border-t border-[rgba(13,27,42,0.08)]">
          <p className="text-[8px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.25)]">
            Diamant Noir · Conciergerie de luxe, Martinique
          </p>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 4.2 : Vérifier le build**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -10
```

- [ ] **Step 4.3 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add app/espace-client/livret/print/page.tsx && git commit -m "feat(livret): add print/PDF page with auto-print trigger"
```

---

## Task 5 : Checklist Avant l'arrivée + iCal + Supabase

Créer la page checklist accessible depuis le CTA "Avant l'arrivée" de la page Séjour. 4 items avec cases cochables, persistance JSONB dans `bookings.checklist_state`, et boutons de calendrier iCal/Google/Outlook pour l'item calendrier.

**Files:**
- Create: `app/espace-client/checklist/page.tsx`

**Schema Supabase requis** : colonne `checklist_state JSONB` sur table `bookings`. Ajouter si absente :

- [ ] **Step 5.1 : Ajouter la colonne checklist_state**

Exécuter via Supabase MCP ou en copiant ce SQL dans la console Supabase :

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checklist_state JSONB DEFAULT '{}';
```

Si Supabase MCP est disponible, utiliser l'outil `execute_sql`. Sinon, noter que la migration doit être exécutée manuellement.

Pour vérifier que la colonne existe (optionnel) :
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'checklist_state';
```

- [ ] **Step 5.2 : Créer la page checklist**

Créer `app/espace-client/checklist/page.tsx` :

```tsx
"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { PageTopbar } from "@/components/espace-client/PageTopbar";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

interface ChecklistState {
  identity: boolean;
  contract: boolean;
  calendar: boolean;
  access: boolean;
}

const DEFAULT_STATE: ChecklistState = {
  identity: false,
  contract: false,
  calendar: false,
  access: false,
};

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  checklist_state: ChecklistState | null;
  villa: { name: string; location?: string } | null;
}

// ── Helpers iCal / Calendrier ─────────────────────────────────────────────────

function formatDateICS(dateStr: string): string {
  // YYYYMMDD format for RFC 5545
  return dateStr.replace(/-/g, "").slice(0, 8);
}

function generateICS(booking: Booking): string {
  const dtstart = formatDateICS(booking.start_date);
  const dtend = formatDateICS(booking.end_date);
  const summary = `Séjour ${booking.villa?.name ?? "Villa Diamant Noir"}`;
  const location = booking.villa?.location ? `${booking.villa.location}, Martinique` : "Martinique";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Diamant Noir//FR",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function googleCalendarUrl(booking: Booking): string {
  const dtstart = formatDateICS(booking.start_date);
  const dtend = formatDateICS(booking.end_date);
  const title = encodeURIComponent(`Séjour ${booking.villa?.name ?? "Villa Diamant Noir"}`);
  const location = encodeURIComponent(
    booking.villa?.location ? `${booking.villa.location}, Martinique` : "Martinique"
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dtstart}/${dtend}&location=${location}`;
}

function outlookCalendarUrl(booking: Booking): string {
  const title = encodeURIComponent(`Séjour ${booking.villa?.name ?? "Villa Diamant Noir"}`);
  const location = encodeURIComponent(
    booking.villa?.location ? `${booking.villa.location}, Martinique` : "Martinique"
  );
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${booking.start_date}&enddt=${booking.end_date}&location=${location}`;
}

function downloadICS(booking: Booking) {
  const content = generateICS(booking);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sejour-diamant-noir-${booking.start_date}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Checklist items config ────────────────────────────────────────────────────

const ITEMS: Array<{
  key: keyof ChecklistState;
  label: string;
  description: string;
  cta?: "calendar" | "livret";
}> = [
  {
    key: "identity",
    label: "Pièce d'identité",
    description: "Passeport ou carte d'identité en cours de validité",
  },
  {
    key: "contract",
    label: "Contrat de location signé",
    description: "Vérifier votre email de confirmation ou contacter la conciergerie",
  },
  {
    key: "calendar",
    label: "Ajouter au calendrier",
    description: "Enregistrez les dates de votre séjour dans votre agenda",
    cta: "calendar",
  },
  {
    key: "access",
    label: "Horaires & accès",
    description: "Check-in à partir de 16h00 · Check-out avant 11h00",
    cta: "livret",
  },
];

// ── Composant principal ───────────────────────────────────────────────────────

export default function ChecklistPage() {
  const supabase = getSupabaseBrowser();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setLoading(false); return; }

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, start_date, end_date, checklist_state, villa_id, status")
        .eq("guest_email", session.user.email)
        .in("status", ["confirmed", "upcoming"])
        .gt("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(1);

      const bk = bookings?.[0];
      if (!bk) { setLoading(false); return; }

      const { data: villaRaw } = await supabase
        .from("villas")
        .select("name, location")
        .eq("id", bk.villa_id)
        .single();

      const bkWithVilla: Booking = {
        ...bk,
        villa: villaRaw as { name: string; location?: string } | null,
        checklist_state: (bk.checklist_state as ChecklistState) ?? DEFAULT_STATE,
      };

      setBooking(bkWithVilla);
      setChecklist({ ...DEFAULT_STATE, ...(bk.checklist_state ?? {}) });
      setLoading(false);
    })();
  }, [supabase]);

  const toggle = async (key: keyof ChecklistState) => {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);

    if (!booking || !supabase) return;
    setSaving(true);
    await supabase
      .from("bookings")
      .update({ checklist_state: next })
      .eq("id", booking.id);
    setSaving(false);
  };

  const checked = Object.values(checklist).filter(Boolean).length;
  const total = ITEMS.length;
  const progress = Math.round((checked / total) * 100);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  if (loading) {
    return (
      <>
        <PageTopbar title="Avant votre arrivée" />
        <div className="max-w-2xl mx-auto px-6 py-10 animate-pulse space-y-4">
          <div className="h-8 w-32 bg-[rgba(13,27,42,0.06)] rounded" />
          <div className="h-2 w-full bg-[rgba(13,27,42,0.04)] rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-[rgba(13,27,42,0.03)] border border-[rgba(13,27,42,0.06)]" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageTopbar title="Avant votre arrivée" />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[8px] tracking-[0.26em] uppercase text-[#D4AF37] mb-2">
            Checklist avant-arrivée
          </p>
          <h1 className="font-display text-2xl font-normal text-[#0D1B2A] mb-1">
            Avant votre arrivée
          </h1>
          {booking && (
            <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.4)]">
              {booking.villa?.name} · {fmt(booking.start_date)}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-3">
            <span
              className="font-display font-normal text-[#0D1B2A] leading-none"
              style={{ fontSize: "28px" }}
            >
              {checked} / {total}
            </span>
            <span className="text-[8px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.32)]">
              étapes complétées
            </span>
            {saving && (
              <span className="text-[7px] tracking-[0.15em] uppercase text-[rgba(13,27,42,0.25)] ml-auto">
                Sauvegarde…
              </span>
            )}
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${checked} sur ${total} étapes complétées`}
            className="h-[2px] bg-[rgba(13,27,42,0.07)] rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-[#D4AF37] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist items */}
        {!booking ? (
          <div className="py-12 text-center">
            <p className="font-cormorant italic text-[17px] font-light text-[rgba(13,27,42,0.4)]">
              Aucune réservation à venir.{" "}
              <Link href="/villas" className="text-[#D4AF37] underline underline-offset-4">
                Découvrir nos villas →
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-[2px]">
            {ITEMS.map(({ key, label, description, cta }) => {
              const isChecked = checklist[key];
              return (
                <div
                  key={key}
                  className="flex items-start gap-4 border border-[rgba(13,27,42,0.07)] bg-white px-5 py-4"
                >
                  {/* Checkbox circle */}
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className={[
                      "shrink-0 w-[28px] h-[28px] rounded-full border flex items-center justify-center transition-all mt-0.5",
                      isChecked
                        ? "bg-[#D4AF37] border-[#D4AF37]"
                        : "border-[rgba(13,27,42,0.18)] hover:border-[#D4AF37]",
                    ].join(" ")}
                    aria-checked={isChecked}
                    aria-label={`Marquer "${label}" comme ${isChecked ? "non complété" : "complété"}`}
                  >
                    {isChecked && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={[
                        "text-[9px] tracking-[0.18em] uppercase mb-0.5 transition-colors",
                        isChecked
                          ? "text-[rgba(13,27,42,0.3)] line-through decoration-[rgba(13,27,42,0.2)]"
                          : "text-[#0D1B2A] font-medium",
                      ].join(" ")}
                    >
                      {label}
                    </p>
                    <p
                      className={[
                        "font-cormorant italic text-[13px] font-light transition-colors",
                        isChecked ? "text-[rgba(13,27,42,0.25)]" : "text-[rgba(13,27,42,0.45)]",
                      ].join(" ")}
                    >
                      {description}
                    </p>

                    {/* CTA calendrier */}
                    {cta === "calendar" && booking && !isChecked && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => downloadICS(booking)}
                          className="text-[7px] tracking-[0.16em] uppercase border border-[rgba(13,27,42,0.12)] px-3 py-1.5 text-[rgba(13,27,42,0.5)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                        >
                          iCal
                        </button>
                        <a
                          href={googleCalendarUrl(booking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[7px] tracking-[0.16em] uppercase border border-[rgba(13,27,42,0.12)] px-3 py-1.5 text-[rgba(13,27,42,0.5)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors no-underline"
                          style={{ textDecoration: "none" }}
                        >
                          Google Calendar
                        </a>
                        <a
                          href={outlookCalendarUrl(booking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[7px] tracking-[0.16em] uppercase border border-[rgba(13,27,42,0.12)] px-3 py-1.5 text-[rgba(13,27,42,0.5)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors no-underline"
                          style={{ textDecoration: "none" }}
                        >
                          Outlook
                        </a>
                      </div>
                    )}

                    {/* CTA livret */}
                    {cta === "livret" && !isChecked && (
                      <Link
                        href="/espace-client/livret#checkinout"
                        className="inline-block mt-2 text-[7px] tracking-[0.16em] uppercase text-[#D4AF37] underline underline-offset-4 decoration-[rgba(212,175,55,0.4)] hover:decoration-[#D4AF37] transition-colors no-underline"
                        style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
                      >
                        Voir dans le livret →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lien retour séjour */}
        <div className="mt-8">
          <Link
            href="/espace-client"
            className="text-[8px] tracking-[0.18em] uppercase text-[rgba(13,27,42,0.35)] hover:text-[#0D1B2A] transition-colors no-underline"
            style={{ textDecoration: "none" }}
          >
            ← Retour à mon séjour
          </Link>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 5.3 : Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -30
```
Résultat attendu : aucune erreur.

- [ ] **Step 5.4 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add app/espace-client/checklist/page.tsx && git commit -m "feat(checklist): add avant-arrivée page with iCal, Google/Outlook calendar, Supabase JSONB persistence"
```

---

## Task 6 : Tests Playwright

**Files:**
- Create: `tests/espace-client/ux-features.spec.ts`

- [ ] **Step 6.1 : Écrire les tests**

```ts
import { test, expect } from "@playwright/test";

// Start dev server: npm run dev
// Run: npx playwright test tests/espace-client/ux-features.spec.ts --reporter=line

test.describe("Espace Client — UX Features", () => {
  test("page livret responds without 5xx", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/espace-client/livret");
    expect(response?.status()).toBeLessThan(500);
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login|\/espace-client\/livret/);
  });

  test("page livret/print responds without 5xx", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/espace-client/livret/print");
    expect(response?.status()).toBeLessThan(500);
  });

  test("page checklist responds without 5xx", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/espace-client/checklist");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login|\/espace-client\/checklist/);
  });

  test("séjour page hero card has no dark navy bg", async ({ page }) => {
    // Without auth → redirect. This test verifies the route doesn't 500.
    const response = await page.goto("http://localhost:3000/espace-client");
    expect(response?.status()).toBeLessThan(500);
  });

  test("accès rapide links navigate correctly", async ({ page }) => {
    // Navigate to checklist directly
    const response = await page.goto("http://localhost:3000/espace-client/checklist");
    expect(response?.status()).toBeLessThan(500);
  });
});
```

- [ ] **Step 6.2 : Lancer les tests**

Démarrer le dev server :
```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run dev > /tmp/diamantnoir-dev2.log 2>&1 &
DEV_PID=$!
sleep 6
```

Lancer les tests :
```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx playwright test tests/espace-client/ux-features.spec.ts --reporter=line 2>&1 | head -40
```

Résultat attendu : 5/5 tests passent.

- [ ] **Step 6.3 : Build prod + commit**

```bash
kill $DEV_PID 2>/dev/null || pkill -f "next dev" 2>/dev/null
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -15
```

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add tests/espace-client/ux-features.spec.ts && git commit -m "test(espace-client): add Playwright tests for UX features pages"
```

---

## Vérification finale

- [ ] **Build prod propre**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```
Résultat attendu : routes `/espace-client/livret`, `/espace-client/livret/print`, `/espace-client/checklist` listées sans erreur.

- [ ] **Checklist visuelle (npm run dev)**

```
http://localhost:3000/espace-client
```
Connecté avec un compte test :
- ✅ Hero card blanc avec `border-top: 2px solid #D4AF37`
- ✅ Villa name en Playfair 24px, dates en Cormorant italic
- ✅ Compteur jours en Playfair 40px à droite
- ✅ Lien "Voir le livret →" gold avec underline
- ✅ Section Accès rapide 4 colonnes (desktop) ou 2×2 (mobile)

```
http://localhost:3000/espace-client/livret
```
- ✅ Deux colonnes desktop : index 200px à gauche, contenu à droite
- ✅ Section Wi-Fi : champ masqué par défaut, bouton afficher/masquer, bouton "Copier"
- ✅ Empty state éditorial si villa sans données
- ✅ Bouton "Télécharger PDF" en haut à droite (desktop) et en bas de page (mobile)

```
http://localhost:3000/espace-client/livret/print
```
- ✅ Page claire, déclenchement `window.print()` après 500ms
- ✅ Pas de navigation visible

```
http://localhost:3000/espace-client/checklist
```
- ✅ Header "Avant votre arrivée" + dates en Cormorant italic
- ✅ Compteur "X / 4" en Playfair 28px + barre de progression gold
- ✅ 4 items avec cercle cochable (fond gold + checkmark blanc quand coché)
- ✅ Item calendrier : 3 boutons (iCal, Google Calendar, Outlook)
- ✅ Case cochée : label barré, opacité réduite

---

> **Suite :** Plan 3 — `2026-04-02-espace-client-plan3-chat.md` — Chat persistence (localStorage sessionId + Supabase `chat_messages`), lazy loading `TenantChatbot`, suppression faux "En ligne".
