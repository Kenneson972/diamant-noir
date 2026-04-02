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

      const bk = (bookings as Array<{
        id: string;
        start_date: string;
        end_date: string;
        checklist_state: ChecklistState | null;
        villa_id: string;
        status: string;
      }> | null)?.[0];

      if (!bk) { setLoading(false); return; }

      const { data: villaRaw } = await supabase
        .from("villas")
        .select("name, location")
        .eq("id", bk.villa_id)
        .single();

      const bkWithVilla: Booking = {
        id: bk.id,
        start_date: bk.start_date,
        end_date: bk.end_date,
        checklist_state: bk.checklist_state ?? null,
        villa: villaRaw as { name: string; location?: string } | null,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
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
