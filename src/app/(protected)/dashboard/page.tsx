"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SchoolIcon from "@mui/icons-material/School";

const QUICK_LINKS = [
  {
    title: "Document Vault",
    description: "Download lecture sheets, PDFs, and study materials",
    href: "/documents",
    icon: <FolderOutlinedIcon sx={{ fontSize: 28 }} />,
    color: "#C9A800",
    bg: "linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(244, 208, 63, 0.05) 100%)",
    borderColor: "rgba(201, 168, 0, 0.2)",
  },
  {
    title: "Class Routine",
    description: "Check today's schedule and weekly timetable",
    href: "/routine",
    icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 28 }} />,
    color: "#1B4F72",
    bg: "linear-gradient(135deg, rgba(27, 79, 114, 0.08) 0%, rgba(36, 113, 163, 0.04) 100%)",
    borderColor: "rgba(27, 79, 114, 0.15)",
  },
  {
    title: "Deadline Tracker",
    description: "Track assignments, quizzes, and project due dates",
    href: "/deadlines",
    icon: <TimerOutlinedIcon sx={{ fontSize: 28 }} />,
    color: "#DC2626",
    bg: "linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, rgba(239, 68, 68, 0.03) 100%)",
    borderColor: "rgba(220, 38, 38, 0.12)",
  },
  {
    title: "Notice Board",
    description: "View pinned announcements and class updates",
    href: "/notices",
    icon: <CampaignOutlinedIcon sx={{ fontSize: 28 }} />,
    color: "#006B3F",
    bg: "linear-gradient(135deg, rgba(0, 107, 63, 0.08) 0%, rgba(0, 137, 90, 0.04) 100%)",
    borderColor: "rgba(0, 107, 63, 0.15)",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardPage() {
  const [settings, setSettings] = useState({
    university_name: "Bangladesh Army University of Science & Technology",
    department_name: "CSE",
    section_name: "Section A",
    batch_no: "Batch 19",
  });

  useEffect(() => {
    const supabase = createClient();
    async function loadSettings() {
      const { data } = await supabase
        .from("portal_settings")
        .select("*")
        .eq("id", "settings")
        .single();
      if (data) {
        setSettings({
          university_name: data.university_name,
          department_name: data.department_name,
          section_name: data.section_name,
          batch_no: data.batch_no,
        });
      }
    }
    loadSettings();
  }, []);

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good Morning"
      : now.getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants}>
        <div style={{ marginBottom: "8px" }}>
          <h1 className="text-2xl font-bold text-[#1A202C]">
            {greeting}
          </h1>
          <p className="text-sm text-[#4A5568] mt-1.5">
            Welcome to BAUST Smart Learning Gateway
          </p>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div variants={itemVariants}>
        <div
          className="rounded-xl p-5 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, #006B3F 0%, #1B4F72 100%)",
            boxShadow: "0 4px 20px rgba(0, 107, 63, 0.2)",
          }}
        >
          <div className="flex-1">
            <h3 className="text-white font-semibold text-base mb-1">
              {settings.department_name} {settings.section_name} • {settings.batch_no}
            </h3>
            <p className="text-white/70 text-sm">
              {settings.university_name}
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: "rgba(255, 215, 0, 0.2)",
              color: "#FFD700",
              border: "1px solid rgba(255, 215, 0, 0.3)",
            }}
          >
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </motion.div>

      {/* Quick Navigation Cards */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-[#1A202C] mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_LINKS.map((link, index) => {
            const isDocVault = link.title === "Document Vault";
            return (
              <motion.div
                key={link.href}
                variants={itemVariants}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className={isDocVault ? "sm:col-span-2" : ""}
              >
                <Link href={link.href} className="no-underline block">
                  <div
                    className="rounded-xl p-5 h-full transition-all duration-200 cursor-pointer group"
                    style={{
                      background: isDocVault 
                        ? "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(251, 191, 36, 0.04) 100%)"
                        : link.bg,
                      border: isDocVault ? "2px solid #F59E0B" : `1px solid ${link.borderColor}`,
                      boxShadow: isDocVault ? "0 10px 20px -3px rgba(245, 158, 11, 0.15), 0 4px 6px -2px rgba(245, 158, 11, 0.05)" : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div style={{ color: isDocVault ? "#D97706" : link.color }}>{link.icon}</div>
                      <div className="flex items-center gap-2">
                        <ArrowForwardIcon
                          sx={{
                            fontSize: 18,
                            color: isDocVault ? "#D97706" : link.color,
                            opacity: 0.4,
                            transition: "all 0.2s",
                          }}
                          className="group-hover:opacity-100 group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </div>
                    <h3
                      className="font-semibold text-base mb-1"
                      style={{ color: isDocVault ? "#D97706" : link.color }}
                    >
                      {link.title}
                    </h3>
                    <p className="text-sm text-[#4A5568] leading-relaxed">
                      {link.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
