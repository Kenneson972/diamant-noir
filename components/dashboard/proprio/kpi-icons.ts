import {
  Building2,
  CalendarCheck,
  CalendarDays,
  DollarSign,
  Percent,
  TrendingUp,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

export const KPI_ICONS = {
  building2: Building2,
  calendarDays: CalendarDays,
  calendarCheck: CalendarCheck,
  dollarSign: DollarSign,
  percent: Percent,
  trendingUp: TrendingUp,
  userCircle: UserCircle,
  users: Users,
} as const;

export type KpiIconName = keyof typeof KPI_ICONS;

export function resolveKpiIcon(name: KpiIconName): LucideIcon {
  return KPI_ICONS[name];
}
