export type DayOfWeek =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday";

export interface ClassSlot {
  id: string;
  day: DayOfWeek;
  start_time: string; // "HH:mm" format
  end_time: string;   // "HH:mm" format
  course_code: string;
  course_title: string;
  teacher_initials: string;
  room_number: string;
  created_at: string;
}

export type WeeklyRoutine = Record<DayOfWeek, ClassSlot[]>;

export const DAYS: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
};
