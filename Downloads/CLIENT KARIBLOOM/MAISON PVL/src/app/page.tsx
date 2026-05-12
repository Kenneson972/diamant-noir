'use client';

import Image from 'next/image';
import Link from 'next/link';

const SPLIT_IMAGES = {
  homme: '/images/photos/entry-homme.png',
  femme: '/images/photos/entry-femme.png',
};

export default function EntryPage() {
  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-pvl-black">
      <div className="flex h-full flex-col md:flex-row">
        {/* Homme half */}
        <Link
          href="/homme"
          className="relative flex-1 overflow-hidden group"
        >
          <Image
            src={SPLIT_IMAGES.homme}
            alt="Collection Homme"
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="50vw"
            priority
          />
          <div className="absolute inset-0 bg-black/10 transition-opacity duration-500 group-hover:bg-black/5" />
          <div className="absolute inset-0 flex items-end md:items-center justify-center pb-16 md:pb-0">
            <span className="font-display text-[clamp(1.5rem,4vw,3.5rem)] font-normal uppercase tracking-[0.15em] text-white">
              Homme
            </span>
          </div>
        </Link>

        {/* Femme half */}
        <Link
          href="/femme"
          className="relative flex-1 overflow-hidden group"
        >
          <Image
            src={SPLIT_IMAGES.femme}
            alt="Collection Femme"
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="50vw"
            priority
          />
          <div className="absolute inset-0 bg-black/10 transition-opacity duration-500 group-hover:bg-black/5" />
          <div className="absolute inset-0 flex items-end md:items-center justify-center pb-16 md:pb-0">
            <span className="font-display text-[clamp(1.5rem,4vw,3.5rem)] font-normal uppercase tracking-[0.15em] text-white">
              Femme
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
