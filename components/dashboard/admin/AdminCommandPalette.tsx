"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CalendarDays, Search } from "lucide-react";
import { Command } from "@heroui-pro/react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { adminMenuItems } from "@/components/dashboard/admin/AdminMenuItems";
import type { SidebarMenuItem } from "@/components/dashboard/shared/dashboard-sidebar-types";
import { DashboardNavIcon } from "@/components/dashboard/shared/dashboard-nav-icon";

function flattenNavItems(
  items: SidebarMenuItem[],
  parentLabel?: string
): Array<{ key: string; label: string; href: string; icon: string }> {
  const flat: Array<{ key: string; label: string; href: string; icon: string }> = [];

  for (const item of items) {
    if (item.href) {
      flat.push({
        key: item.href,
        label: parentLabel ? `${parentLabel} · ${item.label}` : item.label,
        href: item.href,
        icon: item.icon,
      });
    }
    if (item.children?.length) {
      flat.push(...flattenNavItems(item.children, item.label));
    }
  }

  return flat;
}

const adminNavItems = flattenNavItems(adminMenuItems);

function NavIcon({ name, size = 16 }: { name: string; size?: number }) {
  return <DashboardNavIcon name={name} size={size} />;
}

type SearchBooking = {
  id: string;
  guest_name: string | null;
  villas?: { name: string } | null;
};

type SearchVilla = {
  id: string;
  name: string;
};

export function AdminCommandPalette() {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [bookings, setBookings] = useState<SearchBooking[]>([]);
  const [villas, setVillas] = useState<SearchVilla[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setLoading(true);
    const [{ data: bookingData }, { data: villaData }] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, guest_name, villas!bookings_villa_id_fkey(name)")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.from("villas").select("id, name").order("name").limit(12),
    ]);
    setBookings(bookingData ?? []);
    setVillas(villaData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) void loadData();
  }, [isOpen, loadData]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Command>
      <Command.Backdrop
        isOpen={isOpen}
        onOpenChange={setOpen}
      >
        <Command.Container>
          <Command.Dialog aria-label="Recherche admin">
            <Command.InputGroup>
              <Command.InputGroup.Prefix>
                <Search className="size-4 text-muted" />
              </Command.InputGroup.Prefix>
              <Command.InputGroup.Input placeholder="Rechercher une réservation, villa, page..." />
              <Command.InputGroup.ClearButton />
              <Command.InputGroup.Suffix>
                <kbd className="rounded border border-border-subtle px-1.5 py-0.5 text-[10px] text-muted">
                  Esc
                </kbd>
              </Command.InputGroup.Suffix>
            </Command.InputGroup>
            <Command.List>
              <Command.Group heading="Navigation">
                {adminNavItems.map((item) => (
                  <Command.Item
                    key={item.key}
                    textValue={item.label}
                    onAction={() => navigate(item.href)}
                  >
                    <NavIcon name={item.icon} />
                    <span>{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Réservations récentes">
                {loading ? (
                  <Command.Item isDisabled textValue="Chargement">
                    Chargement…
                  </Command.Item>
                ) : (
                  bookings.map((b) => (
                    <Command.Item
                      key={b.id}
                      textValue={`${b.guest_name ?? "Voyageur"} ${b.villas?.name ?? ""}`}
                      onAction={() => navigate(`/admin/reservations/${b.id}`)}
                    >
                      <CalendarDays size={18} strokeWidth={1.75} aria-hidden />
                      <span>
                        {b.guest_name ?? "Voyageur"}
                        {b.villas?.name ? ` — ${b.villas.name}` : ""}
                      </span>
                    </Command.Item>
                  ))
                )}
              </Command.Group>
              <Command.Group heading="Villas">
                {villas.map((v) => (
                  <Command.Item
                    key={v.id}
                    textValue={v.name}
                    onAction={() => navigate(`/admin/villas/${v.id}`)}
                  >
                    <Building2 size={18} strokeWidth={1.75} aria-hidden />
                    <span>{v.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
            <Command.Footer className="text-[10px] text-muted">
              <span>
                <kbd className="mr-1 rounded border px-1">⌘</kbd>
                <kbd className="rounded border px-1">K</kbd> pour ouvrir
              </span>
            </Command.Footer>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
}
