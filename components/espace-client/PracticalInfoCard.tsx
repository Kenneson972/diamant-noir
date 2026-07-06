"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { KayvilaTenantWidget } from "@/components/ui/pro";

type PracticalVilla = {
  wifi_name?: string | null;
  wifi_password?: string | null;
  welcome_booklet_url?: string | null;
  checkout_instructions?: string | null;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copier ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // clipboard indisponible : rien à faire, la valeur est affichée
        }
      }}
      className="inline-flex size-11 shrink-0 items-center justify-center text-navy/45 transition-colors hover:text-gold"
    >
      {copied ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </button>
  );
}

export function PracticalInfoCard({
  villa,
  startDate,
  endDate,
  status,
}: {
  villa: PracticalVilla | null | undefined;
  startDate: string;
  endDate: string;
  status: string;
}) {
  // Sécurité : jamais de WiFi pour une résa non confirmée ou un séjour lointain
  const now = Date.now();
  const hoursUntilStart = (new Date(startDate).getTime() - now) / 3600000;
  const visible = status === "confirmed" && hoursUntilStart <= 24 && now < new Date(endDate).getTime();
  if (!visible || !villa) return null;

  const rows: { label: string; value: string; copyable?: boolean }[] = [];
  if (villa.wifi_name) rows.push({ label: "Réseau WiFi", value: villa.wifi_name, copyable: true });
  if (villa.wifi_password)
    rows.push({ label: "Mot de passe WiFi", value: villa.wifi_password, copyable: true });
  if (rows.length === 0 && !villa.welcome_booklet_url) return null;

  return (
    <KayvilaTenantWidget title="Infos pratiques">
      <dl className="divide-y divide-navy/5">
        {rows.map((row) => (
          <div key={row.label} className="flex min-h-[44px] items-center justify-between gap-3 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-navy/45">
              {row.label}
            </dt>
            <dd className="flex min-w-0 items-center gap-1">
              <span className="truncate text-sm font-medium text-navy">{row.value}</span>
              {row.copyable ? <CopyButton value={row.value} label={row.label} /> : null}
            </dd>
          </div>
        ))}
      </dl>
      {villa.welcome_booklet_url ? (
        <div className="mt-3">
          <a
            href={villa.welcome_booklet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold no-underline transition-colors hover:text-navy"
          >
            <KayvilaPngIcon name="book" size={18} alt="" aria-hidden />
            Livret d&apos;accueil
          </a>
        </div>
      ) : null}
    </KayvilaTenantWidget>
  );
}
