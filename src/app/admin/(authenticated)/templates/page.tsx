"use client";

import React, { useEffect, useState, useCallback } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string;
  name: string;
  code: string | null;
  teacher_name: string | null;
  teacher_designation: string | null;
}

interface Template {
  id: string;
  type: "lab_report" | "assignment";
  title: string;
  no: string;
  course_id: string;
  experiment_date: string | null;
  submission_date: string | null;
  created_at: string;
  courses?: Course;
}

const TYPES = [
  { value: "lab_report", label: "Lab Report" },
  { value: "assignment", label: "Assignment" },
];

const emptyForm = {
  type: "lab_report" as "lab_report" | "assignment",
  title: "",
  no: "",
  course_id: "",
  experiment_date: "",
  submission_date: "",
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [templatesRes, coursesRes] = await Promise.all([
      supabase
        .from("generator_templates")
        .select("*, courses(id, name, code, teacher_name, teacher_designation)")
        .order("created_at", { ascending: false }),
      supabase.from("courses").select("*").order("name"),
    ]);
    if (templatesRes.data) setTemplates(templatesRes.data as Template[]);
    if (coursesRes.data) setCourses(coursesRes.data as Course[]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (t: Template) => {
    setForm({
      type: t.type,
      title: t.title,
      no: t.no,
      course_id: t.course_id,
      experiment_date: t.experiment_date || "",
      submission_date: t.submission_date || "",
    });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      type: form.type,
      title: form.title,
      no: form.no,
      course_id: form.course_id,
      experiment_date: form.experiment_date || null,
      submission_date: form.submission_date || null,
    };
    if (editingId) {
      await supabase
        .from("generator_templates")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingId);
    } else {
      await supabase.from("generator_templates").insert(payload);
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("generator_templates").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchData();
  };

  const getCourseName = (courseId: string) => {
    const c = courses.find((c) => c.id === courseId);
    return c ? c.name : "—";
  };

  const getCourseCode = (courseId: string) => {
    const c = courses.find((c) => c.id === courseId);
    return c?.code || "";
  };

  const getTeacherName = (courseId: string) => {
    const c = courses.find((c) => c.id === courseId);
    return c?.teacher_name || "";
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1A202C]">
            Manage Templates
          </h2>
          <p className="text-xs text-[#A0AEC0] mt-0.5">
            Pre-define lab reports and assignments. Students can auto-fill their
            generators with one click.
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="small"
        >
          Add Template
        </Button>
      </div>

      {/* Templates List */}
      {loading ? (
        <p className="text-sm text-[#A0AEC0] text-center py-8">Loading...</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-[#A0AEC0] text-center py-8">
          No templates yet. Click &quot;Add Template&quot; to create one.
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      t.type === "lab_report"
                        ? "text-[#1B4F72] bg-[#EBF5FB]"
                        : "text-[#7B341E] bg-[#FEFCBF]"
                    }`}
                  >
                    {t.type === "lab_report" ? "Lab Report" : "Assignment"}
                  </span>
                  <span className="text-xs text-[#A0AEC0]">
                    #{t.no}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[#1A202C]">
                  {t.title}
                </h3>
                <p className="text-xs text-[#4A5568] mt-0.5">
                  {getCourseName(t.course_id)}
                  {getCourseCode(t.course_id) &&
                    ` (${getCourseCode(t.course_id)})`}
                </p>
                {getTeacherName(t.course_id) && (
                  <p className="text-xs text-[#718096] mt-0.5">
                    👤 {getTeacherName(t.course_id)}
                  </p>
                )}
                <p className="text-xs text-[#A0AEC0] mt-1">
                  Exp: {formatDate(t.experiment_date)} · Sub:{" "}
                  {formatDate(t.submission_date)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <IconButton size="small" onClick={() => handleOpenEdit(t)}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setDeleteConfirm(t.id)}
                  sx={{ color: "#DC2626" }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId ? "Edit Template" : "Create Template"}
        </DialogTitle>
        <DialogContent className="space-y-3 pt-2">
          <TextField
            fullWidth
            select
            label="Type"
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value as "lab_report" | "assignment",
              })
            }
            margin="dense"
          >
            {TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Course"
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            margin="dense"
            required
          >
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} {c.code ? `(${c.code})` : ""}
                {c.teacher_name ? ` — ${c.teacher_name}` : ""}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label={
              form.type === "lab_report"
                ? "Experiment No"
                : "Assignment No"
            }
            value={form.no}
            onChange={(e) => setForm({ ...form, no: e.target.value })}
            margin="dense"
            required
            placeholder="e.g. 01"
          />

          <TextField
            fullWidth
            label={
              form.type === "lab_report"
                ? "Experiment Name"
                : "Assignment Topic"
            }
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            margin="dense"
            required
          />

          <TextField
            fullWidth
            label={
              form.type === "lab_report"
                ? "Experiment Date"
                : "Assignment Date"
            }
            type="date"
            value={form.experiment_date}
            onChange={(e) =>
              setForm({ ...form, experiment_date: e.target.value })
            }
            margin="dense"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            fullWidth
            label="Submission Date"
            type="date"
            value={form.submission_date}
            onChange={(e) =>
              setForm({ ...form, submission_date: e.target.value })
            }
            margin="dense"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!form.title.trim() || !form.no.trim() || !form.course_id}
          >
            {editingId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Template?</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#4A5568]">
            This action cannot be undone. Students will no longer be able to use
            this template.
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
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
