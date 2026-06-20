"use client";

import {
  Calendar,
  DollarSign,
  Home,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface CopilotActionCardProps {
  action: string;
  result: { success: boolean; [key: string]: unknown };
}

export function CopilotActionCard({ action, result }: CopilotActionCardProps) {
  const config = getConfig(action, result);

  return (
    <div
      className="mt-3 rounded-lg border p-4"
      style={{
        borderColor: result.success
          ? "rgba(212,175,55,0.3)"
          : "rgba(239,68,68,0.3)",
        backgroundColor: result.success
          ? "rgba(212,175,55,0.04)"
          : "rgba(239,68,68,0.04)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-navy">
            {result.success ? config.title : config.errorTitle}
          </p>
          <p className="mt-1 text-[12px] text-navy/65">{config.detail}</p>
        </div>
      </div>
    </div>
  );
}

interface ActionConfig {
  icon: React.ReactNode;
  title: string;
  errorTitle: string;
  detail: string;
}

function getConfig(
  action: string,
  result: { success: boolean; [key: string]: unknown }
): ActionConfig {
  const fail = {
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    title: "",
    errorTitle: result.error
      ? String(result.error)
      : "Action non disponible",
    detail: "",
  };

  switch (action) {
    case "BLOCK_DATE": {
      if (!result.success) return { ...fail, errorTitle: "Blocage impossible" };
      return {
        icon: <Calendar className="h-4 w-4 text-gold" />,
        title: "Dates bloquées",
        errorTitle: "Blocage impossible",
        detail: "Les dates ont été bloquées avec succès.",
      };
    }
    case "SET_PRICE": {
      if (!result.success)
        return { ...fail, errorTitle: "Modification impossible" };
      const prev = (result as Record<string, unknown>).previous_price;
      const villa = (result as Record<string, unknown>)
        .villa as Record<string, unknown> | undefined;
      return {
        icon: <DollarSign className="h-4 w-4 text-gold" />,
        title: "Prix mis à jour",
        errorTitle: "Modification impossible",
        detail: `${villa?.name ?? "Villa"} : ${
          prev ? `${prev} € → ` : ""
        }${villa?.price_per_night ?? "?"} € / nuit`,
      };
    }
    case "SHOW_BOOKING": {
      if (!result.success)
        return { ...fail, errorTitle: "Recherche impossible" };
      const b = (result as Record<string, unknown>)
        .booking as Record<string, unknown> | undefined;
      if (!b) {
        return {
          icon: <Home className="h-4 w-4 text-gold" />,
          title: "Aucune réservation à venir",
          errorTitle: "",
          detail:
            "Vous n'avez pas de réservation confirmée pour le moment.",
        };
      }
      const amount = b.total_price_cents
        ? `${(Number(b.total_price_cents) / 100).toLocaleString(
            "fr-FR"
          )} €`
        : "—";
      return {
        icon: <Home className="h-4 w-4 text-gold" />,
        title: (b.guest_name as string) ?? "Réservation",
        errorTitle: "",
        detail: `${b.start_date ?? ""} → ${b.end_date ?? ""} · ${amount} · ${
          b.status ?? ""
        }`,
      };
    }
    default:
      return {
        icon: <CheckCircle className="h-4 w-4 text-gold" />,
        title: "Action effectuée",
        errorTitle: "Échec",
        detail: "",
      };
  }
}
