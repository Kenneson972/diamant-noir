import Link from "next/link";

const PROPS = [
  {
    label: "Des villas",
    word: "Exclusives",
    body: "Chaque propriété est sélectionnée pour son âme, sa situation et sa singularité en Martinique.",
    href: "/villas",
  },
  {
    label: "L'art du",
    word: "Sur-mesure",
    body: "Services quotidiens, activités, transferts — nous personnalisons chaque détail de votre séjour.",
    href: "/prestations",
  },
  {
    label: "Une équipe",
    word: "Locale",
    body: "Nos concierges sont présents 7j/7 en Martinique. Ils connaissent l'île sur le bout des doigts.",
    href: "/contact",
  },
];

export function HomeValueProps() {
  return (
    <section className="bg-[#F5F3F0] px-6 py-20 md:px-8 md:py-28 lg:px-12">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 text-center md:grid-cols-3 md:gap-12 lg:gap-16">
        {PROPS.map(({ label, word, body, href }) => (
          <Link
            key={word}
            href={href}
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.42em] text-navy/55">
              {label}
            </p>
            <p className="mt-2 font-display text-[3rem] font-bold uppercase leading-none tracking-[0.04em] text-navy transition-opacity group-hover:opacity-70 sm:text-[3.5rem] md:text-[4rem] lg:text-[4.5rem]">
              {word}
            </p>
            <p className="mx-auto mt-5 max-w-[260px] text-sm leading-relaxed text-navy/60">
              {body}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
