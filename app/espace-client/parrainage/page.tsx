"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Gift, Send, Copy, Check } from "lucide-react";
import { PageTopbar } from "@/components/espace-client/PageTopbar";
import { REFERRAL_STATUS_STYLES, REFERRAL_STATUS_LABELS } from "@/lib/constants";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `KAYVILA-${code}`;
}



export default function ParrainagePage() {
  const supabase = getSupabaseBrowser();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendEmail, setFriendEmail] = useState("");
  const [friendName, setFriendName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("referrals")
        .select("id, friend_email, friend_name, code, status, created_at")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      setReferrals(data ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !friendEmail.trim()) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }
    const code = generateCode();
    await supabase.from("referrals").insert({
      referrer_id: user.id,
      friend_email: friendEmail.trim(),
      friend_name: friendName.trim() || null,
      code,
      status: "invited",
    });
    setFriendEmail("");
    setFriendName("");
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    // Re-fetch
    const { data } = await supabase
      .from("referrals")
      .select("id, friend_email, friend_name, code, status, created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });
    setReferrals(data ?? []);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <>
      <PageTopbar title="Parrainage" />
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl text-navy">Parrainage</h1>
          <p className="text-sm text-navy/50 mt-1">Invitez vos amis et gagnez des avantages</p>
        </div>

        {/* Hero card */}
        <div className="border border-gold/30 bg-gold/[0.04] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
              <Gift size={18} className="text-gold" />
            </div>
            <div>
              <p className="font-display text-lg text-navy">Gagnez 100 € par ami qui réserve</p>
              <p className="text-sm text-navy/50 mt-1">
                Partagez votre code de parrainage. Quand un ami réserve avec votre code, vous recevez 100 € en bon d&apos;achat sur votre prochain séjour Kayvila.
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire invitation */}
        <form onSubmit={handleInvite} className="border border-navy/10 bg-white p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50">Inviter un ami</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              required
              placeholder="Email de votre ami"
              className="border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/50"
            />
            <input
              type="text"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="Prénom (optionnel)"
              className="border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/50"
            />
          </div>
          {sent && (
            <p className="text-[11px] text-emerald-600 font-medium">✓ Invitation envoyée !</p>
          )}
          <button
            type="submit"
            disabled={sending || !friendEmail.trim()}
            className="inline-flex items-center gap-1.5 bg-navy px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={12} />
            {sending ? "Envoi..." : "Envoyer l'invitation"}
          </button>
        </form>

        {/* Dashboard filleuls */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-3">Mes filleuls</p>
          {loading ? (
            <p className="text-sm text-navy/40">Chargement...</p>
          ) : referrals.length === 0 ? (
            <div className="border border-navy/10 bg-white p-8 text-center">
              <Gift size={24} className="text-navy/15 mx-auto mb-2" />
              <p className="text-sm text-navy/40">Aucun filleul pour le moment</p>
              <p className="text-[11px] text-navy/30 mt-1">Invitez vos amis pour commencer à cumuler des avantages.</p>
            </div>
          ) : (
            <div className="space-y-[1px] border border-navy/[0.07] bg-navy/[0.04]">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-offwhite px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy truncate">
                      {r.friend_name ? `${r.friend_name} (${r.friend_email})` : r.friend_email}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${REFERRAL_STATUS_STYLES[r.status] ?? "bg-gray-50 text-gray-600"}`}>
                        {REFERRAL_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                      <button
                        onClick={() => copyCode(r.code)}
                        className="inline-flex items-center gap-1 text-[10px] text-navy/40 hover:text-gold transition-colors"
                      >
                        {copied === r.code ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                        {copied === r.code ? "Copié !" : r.code}
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] text-navy/30 shrink-0 ml-4">
                    {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
