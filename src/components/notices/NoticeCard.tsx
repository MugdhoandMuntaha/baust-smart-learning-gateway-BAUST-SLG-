"use client";

import React from "react";
import { motion } from "framer-motion";
import Chip from "@mui/material/Chip";
import PushPinIcon from "@mui/icons-material/PushPin";
import type { Notice, NoticeCategory, CATEGORY_LABELS } from "@/types/notices";

interface NoticeCardProps {
  notice: Notice;
  index: number;
}

const CATEGORY_COLORS: Record<NoticeCategory, { bg: string; text: string; border: string }> = {
  exam: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  class_cancelled: { bg: "#F3E8FF", text: "#6B21A8", border: "#E9D5FF" },
  assignment: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  urgent: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
  general: { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
};

const CATEGORY_LABEL_MAP: Record<NoticeCategory, string> = {
  exam: "Exam",
  class_cancelled: "Class Cancelled",
  assignment: "Assignment",
  urgent: "Urgent",
  general: "General",
};

export default function NoticeCard({ notice, index }: NoticeCardProps) {
  const colors = CATEGORY_COLORS[notice.category];
  const formattedDate = new Date(notice.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-xl bg-white border border-[#E2E8F0] p-5 relative overflow-hidden transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Pin Indicator */}
      {notice.is_pinned && (
        <div className="absolute top-3 right-3">
          <PushPinIcon
            sx={{
              fontSize: 16,
              color: "#006B3F",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}

      {/* Pinned Accent Line */}
      {notice.is_pinned && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: "linear-gradient(90deg, #006B3F 0%, #FFD700 100%)",
          }}
        />
      )}

      {/* Category Badge */}
      <div className="flex items-center gap-2 mb-3">
        <Chip
          label={CATEGORY_LABEL_MAP[notice.category]}
          size="small"
          sx={{
            backgroundColor: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            fontWeight: 600,
            fontSize: "0.7rem",
            height: 26,
          }}
        />
        {notice.is_pinned && (
          <span className="text-[10px] font-semibold text-[#006B3F] uppercase tracking-wider">
            Pinned
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-[#1A202C] mb-2 pr-6">
        {notice.title}
      </h3>

      {/* Content */}
      <p className="text-sm text-[#4A5568] leading-relaxed mb-3 whitespace-pre-wrap">
        {notice.content}
      </p>

      {/* Timestamp */}
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-[#A0AEC0]" />
        <time className="text-xs text-[#A0AEC0]">{formattedDate}</time>
      </div>
    </motion.div>
  );
}
