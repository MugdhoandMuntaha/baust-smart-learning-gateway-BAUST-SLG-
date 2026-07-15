export type DeadlineCategory =
  | "assignment"
  | "quiz"
  | "lab_report"
  | "project";

export type UrgencyLevel = "critical" | "warning" | "safe";

export interface Deadline {
  id: string;
  title: string;
  description: string | null;
  category: DeadlineCategory;
  due_date: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export const DEADLINE_CATEGORY_LABELS: Record<DeadlineCategory, string> = {
  assignment: "Assignment",
  quiz: "Quiz",
  lab_report: "Lab Report",
  project: "Project",
};

export const DEADLINE_CATEGORY_ICONS: Record<DeadlineCategory, string> = {
  assignment: "📝",
  quiz: "❓",
  lab_report: "🔬",
  project: "🚀",
};

export function getUrgencyLevel(dueDate: string): UrgencyLevel {
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const hoursLeft = (due - now) / (1000 * 60 * 60);

  if (hoursLeft < 24) return "critical";
  if (hoursLeft < 72) return "warning";
  return "safe";
}

export function getTimeRemaining(dueDate: string): string {
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diff = due - now;

  if (diff <= 0) return "Overdue";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}
