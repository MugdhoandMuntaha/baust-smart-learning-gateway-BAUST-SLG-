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
    if (scopeLoading) return;
    if (!scope) {
      setLoading(false);
      return;
    }
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

  // Group deadlines for the next 7 days chronologically
  const getSevenDaySchedule = () => {
    const now = new Date();
    // Start of today (00:00:00)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // End of 7 days from now (23:59:59)
    const sevenDaysEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    sevenDaysEnd.setHours(23, 59, 59, 999);

    // Filter deadlines in this range
    const scheduleItems = deadlines.filter((d) => {
      const itemDate = new Date(d.due_date);
      return itemDate >= todayStart && itemDate <= sevenDaysEnd;
    });

    // Group by day of the week
    const groups: { [key: string]: typeof deadlines } = {};
    scheduleItems.forEach((item) => {
      const itemDate = new Date(item.due_date);
      const isToday = itemDate.toDateString() === now.toDateString();
      
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const isTomorrow = itemDate.toDateString() === tomorrow.toDateString();

      let dayLabel = "";
      if (isToday) {
        dayLabel = "Today";
      } else if (isTomorrow) {
        dayLabel = "Tomorrow";
      } else {
        dayLabel = itemDate.toLocaleDateString("en-US", { weekday: "long" });
      }

      // We include the date to sort groups chronologically
      const sortKey = itemDate.toISOString().slice(0, 10);
      const groupKey = `${sortKey}|${dayLabel}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    // Sort the keys chronologically
    return Object.keys(groups)
      .sort()
      .map((key) => {
        const [sortKey, dayLabel] = key.split("|");
        return {
          dateStr: sortKey,
          dayLabel,
          items: groups[key].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()),
        };
      });
  };

  const sevenDaySchedule = getSevenDaySchedule();

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
          {/* LEFT COLUMN: 7-Day Academic Schedule Widget (md:col-span-7) */}
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
                  <h2 className="text-lg font-bold text-[#1E293B] m-0">7-Day Academic Schedule</h2>
                </div>
                <Link
                  href="/deadlines"
                  className="flex items-center gap-1 text-xs font-semibold text-[#006B3F] hover:text-[#00895a] no-underline transition-colors"
                >
                  View All <ArrowForwardIcon sx={{ fontSize: 14 }} />
                </Link>
              </div>

              {/* Content */}
              {sevenDaySchedule.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-[#94A3B8] m-0 font-medium">All clean! No tasks scheduled for the next 7 days.</p>
                </div>
              ) : (
                <div className="space-y-6 flex-grow">
                  {sevenDaySchedule.map((group) => (
                    <div key={group.dateStr} className="space-y-3">
                      {/* Day Label Header */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider bg-[#EDF2F7] px-2.5 py-0.5 rounded-md">
                          {group.dayLabel}
                        </span>
                        <span className="text-xs text-[#A0AEC0] font-medium">
                          {new Date(group.dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                      </div>

                      {/* Items under this day */}
                      <div className="pl-3 border-l-2 border-[#E2E8F0] space-y-4">
                        {group.items.map((item) => {
                          // Category styling
                          const getCatStyles = (cat: string) => {
                            switch (cat) {
                              case "ct":
                                return { bg: "#FEF2F2", text: "#DC2626", border: "#FEE2E2", label: "CT" };
                              case "lab_report":
                                return { bg: "#F0FDF4", text: "#16A34A", border: "#DCFCE7", label: "Lab Report" };
                              case "assignment":
                                return { bg: "#EEF2FF", text: "#6366F1", border: "#E0E7FF", label: "Assignment" };
                              case "mid_exam":
                                return { bg: "#FAF5FF", text: "#9333EA", border: "#F3E8FF", label: "Mid Exam" };
                              default:
                                return { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0", label: "Project/Quiz" };
                            }
                          };
                          const catStyle = getCatStyles(item.category);

                          return (
                            <div key={item.id} className="text-xs space-y-1 bg-[#FCFDFD] p-3 rounded-xl border border-[#F1F5F9] hover:border-[#CBD5E1] transition-all">
                              <div className="flex items-start justify-between gap-3">
                                <span className="font-bold text-[#2D3748] text-sm">
                                  {item.title}
                                </span>
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    backgroundColor: catStyle.bg,
                                    color: catStyle.text,
                                    border: `1px solid ${catStyle.border}`,
                                    borderRadius: "4px",
                                    padding: "2px 8px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {catStyle.label}
                                </span>
                              </div>
                              {(() => {
                                let isJson = false;
                                let parsed: any = {};
                                if (item.description && item.description.startsWith("{")) {
                                  try {
                                    parsed = JSON.parse(item.description);
                                    isJson = true;
                                  } catch (e) {}
                                }

                                if (isJson) {
                                  return (
                                    <div className="text-[11px] text-[#4A5568] space-y-0.5 mt-1 bg-[#F8FAFC] p-2 rounded-lg border border-[#EDF2F7]">
                                      <div>
                                        <strong>Course:</strong> {parsed.course_name} ({parsed.course_code})
                                      </div>
                                      {parsed.teachers && (
                                        <div>
                                          <strong>Teachers:</strong> {parsed.teachers}
                                        </div>
                                      )}
                                      {parsed.experiment_date && (
                                        <div>
                                          <strong>Experiment Date:</strong> {parsed.experiment_date}
                                        </div>
                                      )}
                                      {parsed.assigned_date && (
                                        <div>
                                          <strong>Assigned Date:</strong> {parsed.assigned_date}
                                        </div>
                                      )}
                                      {parsed.description && (
                                        <div className="text-[#718096] italic mt-1 pt-1 border-t border-[#EDF2F7]">
                                          &ldquo;{parsed.description}&rdquo;
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  item.description && (
                                    <p className="text-xs text-[#64748B] m-0 leading-relaxed">
                                      {item.description}
                                    </p>
                                  )
                                );
                              })()}
                              <div className="flex items-center gap-3 text-xs text-[#94A3B8] mt-1.5 font-medium">
                                {item.period && <span className="flex items-center gap-1">⏱️ {item.period}</span>}
                                {item.room_no && <span className="flex items-center gap-1">📍 Room {item.room_no}</span>}
                                {!item.period && !item.room_no && (
                                  <span className="flex items-center gap-1">
                                    ⏰ {new Date(item.due_date).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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

            {/* Widget 3: Notice Board */}
            <Card
              sx={{
                p: 3,
                borderRadius: 4,
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                background: "linear-gradient(135deg, #FFFFFF 0%, #FAFBFB 100%)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1E293B] m-0">Notice Board</h3>
                </div>
                <Link
                  href="/notices"
                  className="flex items-center gap-1 text-[11px] font-bold text-[#006B3F] hover:text-[#005230] no-underline transition-colors"
                >
                  View All <ArrowForwardIcon sx={{ fontSize: 12 }} />
                </Link>
              </div>

              {/* Content */}
              {notices.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-xs text-[#94A3B8] m-0 font-medium">No active notices posted yet.</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {notices.map((notice) => {
                    const style = getNoticeCategoryStyle(notice.category);
                    return (
                      <div
                        key={notice.id}
                        className="p-3 rounded-xl border border-[#F1F5F9] bg-[#FCFDFD] hover:border-[#CBD5E1] transition-all flex flex-col gap-1.5 relative group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{
                                display: "inline-block",
                                fontSize: "9px",
                                fontWeight: 700,
                                backgroundColor: style.bg,
                                color: style.color,
                                borderRadius: "4px",
                                textTransform: "uppercase",
                                letterSpacing: "0.03em",
                                padding: "2px 6px"
                              }}
                            >
                              {style.label}
                            </span>
                            {notice.is_pinned && (
                              <span
                                style={{
                                  display: "inline-block",
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  backgroundColor: "#FEF3C7",
                                  color: "#D97706",
                                  borderRadius: "4px",
                                  padding: "1px 5px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.03em",
                                }}
                              >
                                Pinned
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#94A3B8] font-medium">
                            {new Date(notice.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#1E293B] m-0 group-hover:text-[#006B3F] transition-colors line-clamp-1">
                          {notice.title}
                        </h4>
                        <p className="text-[11px] text-[#64748B] m-0 line-clamp-2 leading-relaxed">
                          {notice.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </motion.div>
  );
}
