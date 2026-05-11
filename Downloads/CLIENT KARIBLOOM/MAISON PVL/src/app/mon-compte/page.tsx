'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/store/wishlistStore';
import { Package, Heart, MapPin, ArrowRight, ShoppingBag } from 'lucide-react';

const QUICK_LINKS = [
  {
    href: '/mon-compte/commandes',
    label: 'Mes commandes',
    icon: Package,
    description: 'Suivez et gérez vos commandes',
  },
  {
    href: '/mon-compte/favoris',
    label: 'Mes favoris',
    icon: Heart,
    description: 'Retrouvez vos articles sauvegardés',
  },
  {
    href: '/mon-compte/adresses',
    label: 'Mes adresses',
    icon: MapPin,
    description: 'Gérez vos adresses de livraison',
  },
] as const;

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const { items: wishlistItems } = useWishlist();

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || '';

  return (
    <div>
      {/* Welcome */}
      <div className="mb-10">
        <h2 className="font-display text-2xl md:text-3xl mb-2">
          Bonjour, {firstName}
        </h2>
        <p className="text-sm text-pvl-slate">
          Bienvenue dans votre espace personnel.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="bg-pvl-cream p-6">
          <Package size={20} className="text-pvl-slate mb-3" strokeWidth={1.5} />
          <p className="text-2xl font-display mb-1">0</p>
          <p className="text-xs text-pvl-slate uppercase tracking-[0.1em]">
            Commandes
          </p>
        </div>
        <div className="bg-pvl-cream p-6">
          <Heart size={20} className="text-pvl-slate mb-3" strokeWidth={1.5} />
          <p className="text-2xl font-display mb-1">{wishlistItems.length}</p>
          <p className="text-xs text-pvl-slate uppercase tracking-[0.1em]">
            Favoris
          </p>
        </div>
        <div className="bg-pvl-cream p-6">
          <MapPin size={20} className="text-pvl-slate mb-3" strokeWidth={1.5} />
          <p className="text-2xl font-display mb-1">0</p>
          <p className="text-xs text-pvl-slate uppercase tracking-[0.1em]">
            Adresses
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="space-y-4">
        <h3 className="text-pvl-kicker">Accès rapide</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_LINKS.map(({ href, label, icon: Icon, description }) => (
            <Link
              key={href}
              href={href}
              className="group border border-pvl-black/12 p-6 hover:border-pvl-black transition-colors"
            >
              <Icon
                size={20}
                className="text-pvl-slate group-hover:text-pvl-black mb-3 transition-colors"
                strokeWidth={1.5}
              />
              <h4 className="text-sm font-medium mb-1">{label}</h4>
              <p className="text-xs text-pvl-stone mb-3">{description}</p>
              <ArrowRight
                size={14}
                className="text-pvl-stone group-hover:text-pvl-black transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Empty orders hint */}
      <div className="mt-12 border-t border-pvl-black/8 pt-8">
        <div className="text-center max-w-sm mx-auto">
          <ShoppingBag size={24} className="mx-auto text-pvl-stone mb-3" strokeWidth={1.5} />
          <h3 className="font-display text-lg mb-2">
            Prêt à shopper ?
          </h3>
          <p className="text-sm text-pvl-slate mb-6">
            Découvrez notre collection et trouvez des pièces qui vous ressemblent.
          </p>
          <Link
            href="/homme"
            className="inline-block bg-pvl-black text-pvl-white px-8 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
          >
            Découvrir la collection
          </Link>
        </div>
      </div>
    </div>
  );
}
