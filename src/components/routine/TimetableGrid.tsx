"use client";

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import type { ClassSlot, DayOfWeek } from "@/types/routine";
import { DAYS } from "@/types/routine";
import { createClient } from "@/lib/supabase/client";

interface TimetableGridProps {
  routine: Record<DayOfWeek, ClassSlot[]>;
}

interface PortalSettings {
  university_name: string;
  department_name: string;
  section_name: string;
  batch_no: string;
  batch_advisor: string;
  dpc_name: string;
  dpc_phone: string;
  logo_url: string | null;
}

const TIME_SLOTS = [
  { start: "08:00", end: "08:50", label: "08.00-08.50" },
  { start: "09:00", end: "09:50", label: "09.00-09.50" },
  { start: "10:00", end: "10:50", label: "10.00-10.50" },
  { start: "11:30", end: "12:20", label: "11.30-12.20" },
  { start: "12:30", end: "13:20", label: "12.30-01.20" },
  { start: "13:30", end: "14:20", label: "01.30-02.20" },
  { start: "14:30", end: "15:20", label: "02.30-03.20" },
  { start: "15:30", end: "16:20", label: "03.30-04.20" },
  { start: "16:30", end: "17:20", label: "04.30-05.20" },
];

function normalizeTime(timeStr: string): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

function timeToIdx(time: string): number {
  const t = normalizeTime(time);
  if (t === "08:00") return 0;
  if (t === "09:00") return 1;
  if (t === "10:00") return 2;
  if (t === "11:30") return 3; // Shift index by 1 since we handle BREAK separately
  if (t === "12:30") return 4;
  if (t === "13:30") return 5;
  if (t === "14:30") return 6;
  if (t === "15:30") return 7;
  if (t === "16:30") return 8;
  return -1;
}

function endTimeToIdx(time: string): number {
  const t = normalizeTime(time);
  if (t === "08:50") return 0;
  if (t === "09:50") return 1;
  if (t === "10:50") return 2;
  if (t === "12:20") return 3;
  if (t === "13:20" || t === "01:20") return 4;
  if (t === "14:20" || t === "02:20") return 5;
  if (t === "15:20" || t === "03:20") return 6;
  if (t === "16:20" || t === "04:20") return 7;
  if (t === "17:20" || t === "05:20") return 8;
  return -1;
}

function getCurrentDay(): DayOfWeek | null {
  const dayIndex = new Date().getDay();
  const dayMap: Record<number, DayOfWeek> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
  };
  return dayMap[dayIndex] || null;
}

export default function TimetableGrid({ routine }: TimetableGridProps) {
  const currentDay = getCurrentDay();
  const [settings, setSettings] = useState<PortalSettings>({
    university_name: "Bangladesh Army University of Science and Technology (BAUST), Saidpur",
    department_name: "Department of Computer Science and Engineering (CSE)",
    section_name: "C",
    batch_no: "2-II",
    batch_advisor: "Md. Zahim Hassan",
    dpc_name: "Md. Zahim Hassan",
    dpc_phone: "01736393334",
    logo_url: null,
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
          university_name: data.university_name || "Bangladesh Army University of Science and Technology (BAUST), Saidpur",
          department_name: data.department_name || "Department of Computer Science and Engineering (CSE)",
          section_name: data.section_name || "C",
          batch_no: data.batch_no || "2-II",
          batch_advisor: data.batch_advisor || "Md. Zahim Hassan",
          dpc_name: data.dpc_name || "Md. Zahim Hassan",
          dpc_phone: data.dpc_phone || "01736393334",
          logo_url: data.logo_url || null,
        });
      }
    }
    loadSettings();
  }, []);

  // Construct cells row-by-row for the grid table
  const getRowCells = (day: DayOfWeek) => {
    const daySlots = routine[day] || [];

    // Initialize 9 columns array (0 to 8, BREAK is placed manually in middle)
    const cells: { slot?: ClassSlot; colSpan: number; isFilled: boolean }[] = Array(9)
      .fill(null)
      .map(() => ({ colSpan: 1, isFilled: false }));

    daySlots.forEach((slot) => {
      const startIdx = timeToIdx(slot.start_time);
      const endIdx = endTimeToIdx(slot.end_time);

      if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
        const span = endIdx - startIdx + 1;
        cells[startIdx] = { slot, colSpan: span, isFilled: true };
        for (let k = startIdx + 1; k <= endIdx; k++) {
          cells[k] = { colSpan: 0, isFilled: true };
        }
      }
    });

    return cells;
  };

  return (
    <Card id="timetable-grid-card" sx={{ p: { xs: 2, sm: 3, md: 4 }, overflow: "hidden", display: "flex", flexDirection: "column", gap: 4 }}>
      {/* 1. Header (Dynamic Official Schema style) */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          gap: { xs: 2, md: 4 },
          borderBottom: "2px solid #1A202C",
          pb: 2.5,
        }}
      >
        {/* BAUST logo */}
        <Box sx={{ flexShrink: 0 }}>
          <img
            src={settings.logo_url || "/logo.png"}
            alt="BAUST Logo"
            style={{ width: 90, height: 100, objectFit: "contain" }}
          />
        </Box>

        {/* Center texts */}
        <Box sx={{ flexGrow: 1, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1A202C" }}>
            {settings.university_name}
          </h2>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "4px 0", color: "#1A202C" }}>
            {settings.department_name}
          </h3>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "#4A5568" }}>
            Batchwise Class Routine, Winter 2026
          </p>
        </Box>

        {/* Spacer to align logo centering */}
        <Box sx={{ width: 90, flexShrink: 0, display: { xs: "none", md: "block" } }} />
      </Box>

      {/* 2. Metadata Info Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1fr" },
          gap: 2,
          fontSize: 13,
          color: "#1A202C",
          fontWeight: 600,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ minWidth: 100 }}>Level-Term:</span>
            <span>{settings.batch_no}</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ minWidth: 100 }}>Section:</span>
            <span>{settings.section_name}</span>
          </div>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ minWidth: 100 }}>Batch Advisor:</span>
            <span>{settings.batch_advisor}</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ minWidth: 100 }}>DPC/G2:</span>
            <span>{settings.dpc_name}</span>
            <span style={{ marginLeft: "auto", fontWeight: 500, marginRight: "20px" }}>Phone No: </span>
            <span >{settings.dpc_phone}</span>
          </div>
        </Box>
      </Box>

      {/* 3. Routine Schedule Table */}
      <Box sx={{ overflowX: "auto", border: "1px solid #1A202C" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            textAlign: "center",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#F1F5F9", borderBottom: "1px solid #1A202C" }}>
              <th style={{ padding: "10px", borderRight: "1px solid #1A202C", fontWeight: 700, width: 60 }}>
                Day
              </th>
              {TIME_SLOTS.slice(0, 3).map((slot) => (
                <th key={slot.label} style={{ padding: "10px", borderRight: "1px solid #1A202C", fontWeight: 700, minWidth: 100 }}>
                  {slot.label}
                </th>
              ))}
              {/* BREAK Header */}
              <th style={{ padding: "10px", borderRight: "1px solid #1A202C", fontWeight: 700, width: 40 }}>
                BREAK
              </th>
              {TIME_SLOTS.slice(3).map((slot) => (
                <th key={slot.label} style={{ padding: "10px", borderRight: "1px solid #1A202C", fontWeight: 700, minWidth: 100 }}>
                  {slot.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dIdx) => {
              const isToday = day === currentDay;
              const rowCells = getRowCells(day);

              return (
                <tr
                  key={day}
                  style={{
                    borderBottom: "1px solid #1A202C",
                    backgroundColor: isToday ? "rgba(0, 107, 63, 0.05)" : "transparent",
                  }}
                >
                  {/* Day column */}
                  <td
                    style={{
                      padding: "16px 8px",
                      borderRight: "1px solid #1A202C",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      backgroundColor: isToday ? "rgba(0, 107, 63, 0.1)" : "#F8F9FA",
                    }}
                  >
                    {day.slice(0, 3)}
                  </td>

                  {/* Morning Slots (0 to 2) */}
                  {rowCells.slice(0, 3).map((cell, cIdx) => {
                    if (cell.colSpan === 0) return null;
                    const slot = cell.slot;
                    return (
                      <td
                        key={cIdx}
                        colSpan={cell.colSpan}
                        style={{
                          padding: "8px",
                          borderRight: "1px solid #1A202C",
                          fontWeight: 500,
                          lineHeight: 1.4,
                        }}
                      >
                        {slot ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {slot.course_code} ({slot.teacher_initials})
                            </div>
                            <div style={{ color: "#718096", fontSize: 10 }}>
                              [{slot.room_number}]
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#CBD5E1" }}>-</span>
                        )}
                      </td>
                    );
                  })}

                  {/* BREAK Column with rowSpan={5} (rendered on Sunday's row) */}
                  {dIdx === 0 && (
                    <td
                      rowSpan={5}
                      style={{
                        position: "relative",
                        borderRight: "1px solid #1A202C",
                        backgroundColor: "#F8F9FA",
                        width: 40,
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%) rotate(90deg)",
                          whiteSpace: "nowrap",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.15em",
                          color: "#4A5568",
                          fontSize: "11px",
                        }}
                      >
                        BREAK (10.50 - 11.30)
                      </div>
                    </td>
                  )}

                  {/* Afternoon Slots (3 to 8) */}
                  {rowCells.slice(3).map((cell, cIdx) => {
                    if (cell.colSpan === 0) return null;
                    const slot = cell.slot;
                    return (
                      <td
                        key={cIdx + 3}
                        colSpan={cell.colSpan}
                        style={{
                          padding: "8px",
                          borderRight: "1px solid #1A202C",
                          fontWeight: 500,
                          lineHeight: 1.4,
                        }}
                      >
                        {slot ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {slot.course_code} ({slot.teacher_initials})
                            </div>
                            <div style={{ color: "#718096", fontSize: 10 }}>
                              [{slot.room_number}]
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#CBD5E1" }}>-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
    </Card>
  );
}
