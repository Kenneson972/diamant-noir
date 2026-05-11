export interface TenantMenuItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
}

export const tenantMenuItems: TenantMenuItem[] = [
  { label: "Séjour", href: "/espace-client", icon: "Home", exact: true },
  { label: "Livret", href: "/espace-client/livret", icon: "BookOpen" },
  { label: "Messages", href: "/espace-client/messagerie", icon: "MessageCircle" },
  { label: "Documents", href: "/espace-client/documents", icon: "FileText" },
  { label: "Conciergerie", href: "/espace-client/conciergerie", icon: "UserCircle" },
];
