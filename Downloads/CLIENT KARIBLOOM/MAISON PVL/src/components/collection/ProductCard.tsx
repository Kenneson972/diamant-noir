'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const mainImage = product.images[0];
  const secondImage = product.images[1];

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-card)' }}
      >
        {/* Main image */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: isHovered && secondImage ? 0 : 1 }}
          transition={{ duration: 0.4 }}
        >
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={mainImage.alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-pvl-cream" />
          )}
        </motion.div>

        {/* Second image (crossfade on hover) */}
        {secondImage && (
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          >
            <img
              src={secondImage.url}
              alt={secondImage.alt}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {/* Zoom on hover */}
        <motion.div
          className="absolute inset-0"
          animate={{ scale: isHovered ? 1.02 : 1 }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        />
      </div>

      {/* Product info — minimal, no badges, no stars */}
      <div className="pt-3">
        <p className="text-pvl-product-name text-pvl-black">{product.name}</p>
        <p className="text-pvl-price text-pvl-slate mt-1">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          }).format(product.price)}
        </p>
      </div>
    </Link>
  );
}
