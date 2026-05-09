import Image from "next/image";

// 4 photos portrait décalées — expériences conciergerie Martinique
// Remplacer les src par de vraies photos lifestyle (catamaran, plages, etc.)
const IMAGES = [
  { src: "/villa-hero.jpg", alt: "Catamaran en mer des Caraïbes" },
  { src: "/villa-hero.jpg", alt: "Plage secrète en Martinique" },
  { src: "/villa-hero.jpg", alt: "Snorkeling fonds marins" },
  { src: "/villa-hero.jpg", alt: "Gastronomie et rhum martiniquais" },
];

export function HomeExperiencesGrid() {
  return (
    <section className="overflow-hidden bg-white pb-0 pt-16 md:pt-20">
      {/* En-tête */}
      <div className="mb-10 px-8 md:mb-12 md:px-14">
        <span className="text-[10px] font-bold uppercase tracking-[0.42em] text-navy/35">
          La conciergerie
        </span>
        <h2 className="mt-3 font-display text-4xl font-light italic text-navy md:text-5xl">
          autrement
        </h2>
      </div>

      {/* Grille 4 colonnes décalées */}
      <div className="flex items-start gap-2 px-8 md:gap-3 md:px-14">
        <div className="relative aspect-[2/3] w-1/4 shrink-0 overflow-hidden">
          <Image src={IMAGES[0].src} alt={IMAGES[0].alt} fill className="object-cover" sizes="25vw" loading="lazy" />
        </div>
        <div className="relative mt-16 aspect-[3/4] w-1/4 shrink-0 overflow-hidden md:mt-20">
          <Image src={IMAGES[1].src} alt={IMAGES[1].alt} fill className="object-cover" sizes="25vw" loading="lazy" />
        </div>
        <div className="relative mt-8 aspect-[2/3] w-1/4 shrink-0 overflow-hidden md:mt-10">
          <Image src={IMAGES[2].src} alt={IMAGES[2].alt} fill className="object-cover" sizes="25vw" loading="lazy" />
        </div>
        <div className="relative mt-12 aspect-[3/4] w-1/4 shrink-0 overflow-hidden md:mt-16">
          <Image src={IMAGES[3].src} alt={IMAGES[3].alt} fill className="object-cover" sizes="25vw" loading="lazy" />
        </div>
      </div>
    </section>
  );
}
