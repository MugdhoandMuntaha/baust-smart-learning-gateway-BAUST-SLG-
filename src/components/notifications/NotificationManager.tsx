"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStudentScope } from "@/hooks/useStudentScope";
import type { Deadline } from "@/types/deadlines";
import { DEADLINE_CATEGORY_LABELS } from "@/types/deadlines";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

const NOTIF_STORAGE_KEY = "baust_slg_sent_notifications_v1";

export default function NotificationManager() {
  const { scope, loading: scopeLoading } = useStudentScope();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [showBanner, setShowBanner] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<Array<{ id: string; title: string; message: string; type: "eve" | "urgent" }>>([]);

  // Check notification support and status on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "default") {
        setShowBanner(true);
      }
    } else {
      setPermission("unsupported");
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        setShowBanner(false);
        new Notification("🔔 Reminders Enabled!", {
          body: "You will receive schedule reminders at 7:30 PM the night before and 30 minutes before deadlines.",
          icon: "/favicon.ico",
        });
      }
    }
  };

  const getSentNotifications = (): Record<string, boolean> => {
    try {
      const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };

  const markNotificationSent = (key: string) => {
    try {
      const current = getSentNotifications();
      current[key] = true;
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(current));
    } catch (e) {}
  };

  const checkAndFireNotifications = useCallback((deadlines: Deadline[]) => {
    const now = new Date();
    const sentMap = getSentNotifications();
    const newAlerts: Array<{ id: string; title: string; message: string; type: "eve" | "urgent" }> = [];

    deadlines.forEach((dl) => {
      const dueDate = new Date(dl.due_date);
      const categoryLabel = DEADLINE_CATEGORY_LABELS[dl.category] || "Schedule Item";

      // Parse JSON description if present for course info
      let courseInfo = "";
      if (dl.description && dl.description.startsWith("{")) {
        try {
          const parsed = JSON.parse(dl.description);
          if (parsed.course_name) courseInfo = ` (${parsed.course_code || parsed.course_name})`;
        } catch (e) {}
      }

      // 1. Previous Day 7:30 PM (19:30) Notification Rule
      const eve730 = new Date(dueDate);
      eve730.setDate(eve730.getDate() - 1);
      eve730.setHours(19, 30, 0, 0);

      // Trigger condition: Current time is after 7:30 PM previous day AND before due date
      const eveKey = `eve_730_${dl.id}`;
      if (now >= eve730 && now < dueDate && !sentMap[eveKey]) {
        const notifTitle = `📌 Tomorrow: ${categoryLabel}${courseInfo}`;
        const notifBody = `${dl.title} is scheduled for tomorrow! Ensure your preparation is complete.`;

        markNotificationSent(eveKey);

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(notifTitle, {
            body: notifBody,
            icon: "/favicon.ico",
            tag: eveKey,
          });
        }

        newAlerts.push({
          id: eveKey,
          title: notifTitle,
          message: notifBody,
          type: "eve",
        });
      }

      // 2. 30 Minutes Before Deadline Rule
      const mins30Before = new Date(dueDate.getTime() - 30 * 60 * 1000);
      const urgentKey = `urgent_30m_${dl.id}`;
      if (now >= mins30Before && now < dueDate && !sentMap[urgentKey]) {
        const notifTitle = `🚨 URGENT (30 mins left): ${categoryLabel}${courseInfo}`;
        const notifBody = `${dl.title} starts/is due in less than 30 minutes! Venue: ${dl.room_no || 'N/A'}, Period: ${dl.period || 'N/A'}`;

        markNotificationSent(urgentKey);

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(notifTitle, {
            body: notifBody,
            icon: "/favicon.ico",
            tag: urgentKey,
          });
        }

        newAlerts.push({
          id: urgentKey,
          title: notifTitle,
          message: notifBody,
          type: "urgent",
        });
      }
    });

    if (newAlerts.length > 0) {
      setActiveAlerts((prev) => [...prev, ...newAlerts]);
    }
  }, []);

  // Fetch deadlines and run check periodically (every 1 minute)
  useEffect(() => {
    if (scopeLoading || !scope) return;
    const s = scope;

    async function fetchAndCheck() {
      const supabase = createClient();
      const { data } = await supabase
        .from("deadlines")
        .select("*")
        .eq("level", s.level)
        .eq("term", s.term)
        .eq("section", s.section)
        .gte("due_date", new Date().toISOString())
        .order("due_date", { ascending: true });

      if (data) {
        checkAndFireNotifications(data as Deadline[]);
      }
    }

    fetchAndCheck();
    const interval = setInterval(fetchAndCheck, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [scope, scopeLoading, checkAndFireNotifications]);

  return (
    <div className="space-y-3 mb-4">
      {/* Permission Enable Banner */}
      {showBanner && permission === "default" && (
        <Alert
          icon={<NotificationsActiveOutlinedIcon fontSize="inherit" />}
          severity="info"
          action={
            <div className="flex items-center gap-2">
              <Button
                color="success"
                size="small"
                variant="contained"
                onClick={requestPermission}
                sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
              >
                Enable Notifications
              </Button>
              <button
                onClick={() => setShowBanner(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <CloseOutlinedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          }
          sx={{
            borderRadius: "12px",
            backgroundColor: "#F0FDF4",
            border: "1px solid #BBF7D0",
            color: "#166534",
            "& .MuiAlert-icon": { color: "#16A34A" },
          }}
        >
          <strong>Stay on track!</strong> Enable schedule reminders for previous-day 7:30 PM alerts & 30-min urgent deadline notifications.
        </Alert>
      )}

      {/* Active In-App Reminder Banners */}
      {activeAlerts.map((alert) => (
        <Alert
          key={alert.id}
          severity={alert.type === "urgent" ? "error" : "warning"}
          onClose={() => setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
          sx={{ borderRadius: "12px", fontWeight: 500 }}
        >
          <strong>{alert.title}:</strong> {alert.message}
        </Alert>
      ))}
    </div>
  );
}
