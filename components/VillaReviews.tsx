import Link from "next/link";
import { Quote } from "lucide-react";

type VillaReviewsProps = {
  villaId: string;
  villaName: string;
};

export function VillaReviews({ villaId, villaName }: VillaReviewsProps) {
  return (
    <section className="pt-10 border-t border-navy/10">
      <h2 className="font-display font-normal text-2xl text-navy mb-8">Avis des voyageurs</h2>
      <div className="border border-navy/8 bg-offwhite p-8 md:p-12">
        <div className="max-w-2xl mx-auto text-center">
          <Quote size={28} className="mx-auto text-gold/40 mb-4" />
          <blockquote>
            <p className="font-display text-xl md:text-2xl text-navy leading-[1.4] italic">
              «&nbsp;Ce qui rend un séjour inoubliable, ce n&apos;est pas seulement la villa — c&apos;est la manière dont on prend soin de vous.&nbsp;»
            </p>
          </blockquote>
          <p className="mt-6 text-sm text-navy/40">
            Rejoignez les voyageurs qui nous confient leur séjour en Martinique.
          </p>
          <Link
            href="/contact"
            className="inline-block mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-navy/60 hover:text-navy transition-colors border border-navy/15 px-6 py-3"
          >
            Vivre l&apos;expérience Kayvila
          </Link>
        </div>
      </div>
    </section>
  );
}
