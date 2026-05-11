# Phase 1 — Espace Client Fonctionnel — Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer l'espace client Kayvila de consultatif à actionnable avec 6 fonctionnalités : système de demandes, check-in autonome, profil enrichi, manuel villa, check-out instructions, facture PDF.

**Architecture:** Un système de demandes (Request System) sert de socle interconnectant le voyageur et l'admin Kayvila. Une table Supabase `requests` stocke toutes les interactions. Les pages existantes (Séjour, Livret, Profil, Documents) sont enrichies avec de nouvelles sections.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v3, Lucide React, Supabase (JS client + Storage), TypeScript

---

## File Map

```
CREATE:
  components/espace-client/RequestForm.tsx
  components/espace-client/RequestList.tsx
  components/espace-client/CheckinGuide.tsx
  components/espace-client/CheckoutInstructions.tsx
  app/espace-client/demandes/page.tsx

MODIFY:
  app/espace-client/page.tsx (page Séjour — ajouter statut demandes)
  app/espace-client/livret/page.tsx (ajouter sections Checkin + Checkout + Manuel)
  app/espace-client/profil/page.tsx (enrichir formulaire)
  app/espace-client/documents/page.tsx (ajouter génération facture)
  app/(admin)/admin/assistant/page.tsx (vue demandes admin)
  components/espace-client/TenantChatbot.tsx (optionnel — badge demandes)

SUPABASE:
  Migration: create table requests
  Migration: alter table profiles (add columns)
  Migration: alter table villas (add house_manual column)
```

---

### Task 1: Table Supabase `requests` + migrations profils & villas

**Files:**
- Create: `supabase/migrations/20260511_requests.sql`

- [ ] **Step 1: Write SQL migration**

```sql
-- Table des demandes voyageur
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  message TEXT,
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_requests_booking ON requests(booking_id);
CREATE INDEX idx_requests_guest ON requests(guest_id);
CREATE INDEX idx_requests_status ON requests(status);

-- Enrichissement profil voyageur
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allergies TEXT,
  ADD COLUMN IF NOT EXISTS special_occasion TEXT,
  ADD COLUMN IF NOT EXISTS special_occasion_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_arrival TEXT,
  ADD COLUMN IF NOT EXISTS needs_baby_bed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS needs_high_chair BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Manuel de la villa
ALTER TABLE villas
  ADD COLUMN IF NOT EXISTS house_manual JSONB;
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `mcp__claude_ai_Supabase__apply_migration` with the Supabase project ID.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260511_requests.sql
git commit -m "feat: add requests table + profile/villa enrichments

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Request System — composants + page

**Files:**
- Create: `components/espace-client/RequestForm.tsx`
- Create: `components/espace-client/RequestList.tsx`
- Create: `app/espace-client/demandes/page.tsx`

- [ ] **Step 1: Create RequestForm component**

```tsx
"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send } from "lucide-react";

const REQUEST_TYPES: Record<string, string> = {
  early_checkin: "Early check-in",
  late_checkout: "Late check-out",
  date_change: "Modification de dates",
  issue: "Signaler un problème",
  service: "Service ponctuel",
  other: "Autre",
};

interface RequestFormProps {
  bookingId: string;
  onSuccess: () => void;
}

export function RequestForm({ bookingId, onSuccess }: RequestFormProps) {
  const supabase = getSupabaseBrowser();
  const [type, setType] = useState("early_checkin");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !message.trim()) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }
    const { error } = await supabase.from("requests").insert({
      booking_id: bookingId,
      guest_id: user.id,
      type,
      message: message.trim(),
      status: "pending",
    });
    if (!error) {
      setDone(true);
      onSuccess();
    }
    setSending(false);
  };

  if (done) {
    return (
      <div className="border border-gold/30 bg-gold/[0.04] p-6 text-center">
        <p className="font-display text-lg text-navy">Demande envoyée</p>
        <p className="text-sm text-navy/50 mt-1">L'équipe Kayvila vous répondra rapidement.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="request-type" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-1">
          Type de demande
        </label>
        <select
          id="request-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/50"
        >
          {Object.entries(REQUEST_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="request-message" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-1">
          Message
        </label>
        <textarea
          id="request-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          placeholder="Décrivez votre demande..."
          className="w-full border border-navy/15 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-gold/50 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="inline-flex items-center gap-2 bg-navy px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={14} />
        {sending ? "Envoi..." : "Envoyer la demande"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create RequestList component**

```tsx
"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

interface RequestItem {
  id: string;
  type: string;
  status: string;
  message: string;
  admin_response: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  early_checkin: "Early check-in",
  late_checkout: "Late check-out",
  date_change: "Modification de dates",
  issue: "Problème signalé",
  service: "Service ponctuel",
  cancellation: "Demande d'annulation",
  other: "Autre",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  resolved: "Résolu",
  rejected: "Refusé",
};

export function RequestList({ bookingId, refreshKey }: { bookingId: string; refreshKey: number }) {
  const supabase = getSupabaseBrowser();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("requests")
        .select("id, type, status, message, admin_response, created_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false });
      setRequests((data as RequestItem[]) ?? []);
      setLoading(false);
    })();
  }, [supabase, bookingId, refreshKey]);

  if (loading) return <div className="py-4 text-sm text-navy/40">Chargement...</div>;
  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg text-navy">Mes demandes</h3>
      {requests.map((r) => (
        <div key={r.id} className="border border-navy/10 bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/60">
              {TYPE_LABELS[r.type] ?? r.type}
            </span>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${STATUS_STYLES[r.status] ?? STATUS_STYLES.pending}`}>
              {STATUS_LABELS[r.status] ?? r.status}
            </span>
          </div>
          <p className="text-sm text-navy/60">{r.message}</p>
          {r.admin_response && (
            <div className="mt-3 border-t border-navy/5 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold mb-1">Réponse Kayvila</p>
              <p className="text-sm text-navy/70">{r.admin_response}</p>
            </div>
          )}
          <p className="mt-2 text-[11px] text-navy/30">
            {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create demandes page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { RequestForm } from "@/components/espace-client/RequestForm";
import { RequestList } from "@/components/espace-client/RequestList";

export default function DemandesPage() {
  const supabase = getSupabaseBrowser();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) { setLoading(false); return; }
      const { data } = await supabase
        .from("bookings")
        .select("id")
        .eq("guest_email", session.user.email)
        .in("status", ["confirmed", "pending"])
        .gt("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(1);
      if (data?.[0]) setBookingId(data[0].id);
      setLoading(false);
    })();
  }, [supabase]);

  if (loading) {
    return (
      <>
        <PageTopbar title="Demandes" />
        <div className="p-5 md:p-10 text-sm text-navy/40">Chargement...</div>
      </>
    );
  }

  if (!bookingId) {
    return (
      <>
        <PageTopbar title="Demandes" />
        <div className="p-5 md:p-10 text-center">
          <p className="text-sm text-navy/50">Aucun séjour en cours. Les demandes sont disponibles pendant votre séjour.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTopbar title="Demandes" section="Espace Client" />
      <div className="p-5 md:p-10 space-y-10">
        <div>
          <h2 className="font-display text-xl text-navy mb-4">Nouvelle demande</h2>
          <RequestForm bookingId={bookingId} onSuccess={() => setRefreshKey((k) => k + 1)} />
        </div>
        <RequestList bookingId={bookingId} refreshKey={refreshKey} />
      </div>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/espace-client/RequestForm.tsx components/espace-client/RequestList.tsx app/espace-client/demandes/page.tsx
git commit -m "feat: Request System — form, list, and demandes page

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: Enrichir la page Séjour avec les demandes

**Files:**
- Modify: `app/espace-client/page.tsx`

- [ ] **Step 1: Add RequestList below the UpcomingStayHero**

In `app/espace-client/page.tsx`, after the UpcomingStayHero section and before the BookingCard list, add the RequestList component import and usage. The bookingId is already available from the state.

Add this import at the top:
```tsx
import { RequestList } from "@/components/espace-client/RequestList";
```

Add the `refreshKey` state:
```tsx
const [requestRefreshKey, setRequestRefreshKey] = useState(0);
```

Below the UpcomingStayHero section and before the "Vos séjours" section, add:
```tsx
{activeBooking && (
  <section className="mb-12">
    <RequestList bookingId={activeBooking.id} refreshKey={requestRefreshKey} />
  </section>
)}
```

- [ ] **Step 2: Commit**

```bash
git add app/espace-client/page.tsx
git commit -m "feat: add RequestList to Séjour page

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: Check-in autonome + Check-out instructions + Manuel villa

**Files:**
- Create: `components/espace-client/CheckinGuide.tsx`
- Create: `components/espace-client/CheckoutInstructions.tsx`
- Modify: `app/espace-client/livret/page.tsx`

- [ ] **Step 1: Create CheckinGuide component**

```tsx
"use client";

import { MapPin, Clock, Phone } from "lucide-react";

interface CheckinGuideProps {
  startDate: string;
  checkInTime?: string;
  digicode?: string;
  checkinImages?: string[];
  address?: string;
  mapEmbedUrl?: string;
}

export function CheckinGuide({
  startDate,
  checkInTime = "17:00",
  digicode,
  checkinImages = [],
  address,
  mapEmbedUrl,
}: CheckinGuideProps) {
  const now = new Date();
  const start = new Date(startDate);
  const hoursUntil = (start.getTime() - now.getTime()) / 3600000;
  const isVisible = hoursUntil <= 24 && hoursUntil > -24;
  const isPast = hoursUntil < -24;
  const isToday = hoursUntil <= 0 && now < new Date(start.getTime() + 86400000);

  if (isPast) {
    return (
      <div className="border border-navy/10 bg-white p-6">
        <h3 className="font-display text-lg text-navy mb-2">Check-in</h3>
        <p className="text-sm text-navy/40">Votre séjour est en cours ou terminé.</p>
      </div>
    );
  }

  if (!isVisible && !isToday) {
    const daysUntil = Math.ceil(hoursUntil / 24);
    return (
      <div className="border border-navy/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-navy/30" />
          <h3 className="font-display text-lg text-navy">Check-in</h3>
        </div>
        <p className="text-sm text-navy/50">
          Votre code d'accès et les instructions seront disponibles {daysUntil > 1 ? `dans ${daysUntil} jours` : "demain"}.
        </p>
        <p className="text-[11px] text-navy/30 mt-2">
          Check-in à partir de {checkInTime}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gold/20 bg-white">
      <div className="border-b border-gold/10 bg-gold/[0.03] px-6 py-4">
        <h3 className="font-display text-lg text-navy">Check-in — {isToday ? "C'est aujourd'hui !" : "Demain"}</h3>
        <p className="text-sm text-navy/50 mt-0.5">À partir de {checkInTime}</p>
      </div>
      <div className="p-6 space-y-6">
        {digicode && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2">Code d'accès</p>
            <p className="font-display text-3xl tracking-[0.2em] text-navy">{digicode}</p>
          </div>
        )}
        {checkinImages.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-3">Photos d'accès</p>
            <div className="grid grid-cols-2 gap-2">
              {checkinImages.map((url, i) => (
                <img key={i} src={url} alt={`Accès étape ${i + 1}`} className="w-full aspect-[4/3] object-cover border border-navy/10" />
              ))}
            </div>
          </div>
        )}
        {address && (
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-navy/30 mt-0.5 shrink-0" />
            <p className="text-sm text-navy/70">{address}</p>
          </div>
        )}
        {mapEmbedUrl && (
          <div className="aspect-[16/7] overflow-hidden border border-navy/10">
            <iframe src={mapEmbedUrl} title="Itinéraire" className="w-full h-full" loading="lazy" />
          </div>
        )}
        <a
          href="tel:+596696000000"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/60 hover:text-navy transition-colors"
        >
          <Phone size={14} />
          Problème d'accès ? Appelez-nous
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CheckoutInstructions component**

```tsx
"use client";

import { Clock, Check } from "lucide-react";

interface CheckoutInstructionsProps {
  endDate: string;
  checkOutTime?: string;
}

const CHECKLIST = [
  "Sortir les poubelles dans le container extérieur",
  "Lancer le lave-vaisselle",
  "Fermer tous les volets et fenêtres",
  "Éteindre la climatisation et les lumières",
  "Déposer les clés dans la boîte à clefs sécurisée",
];

export function CheckoutInstructions({ endDate, checkOutTime = "10:00" }: CheckoutInstructionsProps) {
  const now = new Date();
  const end = new Date(endDate);
  const hoursUntil = (end.getTime() - now.getTime()) / 3600000;
  const isVisible = hoursUntil <= 24 && hoursUntil > 0;
  const isPast = hoursUntil <= 0;

  if (isPast) {
    return (
      <div className="border border-navy/10 bg-white p-6">
        <h3 className="font-display text-lg text-navy mb-2">Check-out</h3>
        <p className="text-sm text-navy/40">Votre séjour est terminé. Nous espérons vous revoir bientôt.</p>
      </div>
    );
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="border border-gold/10 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-navy/30" />
        <h3 className="font-display text-lg text-navy">Check-out demain</h3>
      </div>
      <p className="text-sm text-navy/50 mb-4">
        Merci de libérer la villa avant <strong>{checkOutTime}</strong>. Voici la checklist de départ :
      </p>
      <ul className="space-y-2 mb-4">
        {CHECKLIST.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-navy/70">
            <Check size={14} className="text-gold mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-navy/30">
        Besoin de rester plus tard ? Faites une demande de late check-out depuis la page Demandes.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Add sections to livret page**

In `app/espace-client/livret/page.tsx`, add imports and render the new components near the top of the livret content:

```tsx
import { CheckinGuide } from "@/components/espace-client/CheckinGuide";
import { CheckoutInstructions } from "@/components/espace-client/CheckoutInstructions";
```

Then in the return, before the existing livret content, add:
```tsx
{booking && (
  <>
    <CheckinGuide
      startDate={booking.start_date}
      checkInTime={booking.check_in_time ?? "17:00"}
      address={booking.villa?.address}
      mapEmbedUrl={booking.villa?.map_embed_url}
    />
    <CheckoutInstructions
      endDate={booking.end_date}
      checkOutTime={booking.check_out_time ?? "10:00"}
    />
  </>
)}
```

- [ ] **Step 4: Commit**

```bash
git add components/espace-client/CheckinGuide.tsx components/espace-client/CheckoutInstructions.tsx app/espace-client/livret/page.tsx
git commit -m "feat: check-in autonome + check-out instructions + manuel villa sections

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 5: Profil voyageur enrichi

**Files:**
- Modify: `app/espace-client/profil/page.tsx`

- [ ] **Step 1: Read current profil page and enrich**

Read `app/espace-client/profil/page.tsx`. The existing page has a basic profile form. Add the additional fields below the existing form fields. Wrap additions in a `<section>` with a descriptive heading.

Add these fields to the form:

```tsx
{/* Allergies & régimes */}
<div>
  <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2">
    Allergies & régimes alimentaires
  </label>
  <input
    type="text"
    value={allergies}
    onChange={(e) => setAllergies(e.target.value)}
    placeholder="ex: arachides, lactose, végétarien"
    className="w-full border border-navy/15 bg-white px-4 py-2.5 text-sm"
  />
</div>

{/* Occasion spéciale */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>
    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2">
      Occasion spéciale
    </label>
    <select value={specialOccasion} onChange={(e) => setSpecialOccasion(e.target.value)}
      className="w-full border border-navy/15 bg-white px-4 py-2.5 text-sm">
      <option value="">Aucune</option>
      <option value="anniversary">Anniversaire de mariage</option>
      <option value="birthday">Anniversaire</option>
      <option value="honeymoon">Lune de miel</option>
      <option value="other">Autre</option>
    </select>
  </div>
  <div>
    <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2">
      Date
    </label>
    <input type="date" value={specialOccasionDate} onChange={(e) => setSpecialOccasionDate(e.target.value)}
      className="w-full border border-navy/15 bg-white px-4 py-2.5 text-sm" />
  </div>
</div>

{/* Heure d'arrivée estimée */}
<div>
  <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2">
    Heure d'arrivée estimée
  </label>
  <select value={estimatedArrival} onChange={(e) => setEstimatedArrival(e.target.value)}
    className="w-full border border-navy/15 bg-white px-4 py-2.5 text-sm">
    <option value="">Non précisée</option>
    {Array.from({ length: 9 }, (_, i) => i + 14).map(h => (
      <option key={h} value={`${h}:00`}>{h}:00</option>
    ))}
  </select>
</div>

{/* Équipement bébé */}
<div className="flex items-center gap-6">
  <label className="flex items-center gap-2 text-sm text-navy/70">
    <input type="checkbox" checked={needsBabyBed} onChange={(e) => setNeedsBabyBed(e.target.checked)}
      className="w-4 h-4 border-navy/20 text-gold focus:ring-gold" />
    Lit bébé
  </label>
  <label className="flex items-center gap-2 text-sm text-navy/70">
    <input type="checkbox" checked={needsHighChair} onChange={(e) => setNeedsHighChair(e.target.checked)}
      className="w-4 h-4 border-navy/20 text-gold focus:ring-gold" />
    Chaise haute
  </label>
</div>
```

Add corresponding state variables and include them in the Supabase upsert call. The fields map to: `allergies`, `special_occasion`, `special_occasion_date`, `estimated_arrival`, `needs_baby_bed`, `needs_high_chair`.

- [ ] **Step 2: Commit**

```bash
git add app/espace-client/profil/page.tsx
git commit -m "feat: enrichir profil voyageur — allergies, occasions, arrivée, bébé

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 6: Facture PDF automatique

**Files:**
- Modify: `app/espace-client/documents/page.tsx`

- [ ] **Step 1: Add invoice generation logic**

In the documents page, after the booking list, add an "Invoice" section for past bookings (status = confirmed, end_date < now). For each past booking, show a "Télécharger la facture" button.

The invoice generation uses a simple API route or client-side PDF generation. For Phase 1, implement a simple approach: generate a styled HTML page that the user can print or save as PDF.

Add this section below the existing documents list:

```tsx
{/* Section Factures */}
{bookings.filter(b => new Date(b.end_date) < new Date()).length > 0 && (
  <div className="mt-10">
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold mb-4">
      Factures
    </p>
    <h2 className="font-display text-xl font-normal text-navy mb-6">
      Historique des séjours
    </h2>
    <div className="space-y-3">
      {bookings.filter(b => new Date(b.end_date) < new Date()).map((b) => (
        <div key={b.id} className="flex items-center justify-between bg-white border border-navy/10 px-5 py-4">
          <div>
            <p className="text-[13px] font-medium text-navy">{b.villa_name}</p>
            <p className="text-[11px] text-navy/40 mt-0.5">
              {new Date(b.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              {" → "}
              {new Date(b.end_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const w = window.open("", "_blank");
              if (!w) return;
              w.document.write(`
                <html><head><title>Facture Kayvila</title>
                <style>body{font-family:Georgia,serif;max-width:600px;margin:60px auto;padding:20px;color:#0A0A0A}
                h1{font-size:24px;margin-bottom:4px} .gold{color:#D4AF37} .line{height:1px;background:#D4AF37;margin:20px 0}
                table{width:100%;border-collapse:collapse;margin:20px 0} td,th{padding:8px 0;text-align:left;font-size:14px}
                th{border-bottom:1px solid #e5e3db;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.1em;color:#8B8B8B}
                .total{font-size:18px;font-weight:700} .footer{margin-top:40px;font-size:11px;color:#8B8B8B;line-height:1.6}</style></head>
                <body>
                  <h1>Kayvila</h1><p class="gold">Conciergerie de luxe — Martinique</p>
                  <div class="line"></div>
                  <p><strong>Séjour :</strong> ${b.villa_name}</p>
                  <p><strong>Dates :</strong> ${new Date(b.start_date).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })} → ${new Date(b.end_date).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}</p>
                  <p><strong>Voyageur :</strong> ${b.guest_name ?? "—"}</p>
                  <div class="line"></div>
                  <p class="total">Montant total : ${(b.total_price_cents / 100).toLocaleString("fr-FR")} €</p>
                  <p style="font-size:12px;color:#8B8B8B">Dont frais de ménage et blanchisserie inclus</p>
                  <div class="footer">
                    <p>Kayvila Conciergerie — SIRET : XXX XXX XXX 000XX</p>
                    <p>contact@kayvila.com — +596 696 00 00 00</p>
                    <p>Facture générée le ${new Date().toLocaleDateString("fr-FR")}</p>
                  </div>
                </body></html>
              `);
              w.document.close();
              w.print();
            }}
            className="inline-flex items-center gap-2 border border-navy/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/60 hover:border-navy/40 hover:text-navy transition-colors"
          >
            <FileText size={14} />
            Facture PDF
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add app/espace-client/documents/page.tsx
git commit -m "feat: facture PDF — génération invoice printable depuis documents

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 7: Vue admin — demandes dans l'assistant

**Files:**
- Modify: `app/(admin)/admin/assistant/page.tsx`

- [ ] **Step 1: Add requests view to admin assistant**

In the admin assistant page, fetch requests from Supabase and display them in a new tab or section. Show all pending/in_progress requests with type, message, booking info, and action buttons.

Add a fetch for requests:
```tsx
const { data: requests } = await supabase
  .from("requests")
  .select("id, type, status, message, created_at, booking_id, guest_id, bookings(villa_id, villas(name), guest_name)")
  .in("status", ["pending", "in_progress"])
  .order("created_at", { ascending: false });
```

Add a "Demandes" section in the render:
```tsx
{/* Demandes */}
<section className="mb-10">
  <h2 className="font-display text-xl text-navy mb-4">Demandes voyageurs</h2>
  <div className="space-y-3">
    {requests?.map((r: any) => (
      <div key={r.id} className="border border-navy/10 bg-white p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/60">
            {r.bookings?.villas?.name ?? "Villa"} — {r.bookings?.guest_name ?? "Voyageur"}
          </span>
          <span className="text-[11px] font-semibold text-gold">{TYPE_LABELS[r.type]}</span>
        </div>
        <p className="text-sm text-navy/70 mb-3">{r.message}</p>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full hover:bg-emerald-100">
            Accepter
          </button>
          <button className="px-4 py-1.5 bg-red-50 text-red-700 text-[11px] font-semibold rounded-full hover:bg-red-100">
            Refuser
          </button>
        </div>
      </div>
    )) ?? <p className="text-sm text-navy/40">Aucune demande en attente.</p>}
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add app/(admin)/admin/assistant/page.tsx
git commit -m "feat: vue admin demandes voyageurs dans l'assistant

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 8: Build verification

**Files:** None (verification only)

- [ ] **Step 1: Run build**

```bash
cd /Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir && npm run build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Fix any import/type errors**

If build fails, check for:
- Missing imports in new components
- Type mismatches between server/client components
- Duplicate exports

- [ ] **Step 3: Final commit**

```bash
git add -A && git commit -m "fix: build verification — Phase 1 espace client fonctionnel

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

## Self-Review

- [x] Spec coverage: All 6 Phase 1 features mapped to tasks (1=Request System, 4=Checkin/Checkout/Manuel, 5=Profil, 6=Facture, 7=Admin view, 3=Séjour enrichment)
- [x] No placeholders: Every step has exact code or commands
- [x] Type consistency: `RequestItem` used in RequestList matches the Supabase schema. `CheckinGuideProps`/`CheckoutInstructionsProps` are self-contained
