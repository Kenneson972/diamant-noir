import type { SidebarMenuItem } from "@/components/dashboard/shared/dashboard-sidebar-types";

/**
 * Navigation admin — parents métier + enfants actionnables.
 * Les parents n'ont pas de href : expand/collapse HeroUI Sidebar uniquement.
 */
export const adminMenuItems: SidebarMenuItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard", exact: true },

  {
    id: "admin-gestion-patrimoine",
    label: "Patrimoine",
    icon: "Building2",
    group: "GESTION",
    children: [
      { label: "Villas", href: "/admin/villas", icon: "Building2" },
      { label: "Soumissions", href: "/admin/soumissions", icon: "Home" },
    ],
  },
  {
    id: "admin-gestion-sejours",
    label: "Séjours & demandes",
    icon: "CalendarDays",
    group: "GESTION",
    children: [
      { label: "Réservations", href: "/admin/reservations", icon: "CalendarDays" },
      { label: "Demandes", href: "/admin/demandes", icon: "ClipboardList" },
    ],
  },
  {
    id: "admin-gestion-acteurs",
    label: "Clients & propriétaires",
    icon: "Users",
    group: "GESTION",
    children: [
      { label: "Clients", href: "/admin/clients", icon: "UserCircle" },
      { label: "Propriétaires", href: "/admin/proprietaires", icon: "Users" },
    ],
  },

  {
    id: "admin-finances-canaux",
    label: "Finances & canaux",
    icon: "DollarSign",
    group: "FINANCES",
    children: [
      { label: "Revenus", href: "/admin/revenus", icon: "DollarSign" },
      { label: "Tarification", href: "/admin/tarification", icon: "Percent" },
      { label: "Sync OTA", href: "/admin/sync-ota", icon: "Zap" },
    ],
  },

  {
    id: "admin-relation-client",
    label: "Relation client",
    icon: "MessageCircle",
    group: "OUTILS",
    children: [
      { label: "Avis", href: "/admin/avis", icon: "Star" },
      { label: "Messagerie", href: "/admin/messagerie", icon: "MessageCircle" },
    ],
  },
  {
    label: "Concierge IA",
    href: "/admin/concierge",
    icon: "Sparkles",
    group: "OUTILS",
  },
  {
    label: "Documents",
    href: "/admin/documents",
    icon: "FileText",
    group: "OUTILS",
  },
  {
    label: "Paramètres",
    href: "/admin/parametres",
    icon: "Settings",
    group: "OUTILS",
  },
];
