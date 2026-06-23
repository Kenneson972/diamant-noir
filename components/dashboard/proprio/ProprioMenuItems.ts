import type { SidebarMenuItem } from "@/components/dashboard/shared/DashboardSidebar";

export const proprioMenuItems: SidebarMenuItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: "LayoutDashboard", exact: true },

  { label: "Mes Villas",    href: "/dashboard/villas",        icon: "Building2",    group: "MES PROPRIÉTÉS" },
  { label: "Réservations",  href: "/dashboard/reservations",  icon: "CalendarDays", group: "MES PROPRIÉTÉS" },
  { label: "Tâches",        href: "/dashboard/taches",        icon: "ClipboardList",group: "MES PROPRIÉTÉS" },

  { label: "Revenus",       href: "/dashboard/revenus",       icon: "DollarSign",   group: "FINANCES & SUIVI" },
  { label: "Statistiques",  href: "/dashboard/statistiques",  icon: "BarChart3",    group: "FINANCES & SUIVI" },

  { label: "Mon concierge", href: "/dashboard/concierge",     icon: "Sparkles",     group: "SERVICES" },
  { label: "Mes documents", href: "/dashboard/documents",     icon: "FileText",     group: "SERVICES" },
];
