import { CollectionHero } from '@/components/collection/CollectionHero';
import { ProductGrid } from '@/components/collection/ProductGrid';

export default function EssentielsFemmePage() {
  return (
    <>
      <CollectionHero
        kicker="FEMME"
        title="Essentiels"
        imageStyle={{ background: 'linear-gradient(135deg, #9a8b7a, #6a5b4a)' }}
      />
      <ProductGrid gender="femme" />
    </>
  );
}
