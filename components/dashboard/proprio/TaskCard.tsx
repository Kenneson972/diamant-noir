import Link from "next/link";
import { Calendar, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/domain";
import { TaskStatusBadge } from "./TaskStatusBadge";

interface TaskCardProps {
  task: Pick<
    Task,
    "id" | "title" | "description" | "status" | "due_date" | "villa_id"
  >;
  villaName?: string;
}

export function TaskCard({ task, villaName }: TaskCardProps) {
  const formattedDate = task.due_date
    ? format(new Date(task.due_date), "dd MMM yyyy", { locale: fr })
    : null;

  return (
    <Link
      href={`/dashboard/taches/${task.id}`}
      className={cn(
        "group block rounded-lg border border-gray-200 bg-white p-4 shadow-sm",
        "transition-all duration-200 hover:border-gold/30 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 text-navy/40" />
            <h3 className="truncate text-sm font-semibold text-navy group-hover:text-gold transition-colors">
              {task.title}
            </h3>
          </div>

          {task.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-navy/60">
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-navy/50">
            {formattedDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formattedDate}
              </span>
            )}

            {villaName && (
              <span className="inline-flex items-center gap-1 rounded bg-cream px-1.5 py-0.5 text-navy/60">
                {villaName}
              </span>
            )}
          </div>
        </div>

        <TaskStatusBadge status={task.status} />
      </div>
    </Link>
  );
}
