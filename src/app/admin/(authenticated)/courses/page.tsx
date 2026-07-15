"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BookIcon from "@mui/icons-material/Book";
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string;
  name: string;
  code: string | null;
  teacher_name: string | null;
  teacher_designation: string | null;
  teacher_avatar_url: string | null;
  level: string | null;
  term: string | null;
  created_at: string;
  teachers?: Array<{
    full_name: string;
    designation: string;
    avatar_url: string | null;
  }> | null;
}

const emptyForm = {
  name: "",
  code: "",
  teacher_name: "",
  teacher_designation: "",
  level: "1",
  term: "I",
};

const LEVELS = ["1", "2", "3", "4"];
const TERMS = ["I", "II"];

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*, teachers(full_name, designation, avatar_url)")
      .order("name", { ascending: true });

    if (!error && data) {
      setCourses(data as any[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: Course) => {
    setForm({
      name: c.name,
      code: c.code || "",
      teacher_name: c.teacher_name || "",
      teacher_designation: c.teacher_designation || "",
      level: c.level || "1",
      term: c.term || "I",
    });
    setAvatarFile(null);
    setAvatarPreview(c.teacher_avatar_url);
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalAvatarUrl = avatarPreview;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `teacher_avatars/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, avatarFile, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);
        finalAvatarUrl = urlData.publicUrl;
      }

      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        teacher_name: form.teacher_name.trim() || null,
        teacher_designation: form.teacher_designation.trim() || null,
        teacher_avatar_url: finalAvatarUrl,
        level: form.level,
        term: form.term,
      };

      if (editingId) {
        const { error } = await supabase
          .from("courses")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(payload);
        if (error) throw error;
      }

      setDialogOpen(false);
      fetchCourses();
    } catch (error: any) {
      console.error("Error saving course:", error);
      alert(error.message || "Failed to save course details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      setDeleteConfirm(null);
      fetchCourses();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      alert(error.message || "Failed to delete course. It may have associated documents.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1A202C]">Manage Running Courses</h2>
          <p className="text-xs text-[#A0AEC0] mt-0.5">
            Add or edit running courses for current level and term. Mapped folders and documents are synced automatically.
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="small"
          style={{ background: "#006B3F" }}
        >
          Add Course
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[#A0AEC0] text-center py-8">Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-sm text-[#A0AEC0] text-center py-8">
          No courses added yet. Click &quot;Add Course&quot; to list one.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex gap-4 items-center justify-between shadow-sm"
            >
              {(() => {
                const displayTeacher = c.teachers && c.teachers.length > 0 
                  ? { 
                      name: c.teachers[0].full_name, 
                      designation: c.teachers[0].designation, 
                      avatar: c.teachers[0].avatar_url 
                    }
                  : { 
                      name: c.teacher_name, 
                      designation: c.teacher_designation, 
                      avatar: c.teacher_avatar_url 
                    };
                return (
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar
                      src={displayTeacher.avatar || undefined}
                      sx={{ width: 50, height: 50, bgcolor: "#EBF5FB", color: "#1B4F72", fontWeight: 600 }}
                    >
                      {displayTeacher.name ? displayTeacher.name[0]?.toUpperCase() : <BookIcon />}
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#1A202C] truncate">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#006B3F] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {c.code || "N/A"}
                        </span>
                        <span className="text-[10px] text-[#718096] bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          L-{c.level || "1"} T-{c.term || "I"}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#4A5568] mt-2">
                        <span className="font-semibold">Instructor:</span> {displayTeacher.name || "—"} 
                        {displayTeacher.designation && ` (${displayTeacher.designation})`}
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div className="flex flex-col gap-1 shrink-0">
                <IconButton size="small" onClick={() => handleOpenEdit(c)}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setDeleteConfirm(c)}
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
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId ? "Edit Course" : "Add Course"}
        </DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2 py-2">
            <Avatar
              src={avatarPreview || undefined}
              sx={{ width: 72, height: 72, border: "2px solid #006B3F" }}
            >
              {!avatarPreview && <BookIcon />}
            </Avatar>
            <Button
              variant="outlined"
              component="label"
              size="small"
              startIcon={<CloudUploadIcon />}
              style={{ borderColor: "#006B3F", color: "#006B3F" }}
            >
              Upload Teacher Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleAvatarChange}
                ref={fileInputRef}
              />
            </Button>
          </div>

          <TextField
            fullWidth
            label="Course Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            margin="dense"
            required
            disabled={saving}
          />

          <TextField
            fullWidth
            label="Course Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            margin="dense"
            required
            disabled={saving}
            placeholder="e.g. CSE 2201"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              fullWidth
              select
              label="Level"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              margin="dense"
              disabled={saving}
            >
              {LEVELS.map((l) => (
                <MenuItem key={l} value={l}>
                  Level {l}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              label="Term"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
              margin="dense"
              disabled={saving}
            >
              {TERMS.map((t) => (
                <MenuItem key={t} value={t}>
                  Term {t}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <TextField
            fullWidth
            label="Teacher Name"
            value={form.teacher_name}
            onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
            margin="dense"
            disabled={saving}
          />

          <TextField
            fullWidth
            label="Teacher Designation"
            value={form.teacher_designation}
            onChange={(e) => setForm({ ...form, teacher_designation: e.target.value })}
            margin="dense"
            disabled={saving}
            placeholder="e.g. Lecturer, Dept. of CSE"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !form.name.trim() || !form.code.trim()}
            style={{ background: "#006B3F" }}
          >
            {saving ? "Saving..." : editingId ? "Update" : "Save"}
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
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Course?</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#4A5568]">
            This action cannot be undone. All mapped documents and templates associated with <strong>{deleteConfirm?.name}</strong> may fail to load correctly.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
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
