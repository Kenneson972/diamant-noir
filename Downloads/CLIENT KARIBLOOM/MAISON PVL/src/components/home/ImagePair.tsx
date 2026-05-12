'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ImagePairProps {
  left: { src: string; alt: string; href?: string; label?: string };
  right: { src: string; alt: string; href?: string; label?: string };
}

export function ImagePair({ left, right }: ImagePairProps) {
  const ImageBlock = ({ src, alt, href, label }: ImagePairProps['left']) => (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 30 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7 }}
      className="relative flex-1 overflow-hidden h-[50dvh] md:h-[100dvh]"
    >
      <Link href={href || '#'} className="group block h-full">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="h-full"
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="50vw"
          />
        </motion.div>
        {label && (
          <div className="absolute bottom-0 left-0 p-6 md:p-10 z-10">
            <span className="font-display text-[clamp(1rem,2vw,1.75rem)] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              {label}
            </span>
          </div>
        )}
      </Link>
    </motion.div>
  );

  return (
    <section className="flex flex-col md:flex-row w-screen">
      <ImageBlock {...left} />
      <ImageBlock {...right} />
    </section>
  );
}
