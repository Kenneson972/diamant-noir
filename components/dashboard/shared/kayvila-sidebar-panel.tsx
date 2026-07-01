"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Key } from "@react-types/shared";
import { usePathname } from "next/navigation";
import { Sidebar, useSidebar } from "@heroui-pro/react/sidebar";
import { Button } from "@heroui/react";
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { DashboardNavIcon } from "@/components/dashboard/shared/dashboard-nav-icon";
import type { SidebarMenuItem } from "@/components/dashboard/shared/dashboard-sidebar-types";

function getItemId(item: SidebarMenuItem): string {
  return item.id ?? item.href ?? item.label;
}

function isItemCurrent(item: SidebarMenuItem, pathname: string) {
  if (!item.href) return false;
  return item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);
}

function hasActiveDescendant(item: SidebarMenuItem, pathname: string): boolean {
  if (isItemCurrent(item, pathname)) return true;
  return item.children?.some((child) => hasActiveDescendant(child, pathname)) ?? false;
}

function collectExpandedKeys(items: SidebarMenuItem[], pathname: string): Set<Key> {
  const keys = new Set<Key>();
  const walk = (nodes: SidebarMenuItem[]) => {
    for (const node of nodes) {
      if (!node.children?.length) continue;
      if (hasActiveDescendant(node, pathname)) {
        keys.add(getItemId(node));
      }
      walk(node.children);
    }
  };
  walk(items);
  return keys;
}

function SidebarIcon({ name, nested = false }: { name: string; nested?: boolean }) {
  return <DashboardNavIcon name={name} size={nested ? 18 : 22} />;
}

function SidebarMenuItemNode({
  item,
  pathname,
  nested = false,
}: {
  item: SidebarMenuItem;
  pathname: string;
  nested?: boolean;
}) {
  const itemId = getItemId(item);
  const current = isItemCurrent(item, pathname);
  const branchActive = hasActiveDescendant(item, pathname);

  if (item.children?.length) {
    return (
      <Sidebar.MenuItem
        id={itemId}
        isCurrent={branchActive}
        textValue={item.label}
        tooltip={item.label}
      >
        <Sidebar.MenuItemContent>
          <Sidebar.MenuIcon>
            <SidebarIcon name={item.icon} />
          </Sidebar.MenuIcon>
          <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
          {item.badge != null && item.badge > 0 ? (
            <Sidebar.MenuChip>{item.badge > 99 ? "99+" : item.badge}</Sidebar.MenuChip>
          ) : null}
          <Sidebar.MenuIndicator />
        </Sidebar.MenuItemContent>
        <Sidebar.Submenu>
          {item.children.map((child) => (
            <SidebarMenuItemNode
              key={getItemId(child)}
              item={child}
              pathname={pathname}
              nested
            />
          ))}
        </Sidebar.Submenu>
      </Sidebar.MenuItem>
    );
  }

  return (
    <Sidebar.MenuItem
      id={itemId}
      href={item.href}
      isCurrent={current}
      textValue={item.label}
      tooltip={item.label}
    >
      <Sidebar.MenuItemContent>
        {!nested ? (
          <Sidebar.MenuIcon>
            <SidebarIcon name={item.icon} nested={nested} />
          </Sidebar.MenuIcon>
        ) : null}
        <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
        {item.badge != null && item.badge > 0 ? (
          <Sidebar.MenuChip>{item.badge > 99 ? "99+" : item.badge}</Sidebar.MenuChip>
        ) : null}
      </Sidebar.MenuItemContent>
    </Sidebar.MenuItem>
  );
}

type MenuBlock = { heading?: string; items: SidebarMenuItem[] };

function groupMenuItems(menu: SidebarMenuItem[]): MenuBlock[] {
  const blocks: MenuBlock[] = [];
  let current: MenuBlock | null = null;

  for (const item of menu) {
    if (!item.group) {
      blocks.push({ items: [item] });
      current = null;
      continue;
    }
    if (!current || current.heading !== item.group) {
      current = { heading: item.group, items: [] };
      blocks.push(current);
    }
    current.items.push(item);
  }

  return blocks;
}

export type KayvilaSidebarPanelProps = {
  role: "admin" | "owner" | "tenant";
  roleLabel: string;
  menu: SidebarMenuItem[];
  userName?: string;
  userEmail?: string;
  onSignOut: () => void;
};

function SidebarInner({
  role,
  roleLabel,
  menu,
  userName,
  userEmail,
  onSignOut,
}: KayvilaSidebarPanelProps) {
  const pathname = usePathname() ?? "";
  const { toggleSidebar, isOpen } = useSidebar();
  const displayName = userName ?? userEmail ?? roleLabel;
  const homeHref =
    role === "admin" ? "/admin" : role === "owner" ? "/dashboard" : "/espace-client";

  const blocks = useMemo(() => groupMenuItems(menu), [menu]);
  const expandedKeys = useMemo(() => collectExpandedKeys(menu, pathname), [menu, pathname]);

  return (
    <>
      <Sidebar.Header className="border-b border-navy/10 px-4 py-5">
        <Link href={homeHref} className="flex items-center gap-2 no-underline">
          <span className="font-display-dashboard text-xl font-semibold tracking-wide text-gold">
            Kayvila
          </span>
          <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
            {roleLabel}
          </span>
        </Link>
      </Sidebar.Header>

      <Sidebar.Content className="px-2 py-4">
        <Sidebar.Menu
          aria-label={`Navigation ${roleLabel.toLowerCase()}`}
          expandedKeys={expandedKeys}
          showGuideLines="hover"
        >
          {blocks.map((block) =>
            block.heading ? (
              <Sidebar.MenuSection key={block.heading} id={block.heading}>
                <Sidebar.MenuHeader>{block.heading}</Sidebar.MenuHeader>
                {block.items.map((item) => (
                  <SidebarMenuItemNode
                    key={getItemId(item)}
                    item={item}
                    pathname={pathname}
                  />
                ))}
              </Sidebar.MenuSection>
            ) : (
              block.items.map((item) => (
                <SidebarMenuItemNode key={getItemId(item)} item={item} pathname={pathname} />
              ))
            )
          )}
        </Sidebar.Menu>
      </Sidebar.Content>

      <Sidebar.Footer className="mt-auto border-t border-navy/10 px-3 py-4">
        <div className="rounded-lg bg-navy/5 px-3 py-2">
          <p className="truncate text-[11px] font-medium text-navy/90" title={displayName}>
            {displayName}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy/45">
            {roleLabel}
          </p>
        </div>

        <Button
          className="mt-3 w-full justify-start gap-2 text-navy/85 hover:bg-navy/10"
          variant="ghost"
          onPress={onSignOut}
        >
          <LogOut className="size-4 opacity-80" aria-hidden />
          Déconnexion
        </Button>

        <Link
          href="/"
          className="mt-2 block px-2 py-2 text-xs text-navy/65 no-underline transition-colors hover:text-navy"
        >
          Retour au site public
        </Link>

        <Button
          className="mt-2 hidden w-full justify-start gap-2 text-navy/55 hover:bg-navy/10 md:inline-flex"
          variant="ghost"
          onPress={toggleSidebar}
          aria-label={isOpen ? "Réduire le menu" : "Étendre le menu"}
        >
          {isOpen ? (
            <>
              <PanelLeftClose className="size-4" aria-hidden />
              Réduire
            </>
          ) : (
            <>
              <PanelLeftOpen className="size-4" aria-hidden />
              Étendre
            </>
          )}
        </Button>
      </Sidebar.Footer>
    </>
  );
}

export function KayvilaSidebarPanel(props: KayvilaSidebarPanelProps) {
  return (
    <>
      <Sidebar className="kayvila-sidebar hidden border-r border-navy/10 md:flex">
        <SidebarInner {...props} />
        <Sidebar.Rail />
      </Sidebar>

      <Sidebar.Mobile backdrop="opaque" className="kayvila-sidebar">
        <SidebarInner {...props} />
      </Sidebar.Mobile>
    </>
  );
}

/** Fil d'Ariane — parcourt parents et enfants */
export function findSidebarBreadcrumb(
  menu: SidebarMenuItem[],
  pathname: string
): { parent?: string; current: string } | null {
  for (const item of menu) {
    if (item.children?.length) {
      const child = item.children.find((c) => isItemCurrent(c, pathname));
      if (child) return { parent: item.label, current: child.label };
      const nested = findSidebarBreadcrumb(item.children, pathname);
      if (nested) {
        return nested.parent
          ? nested
          : { parent: item.label, current: nested.current };
      }
      if (isItemCurrent(item, pathname)) {
        return { current: item.label };
      }
      continue;
    }
    if (isItemCurrent(item, pathname)) {
      return { current: item.label };
    }
  }
  return null;
}
