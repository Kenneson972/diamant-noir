"use client";

import Link from "next/link";
import { Kanban, useKanban, useKanbanColumn } from "@heroui-pro/react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { formatDate } from "@/lib/utils";
import { KayvilaNumberValue } from "@/components/ui/pro";
import type { AdminBookingRow } from "@/components/dashboard/admin/AdminReservationsDataGrid";

export type KanbanBooking = AdminBookingRow & {
  pipelineColumn: PipelineColumn;
};

type PipelineColumn = "pending" | "confirmed" | "checkin" | "completed" | "cancelled";

const COLUMNS: { id: PipelineColumn; title: string }[] = [
  { id: "pending", title: "En attente" },
  { id: "confirmed", title: "Confirmées" },
  { id: "checkin", title: "Check-in" },
  { id: "completed", title: "Terminées" },
  { id: "cancelled", title: "Annulées" },
];

const COLUMN_INDICATOR: Record<PipelineColumn, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-emerald-500",
  checkin: "bg-gold",
  completed: "bg-navy/40",
  cancelled: "bg-red-400",
};

function resolvePipelineColumn(booking: AdminBookingRow, today: string): PipelineColumn {
  if (booking.status === "pending") return "pending";
  if (booking.status === "cancelled" || booking.status === "refunded") return "cancelled";
  if (booking.end_date < today) return "completed";
  if (booking.start_date === today) return "checkin";
  return "confirmed";
}

function pipelineToStatus(column: PipelineColumn): string {
  if (column === "pending") return "pending";
  if (column === "cancelled") return "cancelled";
  return "confirmed";
}

function toKanbanItems(rows: AdminBookingRow[]): KanbanBooking[] {
  const today = new Date().toISOString().split("T")[0];
  return rows.map((row) => ({
    ...row,
    pipelineColumn: resolvePipelineColumn(row, today),
  }));
}

function BookingKanbanCard({ booking }: { booking: KanbanBooking }) {
  const villaName = booking.villas?.name ?? booking.villa_id.slice(0, 8);
  const dates = `${formatDate(booking.start_date, { day: "numeric", month: "short" })} → ${formatDate(booking.end_date, { day: "numeric", month: "short" })}`;

  return (
    <div className="space-y-2 p-1">
      <Link
        href={`/admin/reservations/${booking.id}`}
        className="block font-medium text-navy hover:text-gold"
        onClick={(e) => e.stopPropagation()}
      >
        {booking.guest_name || "Anonyme"}
      </Link>
      <p className="text-[11px] text-muted">
        {villaName} · {dates}
      </p>
      <KayvilaNumberValue
        value={booking.total_price_cents ?? 0}
        format="currency"
        cents
        className="text-xs font-semibold text-gold"
      />
    </div>
  );
}

function KanbanColumnBoard({
  column,
  kanban,
}: {
  column: PipelineColumn;
  kanban: ReturnType<typeof useKanban<KanbanBooking>>;
}) {
  const { dragAndDropHooks, items } = useKanbanColumn(kanban, column);
  const meta = COLUMNS.find((c) => c.id === column)!;

  return (
    <Kanban.Column className="min-w-[220px] max-w-[260px] flex-1">
      <Kanban.ColumnHeader className="rounded-t-xl border border-border-subtle bg-white px-3 py-2">
        <Kanban.ColumnIndicator className={COLUMN_INDICATOR[column]} />
        <Kanban.ColumnTitle className="font-sora text-xs font-semibold uppercase tracking-wider text-navy">
          {meta.title}
        </Kanban.ColumnTitle>
        <Kanban.ColumnCount className="text-muted">{items.length}</Kanban.ColumnCount>
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody className="rounded-b-xl border border-t-0 border-border-subtle bg-navy/[0.02]">
        <Kanban.ScrollShadow>
          <Kanban.CardList
            aria-label={meta.title}
            dragAndDropHooks={dragAndDropHooks}
            items={items}
            renderEmptyState={() => (
              <div className="flex flex-col items-center gap-1.5 px-2 py-4 text-center">
                <KayvilaPngIcon name="message" size={20} alt="" />
                <p className="text-[11px] text-muted">Aucune réservation</p>
              </div>
            )}
          >
            {(booking) => (
              <Kanban.Card textValue={booking.guest_name ?? booking.id}>
                <BookingKanbanCard booking={booking} />
              </Kanban.Card>
            )}
          </Kanban.CardList>
        </Kanban.ScrollShadow>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
}

type AdminReservationsKanbanProps = {
  rows: AdminBookingRow[];
  onStatusChange: (id: string, status: string) => void;
};

export function AdminReservationsKanban({ rows, onStatusChange }: AdminReservationsKanbanProps) {
  const kanban = useKanban<KanbanBooking>({
    initialItems: toKanbanItems(rows),
    getColumn: (item) => item.pipelineColumn,
    getKey: (item) => item.id,
    setColumn: (item, column) => {
      const col = column as PipelineColumn;
      const nextStatus = pipelineToStatus(col);
      if (nextStatus !== item.status) {
        onStatusChange(item.id, nextStatus);
      }
      return { ...item, pipelineColumn: col, status: nextStatus };
    },
  });

  return (
    <div className="relative pb-2">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/40 md:hidden">
        Glissez horizontalement pour voir toutes les colonnes →
      </p>
      <div className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
      <Kanban hideScrollBar className="min-h-[420px] items-start gap-3">
        {COLUMNS.map((col) => (
          <KanbanColumnBoard key={col.id} column={col.id} kanban={kanban} />
        ))}
      </Kanban>
      </div>
    </div>
  );
}
