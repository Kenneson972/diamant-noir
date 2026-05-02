import {
  LayoutDashboard,
  Home,
  CalendarDays,
  DollarSign,
  ClipboardList,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const proprioMenuItems: MenuItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mes Villas", href: "/dashboard/villas", icon: Home },
  { label: "Réservations", href: "/dashboard/reservations", icon: CalendarDays },
  { label: "Revenus", href: "/dashboard/revenus", icon: DollarSign },
  { label: "Tâches", href: "/dashboard/taches", icon: ClipboardList },
  { label: "Statistiques", href: "/dashboard/statistiques", icon: BarChart3 },
];
