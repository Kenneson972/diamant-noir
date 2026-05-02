import { CalendarDays } from "lucide-react";

interface TodayEvent {
  kind: "check_in" | "check_out" | "stay";
  villa_name: string;
  guest_name: string;
  start_date: string;
  end_date: string;
}

interface TodayTimelineProps {
  events: TodayEvent[];
}

const kindConfig = {
  check_in: { label: "ARRIVÉE", dotColor: "dot-checkin" },
  check_out: { label: "DÉPART", dotColor: "dot-checkout" },
  stay: { label: "SÉJOUR", dotColor: "dot-stay" },
};

function formatTime(_dateStr: string): string {
  // Default check-in/out time display
  return "";
}

export function TodayTimeline({ events }: TodayTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="dashboard-card">
        <span className="dashboard-eyebrow">AUJOURD&apos;HUI</span>
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays
            className="mb-3 h-8 w-8 text-muted"
            aria-hidden
          />
          <p className="text-sm italic text-muted">
            Aucun événement aujourd&apos;hui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <span className="dashboard-eyebrow">AUJOURD&apos;HUI</span>

      <ul className="mt-4 space-y-3">
        {events.map((event, idx) => {
          const cfg = kindConfig[event.kind];
          return (
            <li key={idx} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dotColor}`}
                />
                {idx < events.length - 1 && (
                  <div className="mt-1 h-full w-px bg-border-subtle" />
                )}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {cfg.label}
                  </span>
                  {formatTime(event.start_date) && (
                    <span className="text-xs text-muted">
                      {formatTime(event.start_date)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-navy-900">
                  {event.guest_name}
                </p>
                <p className="text-xs text-muted">{event.villa_name}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
