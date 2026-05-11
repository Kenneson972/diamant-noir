export interface MenuItem {
  label: string;
  href: string;
  icon: string;
}

export const adminMenuItems: MenuItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard" },
  { label: "Villas", href: "/admin/villas", icon: "Building2" },
  { label: "Réservations", href: "/admin/reservations", icon: "CalendarDays" },
  { label: "Clients", href: "/admin/clients", icon: "UserCircle" },
  { label: "Demandes", href: "/admin/demandes", icon: "ClipboardList" },
  { label: "Avis", href: "/admin/avis", icon: "Star" },
  { label: "Messagerie", href: "/admin/messagerie", icon: "MessageCircle" },
  { label: "Revenus", href: "/admin/revenus", icon: "DollarSign" },
  { label: "Sync OTA", href: "/admin/sync-ota", icon: "Zap" },
  { label: "Paramètres", href: "/admin/parametres", icon: "Settings" },
];
