import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  UserCircle,
  DollarSign,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const adminMenuItems: MenuItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Villas", href: "/admin/villas", icon: Building2 },
  { label: "Propriétaires", href: "/admin/proprietaires", icon: Users },
  { label: "Réservations", href: "/admin/reservations", icon: CalendarDays },
  { label: "Clients", href: "/admin/clients", icon: UserCircle },
  { label: "Revenus", href: "/admin/revenus", icon: DollarSign },
  { label: "Paramètres", href: "/admin/parametres", icon: Settings },
];
