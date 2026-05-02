import type { TaskStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "À faire",
    className: "bg-gray-100 text-gray-600",
  },
  in_progress: {
    label: "En cours",
    className: "bg-yellow-100 text-yellow-700",
  },
  completed: {
    label: "Terminée",
    className: "bg-green-100 text-green-700",
  },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
