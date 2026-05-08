import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import type { Task } from "@/types/domain";
import { TaskList } from "@/components/dashboard/proprio/TaskList";

export const metadata: Metadata = {
  title: "Tâches — Kayvila",
};

export default async function TasksPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch villas owned by user
  const { data: villas } = await supabase
    .from("villas")
    .select("id, name")
    .eq("owner_id", user!.id);

  if (!villas || villas.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Tâches de maintenance
        </h1>
        <TaskList tasks={[]} villaMap={new Map()} />
      </div>
    );
  }

  const villaIds = villas.map((v) => v.id);

  // Fetch tasks for user's villas
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .in("villa_id", villaIds)
    .order("created_at", { ascending: false });

  // Build villa name map
  const villaMap = new Map<string, string>(
    villas.map((v) => [v.id, v.name]),
  );

  const typedTasks = (tasks ?? []) as Task[];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">
        Tâches de maintenance
      </h1>
      <TaskList tasks={typedTasks} villaMap={villaMap} />
    </div>
  );
}
