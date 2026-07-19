"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useStudentScope } from "@/hooks/useStudentScope";
import Link from "next/link";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SchoolIcon from "@mui/icons-material/School";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import DownloadIcon from "@mui/icons-material/Download";

// Countdown Timer sub-component
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true };
      }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOverdue: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isOverdue) {
    return (
      <span style={{ color: "#DC2626", fontWeight: 700, fontSize: 13 }}>
        Overdue / Time elapsed
      </span>
    );
  }

  const numberStyle = {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "20px",
    fontWeight: 800,
    color: "#0F172A",
    display: "inline-block",
    minWidth: "42px",
    textAlign: "center" as const,
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  };

  const labelStyle = {
    fontSize: "9px",
    color: "#64748B",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    marginTop: "6px",
    letterSpacing: "0.05em",
  };

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={numberStyle}>{timeLeft.days}</span>
        <span style={labelStyle}>Days</span>
      </div>
      <span style={{ fontSize: "20px", fontWeight: 800, color: "#CBD5E1", alignSelf: "flex-start", marginTop: "6px" }}>:</span>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={numberStyle}>{timeLeft.hours}</span>
        <span style={labelStyle}>Hours</span>
      </div>
      <span style={{ fontSize: "20px", fontWeight: 800, color: "#CBD5E1", alignSelf: "flex-start", marginTop: "6px" }}>:</span>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={numberStyle}>{timeLeft.minutes}</span>
        <span style={labelStyle}>Mins</span>
      </div>
      <span style={{ fontSize: "20px", fontWeight: 800, color: "#CBD5E1", alignSelf: "flex-start", marginTop: "6px" }}>:</span>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={numberStyle}>{timeLeft.seconds}</span>
        <span style={labelStyle}>Secs</span>
      </div>
    </div>
  );
}

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
  const { scope, loading: scopeLoading } = useStudentScope();
  const [notices, setNotices] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (scopeLoading || !scope) return;
    const s = scope;
    const supabase = createClient();
    async function loadDashboardData() {
      try {
        // Fetch notices (pinned first, then newest)
        const { data: noticesData } = await supabase
          .from("notices")
          .select("*")
          .eq("level", s.level)
          .eq("term", s.term)
          .eq("section", s.section)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(4);

        // Fetch upcoming deadlines (future only)
        const { data: deadlinesData } = await supabase
          .from("deadlines")
          .select("*")
          .eq("level", s.level)
          .eq("term", s.term)
          .eq("section", s.section)
          .order("due_date", { ascending: true });

        // Fetch readymade coverpage templates (limit 3)
        const { data: templatesData } = await supabase
          .from("generator_templates")
          .select("id, title, no, experiment_date, submission_date, courses!inner(id, name, code, teacher_name, teacher_designation, level, term, section)")
          .eq("type", "lab_report")
          .eq("courses.level", s.level)
          .eq("courses.term", s.term)
          .eq("courses.section", s.section)
          .order("created_at", { ascending: false })
          .limit(3);

        if (noticesData) setNotices(noticesData);
        if (deadlinesData) setDeadlines(deadlinesData);
        if (templatesData) setTemplates(templatesData);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [scope, scopeLoading]);

  
  // Category tags styling helper for notices
  const getNoticeCategoryStyle = (category: string) => {
    switch (category) {
      case "exam":
        return { bg: "#FEF2F2", color: "#EF4444", label: "Exam" };
      case "class_cancelled":
        return { bg: "#FFF7ED", color: "#F97316", label: "Cancelled" };
      case "assignment":
        return { bg: "#EEF2FF", color: "#6366F1", label: "Assignment" };
      case "urgent":
        return { bg: "#FEF2F2", color: "#DC2626", label: "Urgent" };
      default:
        return { bg: "#F0FDF4", color: "#16A34A", label: "General" };
    }
  };

  // Find next upcoming lab report
  const upcomingLabs = deadlines.filter((d) => {
    return d.category === "lab_report" && new Date(d.due_date) >= new Date();
  });
  const nextLab = upcomingLabs[0];

  // Helper to match a lab report to a template by parsing course code
  const getMatchingTemplateId = (labTitle: string) => {
    if (!labTitle) return null;
    const match = labTitle.match(/([a-zA-Z]{3,4})\s*[-_]?\s*(\d{4})/);
    if (!match) return null;
    const code = `${match[1]}${match[2]}`.toUpperCase();
    const found = templates.find((t) => {
      const c = Array.isArray(t.courses) ? t.courses[0] : t.courses;
      const cCode = c?.code?.replace(/[\s-_]/g, "")?.toUpperCase();
      return cCode === code;
    });
    return found ? found.id : null;
  };

  // Find nearest overall deadline
  const upcomingDeadlines = deadlines.filter((d) => {
    return new Date(d.due_date) >= new Date();
  });
  const nearestDeadline = upcomingDeadlines[0];

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
          <h2 className="text-2xl font-bold text-[#4A5568] mt-1.5">Welcome to <span className="text-[#006B3F]">BAUST Smart Learning Gateway</span></h2>
        </div>
      </motion.div>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#006B3F" }} />
        </Box>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Notice Board Widget (md:col-span-7) */}
          <div className="md:col-span-7 flex flex-col">
            <Card
              sx={{
                p: 3.5,
                borderRadius: 4,
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-[#1E293B] m-0">Notice Board</h2>
                </div>
                <Link
                  href="/notices"
                  className="flex items-center gap-1 text-xs font-semibold text-[#006B3F] hover:text-[#00895a] no-underline transition-colors"
                >
                  View All <ArrowForwardIcon sx={{ fontSize: 14 }} />
                </Link>
              </div>

              {/* Content */}
              {notices.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-sm text-[#94A3B8] m-0 font-medium">No active notices posted yet.</p>
                </div>
              ) : (
                <div className="space-y-4 flex-grow">
                  {notices.map((notice) => {
                    const style = getNoticeCategoryStyle(notice.category);
                    return (
                      <div
                        key={notice.id}
                        className="p-3.5 rounded-xl border border-[#F1F5F9] bg-[#FCFDFD] hover:border-[#CBD5E1] transition-all flex flex-col gap-2 relative group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: "10px",
                                fontWeight: 700,
                                backgroundColor: style.bg,
                                color: style.color,
                                borderRadius: "4px",
                                textTransform: "uppercase",
                                letterSpacing: "0.03em",
                                padding: "3px 8px"
                              }}
                            >
                              {style.label}
                            </span>
                            {notice.is_pinned && (
                              <span
                                style={{
                                  display: "inline-block",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  backgroundColor: "#FEF3C7",
                                  color: "#D97706",
                                  borderRadius: "4px",
                                  padding: "2px 6px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.03em",
                                }}
                              >
                                Pinned
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#94A3B8] font-medium">
                            {new Date(notice.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1E293B] m-0 group-hover:text-[#006B3F] transition-colors line-clamp-1">
                          {notice.title}
                        </h4>
                        <p className="text-xs text-[#64748B] m-0 line-clamp-2 leading-relaxed">
                          {notice.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN: Info Widgets (md:col-span-5) */}
          <div className="md:col-span-5 flex flex-col gap-6">
            {/* Widget 2: Upcoming Labreport */}
            <Card
              sx={{
                p: 3,
                borderRadius: 4,
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                background: "linear-gradient(135deg, #FFFFFF 0%, #FAFBFB 100%)",
              }}
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1E293B] m-0">Upcoming Lab Report</h3>
                </div>
              </div>

              {nextLab ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#1E293B] m-0">
                    {nextLab.title}
                  </h4>
                  {nextLab.description && (
                    <p className="text-xs text-[#64748B] m-0 line-clamp-2 leading-relaxed">
                      {nextLab.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-semibold text-[#64748B]">
                      Due: {new Date(nextLab.due_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Chip
                      label="Pending"
                      size="small"
                      sx={{
                        backgroundColor: "#FEF3C7",
                        color: "#D97706",
                        fontWeight: 700,
                        fontSize: 10,
                        height: 20,
                      }}
                    />
                  </div>
                  {(() => {
                    const matchedId = getMatchingTemplateId(nextLab.title);
                    return (
                      <Button
                        component={Link}
                        href={matchedId 
                          ? `/generators/lab-report?templateId=${matchedId}&autoDownload=true`
                          : "/generators/lab-report"
                        }
                        variant="contained"
                        size="small"
                        startIcon={<DownloadIcon />}
                        sx={{
                          mt: 1,
                          width: "100%",
                          textTransform: "none",
                          fontWeight: 600,
                          backgroundColor: "#006B3F",
                          "&:hover": { backgroundColor: "#005230" }
                        }}
                      >
                        {matchedId ? "Download Cover Page" : "Create Cover Page"}
                      </Button>
                    );
                  })()}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-[#94A3B8] m-0 font-medium">All caught up! No pending lab reports.</p>
                  
                  {templates.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-[#F1F5F9] text-left">
                      <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5">
                        Readymade Cover Pages
                      </h4>
                      <div className="space-y-2">
                        {templates.map((t) => {
                          const c = Array.isArray(t.courses) ? t.courses[0] : t.courses;
                          return (
                            <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border border-[#F1F5F9] bg-white hover:border-[#E2E8F0] transition-all">
                              <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                                <p className="text-xs font-bold text-[#1E293B] m-0 truncate">
                                  #{t.no} — {t.title}
                                </p>
                                <p className="text-[9px] text-[#64748B] m-0 truncate">
                                  {c?.code || "N/A"} — {c?.name || ""}
                                </p>
                              </div>
                              <Button
                                component={Link}
                                href={`/generators/lab-report?templateId=${t.id}&autoDownload=true`}
                                variant="outlined"
                                size="small"
                                startIcon={<DownloadIcon sx={{ fontSize: 12 }} />}
                                sx={{
                                  fontSize: 9,
                                  py: 0.25,
                                  px: 1,
                                  textTransform: "none",
                                  borderColor: "#006B3F",
                                  color: "#006B3F",
                                  "&:hover": {
                                    borderColor: "#005230",
                                    backgroundColor: "rgba(0,107,63,0.04)"
                                  }
                                }}
                              >
                                Download
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Widget 3: Most Recent Deadline Counter */}
            <Card
              sx={{
                p: 3,
                borderRadius: 4,
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                background: "linear-gradient(135deg, #FFFFFF 0%, #FAFBFB 100%)",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1E293B] m-0">Nearest Deadline</h3>
                  </div>
                  <Link
                    href="/deadlines"
                    className="flex items-center gap-1 text-[11px] font-bold text-[#DC2626] hover:text-[#B91C1C] no-underline transition-colors"
                  >
                    Tracker <ArrowForwardIcon sx={{ fontSize: 12 }} />
                  </Link>
                </div>

                {nearestDeadline ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "9px",
                            fontWeight: 800,
                            backgroundColor: "#FEE2E2",
                            color: "#DC2626",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {nearestDeadline.category.replace("_", " ")}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1E293B] m-0 line-clamp-1">
                        {nearestDeadline.title}
                      </h4>
                    </div>

                    <Box sx={{ py: 1.5, borderTop: "1px dashed #E2E8F0", borderBottom: "1px dashed #E2E8F0" }}>
                      <CountdownTimer targetDate={nearestDeadline.due_date} />
                    </Box>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-[#94A3B8] m-0 font-medium">No upcoming deadlines. All caught up!</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </motion.div>
  );
}
