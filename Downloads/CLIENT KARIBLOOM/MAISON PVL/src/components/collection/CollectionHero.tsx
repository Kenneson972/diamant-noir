'use client';

import Image from 'next/image';

interface CollectionHeroProps {
  title: string;
  kicker?: string;
  imageUrl: string;
}

export function CollectionHero({ title, kicker, imageUrl }: CollectionHeroProps) {
  return (
    <section className="relative w-screen h-[60dvh]">
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute bottom-[4vw] left-[4vw] z-10">
        {kicker && (
          <p className="text-[0.625rem] uppercase tracking-[0.2em] text-white/80 mb-3">{kicker}</p>
        )}
        <h1 className="font-display text-[clamp(1.5rem,3.5vw,3rem)] font-normal text-white leading-[1.1]">
          {title}
        </h1>
      </div>
    </section>
  );
}
