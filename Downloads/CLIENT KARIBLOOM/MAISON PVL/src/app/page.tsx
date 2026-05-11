'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

export default function EntryPage() {
  const [hovered, setHovered] = useState<'homme' | 'femme' | null>(null);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-pvl-black">
      {/* Split halves */}
      <div className="flex h-full flex-col md:flex-row">
        {/* Homme half */}
        <motion.div
          animate={{
            flexBasis:
              hovered === 'homme'
                ? '55%'
                : hovered === 'femme'
                  ? '45%'
                  : '50%',
          }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="relative overflow-hidden"
          onMouseEnter={() => setHovered('homme')}
          onMouseLeave={() => setHovered(null)}
        >
          <Link href="/homme" className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center">
            {/* Placeholder gradient background — replace with real photo */}
            <motion.div
              animate={{ scale: hovered === 'homme' ? 1.03 : 1 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, #5a4c3a 0%, #3a2c1a 100%)',
              }}
            />
            {/* Black overlay */}
            <motion.div
              animate={{ opacity: hovered === 'homme' ? 0.15 : 0.3 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0 bg-black"
            />
            <span className="relative font-display text-[clamp(2rem,5vw,4.5rem)] font-normal uppercase tracking-[0.2em] text-pvl-white">
              Homme
            </span>
          </Link>
        </motion.div>

        {/* Femme half */}
        <motion.div
          animate={{
            flexBasis:
              hovered === 'femme'
                ? '55%'
                : hovered === 'homme'
                  ? '45%'
                  : '50%',
          }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="relative overflow-hidden"
          onMouseEnter={() => setHovered('femme')}
          onMouseLeave={() => setHovered(null)}
        >
          <Link href="/femme" className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center">
            {/* Placeholder gradient background — replace with real photo */}
            <motion.div
              animate={{ scale: hovered === 'femme' ? 1.03 : 1 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, #948575 0%, #746555 100%)',
              }}
            />
            {/* Black overlay */}
            <motion.div
              animate={{ opacity: hovered === 'femme' ? 0.15 : 0.3 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0 bg-black"
            />
            <span className="relative font-display text-[clamp(2rem,5vw,4.5rem)] font-normal uppercase tracking-[0.2em] text-pvl-white">
              Femme
            </span>
          </Link>
        </motion.div>
      </div>

      {/* Centered logo at intersection of the two halves */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <span className="font-sans text-[clamp(0.75rem,1.5vw,1rem)] font-medium uppercase tracking-[0.3em] text-pvl-white">
          Maison PVL
        </span>
      </div>

      {/* Language switcher at bottom */}
      <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
