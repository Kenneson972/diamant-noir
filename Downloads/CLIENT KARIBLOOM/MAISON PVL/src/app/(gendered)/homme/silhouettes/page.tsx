import { CollectionHero } from '@/components/collection/CollectionHero';
import { ProductGrid } from '@/components/collection/ProductGrid';

export default function SilhouettesHommePage() {
  return (
    <>
      <CollectionHero
        kicker="HOMME"
        title="Silhouettes"
        imageStyle={{ background: 'linear-gradient(135deg, #6b5d4b, #4a3c2a)' }}
      />
      <ProductGrid gender="homme" />
    </>
  );
}
