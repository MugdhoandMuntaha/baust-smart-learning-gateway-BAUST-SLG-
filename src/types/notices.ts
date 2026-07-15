export type NoticeCategory =
  | "exam"
  | "class_cancelled"
  | "assignment"
  | "urgent"
  | "general";

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABELS: Record<NoticeCategory, string> = {
  exam: "Exam",
  class_cancelled: "Class Cancelled",
  assignment: "Assignment",
  urgent: "Urgent",
  general: "General",
};

export const CATEGORY_ICONS: Record<NoticeCategory, string> = {
  exam: "📝",
  class_cancelled: "🚫",
  assignment: "📋",
  urgent: "🚨",
  general: "📢",
};
