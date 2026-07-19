"use client";

import React, { useEffect, useState, useCallback } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import { createClient } from "@/lib/supabase/client";
import { useAdminScope } from "@/hooks/useAdminScope";
import type { ClassSlot, DayOfWeek, WeeklyRoutine } from "@/types/routine";
import { DAYS } from "@/types/routine";

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

const emptyForm = {
  day: "sunday" as DayOfWeek,
  start_time: "08:00",
  end_time: "08:50",
  course_code: "",
  course_title: "",
  teacher_initials: "",
  room_number: "",
};

function normalizeTime(timeStr: string): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

function timeToIdx(time: string): number {
  const t = normalizeTime(time);
  if (t === "08:00") return 0;
  if (t === "09:00") return 1;
  if (t === "10:00") return 2;
  if (t === "11:30") return 3;
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

export default function AdminRoutinePage() {
  const { scope, loading: scopeLoading } = useAdminScope();
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [settings, setSettings] = useState<PortalSettings>({
    university_name: "Bangladesh Army University of Science and Technology (BAUST), Saidpur",
    department_name: "Department of Computer Science and Engineering (CSE)",
    section_name: "A",
    batch_no: "L-1 T-I",
    batch_advisor: "Md. Zahim Hassan",
    dpc_name: "Md. Zahim Hassan",
    dpc_phone: "01736393334",
    logo_url: null,
  });

  const supabase = createClient();

  const fetchSettingsAndSlots = useCallback(async () => {
    if (scopeLoading || !scope) return;
    setLoading(true);

    // 1. Fetch settings
    const settingsId = scope.isSuperAdmin ? "settings" : `settings_${scope.level}_${scope.term}_${scope.section}`;
    const { data: settingsData } = await supabase
      .from("portal_settings")
      .select("*")
      .eq("id", settingsId)
      .maybeSingle();

    if (settingsData) {
      setSettings({
        university_name: settingsData.university_name || "Bangladesh Army University of Science and Technology (BAUST), Saidpur",
        department_name: settingsData.department_name || "Department of Computer Science and Engineering (CSE)",
        section_name: settingsData.section_name || scope.section,
        batch_no: settingsData.batch_no || `L-${scope.level} T-${scope.term}`,
        batch_advisor: settingsData.batch_advisor || "Md. Zahim Hassan",
        dpc_name: settingsData.dpc_name || "Md. Zahim Hassan",
        dpc_phone: settingsData.dpc_phone || "01736393334",
        logo_url: settingsData.logo_url || null,
      });
    } else {
      // Default placeholder if settings do not exist yet
      setSettings({
        university_name: "Bangladesh Army University of Science and Technology (BAUST), Saidpur",
        department_name: "Department of Computer Science and Engineering (CSE)",
        section_name: scope.section,
        batch_no: `L-${scope.level} T-${scope.term}`,
        batch_advisor: "Md. Zahim Hassan",
        dpc_name: "Md. Zahim Hassan",
        dpc_phone: "01736393334",
        logo_url: null,
      });
    }

    // 2. Fetch routine slots
    let query = supabase.from("routine").select("*");
    if (!scope.isSuperAdmin) {
      query = query
        .eq("level", scope.level)
        .eq("term", scope.term)
        .eq("section", scope.section);
    }

    const { data: slotsData } = await query
      .order("start_time", { ascending: true });

    if (slotsData) {
      setSlots(slotsData as ClassSlot[]);
    }
    setLoading(false);
  }, [supabase, scope, scopeLoading]);

  useEffect(() => {
    if (!scopeLoading && scope) {
      fetchSettingsAndSlots();
    }
  }, [fetchSettingsAndSlots, scope, scopeLoading]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (slot: ClassSlot) => {
    setForm({
      day: slot.day,
      start_time: normalizeTime(slot.start_time),
      end_time: normalizeTime(slot.end_time),
      course_code: slot.course_code,
      course_title: slot.course_title,
      teacher_initials: slot.teacher_initials,
      room_number: slot.room_number,
    });
    setEditingId(slot.id);
    setDialogOpen(true);
  };

  const handleOpenEmptyClick = (day: DayOfWeek, colIdx: number) => {
    const defaultTime = TIME_SLOTS[colIdx];
    setForm({
      day,
      start_time: defaultTime.start,
      end_time: defaultTime.end,
      course_code: "",
      course_title: "",
      teacher_initials: "",
      room_number: "",
    });
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      level: scope?.isSuperAdmin ? "1" : scope?.level || "1",
      term: scope?.isSuperAdmin ? "I" : scope?.term || "I",
      section: scope?.isSuperAdmin ? "A" : scope?.section || "A",
    };
    if (editingId) {
      await supabase.from("routine").update(payload).eq("id", editingId);
    } else {
      await supabase.from("routine").insert(payload);
    }
    setDialogOpen(false);
    fetchSettingsAndSlots();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("routine").delete().eq("id", id);
    setDeleteConfirm(null);
    setDialogOpen(false);
    fetchSettingsAndSlots();
  };

  // Group routine by day for table structure
  const grouped: Record<DayOfWeek, ClassSlot[]> = DAYS.reduce(
    (acc, day) => {
      acc[day] = slots.filter((s) => s.day === day);
      return acc;
    },
    {} as Record<DayOfWeek, ClassSlot[]>
  );

  const getRowCells = (day: DayOfWeek) => {
    const daySlots = grouped[day] || [];
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div className="w-8 h-8 border-2 border-[#1B4F72] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#A0AEC0]">Loading routine editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1A202C]">Class Routine Grid Editor</h2>
          <p className="text-xs text-[#A0AEC0]">
            Click any card to edit/delete class details, or click empty slots to add a new class.
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="small"
          sx={{
            background: "linear-gradient(135deg, #1B4F72 0%, #2471A3 100%)",
          }}
        >
          Add Class Slot
        </Button>
      </div>

      {/* Routine Grid Board */}
      <Card sx={{ p: { xs: 2, sm: 3, md: 4 }, overflow: "hidden", display: "flex", flexDirection: "column", gap: 4 }}>
        {/* official header segment */}
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
          <Box sx={{ flexShrink: 0 }}>
            <img
              src={settings.logo_url || "/logo.png"}
              alt="BAUST Logo"
              style={{ width: 90, height: 100, objectFit: "contain" }}
            />
          </Box>

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
          <Box sx={{ width: 90, flexShrink: 0, display: { xs: "none", md: "block" } }} />
        </Box>

        {/* metadata info row */}
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
              <span>Phone no: </span>
              <span style={{ marginLeft: "auto", fontWeight: 500 }}>{settings.dpc_phone}</span>
            </div>
          </Box>
        </Box>

        {/* routine table structure */}
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
                  <th key={slot.label} style={{ padding: "10px", borderRight: "1px solid #1A202C", fontWeight: 700, minWidth: 105 }}>
                    {slot.label}
                  </th>
                ))}
                <th style={{ padding: "10px", borderRight: "1px solid #1A202C", fontWeight: 700, width: 40 }}>
                  BREAK
                </th>
                {TIME_SLOTS.slice(3).map((slot) => (
                  <th key={slot.label} style={{ padding: "10px", borderRight: "1px solid #1A202C", fontWeight: 700, minWidth: 105 }}>
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, dIdx) => {
                const rowCells = getRowCells(day);

                return (
                  <tr key={day} style={{ borderBottom: "1px solid #1A202C" }}>
                    {/* Day column */}
                    <td
                      style={{
                        padding: "16px 8px",
                        borderRight: "1px solid #1A202C",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        backgroundColor: "#F8F9FA",
                      }}
                    >
                      {day.slice(0, 3)}
                    </td>

                    {/* Morning slots (0 to 2) */}
                    {rowCells.slice(0, 3).map((cell, cIdx) => {
                      if (cell.colSpan === 0) return null;
                      const slot = cell.slot;
                      return (
                        <td
                          key={cIdx}
                          colSpan={cell.colSpan}
                          onClick={() =>
                            slot
                              ? handleOpenEdit(slot)
                              : handleOpenEmptyClick(day, cIdx)
                          }
                          style={{
                            padding: "8px",
                            borderRight: "1px solid #1A202C",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          className="hover:bg-slate-100"
                        >
                          {slot ? (
                            <div className="bg-[#EBF5FB] border border-[#1B4F72]/20 rounded p-1.5 shadow-sm text-left">
                              <div style={{ fontWeight: 700, color: "#1B4F72" }}>
                                {slot.course_code}
                              </div>
                              <div style={{ display: "flex", justifyContent: "between", fontSize: 9, marginTop: 4, color: "#4A5568" }}>
                                <span>{slot.teacher_initials}</span>
                                <span style={{ marginLeft: "auto", fontWeight: 600 }}>Room {slot.room_number}</span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "#CBD5E1", fontSize: 16 }}>+</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Break vertical column */}
                    {dIdx === 0 && (
                      <td
                        rowSpan={5}
                        style={{
                          padding: "8px",
                          borderRight: "1px solid #1A202C",
                          fontWeight: 700,
                          backgroundColor: "#F8F9FA",
                          width: 40,
                          writingMode: "vertical-lr",
                          textTransform: "uppercase",
                          letterSpacing: "0.15em",
                          color: "#4A5568",
                        }}
                      >
                        BREAK (10.50 - 11.30)
                      </td>
                    )}

                    {/* Afternoon slots (3 to 8) */}
                    {rowCells.slice(3).map((cell, cIdx) => {
                      if (cell.colSpan === 0) return null;
                      const slot = cell.slot;
                      return (
                        <td
                          key={cIdx + 3}
                          colSpan={cell.colSpan}
                          onClick={() =>
                            slot
                              ? handleOpenEdit(slot)
                              : handleOpenEmptyClick(day, cIdx + 3)
                          }
                          style={{
                            padding: "8px",
                            borderRight: "1px solid #1A202C",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          className="hover:bg-slate-100"
                        >
                          {slot ? (
                            <div className="bg-[#EBF5FB] border border-[#1B4F72]/20 rounded p-1.5 shadow-sm text-left">
                              <div style={{ fontWeight: 700, color: "#1B4F72" }}>
                                {slot.course_code}
                              </div>
                              <div style={{ display: "flex", justifyContent: "between", fontSize: 9, marginTop: 4, color: "#4A5568" }}>
                                <span>{slot.teacher_initials}</span>
                                <span style={{ marginLeft: "auto", fontWeight: 600 }}>Room {slot.room_number}</span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "#CBD5E1", fontSize: 16 }}>+</span>
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

      {/* Add/Edit Modal */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, borderBottom: "1px solid #E2E8F0" }}>
          {editingId ? "Edit Class Details" : "Schedule New Class"}
        </DialogTitle>
        <DialogContent className="space-y-4 pt-4">
          <TextField
            fullWidth
            select
            label="Day of the Week"
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value as DayOfWeek })}
            margin="dense"
          >
            {DAYS.map((d) => (
              <MenuItem key={d} value={d}>
                {d.toUpperCase()}
              </MenuItem>
            ))}
          </TextField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <TextField
              label="Start Time"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              margin="dense"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End Time"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              margin="dense"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <TextField
              label="Course Code"
              value={form.course_code}
              onChange={(e) => setForm({ ...form, course_code: e.target.value })}
              margin="dense"
              required
              placeholder="e.g. CSE 2201"
            />
            <TextField
              label="Room Number"
              value={form.room_number}
              onChange={(e) => setForm({ ...form, room_number: e.target.value })}
              margin="dense"
              required
              placeholder="e.g. 407"
            />
          </div>

          <TextField
            fullWidth
            label="Course Title"
            value={form.course_title}
            onChange={(e) => setForm({ ...form, course_title: e.target.value })}
            margin="dense"
            required
            placeholder="e.g. Object Oriented Programming"
          />

          <TextField
            fullWidth
            label="Teacher Initials"
            value={form.teacher_initials}
            onChange={(e) => setForm({ ...form, teacher_initials: e.target.value })}
            margin="dense"
            required
            placeholder="e.g. RR"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: "1px solid #E2E8F0" }}>
          {editingId && (
            <Button
              onClick={() => setDeleteConfirm(editingId)}
              color="error"
              startIcon={<DeleteIcon />}
              sx={{ marginRight: "auto" }}
            >
              Delete
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !form.course_code.trim() ||
              !form.course_title.trim() ||
              !form.teacher_initials.trim() ||
              !form.room_number.trim()
            }
            sx={{
              background: "linear-gradient(135deg, #1B4F72 0%, #2471A3 100%)",
            }}
          >
            {editingId ? "Update Class" : "Add Class"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Class Slot?</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#4A5568]">
            This will permanently remove the class from the routine schedule. This action is irreversible.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            variant="contained"
            color="error"
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
