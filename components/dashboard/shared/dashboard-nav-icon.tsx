"use client";

import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  DollarSign,
  FileText,
  Home,
  LayoutDashboard,
  MessageCircle,
  Percent,
  Settings,
  Sparkles,
  Star,
  UserCircle,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  Building2,
  CalendarDays,
  UserCircle,
  DollarSign,
  Settings,
  Zap,
  FileText,
  ClipboardList,
  BarChart3,
  Percent,
  Users,
  Sparkles,
  Home,
  MessageCircle,
  Star,
};

type DashboardNavIconProps = {
  name: string;
  size?: number;
  className?: string;
};

/** Icônes Lucide pour la navigation dashboard (sidebar, command palette). */
export function DashboardNavIcon({
  name,
  size = 20,
  className = "shrink-0 text-current",
}: DashboardNavIconProps) {
  const Icon = ICON_MAP[name] ?? LayoutDashboard;
  return <Icon size={size} strokeWidth={1.75} className={className} aria-hidden />;
}
