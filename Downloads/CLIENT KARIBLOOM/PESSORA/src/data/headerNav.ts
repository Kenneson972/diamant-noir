import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CalendarDays,
  Home,
  Mail,
  Package,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

/** Navigation principale — alignée sur les routes réelles du site */
export const PRIMARY_NAV: {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Si true, actif seulement quand pathname === path exact */
  matchExact?: boolean;
}[] = [
  { label: 'Accueil', path: '/', icon: Home, matchExact: true },
  { label: 'Concept', path: '/concept', icon: BookOpen },
  { label: 'La carte', path: '/menu', icon: UtensilsCrossed },
  { label: 'Produits', path: '/nos-produits', icon: Package },
  { label: 'Óra+', path: '/ora-plus', icon: Sparkles },
  { label: 'Événements', path: '/evenements', icon: CalendarDays },
  { label: 'Contact', path: '/contact', icon: Mail },
];

export function isPrimaryNavActive(pathname: string, itemPath: string, matchExact?: boolean): boolean {
  if (matchExact) return pathname === itemPath;
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/** Barre secondaire type Nespresso : filtres par contexte */
export type SubNavItem = { label: string; href: string };

export const SUBNAV_MENU: SubNavItem[] = [
  { label: 'Tous', href: '/menu' },
  { label: 'Wellness', href: '/menu?gamme=wellness' },
  { label: 'Énergie', href: '/menu?gamme=energie' },
  { label: 'Shakes', href: '/menu?gamme=shakes' },
  { label: 'Coffee', href: '/menu?gamme=coffee' },
];

export const SUBNAV_EVENEMENTS: SubNavItem[] = [
  { label: 'Tous', href: '/evenements' },
  { label: 'Pop-up', href: '/evenements?type=popup' },
  { label: 'Atelier', href: '/evenements?type=atelier' },
  { label: 'Partenariats', href: '/evenements?type=partenariat' },
];

export const SUBNAV_PRODUITS: SubNavItem[] = [
  { label: 'Vue d’ensemble', href: '/nos-produits' },
  { label: 'Wellness', href: '/nos-produits/wellness' },
  { label: 'Sport', href: '/nos-produits/sport' },
  { label: 'Skin', href: '/nos-produits/skin' },
];

export function getSubNavForPath(pathname: string): SubNavItem[] | null {
  if (pathname === '/menu' || pathname.startsWith('/menu/')) return SUBNAV_MENU;
  if (pathname.startsWith('/evenements')) return SUBNAV_EVENEMENTS;
  if (pathname.startsWith('/nos-produits')) return SUBNAV_PRODUITS;
  return null;
}
