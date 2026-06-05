export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
}

export const proprioMenuItems: MenuItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: "LayoutDashboard", exact: true },
  { label: "Mes Villas", href: "/dashboard/villas", icon: "Building2" },
  { label: "Réservations", href: "/dashboard/reservations", icon: "CalendarDays" },
  { label: "Revenus", href: "/dashboard/revenus", icon: "DollarSign" },
  { label: "Tâches", href: "/dashboard/taches", icon: "ClipboardList" },
  { label: "Statistiques", href: "/dashboard/statistiques", icon: "BarChart3" },
];
