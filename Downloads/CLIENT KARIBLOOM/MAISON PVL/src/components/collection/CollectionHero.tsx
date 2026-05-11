interface CollectionHeroProps {
  title: string;
  kicker?: string;
  imageStyle?: React.CSSProperties;
}

export function CollectionHero({ title, kicker, imageStyle }: CollectionHeroProps) {
  return (
    <section
      className="relative w-full flex items-center justify-center"
      style={{ height: '60vh', minHeight: '400px', ...imageStyle }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 text-center">
        {kicker && (
          <p className="text-pvl-kicker text-pvl-gold mb-4">{kicker}</p>
        )}
        <h1 className="text-pvl-hero-title text-white">{title}</h1>
      </div>
    </section>
  );
}
