import { CheckoutView } from "@/components/booking/CheckoutView";
import { BookLandingMarketing } from "@/components/book/BookLandingMarketing";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

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
    return (
      <main className="min-h-screen bg-offwhite pt-20">
        <CheckoutView villaId={villaId} checkin={checkin} checkout={checkout} guestsCount={guestsParam} />
      </main>
    );
  }

  const catalogueHref =
    checkin && checkout
      ? `/villas?checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}&guests=${encodeURIComponent(String(guestsParam))}`
      : "/villas";

  const hasDateOnly = Boolean(checkin && checkout && !villaId);

  return (
    <main className="min-h-screen bg-offwhite">
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
