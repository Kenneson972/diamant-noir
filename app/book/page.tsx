import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock, Star, MessageCircle, CheckCircle2 } from "lucide-react";
import { SearchResults } from "@/components/booking/SearchResults";
import { CheckoutView } from "@/components/booking/CheckoutView";
import { BookingSearchBar } from "@/components/booking/BookingSearchBar";
import { getSupabaseServer } from "@/lib/supabase-server";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

type VillaBooking = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  price: number;
  guests: number;
  rooms: number;
  rating: number;
  image: string | null;
};

const fallbackVillas: VillaBooking[] = [
  {
    id: "1",
    name: "Villa Diamant Noir",
    location: "Martinique",
    description:
      "Nichée sur les hauteurs, Diamant Noir offre un mélange inégalé de calme et de beauté tropicale.",
    price: 1000,
    guests: 8,
    rooms: 4,
    rating: 4.98,
    image: "/villa-hero.jpg",
  },
];

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  noStore();

  const sp = await searchParams;
  const villaId = sp.villaId as string;
  const checkin = sp.checkin as string | undefined;
  const checkout = sp.checkout as string | undefined;
  const guestsParam = parseInt((sp.guests as string) || "1", 10);

  if (villaId && checkin && checkout) {
    return (
      <main className="min-h-screen bg-offwhite pt-20">
        <CheckoutView
          villaId={villaId}
          checkin={checkin}
          checkout={checkout}
          guestsCount={guestsParam}
        />
      </main>
    );
  }

  let villas: VillaBooking[] = fallbackVillas;

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("villas")
      .select("id,name,location,description,price_per_night,capacity,image_url,image_urls,is_published")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      villas = data.map((villa, index) => ({
        id: villa.id,
        name: villa.name,
        location: villa.location,
        description: villa.description,
        price: villa.price_per_night,
        guests: villa.capacity,
        rooms: Math.max(2, Math.round(villa.capacity / 2)),
        rating: 4.9 + index * 0.02,
        image: villa.image_url || villa.image_urls?.[0] || "/villa-hero.jpg",
      }));
    }
  } catch (error) {
    console.error("Supabase fetch error (book):", error);
  }

  return (
    <main className="min-h-screen bg-offwhite">
      {/* ── Hero ── */}
      <section className="relative min-h-[60vh] w-full overflow-hidden bg-black md:min-h-[74vh]">
        <div
          className="absolute inset-0 bg-[url('/villa-hero.jpg')] bg-cover bg-center opacity-40"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-offwhite" />

        <div className="page-px relative z-10 flex min-h-[60vh] flex-col justify-end pb-12 pt-24 md:min-h-[74vh] md:pb-20 md:pt-32">
          <div className="mx-auto w-full max-w-3xl space-y-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.38em] text-white/50">
              Réservation · Collection privée
            </p>
            <h1 className="font-display text-3xl leading-[1.08] text-white sm:text-4xl md:text-6xl lg:text-7xl">
              Réserver votre séjour
            </h1>
            <p className="mx-auto max-w-lg text-sm font-light tracking-[0.1em] text-white/60">
              Choisissez vos dates, sélectionnez votre villa — notre conciergerie prend soin
              du reste.
            </p>
          </div>

          <div className="mx-auto mt-10 w-full max-w-4xl">
            <BookingSearchBar
              initialCheckin={checkin}
              initialCheckout={checkout}
              initialGuests={guestsParam}
            />
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="border-y border-black/[0.07] bg-white py-8">
        <div className="page-px mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {[
              {
                icon: <CheckCircle2 size={18} strokeWidth={1.25} className="text-navy/50" />,
                title: "Annulation flexible",
                desc: "Remboursement intégral jusqu'à 7 jours avant",
              },
              {
                icon: <Star size={18} strokeWidth={0} className="fill-navy text-navy opacity-50" />,
                title: "Collection certifiée",
                desc: "Chaque villa est inspectée et validée",
              },
              {
                icon: <Clock size={18} strokeWidth={1.25} className="text-navy/50" />,
                title: "Conciergerie 24/7",
                desc: "Votre équipe dédiée, avant et pendant le séjour",
              },
              {
                icon: <ShieldCheck size={18} strokeWidth={1.25} className="text-navy/50" />,
                title: "Paiement sécurisé",
                desc: "Transactions cryptées, jamais de surprises",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-navy">
                    {title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-navy/45">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Catalogue ── */}
      <section
        id="catalogue"
        className="page-px relative z-10 mx-auto max-w-7xl scroll-mt-24 pb-16 pt-12 md:pb-20 md:pt-16"
      >
        <div className="mb-10 md:mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-navy/45">
            Catalogue
          </p>
          <h2 className="mt-2 font-display text-3xl text-navy md:text-4xl">
            Villas disponibles
          </h2>
          <span className="mt-4 block h-px w-14 bg-black/15" />
        </div>

        <SearchResults
          initialVillas={villas}
          checkin={checkin}
          checkout={checkout}
          guests={guestsParam > 1 ? guestsParam : undefined}
        />
      </section>

      {/* ── Comment réserver ── */}
      <section className="border-t border-black/8 bg-white py-16 md:py-24">
        <div className="page-px mx-auto max-w-5xl">
          <div className="mb-12 text-center md:mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-navy/40">
              Processus
            </p>
            <h2 className="mt-3 font-display text-3xl text-navy md:text-4xl">
              Comment réserver
            </h2>
            <span className="mx-auto mt-4 block h-px w-14 bg-black/15" />
          </div>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {[
              {
                step: "01",
                title: "Choisissez votre villa",
                desc:
                  "Parcourez notre catalogue de résidences d'exception. Filtrez par capacité et consultez chaque fiche en détail.",
              },
              {
                step: "02",
                title: "Sélectionnez vos dates",
                desc:
                  "Consultez la disponibilité en temps réel et indiquez vos dates d'arrivée et de départ.",
              },
              {
                step: "03",
                title: "Confirmation & conciergerie",
                desc:
                  "Votre réservation est confirmée instantanément. Notre équipe vous contacte sous 24 h pour préparer votre séjour.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-5">
                <span className="font-display text-5xl text-black/[0.06] md:text-6xl">{step}</span>
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-navy">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-navy/55">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Conciergerie CTA ── */}
      <section className="page-px border-t border-black/8 bg-offwhite py-16 md:py-24">
        <div className="mx-auto max-w-2xl space-y-8 text-center">
          <MessageCircle
            className="mx-auto text-navy/25"
            size={28}
            strokeWidth={1}
            aria-hidden
          />
          <h2 className="font-display text-3xl leading-tight text-navy md:text-4xl">
            Un accompagnement sur mesure
          </h2>
          <p className="text-base font-light leading-relaxed text-navy/55">
            Notre conciergerie vous aide à composer votre séjour idéal : transferts aéroport,
            chef privé, excursions, équipe sur place 24/7.
          </p>
          <div className="flex flex-col xs:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/contact"
              className="inline-flex w-full xs:w-auto min-h-11 items-center justify-center gap-2 border border-navy bg-navy px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            >
              Contacter la conciergerie
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
            </Link>
            <Link
              href="/prestations"
              className="inline-flex w-full xs:w-auto min-h-11 items-center justify-center gap-2 border border-navy/20 px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-navy transition-colors hover:border-navy hover:bg-black/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            >
              Voir nos prestations
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
