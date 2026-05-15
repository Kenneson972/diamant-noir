"use client";

import { useState, useEffect } from "react";
import { CreditCard, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface StripeConnectButtonProps {
  ownerId: string;
  isOnboarded: boolean;
  /** Si la page a été chargée avec ?connect=success, le serveur l'a déjà traité */
  connectDone?: boolean;
}

export const StripeConnectButton = ({ ownerId, isOnboarded, connectDone }: StripeConnectButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(isOnboarded || connectDone || false);
  const [checkingConnect, setCheckingConnect] = useState(false);

  useEffect(() => {
    // Si pas connecté mais le serveur dit qu'on devrait l'être → vérifier
    if (connected) return;
    if (connectDone) {
      setConnected(true);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("connect") === "success") {
      setCheckingConnect(true);
      console.log("[StripeConnect] Détecté ?connect=success, vérification...");

      fetch("/api/stripe/connect-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("[StripeConnect] Réponse verify:", data);
          if (data.connected) {
            setConnected(true);
            window.history.replaceState({}, "", "/dashboard");
          } else if (data.error) {
            setError(data.error);
          } else {
            setError(
              "Votre compte Stripe est en cours de validation. " +
              "Vérifiez que vous avez bien complété toutes les étapes chez Stripe, " +
              "puis rafraîchissez la page."
            );
          }
        })
        .catch((err) => {
          console.error("[StripeConnect] Erreur fetch:", err);
          setError("Erreur de vérification du compte Stripe");
        })
        .finally(() => {
          setCheckingConnect(false);
          window.history.replaceState({}, "", "/dashboard");
        });
    }
  }, [ownerId, connected, connectDone]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/connect-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur de connexion Stripe");
      }

      if (data.already_onboarded) {
        setConnected(true);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (checkingConnect) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <Loader2 size={20} className="shrink-0 animate-spin text-blue-600" />
        <div>
          <p className="text-sm font-bold text-blue-800">Vérification de votre compte Stripe…</p>
          <p className="text-xs text-blue-600">Cela prend quelques secondes</p>
        </div>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
        <CheckCircle2 size={20} className="shrink-0 text-green-600" />
        <div>
          <p className="text-sm font-bold text-green-800">Compte bancaire connecté</p>
          <p className="text-xs text-green-600">
            Les reversements seront automatiques après chaque réservation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <AlertCircle size={20} className="shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-bold text-amber-800">Paiements non configurés</p>
          <p className="text-xs text-amber-600">
            Connectez votre compte bancaire pour recevoir les paiements de vos réservations
          </p>
        </div>
      </div>

      <button
        onClick={handleConnect}
        disabled={loading}
        className="group flex w-full items-center justify-center gap-3 rounded-xl bg-navy px-6 py-4 text-sm font-bold text-white transition-all hover:bg-gold hover:text-navy disabled:opacity-50 sm:w-auto"
      >
        <CreditCard size={18} />
        {loading ? "Connexion en cours…" : "Connecter mon compte Stripe"}
        <ExternalLink size={16} className="transition-transform group-hover:translate-x-1" />
      </button>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <p className="text-xs leading-relaxed text-navy/40">
        Vous serez redirigé vers Stripe pour configurer votre compte de réception des paiements.
        Le processus prend moins de 5 minutes.
      </p>
    </div>
  );
};
