"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import Chip from "@mui/material/Chip";
import NoticeCard from "@/components/notices/NoticeCard";
import { createClient } from "@/lib/supabase/client";
import { useStudentScope } from "@/hooks/useStudentScope";
import type { Notice, NoticeCategory } from "@/types/notices";

const FILTER_OPTIONS: { label: string; value: NoticeCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Exam", value: "exam" },
  { label: "Assignment", value: "assignment" },
  { label: "Urgent", value: "urgent" },
  { label: "Cancelled", value: "class_cancelled" },
  { label: "General", value: "general" },
];

export default function NoticesPage() {
  const { scope, loading: scopeLoading } = useStudentScope();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filter, setFilter] = useState<NoticeCategory | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (scopeLoading || !scope) return;
    const s = scope;
    async function fetchNotices() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("level", s.level)
        .eq("term", s.term)
        .eq("section", s.section)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && data) {
        setNotices(data as Notice[]);
      }
      setLoading(false);
    }
    fetchNotices();
  }, [scope, scopeLoading]);

  const filteredNotices =
    filter === "all"
      ? notices
      : notices.filter((n) => n.category === filter);

  // Separate pinned and unpinned
  const pinned = filteredNotices.filter((n) => n.is_pinned);
  const unpinned = filteredNotices.filter((n) => !n.is_pinned);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
              boxShadow: "0 4px 12px rgba(0, 107, 63, 0.25)",
            }}
          >
            <CampaignOutlinedIcon sx={{ fontSize: 22, color: "#FFFFFF" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A202C]">Notice Board</h1>
            <p className="text-xs text-[#A0AEC0]">
              {notices.length} {notices.length === 1 ? "notice" : "notices"} posted
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[#006B3F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#A0AEC0]">Loading notices...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotices.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
          <CampaignOutlinedIcon sx={{ fontSize: 48, color: "#E2E8F0", mb: 2 }} />
          <h3 className="text-base font-semibold text-[#4A5568] mb-1">
            No notices yet
          </h3>
          <p className="text-sm text-[#A0AEC0]">
            {filter !== "all"
              ? "No notices found for this category"
              : "Notices posted by your CR will appear here"}
          </p>
        </div>
      )}

      {/* Pinned Notices */}
      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#006B3F] mb-3 flex items-center gap-1.5">
            📌 Pinned
          </p>
          <div className="grid grid-cols-1 gap-4">
            {pinned.map((notice, idx) => (
              <NoticeCard key={notice.id} notice={notice} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Notices */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A0AEC0] mb-3">
              Recent
            </p>
          )}
          <div className="grid grid-cols-1 gap-4">
            {unpinned.map((notice, idx) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                index={idx + pinned.length}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
