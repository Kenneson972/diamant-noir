import Link from "next/link";

const CATEGORIES = [
  {
    id: "lune-de-miel",
    label: "Lune de miel",
    subtitle: "Intimité & luxe à deux",
    href: "/villas",
    bg: "from-[#2c1810] via-[#3d2214] to-[#1a0e0a]",
  },
  {
    id: "en-famille",
    label: "En famille",
    subtitle: "4 chambres et plus",
    href: "/villas",
    bg: "from-[#0d2a1a] via-[#163820] to-[#0a1a10]",
  },
  {
    id: "vue-mer",
    label: "Vue mer",
    subtitle: "L'horizon pour décor",
    href: "/villas",
    bg: "from-[#0a1e30] via-[#12304a] to-[#071422]",
  },
  {
    id: "plage-privee",
    label: "Plage privée",
    subtitle: "Pieds dans l'eau",
    href: "/villas",
    bg: "from-[#1a1708] via-[#2e2c10] to-[#100f06]",
  },
];

export function HomeInspirations() {
  return (
    <section className="bg-offwhite px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-baseline justify-between border-b border-navy/8 pb-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-navy/40">
            Inspirations
          </span>
          <Link
            href="/villas"
            className="group flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-navy/50 transition-colors hover:text-navy"
          >
            Toutes les villas
            <span aria-hidden className="ml-0.5 transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              aria-label={`${cat.label} — ${cat.subtitle}`}
              className="group relative block aspect-[3/4] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 translate-y-1 p-4 transition-transform duration-300 group-hover:translate-y-0">
                <p className="font-display text-xl font-light leading-snug text-white">
                  {cat.label}
                </p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {cat.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
