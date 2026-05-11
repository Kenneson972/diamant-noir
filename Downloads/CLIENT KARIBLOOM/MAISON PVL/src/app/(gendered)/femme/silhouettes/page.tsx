import { CollectionHero } from '@/components/collection/CollectionHero';
import { ProductGrid } from '@/components/collection/ProductGrid';

export default function SilhouettesFemmePage() {
  return (
    <>
      <CollectionHero
        kicker="FEMME"
        title="Silhouettes"
        imageStyle={{ background: 'linear-gradient(135deg, #8b7a6a, #5a4b3a)' }}
      />
      <ProductGrid gender="femme" />
    </>
  );
}
