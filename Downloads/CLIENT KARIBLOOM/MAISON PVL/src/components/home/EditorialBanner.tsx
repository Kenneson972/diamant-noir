'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface EditorialBannerProps {
  kicker: string;
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
  imageStyle: React.CSSProperties;
  imagePosition?: 'left' | 'right';
}

export function EditorialBanner({
  kicker,
  title,
  body,
  href,
  linkLabel,
  imageStyle,
  imagePosition = 'left',
}: EditorialBannerProps) {
  const imageBlock = (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 40 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7 }}
      className="relative min-h-[50vh] md:min-h-[70vh]"
      style={imageStyle}
    />
  );

  const textBlock = (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 40 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="bg-pvl-cream flex items-center p-[clamp(3rem,6vw,8rem)]"
    >
      <div className="max-w-md">
        <p className="text-pvl-kicker text-pvl-gold-dim mb-4">{kicker}</p>
        <h2 className="text-pvl-section-title text-pvl-black mb-6">{title}</h2>
        <p className="text-pvl-manifesto text-pvl-slate leading-relaxed">{body}</p>
        {href && linkLabel && (
          <Link
            href={href}
            className="inline-block mt-8 text-pvl-meta text-pvl-slate hover:text-pvl-black transition-colors"
          >
            {linkLabel} &rarr;
          </Link>
        )}
      </div>
    </motion.div>
  );

  return (
    <section
      className={`flex flex-col ${imagePosition === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'}`}
    >
      <div className="md:w-[60%]">{imageBlock}</div>
      <div className="md:w-[40%]">{textBlock}</div>
    </section>
  );
}
