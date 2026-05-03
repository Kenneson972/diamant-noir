// src/pages/admin/AdminMemberDetail.tsx
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DASH_MAIN_PAD } from '../../components/dashboard/layoutClasses';
import type { Order, OrderItem, Profile, Subscription } from '../../types/database';

const inputClass =
  'w-full h-10 bg-surface-muted rounded-[2px] border border-noir/[0.08] px-3 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir/20';

const PLAN_OPTIONS: Subscription['plan'][] = ['free', 'ora_plus'];
const STATUS_OPTIONS: Subscription['status'][] = ['active', 'expired', 'cancelled'];

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuit',
  ora_plus: 'Óra+',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const BILAN_STATUT_LABEL: Record<string, string> = {
  en_attente: 'En attente',
  confirme: 'Confirmé',
  annule: 'Annulé',
};

type OrderWithItems = Order & { order_items: OrderItem[] };

type BilanRow = {
  id: string;
  date_rdv: string;
  heure_rdv: string;
  statut: 'en_attente' | 'confirme' | 'annule';
  notes: string | null;
  created_at: string;
};

type EventRegRow = {
  id: string;
  created_at: string;
  events: { id: string; title: string; date: string | null; type: string | null } | null;
};

type StripeData = {
  status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: { brand: string; last4: string; exp_month: number; exp_year: number } | null;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-display text-[18px] font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
      {children}
    </h2>
  );
}

const AdminMemberDetail = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [bilans, setBilans] = useState<BilanRow[]>([]);
  const [eventRegs, setEventRegs] = useState<EventRegRow[]>([]);
  const [sectionErrors, setSectionErrors] = useState<{
    orders?: string;
    bilans?: string;
    events?: string;
  }>({});

  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [subForm, setSubForm] = useState({
    plan: 'free' as Subscription['plan'],
    status: 'active' as Subscription['status'],
    start_date: '',
    end_date: '',
    auto_renew: false,
    price: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSub, setSavingSub] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeData, setStripeData] = useState<StripeData | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [cancellingStripe, setCancellingStripe] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const loadStripeDataForCustomer = useCallback(async (customerId: string) => {
    setStripeLoading(true);
    setStripeError(null);
    setStripeData(null);
    const { data, error: fnErr } = await supabase.functions.invoke('get-stripe-member', {
      body: { stripe_customer_id: customerId },
    });
    setStripeLoading(false);
    if (fnErr || !data) {
      setStripeError('Données Stripe indisponibles');
      return;
    }
    setStripeData(data as StripeData);
  }, []);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError(null);
    setSectionErrors({});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: profData, error: profErr } = await db
      .from('profiles')
      .select('*, subscriptions(*)')
      .eq('id', memberId)
      .maybeSingle();

    if (profErr || !profData) {
      setError(profErr?.message ?? 'Membre introuvable.');
      setProfile(null);
      setLoading(false);
      return;
    }

    const p = profData as Profile & { subscriptions: Subscription[] | Subscription | null };
    const subs = Array.isArray(p.subscriptions) ? p.subscriptions[0] : p.subscriptions;
    setProfile(p);
    setSubscription(subs ?? null);
    if (p.stripe_customer_id) {
      void loadStripeDataForCustomer(p.stripe_customer_id);
    }
    setProfileForm({
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      phone: p.phone ?? '',
    });
    if (subs) {
      setSubForm({
        plan: subs.plan,
        status: subs.status,
        start_date: subs.start_date?.slice(0, 10) ?? '',
        end_date: subs.end_date ? subs.end_date.slice(0, 10) : '',
        auto_renew: subs.auto_renew,
        price: String(subs.price ?? ''),
      });
    } else {
      setSubForm({
        plan: 'free',
        status: 'active',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
        auto_renew: false,
        price: '0',
      });
    }

    const [oRes, bRes, eRes] = await Promise.all([
      db
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', memberId)
        .order('created_at', { ascending: false }),
      db.from('bilan_bookings').select('*').eq('user_id', memberId).order('created_at', { ascending: false }),
      db
        .from('event_registrations')
        .select('id, created_at, events (id, title, date, type)')
        .eq('user_id', memberId)
        .order('created_at', { ascending: false }),
    ]);

    if (oRes.error) setSectionErrors((s) => ({ ...s, orders: 'Historique commandes indisponible (droits ou table).' }));
    else setOrders((oRes.data as OrderWithItems[]) ?? []);

    if (bRes.error) setSectionErrors((s) => ({ ...s, bilans: 'Historique bilans indisponible (droits ou table).' }));
    else setBilans((bRes.data as BilanRow[]) ?? []);

    if (eRes.error) setSectionErrors((s) => ({ ...s, events: 'Inscriptions événements indisponibles (droits ou table).' }));
    else setEventRegs((eRes.data as EventRegRow[]) ?? []);

    setLoading(false);
  }, [memberId, loadStripeDataForCustomer]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const cancelStripeSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return;
    setCancellingStripe(true);
    const { error: fnErr } = await supabase.functions.invoke('cancel-stripe-subscription', {
      body: { stripe_subscription_id: subscription.stripe_subscription_id },
    });
    setCancellingStripe(false);
    if (fnErr) {
      setConfirmCancel(false);
      showToast("Erreur lors de l'annulation Stripe.");
      return;
    }
    setConfirmCancel(false);
    showToast('Annulation programmée au prochain renouvellement.');
    if (profile?.stripe_customer_id) void loadStripeDataForCustomer(profile.stripe_customer_id);
  };

  const openStripePortal = async () => {
    if (!profile?.stripe_customer_id || openingPortal) return;
    setOpeningPortal(true);
    const returnUrl = `${window.location.origin}/admin/membres/${memberId}`;
    const { data, error: fnErr } = await supabase.functions.invoke('admin-portal-session', {
      body: { stripe_customer_id: profile.stripe_customer_id, return_url: returnUrl },
    });
    setOpeningPortal(false);
    if (fnErr || !data?.url) {
      showToast("Impossible d'ouvrir le portail Stripe.");
      return;
    }
    window.open(data.url, '_blank', 'noopener');
  };

  const saveProfile = async () => {
    if (!memberId) return;
    setConfirmCancel(false);
    setSavingProfile(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upErr } = await (supabase as any)
      .from('profiles')
      .update({
        first_name: profileForm.first_name.trim() || null,
        last_name: profileForm.last_name.trim() || null,
        phone: profileForm.phone.trim() || null,
      })
      .eq('id', memberId);
    setSavingProfile(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    showToast('Profil enregistré.');
    load();
  };

  const saveSubscription = async () => {
    if (!memberId) return;
    setSavingSub(true);
    setError(null);
    const priceNum = parseFloat(subForm.price);
    const price = Number.isFinite(priceNum) ? priceNum : 0;
    const payload = {
      plan: subForm.plan,
      status: subForm.status,
      start_date: subForm.start_date || new Date().toISOString().slice(0, 10),
      end_date: subForm.end_date ? subForm.end_date : null,
      auto_renew: subForm.auto_renew,
      price,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    if (subscription?.id) {
      const { error: upErr } = await db.from('subscriptions').update(payload).eq('id', subscription.id);
      setSavingSub(false);
      if (upErr) {
        setError(upErr.message);
        return;
      }
    } else {
      const { error: insErr } = await db.from('subscriptions').insert({
        user_id: memberId,
        ...payload,
      });
      setSavingSub(false);
      if (insErr) {
        setError(insErr.message);
        return;
      }
    }
    showToast('Abonnement enregistré.');
    load();
  };

  const copyId = () => {
    if (memberId) {
      void navigator.clipboard.writeText(memberId);
      showToast('Identifiant copié.');
    }
  };

  if (!memberId) {
    return (
      <div className={`${DASH_MAIN_PAD} mx-auto w-full max-w-[1400px]`}>
        <p className="text-[13px] text-black/40">Identifiant manquant.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${DASH_MAIN_PAD} mx-auto w-full max-w-[900px] space-y-6`}>
        <div className="h-8 w-48 animate-pulse rounded bg-noir/[0.06]" />
        <div className="h-40 animate-pulse rounded-[2px] bg-noir/[0.04]" />
        <div className="h-40 animate-pulse rounded-[2px] bg-noir/[0.04]" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className={`${DASH_MAIN_PAD} mx-auto w-full max-w-[900px]`}>
        <Link
          to="/admin/membres"
          className="mb-6 inline-flex items-center gap-2 text-[11px] font-light text-black/45 transition-colors hover:text-black"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Membres
        </Link>
        <p className="text-[13px] text-red-500/90">{error}</p>
      </div>
    );
  }

  const displayName =
    `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || profile?.email || 'Membre';

  return (
    <div className={`${DASH_MAIN_PAD} mx-auto w-full max-w-[900px]`}>
      <Link
        to="/admin/membres"
        className="mb-6 inline-flex items-center gap-2 text-[11px] font-light text-black/45 transition-colors hover:text-black"
      >
        <ArrowLeft size={14} strokeWidth={1.5} /> Membres
      </Link>

      {toast && (
        <div className="fixed bottom-24 right-4 z-50 rounded-[2px] border border-noir/10 bg-white px-4 py-2 text-[11px] text-black shadow-lg md:bottom-6 md:right-6">
          {toast}
        </div>
      )}

      <header className="mb-10 border-b border-noir/[0.06] pb-8">
        <h1
          className="font-display text-[32px] font-normal leading-none text-black"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {displayName}
        </h1>
        {profile?.role === 'admin' && (
          <span className="mt-3 inline-block rounded-[2px] bg-noir/[0.07] px-2 py-1 text-[8px] font-normal uppercase tracking-[0.12em] text-black/55">
            Admin
          </span>
        )}
      </header>

      {error && <p className="mb-4 text-[11px] text-red-500/90">{error}</p>}

      <section className="mb-10 rounded-[2px] border border-noir/[0.06] bg-white p-6">
        <SectionTitle>Identité</SectionTitle>
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">E-mail</p>
            <div className="flex items-center gap-2 text-[13px] text-black/70">
              <Mail size={14} className="shrink-0 opacity-45" aria-hidden />
              <span>{profile?.email ?? '—'}</span>
            </div>
            <p className="mt-1.5 text-[10px] font-light leading-relaxed text-black/35">
              L'e-mail de connexion ne se modifie pas ici. Changement = procédure manuelle (Auth / support).
            </p>
          </div>
          <div>
            <p className="mb-1 text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Identifiant (UUID)</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all text-[11px] text-black/55">{memberId}</code>
              <button
                type="button"
                onClick={copyId}
                className="inline-flex items-center gap-1 rounded-[2px] border border-noir/12 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-black/45 hover:border-noir/25 hover:text-black"
              >
                <Copy size={12} strokeWidth={1.5} /> Copier
              </button>
            </div>
          </div>
          <div>
            <p className="mb-1 text-[9px] font-normal uppercase tracking-[0.2em] text-black/35">Membre depuis</p>
            <p className="text-[12px] text-black/60">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : '—'}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-10 rounded-[2px] border border-noir/[0.06] bg-white p-6">
        <SectionTitle>Profil</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Prénom</label>
            <input
              className={inputClass}
              value={profileForm.first_name}
              onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Nom</label>
            <input
              className={inputClass}
              value={profileForm.last_name}
              onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Téléphone</label>
            <input
              className={inputClass}
              value={profileForm.phone}
              onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={savingProfile}
          onClick={saveProfile}
          className="mt-6 h-10 rounded-[2px] bg-noir px-6 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-45"
        >
          {savingProfile ? 'Enregistrement…' : 'Enregistrer le profil'}
        </button>
      </section>

      <section className="mb-10 rounded-[2px] border border-noir/[0.06] bg-white p-6">
        <SectionTitle>Abonnement</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Plan</label>
            <select
              className={inputClass}
              value={subForm.plan}
              onChange={(e) => setSubForm((s) => ({ ...s, plan: e.target.value as Subscription['plan'] }))}
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PLAN_LABEL[p] ?? p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Statut</label>
            <select
              className={inputClass}
              value={subForm.status}
              onChange={(e) => setSubForm((s) => ({ ...s, status: e.target.value as Subscription['status'] }))}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Début</label>
            <input
              type="date"
              className={inputClass}
              value={subForm.start_date}
              onChange={(e) => setSubForm((s) => ({ ...s, start_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Fin (optionnel)</label>
            <input
              type="date"
              className={inputClass}
              value={subForm.end_date}
              onChange={(e) => setSubForm((s) => ({ ...s, end_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[9px] uppercase tracking-[0.2em] text-black/35">Prix (€)</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={subForm.price}
              onChange={(e) => setSubForm((s) => ({ ...s, price: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="auto_renew"
              type="checkbox"
              checked={subForm.auto_renew}
              onChange={(e) => setSubForm((s) => ({ ...s, auto_renew: e.target.checked }))}
              className="h-4 w-4 rounded border-noir/20"
            />
            <label htmlFor="auto_renew" className="text-[12px] text-black/60">
              Renouvellement automatique
            </label>
          </div>
        </div>
        {subscription && (
          <div className="mt-4 border-t border-noir/[0.06] pt-4 text-[10px] font-light text-black/40">
            <p>
              Stripe subscription ID :{' '}
              <span className="font-mono text-[10px] text-black/55">{subscription.stripe_subscription_id ?? '—'}</span>
            </p>
          </div>
        )}
        <button
          type="button"
          disabled={savingSub}
          onClick={saveSubscription}
          className="mt-6 h-10 rounded-[2px] bg-noir px-6 text-[10px] font-normal uppercase tracking-[0.12em] text-white transition-colors hover:bg-anthracite disabled:opacity-45"
        >
          {savingSub ? 'Enregistrement…' : "Enregistrer l'abonnement"}
        </button>
      </section>

      {profile?.stripe_customer_id && (
        <section className="mb-10 rounded-[2px] border border-noir/[0.06] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[18px] font-normal text-black" style={{ fontFamily: 'var(--font-display)' }}>
              Abonnement Stripe
            </h2>
            {stripeData && (
              <span
                className={`rounded-[20px] border px-2.5 py-0.5 text-[9px] font-normal uppercase tracking-[0.1em] ${
                  stripeData.cancel_at_period_end
                    ? 'border-orange-200 bg-orange-50 text-orange-700'
                    : stripeData.status === 'active'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-noir/10 bg-noir/[0.03] text-black/45'
                }`}
              >
                {stripeData.cancel_at_period_end
                  ? `Annulation le ${new Date(stripeData.current_period_end * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                  : stripeData.status === 'active'
                    ? 'Actif'
                    : stripeData.status}
              </span>
            )}
          </div>

          {stripeLoading && (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-[2px] bg-noir/[0.05]" />
              ))}
            </div>
          )}

          {stripeError && !stripeLoading && (
            <p className="text-[11px] font-light text-black/40">{stripeError}</p>
          )}

          {stripeData && !stripeLoading && (
            <>
              {stripeData.cancel_at_period_end && (
                <div className="mb-4 rounded-[2px] border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] text-orange-800">
                  ⚠ Annulation programmée — accès Óra+ jusqu'au{' '}
                  {new Date(stripeData.current_period_end * 1000).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                </div>
              )}

              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-[2px] border border-noir/[0.07] bg-surface-muted p-3">
                  <p className="mb-1 text-[9px] uppercase tracking-[0.08em] text-black/35">Plan</p>
                  <p className="text-[13px] font-normal text-black">{stripeData.plan_name}</p>
                  <p className="text-[9px] text-black/40">
                    {(stripeData.amount / 100).toFixed(2).replace('.', ',')} € / mois
                  </p>
                </div>
                <div className="rounded-[2px] border border-noir/[0.07] bg-surface-muted p-3">
                  <p className="mb-1 text-[9px] uppercase tracking-[0.08em] text-black/35">Prochain prélèvement</p>
                  <p className="text-[13px] font-normal text-black">
                    {new Date(stripeData.current_period_end * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className="rounded-[2px] border border-noir/[0.07] bg-surface-muted p-3">
                  <p className="mb-1 text-[9px] uppercase tracking-[0.08em] text-black/35">Paiement</p>
                  {stripeData.payment_method ? (
                    <>
                      <p className="text-[13px] font-normal capitalize text-black">
                        {stripeData.payment_method.brand} ···· {stripeData.payment_method.last4}
                      </p>
                      <p className="text-[9px] text-black/40">
                        exp. {stripeData.payment_method.exp_month}/{String(stripeData.payment_method.exp_year).slice(-2)}
                      </p>
                    </>
                  ) : (
                    <p className="text-[12px] font-light text-black/35">—</p>
                  )}
                </div>
              </div>

              <p className="mb-4 font-mono text-[10px] text-black/40">
                {subscription?.stripe_subscription_id ?? '—'}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={openStripePortal}
                  disabled={openingPortal}
                  className="flex-1 h-9 rounded-[2px] border border-noir/10 px-4 text-[10px] uppercase tracking-[0.1em] text-black/55 transition-colors hover:border-noir/25 hover:text-black disabled:opacity-45"
                >
                  {openingPortal ? 'Ouverture…' : 'Portail Stripe ↗'}
                </button>
                {!stripeData.cancel_at_period_end && subscription?.stripe_subscription_id && (
                  confirmCancel ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-black/50">Confirmer l'annulation ?</span>
                      <button
                        type="button"
                        disabled={cancellingStripe}
                        onClick={cancelStripeSubscription}
                        className="h-9 rounded-[2px] border border-red-200 bg-red-50 px-4 text-[10px] uppercase tracking-[0.1em] text-red-700 hover:bg-red-100 disabled:opacity-45"
                      >
                        {cancellingStripe ? 'Annulation…' : 'Oui, annuler'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        className="h-9 rounded-[2px] border border-noir/10 px-3 text-[10px] text-black/45 hover:border-noir/25"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(true)}
                      className="h-9 rounded-[2px] border border-red-200 px-4 text-[10px] uppercase tracking-[0.1em] text-red-600 transition-colors hover:bg-red-50"
                    >
                      Annuler abonnement
                    </button>
                  )
                )}
              </div>
              <p className="mt-2 text-right text-[9px] font-light text-black/30">
                L'annulation prend effet à la fin de la période en cours
              </p>
            </>
          )}
        </section>
      )}

      <section className="mb-10 rounded-[2px] border border-noir/[0.06] bg-white p-6">
        <SectionTitle>Commandes</SectionTitle>
        {sectionErrors.orders ? (
          <p className="text-[12px] text-amber-800/90">{sectionErrors.orders}</p>
        ) : orders.length === 0 ? (
          <p className="text-[12px] font-light text-black/40">Aucune commande.</p>
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="border-b border-noir/[0.05] pb-4 last:border-0 last:pb-0">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[12px] font-normal text-black">
                    {new Date(o.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span className="text-[11px] text-black/45">
                    {ORDER_STATUS_LABEL[o.status] ?? o.status} · {o.total.toFixed(2).replace('.', ',')} €
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] text-black/55">
                  {o.order_items?.map((it) => (
                    <li key={it.id}>
                      {it.product_name} × {it.quantity} — {it.price_at_time.toFixed(2).replace('.', ',')} € / u.
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10 rounded-[2px] border border-noir/[0.06] bg-white p-6">
        <SectionTitle>Bilans</SectionTitle>
        {sectionErrors.bilans ? (
          <p className="text-[12px] text-amber-800/90">{sectionErrors.bilans}</p>
        ) : bilans.length === 0 ? (
          <p className="text-[12px] font-light text-black/40">Aucune réservation bilan.</p>
        ) : (
          <ul className="space-y-3">
            {bilans.map((b) => (
              <li key={b.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-noir/[0.05] pb-3 last:border-0">
                <div>
                  <p className="text-[12px] text-black">
                    {b.date_rdv}{' '}
                    {b.heure_rdv ? `· ${String(b.heure_rdv).slice(0, 5)}` : ''}
                  </p>
                  {b.notes && <p className="mt-1 max-w-md text-[11px] font-light text-black/45">{b.notes}</p>}
                </div>
                <span className="rounded-[2px] bg-noir/[0.05] px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-black/50">
                  {BILAN_STATUT_LABEL[b.statut] ?? b.statut}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10 rounded-[2px] border border-noir/[0.06] bg-white p-6">
        <SectionTitle>Événements</SectionTitle>
        {sectionErrors.events ? (
          <p className="text-[12px] text-amber-800/90">{sectionErrors.events}</p>
        ) : eventRegs.length === 0 ? (
          <p className="text-[12px] font-light text-black/40">Aucune inscription.</p>
        ) : (
          <ul className="space-y-3">
            {eventRegs.map((r) => (
              <li key={r.id} className="border-b border-noir/[0.05] pb-3 last:border-0">
                <p className="text-[13px] font-normal text-black">{r.events?.title ?? 'Événement'}</p>
                <p className="text-[11px] text-black/45">
                  {r.events?.date && <span>{r.events.date} · </span>}
                  {r.events?.type && <span className="uppercase tracking-wide">{r.events.type}</span>}
                </p>
                <p className="mt-1 text-[10px] text-black/30">
                  Inscrit le {new Date(r.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminMemberDetail;
