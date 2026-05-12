'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface EditorialBannerProps {
  kicker: string;
  title: string;
  href?: string;
  linkLabel?: string;
  imageUrl: string;
}

export function EditorialBanner({
  kicker,
  title,
  href,
  linkLabel,
  imageUrl,
}: EditorialBannerProps) {
  return (
    <section className="relative w-screen h-[70dvh]">
      <motion.div
        whileInView={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
        className="absolute inset-0"
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-black/15" />
      <div className="absolute bottom-[4vw] left-[4vw] z-10">
        <p className="text-[0.625rem] uppercase tracking-[0.2em] text-white/70 mb-3">{kicker}</p>
        <h2 className="font-display text-[clamp(1.5rem,3.5vw,3rem)] font-normal leading-[1.1] text-white mb-4">
          {title}
        </h2>
        {href && linkLabel && (
          <Link
            href={href}
            className="inline-block text-[0.6875rem] text-white/80 hover:text-white uppercase tracking-[0.2em] transition-colors"
          >
            {linkLabel} <ArrowRight size={14} strokeWidth={1.5} className="inline ml-1 -translate-y-px" />
          </Link>
        )}
      </div>
    </section>
  );
}
