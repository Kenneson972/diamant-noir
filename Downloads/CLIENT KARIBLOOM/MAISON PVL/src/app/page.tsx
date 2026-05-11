'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function EntryPage() {
  const [hovered, setHovered] = useState<'homme' | 'femme' | null>(null);

  return (
    <div className="h-screen w-screen overflow-hidden bg-pvl-black">
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
            <motion.div
              animate={{ scale: hovered === 'homme' ? 1.03 : 1 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #5a4c3a 0%, #3a2c1a 100%)' }}
            />
            <motion.div
              animate={{ opacity: hovered === 'homme' ? 0.05 : 0.1 }}
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
            <motion.div
              animate={{ scale: hovered === 'femme' ? 1.03 : 1 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #948575 0%, #746555 100%)' }}
            />
            <motion.div
              animate={{ opacity: hovered === 'femme' ? 0.05 : 0.1 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0 bg-black"
            />
            <span className="relative font-display text-[clamp(2rem,5vw,4.5rem)] font-normal uppercase tracking-[0.2em] text-pvl-white">
              Femme
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
