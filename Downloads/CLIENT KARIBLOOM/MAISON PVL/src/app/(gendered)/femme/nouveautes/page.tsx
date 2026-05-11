import { CollectionHero } from '@/components/collection/CollectionHero';
import { ProductGrid } from '@/components/collection/ProductGrid';

export default function NouveautesFemmePage() {
  return (
    <>
      <CollectionHero
        kicker="FEMME"
        title="Nouveautés"
        imageStyle={{ background: 'linear-gradient(135deg, #7a6b5a, #4a3b2a)' }}
      />
      <ProductGrid gender="femme" />
    </>
  );
}
