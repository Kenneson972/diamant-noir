export interface TenantMenuItem {
  labelKey: string;
  href: string;
  icon: string;
  exact?: boolean;
}

export const tenantMenuItems: TenantMenuItem[] = [
  { labelKey: "client.nav_sejour", href: "/espace-client", icon: "Home", exact: true },
  { labelKey: "client.nav_livret", href: "/espace-client/livret", icon: "BookOpen" },
  { labelKey: "client.nav_favoris", href: "/espace-client/favoris", icon: "Heart" },
  { labelKey: "client.nav_messages", href: "/espace-client/messagerie", icon: "MessageCircle" },
  { labelKey: "client.nav_notifications", href: "/espace-client/notifications", icon: "Bell" },
  { labelKey: "client.nav_demandes", href: "/espace-client/demandes", icon: "ClipboardList" },
  { labelKey: "client.checklist", href: "/espace-client/checklist", icon: "CheckSquare" },
  { labelKey: "client.nav_profil", href: "/espace-client/profil", icon: "User" },
  { labelKey: "client.documents", href: "/espace-client/documents", icon: "FileText" },
  { labelKey: "client.concierge", href: "/espace-client/conciergerie", icon: "UserCircle" },
];
