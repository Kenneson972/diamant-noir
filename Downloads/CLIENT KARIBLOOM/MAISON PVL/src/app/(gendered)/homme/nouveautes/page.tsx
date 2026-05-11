import { CollectionHero } from '@/components/collection/CollectionHero';
import { ProductGrid } from '@/components/collection/ProductGrid';

export default function NouveautesHommePage() {
  return (
    <>
      <CollectionHero
        kicker="HOMME"
        title="Nouveautés"
        imageStyle={{ background: 'linear-gradient(135deg, #5a4c3a, #3a2c1a)' }}
      />
      <ProductGrid gender="homme" />
    </>
  );
}
