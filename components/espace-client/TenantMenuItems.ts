export interface TenantMenuItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
}

export const tenantMenuItems: TenantMenuItem[] = [
  { label: "Séjour", href: "/espace-client", icon: "Home", exact: true },
  { label: "Livret", href: "/espace-client/livret", icon: "BookOpen" },
  { label: "Favoris", href: "/espace-client/favoris", icon: "Heart" },
  { label: "Messages", href: "/espace-client/messagerie", icon: "MessageCircle" },
  { label: "Notifications", href: "/espace-client/notifications", icon: "Bell" },
  { label: "Demandes", href: "/espace-client/demandes", icon: "ClipboardList" },
  { label: "Documents", href: "/espace-client/documents", icon: "FileText" },
  { label: "Parrainage", href: "/espace-client/parrainage", icon: "Gift" },
  { label: "Conciergerie", href: "/espace-client/conciergerie", icon: "UserCircle" },
];
