"use client";

import { DollarSign, XCircle } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

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
          <p className="mt-1 whitespace-pre-line text-[12px] text-navy/65">{config.detail}</p>
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
  // En cas d'échec : titre lisible (défini par chaque action) + vraie erreur en détail
  const fail = {
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    title: "",
    errorTitle: "Action impossible",
    detail: result.error
      ? String(result.error)
      : "L'action n'a pas pu être effectuée. Vérifiez votre demande et réessayez.",
  };

  switch (action) {
    case "BLOCK_DATE": {
      if (!result.success) return { ...fail, errorTitle: "Blocage impossible" };
      return {
        icon: <KayvilaPngIcon name="calendar" size={18} alt="" />,
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
      const list = ((result as Record<string, unknown>).bookings ??
        []) as Record<string, unknown>[];
      if (Array.isArray(list) && list.length > 1) {
        const fmt = (bk: Record<string, unknown>) => {
          const amt = bk.total_price_cents
            ? `${(Number(bk.total_price_cents) / 100).toLocaleString("fr-FR")} €`
            : "—";
          return `${(bk.guest_name as string) ?? "Réservation"} · ${bk.start_date ?? ""} → ${bk.end_date ?? ""} · ${amt} · ${bk.status ?? ""}`;
        };
        return {
          icon: <KayvilaPngIcon name="home" size={18} alt="" />,
          title: `${list.length} réservations`,
          errorTitle: "",
          detail: list.map(fmt).join("\n"),
        };
      }
      const b = (result as Record<string, unknown>)
        .booking as Record<string, unknown> | undefined;
      if (!b) {
        return {
          icon: <KayvilaPngIcon name="home" size={18} alt="" />,
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
        icon: <KayvilaPngIcon name="home" size={18} alt="" />,
        title: (b.guest_name as string) ?? "Réservation",
        errorTitle: "",
        detail: `${b.start_date ?? ""} → ${b.end_date ?? ""} · ${amount} · ${
          b.status ?? ""
        }`,
      };
    }
    default:
      return {
        icon: <KayvilaPngIcon name="check-circle" size={18} alt="" />,
        title: "Action effectuée",
        errorTitle: "Échec",
        detail: "",
      };
  }
}
