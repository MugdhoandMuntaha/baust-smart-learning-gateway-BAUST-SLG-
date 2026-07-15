"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Deadline } from "@/types/deadlines";
import {
  getUrgencyLevel,
  getTimeRemaining,
  DEADLINE_CATEGORY_ICONS,
  DEADLINE_CATEGORY_LABELS,
  type UrgencyLevel,
} from "@/types/deadlines";
import Chip from "@mui/material/Chip";

interface DeadlineCardProps {
  deadline: Deadline;
  index: number;
}

const URGENCY_STYLES: Record<UrgencyLevel, { bg: string; border: string; accent: string; text: string }> = {
  critical: {
    bg: "linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, rgba(254, 226, 226, 0.5) 100%)",
    border: "#FECACA",
    accent: "#DC2626",
    text: "#991B1B",
  },
  warning: {
    bg: "linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(254, 243, 199, 0.5) 100%)",
    border: "#FDE68A",
    accent: "#F59E0B",
    text: "#92400E",
  },
  safe: {
    bg: "linear-gradient(135deg, rgba(22, 163, 74, 0.06) 0%, rgba(220, 252, 231, 0.5) 100%)",
    border: "#BBF7D0",
    accent: "#16A34A",
    text: "#166534",
  },
};

export default function DeadlineCard({ deadline, index }: DeadlineCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(deadline.due_date));
  const [urgency, setUrgency] = useState(getUrgencyLevel(deadline.due_date));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadline.due_date));
      setUrgency(getUrgencyLevel(deadline.due_date));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [deadline.due_date]);

  const styles = URGENCY_STYLES[urgency];
  const dueDate = new Date(deadline.due_date);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-xl bg-white overflow-hidden transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
      }}
    >
      {/* Urgency Accent */}
      <div
        className="h-1"
        style={{ backgroundColor: styles.accent }}
      />

      <div className="p-5">
        {/* Top Row */}
        <div className="flex items-start justify-between mb-3">
          <Chip
            label={`${DEADLINE_CATEGORY_ICONS[deadline.category]} ${DEADLINE_CATEGORY_LABELS[deadline.category]}`}
            size="small"
            sx={{
              backgroundColor: "rgba(255,255,255,0.7)",
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 26,
              border: `1px solid ${styles.border}`,
            }}
          />
          <div
            className={`text-xs font-bold px-2 py-1 rounded-md ${urgency === "critical" ? "animate-pulse-soft" : ""}`}
            style={{
              color: styles.text,
              backgroundColor: `${styles.accent}15`,
              border: `1px solid ${styles.accent}30`,
            }}
          >
            {timeRemaining}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-[#1A202C] mb-1">
          {deadline.title}
        </h3>

        {/* Description */}
        {deadline.description && (
          <p className="text-sm text-[#4A5568] mb-3 leading-relaxed">
            {deadline.description}
          </p>
        )}

        {/* Due Date */}
        <div className="flex items-center gap-2 text-xs text-[#4A5568]">
          <span>📅</span>
          <span>
            {dueDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {" at "}
            {dueDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
