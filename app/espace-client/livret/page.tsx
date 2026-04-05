"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
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

const SECTION_ICONS: Record<SectionId, React.ReactNode> = {
  wifi: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M1 6c1.9-2 4.5-3 7-3s5.1 1 7 3M4 9.5c1.1-1.1 2.4-1.7 4-1.7s2.9.6 4 1.7M8 13h.01" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
  checkinout: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1" />
      <path d="M2 7h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  contacts: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 3h3l1.5 3-2 1.5c.8 1.6 2 2.8 3.5 3.5L10.5 9l3 1.5V14c-5.5.5-11-5-10.5-11z" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  proximite: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 1L1 3v12l5-2 4 2 5-2V1l-5 2-4-2z" stroke="currentColor" strokeWidth="1" />
      <path d="M6 1v12M10 3v12" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  urgences: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1" />
      <path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
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

// ── Empty section ─────────────────────────────────────────────────────────────

function EmptySection() {
  return (
    <p className="font-cormorant italic text-[15px] font-light text-[rgba(13,27,42,0.3)]">
      Cette section sera complétée avant votre arrivée par l&apos;équipe Diamant Noir.
    </p>
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
      if (!villa.wifi_name && !villa.wifi_password) return <EmptySection />;
      return (
        <div className="space-y-5">
          {villa.wifi_name && (
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.32)] mb-1">Réseau</p>
              <p className="font-cormorant text-[17px] text-[#0D1B2A]">{villa.wifi_name}</p>
            </div>
          )}
          {villa.wifi_password && (
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.32)] mb-2">Mot de passe</p>
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
                  className="shrink-0 text-[10px] tracking-[0.18em] uppercase border border-[rgba(13,27,42,0.12)] px-3 py-2 text-[rgba(13,27,42,0.5)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
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
      return (
        <div className="space-y-5">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.32)] mb-1">Check-in</p>
            <p className="font-cormorant text-[16px] text-[#0D1B2A]">À partir de 16h00</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.32)] mb-1">Check-out</p>
            <p className="font-cormorant text-[16px] text-[#0D1B2A]">Avant 11h00</p>
          </div>
          {villa.checkout_instructions && (
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[rgba(13,27,42,0.32)] mb-2">Instructions</p>
              <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.6)] whitespace-pre-line leading-relaxed">
                {villa.checkout_instructions}
              </p>
            </div>
          )}
          {villa.location && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(villa.name + " " + villa.location + " Martinique")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-[#D4AF37] hover:opacity-80 transition-opacity"
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
        <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.6)] whitespace-pre-line leading-relaxed">
          {villa.emergency_contacts}
        </p>
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
            { name: "Urgences Europe", number: "112", desc: "Numéro universel" },
          ].map(({ name, number, desc }) => (
            <div key={name} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.35)]">{desc}</p>
                <p className="font-cormorant text-[17px] text-[#0D1B2A] font-light">{name}</p>
              </div>
              <a
                href={`tel:${number}`}
                className="font-display text-[20px] font-normal text-[#D4AF37] hover:opacity-80 transition-opacity"
                style={{ textDecoration: "none" }}
                aria-label={`Appeler ${name} au ${number}`}
              >
                {number}
              </a>
            </div>
          ))}
          {villa.emergency_contacts && (
            <div className="pt-4 border-t border-[rgba(13,27,42,0.07)]">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[rgba(13,27,42,0.35)] mb-2">Contact villa</p>
              <p className="font-cormorant text-[15px] font-light text-[rgba(13,27,42,0.6)] whitespace-pre-line">
                {villa.emergency_contacts}
              </p>
            </div>
          )}
        </div>
      );
  }
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

      const { data: bookingsRaw } = await supabase
        .from("bookings")
        .select("id, start_date, end_date, villa_id, status")
        .eq("guest_email", session.user.email)
        .in("status", ["confirmed", "upcoming"])
        .gt("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(1);

      const bookings = bookingsRaw as Array<{ id: string; start_date: string; end_date: string; villa_id: string; status: string }> | null;
      const bk = bookings?.[0];
      if (!bk) { setLoading(false); return; }

      const { data: villaRaw } = await supabase
        .from("villas")
        .select("id, name, location, wifi_name, wifi_password, checkout_instructions, local_recommendations, emergency_contacts")
        .eq("id", bk.villa_id)
        .single();

      setBooking({ id: bk.id, start_date: bk.start_date, end_date: bk.end_date, villa: (villaRaw as VillaData | null) ?? null });
      setLoading(false);
    })();
  }, [supabase]);

  const villa = booking?.villa ?? null;
  const isEmptyBook =
    !villa ||
    (!villa.wifi_name && !villa.wifi_password && !villa.checkout_instructions &&
     !villa.local_recommendations && !villa.emergency_contacts);

  const handlePrint = () => {
    window.open("/espace-client/livret/print", "_blank");
  };

  if (loading) {
    return (
      <>
        <PageTopbar title="Livret d'accueil" />
        <div className="max-w-4xl mx-auto px-6 py-8"><LivretSkeleton /></div>
      </>
    );
  }

  return (
    <>
      <PageTopbar title="Livret d'accueil" />
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.26em] uppercase text-[#D4AF37] mb-2">Votre villa</p>
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
            className="hidden sm:flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase border border-[rgba(13,27,42,0.12)] px-4 py-2.5 text-[rgba(13,27,42,0.45)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors shrink-0"
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
            {/* ── Index desktop ── */}
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
                    <span className="text-[10px] tracking-[0.16em] uppercase flex-1">{label}</span>
                    <svg
                      width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden
                      className={active ? "text-[#D4AF37]" : "text-[rgba(13,27,42,0.15)]"}
                    >
                      <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </button>
                );
              })}
            </nav>

            {/* ── Mobile section selector ── */}
            <div className="md:hidden w-full mb-6">
              <div className="flex flex-wrap gap-2">
                {SECTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSection(id)}
                    className={[
                      "text-[10px] tracking-[0.16em] uppercase px-3 py-2 border transition-colors",
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

            {/* ── Content area ── */}
            <div className="flex-1 min-w-0 md:border-l md:border-[rgba(13,27,42,0.07)] md:pl-8">
              <p className="text-[10px] tracking-[0.26em] uppercase text-[#D4AF37] mb-3">
                {SECTIONS.find((s) => s.id === activeSection)?.label}
              </p>
              <SectionContent id={activeSection} villa={villa!} />

              {/* PDF button mobile */}
              <div className="mt-8 sm:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="text-[10px] tracking-[0.18em] uppercase border border-[rgba(13,27,42,0.12)] px-4 py-2.5 text-[rgba(13,27,42,0.45)] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
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
