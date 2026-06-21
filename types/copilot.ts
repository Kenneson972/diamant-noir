export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /** Action déclenchée par l'assistant (ex: "SET_PRICE", "BLOCK_DATE", "SHOW_BOOKING") */
  action?: string;
  /** Résultat de l'action côté serveur */
  actionResult?: { success: boolean; [key: string]: unknown } | null;
  /** Action proposée nécessitant confirmation (admin) */
  proposedAction?: { action: string; action_data: Record<string, unknown> } | null;
}

export interface CopilotContextData {
  portfolio: {
    total_villas: number;
    published_villas: number;
    total_revenue_paid: number;
    revenue_current_month: number;
    revenue_last_month: number;
    upcoming_bookings_count: number;
    pending_tasks_count: number;
  };
  today: Array<{
    kind: "check_in" | "check_out" | "stay";
    villa_name: string;
    guest_name: string;
    start_date: string;
    end_date: string;
  }>;
  alerts: Array<{
    severity: "high" | "medium" | "low";
    title: string;
    body?: string;
  }>;
  tasks_preview: Array<{
    villa_name: string;
    content: string;
  }>;
  villas_summary: Array<{
    name: string;
    is_published: boolean;
  }>;
  current_date_iso: string;
}

export interface CopilotResponse {
  response: string;
  action?: string;
  action_data?: Record<string, unknown>;
  /** Résultat de l'action exécutée côté serveur */
  action_result?: { success: boolean; [key: string]: unknown } | null;
  proposed_action?: { action: string; action_data: Record<string, unknown> } | null;
  suggested_prompts?: string[];
}
