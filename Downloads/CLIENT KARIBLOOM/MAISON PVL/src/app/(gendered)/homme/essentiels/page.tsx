import { CollectionHero } from '@/components/collection/CollectionHero';
import { ProductGrid } from '@/components/collection/ProductGrid';

export default function EssentielsHommePage() {
  return (
    <>
      <CollectionHero
        kicker="HOMME"
        title="Essentiels"
        imageStyle={{ background: 'linear-gradient(135deg, #8b7d6b, #5a4c3a)' }}
      />
      <ProductGrid gender="homme" />
    </>
  );
}
