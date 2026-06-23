import type { SidebarMenuItem } from "@/components/dashboard/shared/dashboard-sidebar-types";

export const proprioMenuItems: SidebarMenuItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: "LayoutDashboard", exact: true },

  {
    id: "proprio-activite",
    label: "Mon activité",
    icon: "Building2",
    group: "MES PROPRIÉTÉS",
    children: [
      { label: "Mes villas", href: "/dashboard/villas", icon: "Building2" },
      { label: "Réservations", href: "/dashboard/reservations", icon: "CalendarDays" },
      { label: "Tâches", href: "/dashboard/taches", icon: "ClipboardList" },
    ],
  },

  {
    id: "proprio-finances",
    label: "Performance",
    icon: "BarChart3",
    group: "FINANCES & SUIVI",
    children: [
      { label: "Revenus", href: "/dashboard/revenus", icon: "DollarSign" },
      { label: "Statistiques", href: "/dashboard/statistiques", icon: "BarChart3" },
    ],
  },

  {
    id: "proprio-services",
    label: "Services Kayvila",
    icon: "Sparkles",
    group: "SERVICES",
    children: [
      { label: "Mon concierge", href: "/dashboard/concierge", icon: "Sparkles" },
      { label: "Mes documents", href: "/dashboard/documents", icon: "FileText" },
    ],
  },
];
