import { DollarSign, Percent, UserCircle } from "lucide-react";
import type { KayvilaPngName } from "@/components/icons/KayvilaPngIcon";

export const KPI_ICONS: Record<string, KayvilaPngName | "lucide"> = {
  villa: "villa",
  calendar: "calendar",
  calendarCheck: "calendar",
  dollarSign: "lucide",
  percent: "lucide",
  trendingUp: "trending-up",
  userCircle: "lucide",
  users: "users",
  message: "message",
  star: "star",
  tasks: "doc",
};

export type KpiIconName = keyof typeof KPI_ICONS;

export function getKpiPngName(name: KpiIconName): KayvilaPngName | null {
  const icon = KPI_ICONS[name];
  if (icon === "lucide") return null;
  return icon;
}
