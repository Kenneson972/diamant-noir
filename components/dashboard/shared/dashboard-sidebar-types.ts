export type SidebarMenuItem = {
  /** Identifiant stable pour les entrées parent (sans href) */
  id?: string;
  label: string;
  /** Absent sur les parents — navigation via les enfants uniquement */
  href?: string;
  icon: string;
  exact?: boolean;
  badge?: number;
  group?: string;
  children?: SidebarMenuItem[];
};
