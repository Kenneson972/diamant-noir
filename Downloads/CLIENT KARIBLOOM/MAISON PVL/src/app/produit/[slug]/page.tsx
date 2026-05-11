import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageSEO } from '@/components/common/PageSEO';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';

// This would normally fetch from Supabase
async function getProduct(slug: string) {
  return {
    id: 'demo-1',
    slug,
    name: 'Costume deux pièces en laine peignée',
    description:
      "Un costume d'exception taillé dans une laine peignée italienne. Coupe ajustée, finitions main, doublure en soie. L'essence du raffinement masculin.",
    gender: 'homme',
    price: 490,
    compareAtPrice: null,
    isNew: true,
    materials: '97% Laine peignée, 3% Élasthanne',
    careInstructions: 'Nettoyage à sec recommandé. Repassage vapeur doux.',
    images: Array.from({ length: 6 }, (_, i) => ({
      id: `img-${i}`,
      url: '',
      alt: `Costume deux pièces — Vue ${i + 1}`,
      width: 1200,
      height: 1600,
      position: i,
    })),
    variants: [
      {
        id: 'var-1',
        size: '46',
        color: 'Noir',
        colorHex: '#1a1a1a',
        sku: 'PVL-M-001-BLK-46',
        price: 490,
        stock: 5,
      },
      {
        id: 'var-2',
        size: '48',
        color: 'Noir',
        colorHex: '#1a1a1a',
        sku: 'PVL-M-001-BLK-48',
        price: 490,
        stock: 8,
      },
      {
        id: 'var-3',
        size: '50',
        color: 'Noir',
        colorHex: '#1a1a1a',
        sku: 'PVL-M-001-BLK-50',
        price: 490,
        stock: 3,
      },
      {
        id: 'var-4',
        size: '46',
        color: 'Gris Anthracite',
        colorHex: '#36454f',
        sku: 'PVL-M-001-GRY-46',
        price: 490,
        stock: 2,
      },
      {
        id: 'var-5',
        size: '48',
        color: 'Gris Anthracite',
        colorHex: '#36454f',
        sku: 'PVL-M-001-GRY-48',
        price: 490,
        stock: 6,
      },
      {
        id: 'var-6',
        size: '50',
        color: 'Gris Anthracite',
        colorHex: '#36454f',
        sku: 'PVL-M-001-GRY-50',
        price: 490,
        stock: 4,
      },
      {
        id: 'var-7',
        size: '46',
        color: 'Bleu Nuit',
        colorHex: '#191970',
        sku: 'PVL-M-001-NVY-46',
        price: 520,
        stock: 0,
      },
      {
        id: 'var-8',
        size: '48',
        color: 'Bleu Nuit',
        colorHex: '#191970',
        sku: 'PVL-M-001-NVY-48',
        price: 520,
        stock: 3,
      },
    ],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: `${product.name} — Maison PVL`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
