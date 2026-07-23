"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import Chip from "@mui/material/Chip";
import DeadlineCard from "@/components/deadlines/DeadlineCard";
import { createClient } from "@/lib/supabase/client";
import { useStudentScope } from "@/hooks/useStudentScope";
import type { Deadline, DeadlineCategory } from "@/types/deadlines";
import { getUrgencyLevel } from "@/types/deadlines";

const FILTER_OPTIONS: { label: string; value: DeadlineCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "📝 Assignment", value: "assignment" },
  { label: "❓ Quiz", value: "quiz" },
  { label: "🔬 Lab Report", value: "lab_report" },
  { label: "🧪 Lab Evaluation", value: "lab_evaluation" },
  { label: "🗣️ Viva", value: "viva" },
  { label: "🚀 Project", value: "project" },
  { label: "🎓 Mid Exam", value: "mid_exam" },
  { label: "✍️ Class Test (CT)", value: "ct" },
];

export default function DeadlinesPage() {
  const { scope, loading: scopeLoading } = useStudentScope();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [filter, setFilter] = useState<DeadlineCategory | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (scopeLoading || !scope) return;
    const s = scope;
    async function fetchDeadlines() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("deadlines")
        .select("*")
        .eq("level", s.level)
        .eq("term", s.term)
        .eq("section", s.section)
        .gte("due_date", new Date().toISOString())
        .order("due_date", { ascending: true });

      if (!error && data) {
        setDeadlines(data as Deadline[]);
      }
      setLoading(false);
    }
    fetchDeadlines();
  }, [scope, scopeLoading]);

  const filteredDeadlines =
    filter === "all"
      ? deadlines
      : deadlines.filter((d) => d.category === filter);

  // Sort by urgency for visual priority
  const sortedDeadlines = [...filteredDeadlines].sort((a, b) => {
    const urgencyOrder = { critical: 0, warning: 1, safe: 2 };
    return (
      urgencyOrder[getUrgencyLevel(a.due_date)] -
      urgencyOrder[getUrgencyLevel(b.due_date)]
    );
  });

  const criticalCount = deadlines.filter(
    (d) => getUrgencyLevel(d.due_date) === "critical"
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
              boxShadow: "0 4px 12px rgba(0, 107, 63, 0.25)",
            }}
          >
            <TimerOutlinedIcon sx={{ fontSize: 22, color: "#FFFFFF" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A202C]">
              Academic Schedule
            </h1>
            <p className="text-xs text-[#A0AEC0]">
              {deadlines.length} scheduled items{" "}
              {criticalCount > 0 && (
                <span className="text-[#DC2626] font-semibold">
                  • {criticalCount} urgent
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            size="small"
            onClick={() => setFilter(opt.value)}
            sx={{
              fontWeight: 500,
              fontSize: "0.75rem",
              cursor: "pointer",
              backgroundColor:
                filter === opt.value ? "#006B3F" : "#F1F5F9",
              color: filter === opt.value ? "#FFFFFF" : "#4A5568",
              "&:hover": {
                backgroundColor:
                  filter === opt.value ? "#004d2d" : "#E2E8F0",
              },
            }}
          />
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[#006B3F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#A0AEC0]">Loading schedule...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedDeadlines.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
          <TimerOutlinedIcon sx={{ fontSize: 48, color: "#E2E8F0", mb: 2 }} />
          <h3 className="text-base font-semibold text-[#4A5568] mb-1">
            {filter !== "all" ? "No schedule items in this category" : "All clear!"}
          </h3>
          <p className="text-sm text-[#A0AEC0]">
            {filter !== "all"
              ? "Try a different filter"
              : "No upcoming schedule items. Enjoy the breather!"}
          </p>
        </div>
      )}

      {/* Deadline Cards */}
      {!loading && sortedDeadlines.length > 0 && (
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedDeadlines.map((deadline, idx) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
                index={idx}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
