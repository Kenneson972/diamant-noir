import { ClipboardList } from "lucide-react";
import type { Task } from "@/types/domain";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  villaMap: Map<string, string>;
}

export function TaskList({ tasks, villaMap }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="dashboard-card flex flex-col items-center py-12 text-center">
        <ClipboardList className="mb-3 h-10 w-10 text-muted" />
        <p className="text-sm font-medium text-muted">
          Aucune tâche pour le moment
        </p>
        <p className="mt-1 text-xs text-muted">
          Les tâches de maintenance apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          villaName={villaMap.get(task.villa_id ?? "")}
        />
      ))}
    </div>
  );
}
