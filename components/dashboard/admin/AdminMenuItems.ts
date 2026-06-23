import type { SidebarMenuItem } from "@/components/dashboard/shared/DashboardSidebar";

export const adminMenuItems: SidebarMenuItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard", exact: true },

  { label: "Villas",         href: "/admin/villas",        icon: "Building2",    group: "GESTION" },
  { label: "Réservations",   href: "/admin/reservations",  icon: "CalendarDays", group: "GESTION" },
  { label: "Clients",        href: "/admin/clients",       icon: "UserCircle",   group: "GESTION" },
  { label: "Propriétaires",  href: "/admin/proprietaires", icon: "Users",        group: "GESTION" },
  { label: "Soumissions",    href: "/admin/soumissions",   icon: "Home",         group: "GESTION" },
  { label: "Demandes",       href: "/admin/demandes",      icon: "ClipboardList",group: "GESTION" },

  { label: "Revenus",        href: "/admin/revenus",       icon: "DollarSign",   group: "FINANCES" },
  {
    label: "Outils",
    href: "#",
    icon: "Zap",
    group: "FINANCES",
    children: [
      { label: "Tarification", href: "/admin/tarification", icon: "Percent" },
      { label: "Sync OTA",     href: "/admin/sync-ota",     icon: "Zap" },
    ],
  },

  { label: "Avis",         href: "/admin/avis",       icon: "Star",          group: "OUTILS" },
  { label: "Documents",    href: "/admin/documents",  icon: "FileText",      group: "OUTILS" },
  { label: "Messagerie",   href: "/admin/messagerie", icon: "MessageCircle", group: "OUTILS" },
  { label: "Concierge IA", href: "/admin/concierge",  icon: "Sparkles",      group: "OUTILS" },
  { label: "Paramètres",   href: "/admin/parametres", icon: "Settings",      group: "OUTILS" },
];
