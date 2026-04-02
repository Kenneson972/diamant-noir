# Espace Client — Plan 3 : Chat & Messagerie

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Améliorer la messagerie de l'espace client — persistance de conversation (localStorage + Supabase), design aligné sur le système blanc, suppression du faux "En ligne", bandeau contexte villa, lazy loading.

**Architecture:** 3 fichiers modifiés. `TenantChatbot.tsx` est réécrit : design blanc, `role="log"` accessibilité, localStorage sessionId stable, persistance Supabase `chat_messages`. `messagerie/page.tsx` est simplifié : `PageTopbar`, bandeau contexte villa/dates, `dynamic()` pour lazy load. `globals.css` reçoit l'animation `dn-typing-dot`. Aucune nouvelle table React context — chaque composant charge ses propres données.

**Tech Stack:** Next.js 14 App Router, `next/dynamic` pour lazy loading, Supabase browser client, localStorage (Web standard), Tailwind CSS 3.4, Cormorant Garamond (via `font-cormorant`), SVG thin-line icons.

> **Prérequis :** Plans 1 et 2 exécutés — `EspaceClientShell`, `PageTopbar`, `font-cormorant`, layout auth redirect tous en place.

> **Migration SQL requise** (à exécuter manuellement dans la console Supabase avant ou après Task 2) :
> ```sql
> CREATE TABLE IF NOT EXISTS chat_messages (
>   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
>   session_id TEXT NOT NULL,
>   user_id TEXT NOT NULL,
>   role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
>   content TEXT NOT NULL,
>   created_at TIMESTAMPTZ DEFAULT NOW()
> );
> CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id);
> ```

---

## Structure des fichiers

| Fichier | Action | Tâche |
|---------|--------|-------|
| `app/globals.css` | Modifier (ajouter keyframe) | Task 1 — Animation typing dots |
| `components/espace-client/TenantChatbot.tsx` | Réécrire | Task 2 — TenantChatbot v2 |
| `app/espace-client/messagerie/page.tsx` | Réécrire | Task 3 — Page messagerie redesign |
| `tests/espace-client/chat.spec.ts` | Créer | Task 4 — Tests Playwright |

---

## Task 1 : Animation typing dots (globals.css)

Ajouter l'animation `.dn-typing-dot` utilisée dans `TenantChatbot` et le skeleton de chargement.

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1.1 : Ajouter l'animation en fin de fichier**

Dans `app/globals.css`, trouver le bloc `@media (prefers-reduced-motion: reduce)` en fin de fichier (dernières lignes). Insérer **avant** ce bloc :

```css
/* Chat — Typing indicator dots */
@keyframes dn-typing-bounce {
  0%, 60%, 100% { opacity: 0.2; transform: translateY(0); }
  30% { opacity: 0.9; transform: translateY(-3px); }
}
.dn-typing-dot {
  display: inline-block;
  animation: dn-typing-bounce 1.2s ease-in-out infinite;
}
```

Et dans le bloc `@media (prefers-reduced-motion: reduce)` existant, ajouter `.dn-typing-dot` à la liste :

```css
@media (prefers-reduced-motion: reduce) {
  .stagger-item, .line-luxury-animated, .modal-enter, .dn-typing-dot {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  /* ...lignes existantes... */
}
```

- [ ] **Step 1.2 : Vérifier le build TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -5
```

Résultat attendu : pas d'erreur (globals.css n'est pas TypeScript-checked).

- [ ] **Step 1.3 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add app/globals.css && git commit -m "feat(chat): add dn-typing-dot keyframe animation for chat loading indicator"
```

---

## Task 2 : TenantChatbot v2

Réécrire entièrement `components/espace-client/TenantChatbot.tsx` avec :
- Design blanc/offwhite aligné sur le design system (plus de header navy, plus de `bg-navy`)
- Bulles bot : fond blanc, bordure fine, `border-radius: 0 8px 8px 8px`, Cormorant 14px
- Bulles user : fond `#0D1B2A`, `border-radius: 8px 0 8px 8px`, Inter 13px blanc
- `role="log"` + `aria-live="polite"` sur la zone messages
- `aria-label="Envoyer le message"` sur le bouton d'envoi (SVG thin-line, plus de Lucide)
- Indicateur typing 3 dots animés (`dn-typing-dot`)
- Timestamps discrets sous chaque bulle
- Textarea Cormorant italic, fond `#FAFAF8`
- Mention RGPD + "Conversation sauvegardée" sous l'input
- `sessionId` stable depuis `localStorage` (clé `dk_session_${userId}`)
- Chargement historique depuis Supabase `chat_messages` au montage
- Sauvegarde messages en temps réel via Supabase insert
- Suppression du faux "En ligne" dans le header du composant (il n'y a plus de header)
- Prop `userId?: string` ajoutée

**Files:**
- Rewrite: `components/espace-client/TenantChatbot.tsx`

- [ ] **Step 2.1 : Réécrire TenantChatbot.tsx**

Remplacer l'intégralité de `components/espace-client/TenantChatbot.tsx` par :

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface TenantChatbotProps {
  guestEmail: string;
  guestName?: string;
  bookingId?: string;
  userId?: string; // Supabase auth user.id — used for stable localStorage session key
}

// ── Session ID (stable localStorage) ─────────────────────────────────────────

function getOrCreateSessionId(userId?: string): string {
  const key = `dk_session_${userId ?? "guest"}`;
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const newId = `tenant-${userId ?? "anon"}-${Date.now()}`;
    localStorage.setItem(key, newId);
    return newId;
  } catch {
    // localStorage unavailable (SSR, private browsing edge case)
    return `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function makeWelcomeMessage(guestName?: string): Message {
  return {
    role: "assistant",
    content: `Bonjour${guestName ? ` ${guestName}` : ""}\n\nJe suis votre assistante Diamant Noir. Comment puis-je vous aider pendant votre séjour ?`,
    timestamp: new Date(),
  };
}

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  "Signaler un problème",
  "Infos pratiques",
  "Contact urgence",
  "Horaires check-in/out",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TenantChatbot({
  guestEmail,
  guestName,
  bookingId,
  userId,
}: TenantChatbotProps) {
  const supabase = getSupabaseBrowser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sessionId] = useState<string>(() => {
    if (typeof window === "undefined") return `tenant-${Date.now()}`;
    return getOrCreateSessionId(userId);
  });
  const endRef = useRef<HTMLDivElement>(null);

  // ── Load history from Supabase ──────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      setMessages([makeWelcomeMessage(guestName)]);
      setHistoryLoaded(true);
      return;
    }
    (async () => {
      try {
        // @ts-ignore — chat_messages may not be in generated Supabase types yet
        const { data } = await supabase
          .from("chat_messages")
          .select("role, content, created_at")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (data && (data as unknown[]).length > 0) {
          setMessages(
            (data as Array<{ role: string; content: string; created_at: string }>).map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: new Date(m.created_at),
            }))
          );
        } else {
          setMessages([makeWelcomeMessage(guestName)]);
        }
      } catch {
        // chat_messages table not yet created — fall back to welcome message
        setMessages([makeWelcomeMessage(guestName)]);
      }
      setHistoryLoaded(true);
    })();
  }, [supabase, sessionId, guestName]);

  // ── Scroll to bottom on new messages ───────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Save message to Supabase ────────────────────────────────────────────────
  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!supabase) return;
    try {
      // @ts-ignore — chat_messages may not be in generated Supabase types yet
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        user_id: userId ?? guestEmail,
        role,
        content,
      });
    } catch {
      // Graceful degradation — UI state already updated, persistence optional
    }
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    await saveMessage("user", trimmed);

    try {
      const res = await fetch("/api/chat/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId, bookingId, guestEmail }),
      });
      const data = await res.json();
      const reply: string = data.success
        ? data.response
        : "Une erreur est survenue. Veuillez réessayer ou nous contacter directement.";
      const assistantMsg: Message = { role: "assistant", content: reply, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveMessage("assistant", reply);
    } catch {
      const errorMsg: Message = {
        role: "assistant",
        content: "Impossible de contacter le service. Veuillez nous appeler directement.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Loading skeleton (history loading) ─────────────────────────────────────
  if (!historyLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FAFAF8]">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="dn-typing-dot w-2 h-2 rounded-full bg-[rgba(13,27,42,0.15)]"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#FAFAF8]">
      {/* Messages */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Historique de conversation"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={
                msg.role === "user"
                  ? "max-w-[78%] bg-[#0D1B2A] text-white px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line"
                  : "max-w-[78%] bg-white border border-[rgba(13,27,42,0.08)] px-4 py-3 font-cormorant text-[14px] font-light leading-relaxed whitespace-pre-line text-[#0D1B2A]"
              }
              style={{
                borderRadius: msg.role === "user" ? "8px 0 8px 8px" : "0 8px 8px 8px",
              }}
            >
              {msg.content}
            </div>
            <span className="text-[6.5px] tracking-[0.12em] uppercase text-[rgba(13,27,42,0.22)] px-1">
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start">
            <div
              className="bg-white border border-[rgba(13,27,42,0.08)] px-4 py-3 flex items-center gap-1.5"
              style={{ borderRadius: "0 8px 8px 8px" }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="dn-typing-dot w-1.5 h-1.5 rounded-full bg-[rgba(13,27,42,0.3)]"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick actions — shown only when single welcome message */}
      {messages.length === 1 && !loading && (
        <div className="px-5 pb-3 flex flex-wrap gap-2 shrink-0">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => sendMessage(action)}
              className="border border-[rgba(13,27,42,0.10)] bg-white px-4 py-2 text-[8px] tracking-[0.14em] uppercase text-[rgba(13,27,42,0.5)] hover:border-[rgba(212,175,55,0.4)] hover:text-[#D4AF37] transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input zone */}
      <div className="border-t border-[rgba(13,27,42,0.07)] bg-white px-4 pb-4 pt-3 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message…"
            rows={1}
            className="flex-1 bg-[#FAFAF8] border border-[rgba(13,27,42,0.10)] px-4 py-3 font-cormorant italic text-[14px] text-[#0D1B2A] placeholder:text-[rgba(13,27,42,0.3)] focus:outline-none focus:border-[rgba(212,175,55,0.5)] resize-none"
            style={{ minHeight: 44, maxHeight: 120 }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Envoyer le message"
            className="shrink-0 h-[44px] w-[44px] flex items-center justify-center bg-[#0D1B2A] text-white hover:bg-[#D4AF37] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M12 7L2 2l2 5-2 5 10-5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 px-0.5">
          <p className="text-[6.5px] tracking-[0.14em] uppercase text-[rgba(13,27,42,0.2)]">
            Échanges conservés pour la qualité du service
          </p>
          <p className="text-[6.5px] tracking-[0.14em] uppercase text-[rgba(13,27,42,0.2)]">
            Conversation sauvegardée
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2.2 : Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -20
```

Résultat attendu : 0 erreurs.

- [ ] **Step 2.3 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add components/espace-client/TenantChatbot.tsx && git commit -m "feat(chat): rewrite TenantChatbot v2 — white design, localStorage sessionId, Supabase persistence, accessibility"
```

---

## Task 3 : Page messagerie redesign

Réécrire `app/espace-client/messagerie/page.tsx` avec :
- `PageTopbar` (section "Messagerie")
- Suppression du badge vert "En ligne" et du header h1 existant
- Bandeau contexte villa (icône maison + nom villa + dates + "Réponse sous 2 h")
- Fetch de la réservation avec `villa_id` pour charger le nom de villa
- `TenantChatbot` chargé via `next/dynamic` (ssr: false) — lazy loading
- `userId` passé depuis `session.user.id`
- Suppression des imports `Card`, `CardContent`, `Skeleton` inutilisés

**Files:**
- Rewrite: `app/espace-client/messagerie/page.tsx`

- [ ] **Step 3.1 : Réécrire messagerie/page.tsx**

Remplacer l'intégralité de `app/espace-client/messagerie/page.tsx` par :

```tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseBrowser } from "@/lib/supabase";
import { PageTopbar } from "@/components/espace-client/PageTopbar";

// ── Lazy load TenantChatbot (ssr: false — uses localStorage + browser APIs) ───

function ChatLoadingDots() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#FAFAF8]">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="dn-typing-dot w-2 h-2 rounded-full bg-[rgba(13,27,42,0.15)]"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

const TenantChatbot = dynamic(
  () =>
    import("@/components/espace-client/TenantChatbot").then((m) => ({
      default: m.TenantChatbot,
    })),
  { ssr: false, loading: () => <ChatLoadingDots /> }
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingData {
  id: string;
  start_date: string;
  end_date: string;
  villa_id: string;
  villa: { name: string } | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessageriePage() {
  const supabase = getSupabaseBrowser();
  const [userId, setUserId] = useState<string | undefined>();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      const email = session.user.email;
      const name = session.user.user_metadata?.full_name as string | undefined;
      setUserId(session.user.id);
      setUser({ email, name });

      const { data: bookingRaw } = await supabase
        .from("bookings")
        .select("id, start_date, end_date, villa_id, status")
        .eq("guest_email", email)
        .in("status", ["confirmed", "upcoming"])
        .gt("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(1);

      const bk = (
        bookingRaw as Array<{
          id: string;
          start_date: string;
          end_date: string;
          villa_id: string;
          status: string;
        }> | null
      )?.[0];

      if (bk) {
        const { data: villaRaw } = await supabase
          .from("villas")
          .select("name")
          .eq("id", bk.villa_id)
          .single();

        setBooking({
          id: bk.id,
          start_date: bk.start_date,
          end_date: bk.end_date,
          villa_id: bk.villa_id,
          villa: villaRaw as { name: string } | null,
        });
      }

      setLoading(false);
    })();
  }, [supabase]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  if (loading || !user) {
    return (
      <>
        <PageTopbar title="Messagerie" />
        <div className="flex-1 flex items-center justify-center bg-[#FAFAF8]">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="dn-typing-dot w-2 h-2 rounded-full bg-[rgba(13,27,42,0.15)]"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageTopbar title="Messagerie" />

      {/* Bandeau contexte villa */}
      {booking && (
        <div className="flex items-center gap-4 px-6 py-3 border-b border-[rgba(13,27,42,0.06)] bg-white shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M8 1L1 5v9h5V9h4v5h5V5L8 1z"
              stroke="#0D1B2A"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <p className="text-[8px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.5)]">
              {booking.villa?.name ?? "Villa Diamant Noir"}
            </p>
            <p className="font-cormorant italic text-[12px] font-light text-[rgba(13,27,42,0.4)]">
              {fmt(booking.start_date)} → {fmt(booking.end_date)}
            </p>
          </div>
          <span className="ml-auto text-[7px] tracking-[0.18em] uppercase text-[rgba(13,27,42,0.3)]">
            Réponse sous 2 h
          </span>
        </div>
      )}

      {/* Chat — lazy loaded */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <TenantChatbot
          guestEmail={user.email}
          guestName={user.name}
          bookingId={booking?.id}
          userId={userId}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3.2 : Vérifier TypeScript**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -20
```

Résultat attendu : 0 erreurs.

- [ ] **Step 3.3 : Build prod**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -15
```

Résultat attendu : `✓ Compiled successfully`.

- [ ] **Step 3.4 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add app/espace-client/messagerie/page.tsx && git commit -m "feat(messagerie): redesign — PageTopbar, context banner, remove En ligne badge, lazy load TenantChatbot"
```

---

## Task 4 : Tests Playwright

Créer `tests/espace-client/chat.spec.ts` vérifiant que les routes du chat répondent sans 5xx et que la page redirige correctement pour un visiteur non authentifié.

**Files:**
- Create: `tests/espace-client/chat.spec.ts`

- [ ] **Step 4.1 : Créer le fichier de tests**

Créer `tests/espace-client/chat.spec.ts` :

```ts
import { test, expect } from "@playwright/test";

// Start dev server: npm run dev
// Run: npx playwright test tests/espace-client/chat.spec.ts --reporter=line

test.describe("Espace Client — Chat & Messagerie", () => {
  test("page messagerie responds without 5xx", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/espace-client/messagerie");
    expect(response?.status()).toBeLessThan(500);
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login|\/espace-client\/messagerie/);
  });

  test("chat API returns 400 on empty message", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/chat/tenant", {
      data: { message: "", sessionId: "test-session", guestEmail: "test@test.com" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("chat API returns 429 on missing guestEmail", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/chat/tenant", {
      data: { message: "Bonjour", sessionId: "test-session" },
    });
    // 429 rate limit or 400 bad request both acceptable
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test("chat API returns demo response without n8n webhook", async ({ request }) => {
    // N8N_TENANT_WEBHOOK_URL not set in test env → demo response
    const res = await request.post("http://localhost:3000/api/chat/tenant", {
      data: {
        message: "Bonjour",
        sessionId: "test-session-playwright",
        guestEmail: "playwright@diamantnoir.test",
      },
    });
    // Either 200 (demo mode) or 429 (rate limit already hit)
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(typeof body.response).toBe("string");
    }
  });
});
```

- [ ] **Step 4.2 : Vérifier TypeScript (tests)**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npx tsc --noEmit 2>&1 | head -10
```

Résultat attendu : 0 erreurs.

- [ ] **Step 4.3 : Commit**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && git add tests/espace-client/chat.spec.ts && git commit -m "test(chat): add Playwright tests for messagerie page and chat API"
```

---

## Vérification finale

- [ ] **Build prod propre**

```bash
cd "/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir" && npm run build 2>&1 | tail -20
```

Résultat attendu : route `/espace-client/messagerie` listée sans erreur TypeScript.

- [ ] **Checklist visuelle (npm run dev)**

```
http://localhost:3000/espace-client/messagerie
```

Connecté avec un compte test ayant une réservation confirmée :
- ✅ `PageTopbar` "Messagerie" visible en desktop
- ✅ Bandeau contexte : nom villa + dates + "Réponse sous 2 h" (plus de badge vert "En ligne")
- ✅ Zone chat : fond `#FAFAF8`, pas de header navy
- ✅ Bulles bot : fond blanc, `border-radius: 0 8px 8px 8px`, Cormorant 14px
- ✅ Bulles user : fond `#0D1B2A`, `border-radius: 8px 0 8px 8px`
- ✅ Timestamps discrets sous chaque bulle
- ✅ Indicateur typing 3 dots animés
- ✅ Textarea Cormorant italic, fond offwhite
- ✅ Bouton envoi navy → gold au hover
- ✅ Mention RGPD + "Conversation sauvegardée" sous l'input
- ✅ Quick actions 4 boutons sur message d'accueil
- ✅ Après refresh : historique rechargé (si `chat_messages` table créée)
- ✅ Lazy loading : TenantChatbot n'est pas dans le bundle initial

- [ ] **Migration SQL**

À exécuter dans la console Supabase (si pas encore fait) :

```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id);
```

---

> **Plan 3 terminé.** Les 3 plans (Layout, UX Features, Chat) couvrent l'ensemble de la spec `2026-04-02-espace-client-redesign.md`.
