import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, ClipboardList, Home } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Task } from "@/types/domain";
import { TaskStatusBadge } from "@/components/dashboard/proprio/TaskStatusBadge";

interface PageProps {
  params: Promise<{ taskId: string }>;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { taskId } = await params;

  const supabase = await getSupabaseServer();

  // Fetch task
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) {
    notFound();
  }

  const typedTask = task as Task;

  // Fetch villa name
  const { data: villa } = typedTask.villa_id
    ? await supabase
        .from("villas")
        .select("name")
        .eq("id", typedTask.villa_id)
        .single()
    : { data: null };

  const formattedDueDate = typedTask.due_date
    ? format(new Date(typedTask.due_date), "dd MMMM yyyy", { locale: fr })
    : null;

  const formattedCreatedAt = format(
    new Date(typedTask.created_at),
    "dd MMMM yyyy",
    { locale: fr },
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/taches"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux tâches
      </Link>

      {/* Detail card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-navy/40" />
              <h1 className="text-xl font-bold text-navy">
                {typedTask.title}
              </h1>
            </div>

            <div className="mt-2">
              <TaskStatusBadge status={typedTask.status} />
            </div>
          </div>
        </div>

        {typedTask.description && (
          <div className="mt-6">
            <h2 className="mb-1 text-xs font-medium uppercase tracking-wider text-navy/40">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-navy/70">
              {typedTask.description}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-navy/40">
              <Calendar className="h-3.5 w-3.5" />
              Date limite
            </div>
            <p className="mt-1 text-sm font-medium text-navy">
              {formattedDueDate ?? "Non définie"}
            </p>
          </div>

          {villa?.name && (
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-navy/40">
                <Home className="h-3.5 w-3.5" />
                Villa
              </div>
              <p className="mt-1 text-sm font-medium text-navy">
                {villa.name}
              </p>
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-navy/40">
              <Calendar className="h-3.5 w-3.5" />
              Créée le
            </div>
            <p className="mt-1 text-sm font-medium text-navy">
              {formattedCreatedAt}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
