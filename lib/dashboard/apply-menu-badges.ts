import type { SidebarMenuItem } from "@/components/dashboard/shared/dashboard-sidebar-types";

function sumChildBadges(children: SidebarMenuItem[]): number {
  return children.reduce((total, child) => {
    const own = child.badge ?? 0;
    const nested = child.children?.length ? sumChildBadges(child.children) : 0;
    return total + own + nested;
  }, 0);
}

export function applyMenuBadges(
  items: SidebarMenuItem[],
  badgeMap: Record<string, number>
): SidebarMenuItem[] {
  return items.map((item) => {
    const children = item.children?.length
      ? applyMenuBadges(item.children, badgeMap)
      : undefined;

    const hrefBadge = item.href ? badgeMap[item.href] : undefined;
    const childBadgeSum = children?.length ? sumChildBadges(children) : 0;
    const badge =
      hrefBadge != null && hrefBadge > 0
        ? hrefBadge
        : childBadgeSum > 0
          ? childBadgeSum
          : item.badge;

    return {
      ...item,
      ...(children ? { children } : {}),
      ...(badge != null && badge > 0 ? { badge } : {}),
    };
  });
}
