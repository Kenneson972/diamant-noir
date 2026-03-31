import Link from "next/link";
import { Calendar, Users, Search, ArrowRight, MessageCircle } from "lucide-react";
import { SearchResults } from "@/components/booking/SearchResults";
import { CheckoutView } from "@/components/booking/CheckoutView";
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
  const checkin = sp.checkin as string;
  const checkout = sp.checkout as string;
  const guestsParam = parseInt((sp.guests as string) || "1", 10);

  if (villaId && checkin && checkout) {
    return (
      <main className="min-h-screen bg-offwhite pt-20">
        <CheckoutView villaId={villaId} checkin={checkin} checkout={checkout} guestsCount={guestsParam} />
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
      {/* Hero — même langage que l’accueil (noir, barre blanche, pas d’accent or dominant) */}
      <section className="relative min-h-[70vh] w-full overflow-hidden bg-black md:min-h-[78vh]">
        <div
          className="absolute inset-0 bg-[url('/villa-hero.jpg')] bg-cover bg-center opacity-40"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-offwhite" />

        <div className="page-px relative z-10 flex min-h-[70vh] flex-col justify-end pb-12 pt-24 md:min-h-[78vh] md:pb-20 md:pt-32">
          <div className="mx-auto w-full max-w-3xl space-y-5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/50">
              Réservation
            </p>
            <h1 className="font-display text-3xl leading-[1.08] text-white sm:text-4xl md:text-6xl lg:text-7xl">
              Réserver votre séjour
            </h1>
            <p className="mx-auto max-w-lg text-sm font-light tracking-[0.12em] text-white/65">
              Choisissez vos dates et la villa qui vous correspond — collection privée, conciergerie
              dédiée.
            </p>
          </div>

          <div className="mx-auto mt-10 w-full max-w-4xl animate-in fade-in duration-700">
            <div className="flex flex-col divide-y divide-black/10 border border-white/20 bg-white/[0.97] text-navy shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:flex-row sm:divide-x sm:divide-y-0">
              <Link
                href="#catalogue"
              className="group flex min-h-12 flex-1 items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.03] sm:min-h-0 sm:py-5"
              >
                <Calendar className="h-4 w-4 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy/40">Dates</p>
                  <p className="mt-1 text-sm font-medium text-navy">Ajouter des dates</p>
                </div>
              </Link>
              <Link
                href="#catalogue"
              className="group flex min-h-12 flex-1 items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.03] sm:min-h-0 sm:py-5"
              >
                <Users className="h-4 w-4 shrink-0 text-navy/35" strokeWidth={1.25} aria-hidden />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy/40">
                    Voyageurs
                  </p>
                  <p className="mt-1 text-sm text-navy/70">Nombre de personnes</p>
                </div>
              </Link>
              <Link
                href="#catalogue"
                className="flex min-h-[52px] items-center justify-center bg-navy px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-navy/90 sm:min-w-[10rem]"
              >
                <Search className="mr-2 h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
                Rechercher
                <ArrowRight className="ml-2 inline h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="catalogue" className="page-px relative z-10 mx-auto max-w-7xl scroll-mt-28 pb-16 pt-10 md:pb-20 md:pt-16">
        <div className="mb-10 md:mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-navy/45">
            Catalogue
          </p>
          <h2 className="mt-2 font-display text-3xl text-navy md:text-4xl">
            Villas disponibles
          </h2>
          <span className="mt-4 block h-px w-14 bg-black/15" />
        </div>
        <SearchResults initialVillas={villas} />
      </section>

      <section className="page-px border-t border-black/8 bg-white py-16 md:py-28">
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
            Notre conciergerie vous aide à composer votre séjour : transferts, expériences, équipe
            sur place.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center gap-2 border border-navy bg-navy px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            >
              Contacter la conciergerie
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
