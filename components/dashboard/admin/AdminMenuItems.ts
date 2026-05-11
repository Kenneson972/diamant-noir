export interface MenuItem {
  label: string;
  href: string;
  icon: string;
}

export const adminMenuItems: MenuItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard" },
  { label: "Hub classique", href: "/admin/hub-classique", icon: "LayoutGrid" },
  { label: "Villas", href: "/admin/villas", icon: "Building2" },
  { label: "Réservations", href: "/admin/reservations", icon: "CalendarDays" },
  { label: "Propriétaires", href: "/admin/proprietaires", icon: "Users" },
  { label: "Clients", href: "/admin/clients", icon: "UserCircle" },
  { label: "Assistant", href: "/admin/assistant", icon: "Sparkles" },
  { label: "Sync OTA", href: "/admin/sync-ota", icon: "Zap" },
  { label: "Soumissions", href: "/admin/submissions", icon: "Inbox" },
  { label: "Revenus", href: "/admin/revenus", icon: "DollarSign" },
  { label: "Paramètres", href: "/admin/parametres", icon: "Settings" },
];
