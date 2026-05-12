'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Lock, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '@/store/cartStore';
import { formatPrice } from '@/lib/format';

const checkoutSchema = z.object({
  firstName: z.string().min(1, 'Requis'),
  lastName: z.string().min(1, 'Requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  address: z.string().min(1, 'Requis'),
  address2: z.string().optional(),
  city: z.string().min(1, 'Requis'),
  postalCode: z.string().min(1, 'Requis'),
  country: z.string().min(1, 'Requis'),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { items, subtotal, openCart } = useCart();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = (data: CheckoutForm) => {
    // Will connect to Stripe in V2
    console.log('Checkout data:', data);
  };

  return (
    <div className="min-h-screen bg-pvl-white">
      {/* Checkout header */}
      <div className="border-b border-pvl-black/8">
        <div className="container-pvl flex items-center justify-between h-16">
          <Link
            href="/"
            className="font-display text-lg"
          >
            Maison PVL
          </Link>
          <button
            onClick={openCart}
            className="text-[0.625rem] uppercase tracking-[0.15em] text-pvl-stone hover:text-pvl-black transition-colors"
          >
            Retour au panier
          </button>
        </div>
      </div>

      <div className="container-pvl py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <h1 className="font-display text-2xl mb-8">Livraison</h1>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5 max-w-lg"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2">
                    Prénom
                  </label>
                  <input
                    {...register('firstName')}
                    className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                  />
                  {errors.firstName && (
                    <p className="text-[0.625rem] text-pvl-error mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2">
                    Nom
                  </label>
                  <input
                    {...register('lastName')}
                    className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                  />
                  {errors.lastName && (
                    <p className="text-[0.625rem] text-pvl-error mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                />
                {errors.email && (
                  <p className="text-[0.625rem] text-pvl-error mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2">
                  Téléphone
                </label>
                <input
                  {...register('phone')}
                  className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2">
                  Adresse
                </label>
                <input
                  {...register('address')}
                  className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                />
                {errors.address && (
                  <p className="text-[0.625rem] text-pvl-error mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>
              <div>
                <input
                  {...register('address2')}
                  placeholder="Complément d'adresse (optionnel)"
                  className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2">
                    Code postal
                  </label>
                  <input
                    {...register('postalCode')}
                    className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                  />
                  {errors.postalCode && (
                    <p className="text-[0.625rem] text-pvl-error mt-1">
                      {errors.postalCode.message}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2">
                    Ville
                  </label>
                  <input
                    {...register('city')}
                    className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors"
                  />
                  {errors.city && (
                    <p className="text-[0.625rem] text-pvl-error mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[0.625rem] uppercase tracking-[0.15em] text-pvl-slate mb-2">
                  Pays
                </label>
                <select
                  {...register('country')}
                  className="w-full border border-pvl-black/12 px-4 py-3 text-sm focus:outline-none focus:border-pvl-black transition-colors bg-pvl-white"
                >
                  <option value="">Sélectionner</option>
                  <option value="FR">France</option>
                  <option value="BE">Belgique</option>
                  <option value="CH">Suisse</option>
                  <option value="LU">Luxembourg</option>
                  <option value="MC">Monaco</option>
                </select>
                {errors.country && (
                  <p className="text-[0.625rem] text-pvl-error mt-1">
                    {errors.country.message}
                  </p>
                )}
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-pvl-black text-pvl-white py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors flex items-center justify-center gap-3"
                >
                  <Lock size={14} />
                  Paiement sécurisé
                </button>
              </div>
            </form>

            {/* Trust signals */}
            <div className="mt-10 grid grid-cols-3 gap-6 py-6 border-t border-pvl-black/8">
              <div className="text-center">
                <Lock size={16} className="mx-auto text-pvl-stone mb-2" />
                <p className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone">
                  Paiement sécurisé
                </p>
              </div>
              <div className="text-center">
                <Truck size={16} className="mx-auto text-pvl-stone mb-2" />
                <p className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone">
                  Livraison offerte
                </p>
              </div>
              <div className="text-center">
                <RotateCcw size={16} className="mx-auto text-pvl-stone mb-2" />
                <p className="text-[0.5625rem] uppercase tracking-[0.15em] text-pvl-stone">
                  Retours 30 jours
                </p>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-pvl-cream p-6 md:p-8 sticky top-28">
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] mb-6">
                Votre commande
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 border-b border-pvl-black/8 last:border-0 last:pb-0"
                  >
                    <div className="w-16 h-20 bg-pvl-warm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.75rem] font-medium truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[0.5625rem] text-pvl-stone mt-0.5 uppercase tracking-[0.1em]">
                        {item.variant.color} — {item.variant.size}
                      </p>
                      <p className="text-[0.6875rem] mt-1">
                        Qté: {item.quantity}
                      </p>
                    </div>
                    <p className="text-[0.75rem] tabular-nums">
                      {formatPrice(item.variant.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-pvl-black/8 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-pvl-slate">Sous-total</span>
                  <span className="tabular-nums">
                    {formatPrice(subtotal())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-pvl-slate">Livraison</span>
                  <span className="text-pvl-success text-[0.625rem] uppercase tracking-[0.1em]">
                    Offerte
                  </span>
                </div>
              </div>
              <div className="flex justify-between font-medium text-base mt-4 pt-4 border-t border-pvl-black/8">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatPrice(subtotal())}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
