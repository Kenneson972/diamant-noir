'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface CollectionBlock {
  title: string;
  href: string;
  imageStyle: React.CSSProperties;
  span?: 'tall' | 'wide';
}

interface CollectionGridProps {
  blocks: CollectionBlock[];
}

export function CollectionGrid({ blocks }: CollectionGridProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] md:grid-rows-[1fr_1fr] gap-0">
      {blocks.map((block, i) => (
        <Link
          key={block.href}
          href={block.href}
          className={`relative overflow-hidden group ${block.span === 'tall' ? 'md:row-span-2' : ''}`}
        >
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 40 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: i * 0.1 }}
            className="absolute inset-0"
            style={block.imageStyle}
          />
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0"
            style={block.imageStyle}
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 p-6 md:p-10 z-10">
            <h3 className="font-display text-[clamp(1.25rem,2.5vw,2rem)] text-white leading-tight">
              {block.title}
            </h3>
            <span className="block mt-2 text-pvl-kicker text-white border-b border-white/40 pb-1">
              EXPLORER
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
