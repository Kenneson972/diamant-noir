import { CheckoutView } from "@/components/booking/CheckoutView";
import { BookLandingMarketing } from "@/components/book/BookLandingMarketing";
import type { CheckoutVilla } from "@/components/booking/checkout-types";
import { getSupabaseServer } from "@/lib/supabase-server";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réserver votre séjour",
  description: "Finalisez votre réservation villa Kayvila en Martinique — paiement sécurisé Stripe.",
};

const CHECKOUT_VILLA_SELECT =
  "id, name, location, image_url, image_urls, price_per_night, cleaning_fee_cents, min_nights, checkout_instructions, check_in_time, check_out_time, is_published";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  noStore();

  const sp = await searchParams;
  const villaId = typeof sp.villaId === "string" ? sp.villaId : "";
  const checkin = typeof sp.checkin === "string" ? sp.checkin : "";
  const checkout = typeof sp.checkout === "string" ? sp.checkout : "";
  const guestsParam = parseInt((typeof sp.guests === "string" ? sp.guests : "") || "1", 10);

  if (villaId && checkin && checkout) {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from("villas")
      .select(CHECKOUT_VILLA_SELECT)
      .eq("id", villaId)
      .maybeSingle();

    if (!data || data.is_published === false) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-offwhite px-6 pt-20">
          <p className="font-display text-2xl text-navy">Villa introuvable</p>
          <p className="text-sm text-navy/55">Cette propriété n&apos;est plus disponible à la réservation.</p>
          <Link
            href="/villas"
            className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold hover:text-navy"
          >
            Retour au catalogue
          </Link>
        </main>
      );
    }

    const villa = data as CheckoutVilla;

    return <CheckoutView villa={villa} checkin={checkin} checkout={checkout} guestsCount={guestsParam} />;
  }

  const catalogueHref =
    checkin && checkout
      ? `/villas?checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}&guests=${encodeURIComponent(String(guestsParam))}`
      : "/villas";

  const hasDateOnly = Boolean(checkin && checkout && !villaId);

  return (
    <main className="min-h-dvh bg-offwhite">
      <BookLandingMarketing
        catalogueHref={catalogueHref}
        hasDateOnly={hasDateOnly}
        checkin={checkin}
        checkout={checkout}
        guestsParam={guestsParam}
      />
    </main>
  );
}
