import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { DashPageHeader } from '../../components/dashboard/primitives';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';

const Subscription = () => {
  const { subscription } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const features = [
    'Sans engagement',
    'Tarifs préférentiels sur les boissons',
    'Programme de parrainage Óra+',
    'Bilan bien-être personnalisé',
    'Accès privilégié aux événements PESSORA',
  ];

  const priceLabel =
    subscription?.price != null && subscription.price > 0
      ? `${subscription.price.toFixed(2).replace('.', ',')}€`
      : '24,90€';

  const handleManageSubscription = async () => {
    setPortalError(null);
    if (!subscription?.stripeSubscriptionId) {
      window.location.assign('/ora-plus');
      return;
    }
    setPortalLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPortalError('Session expirée. Reconnectez-vous.');
        return;
      }
      const returnPath = `${window.location.pathname}${window.location.search}`;
      const { data, error } = await supabase.functions.invoke('create-customer-portal-session', {
        body: { return_path: returnPath },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      const url = data && typeof data === 'object' && 'url' in data ? (data as { url: string }).url : null;
      if (!url) {
        const msg =
          data && typeof data === 'object' && 'error' in data
            ? String((data as { error: unknown }).error)
            : 'Réponse invalide du serveur.';
        throw new Error(msg);
      }
      window.location.assign(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Impossible d\'ouvrir le portail de paiement.';
      setPortalError(msg);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div>
      <DashPageHeader
        title="Mon abonnement"
        subtitle="Gérez votre plan et vos avantages exclusifs."
        action={
          <Link
            to="/ora-plus"
            className="inline-flex items-center rounded-full border border-noir/15 px-4 py-[10px] text-[13px] font-medium text-black/55 hover:text-noir hover:border-noir/30 transition-colors"
          >
            Découvrir Óra+
          </Link>
        }
      />

      <div className={DASH_MAIN_PAD}>
        {subscription && (
          <p className="text-[11px] text-black/35 mb-6">
            Plan <span className="font-medium">{{ free: 'Gratuit', ora_plus: 'Óra+' }[subscription.plan] ?? subscription.plan}</span> · {subscription.status}
          </p>
        )}

        {portalError ? (
          <p className="text-[11px] text-red-600/90 mb-4" role="alert">
            {portalError}
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-[7fr_5fr] gap-5">
          {/* Plan card */}
          <div className="bg-white rounded-[2px] border border-noir/[0.06] p-8 md:p-10">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 rounded-[2px] bg-noir/[0.06] flex items-center justify-center">
                  <Crown size={18} strokeWidth={1.3} className="text-black/50" />
                </div>
                <span className="text-[8px] font-normal uppercase tracking-[0.28em] text-black/35">Best Value</span>
              </div>
              <span className="text-[8px] font-normal uppercase tracking-[0.2em] text-black/30 border border-black/[0.1] px-3 py-1.5 rounded-[2px]">
                {subscription?.status === 'active' ? 'Actif' : subscription?.status ?? 'Actif'}
              </span>
            </div>

            <h3 className="font-display font-normal text-noir leading-none mb-2" style={{ fontSize: 'clamp(36px, 3vw, 48px)' }}>
              Óra+
            </h3>
            <p className="text-[12px] font-light italic text-black/45 mb-8">
              Plus qu&apos;une boisson, un style de vie !
            </p>

            <div className="flex items-baseline gap-2 mb-8">
              <span className="font-display font-normal text-noir" style={{ fontSize: 'clamp(40px, 4vw, 52px)' }}>
                {priceLabel}
              </span>
              <span className="text-[11px] font-light text-black/30 uppercase tracking-[0.1em]">/mois</span>
            </div>

            <div className="border border-black/[0.06] rounded-[2px] px-5 py-4 mb-8">
              <p className="text-[11px] font-normal text-black/50 uppercase tracking-[0.1em]">Jusqu&apos;à -50% sur nos boissons</p>
            </div>

            <button
              type="button"
              disabled={portalLoading}
              onClick={() => void handleManageSubscription()}
              className="w-full h-11 border border-noir/15 bg-white text-black/55 rounded-[2px] text-[10px] font-normal uppercase tracking-[0.12em] hover:border-noir/30 hover:text-noir transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {portalLoading
                ? 'Ouverture…'
                : subscription?.stripeSubscriptionId
                  ? 'Gérer mon abonnement'
                  : 'Souscrire ou gérer via Óra+'}
            </button>
          </div>

          {/* Benefits card */}
          <div className="bg-white rounded-[2px] border border-noir/[0.06] p-8 flex flex-col">
            <p className="text-[9px] font-normal uppercase tracking-[0.22em] text-black/35 mb-6">
              Les avantages abonné(e)
            </p>
            <div className="flex flex-col divide-y divide-black/[0.05]">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-4 py-4">
                  <Check size={13} strokeWidth={1.5} className="text-black/50 shrink-0 mt-0.5" />
                  <span className="text-[13px] font-light text-black/70 leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
