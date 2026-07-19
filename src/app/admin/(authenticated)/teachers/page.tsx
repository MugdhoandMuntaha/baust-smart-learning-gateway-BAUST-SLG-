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
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string;
  name: string;
  code: string | null;
}

interface Teacher {
  id: string;
  full_name: string;
  designation: string;
  course_id: string | null;
  phone_number: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  courses?: Course | null;
}

const emptyForm = {
  full_name: "",
  designation: "",
  course_id: "",
  phone_number: "",
  email: "",
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [teachersRes, coursesRes] = await Promise.all([
      supabase
        .from("teachers")
        .select("*, courses(id, name, code)")
        .order("created_at", { ascending: false }),
      supabase.from("courses").select("id, name, code").order("name"),
    ]);

    if (teachersRes.data) setTeachers(teachersRes.data as any[]);
    if (coursesRes.data) setCourses(coursesRes.data as Course[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setForm({
      full_name: t.full_name,
      designation: t.designation,
      course_id: t.course_id || "",
      phone_number: t.phone_number || "",
      email: t.email || "",
    });
    setAvatarFile(null);
    setAvatarPreview(t.avatar_url);
    setEditingId(t.id);
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
        full_name: form.full_name,
        designation: form.designation,
        course_id: form.course_id || null,
        phone_number: form.phone_number || null,
        email: form.email || null,
        avatar_url: finalAvatarUrl,
      };

      if (editingId) {
        const { error } = await supabase
          .from("teachers")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("teachers").insert(payload);
        if (error) throw error;
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving teacher:", error);
      alert(error.message || "Failed to save teacher details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
      setDeleteConfirm(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting teacher:", error);
      alert(error.message || "Failed to delete teacher.");
    }
  };

  const getCourseInfo = (t: Teacher) => {
    const c = Array.isArray(t.courses) ? t.courses[0] : t.courses;
    if (!c) return "—";
    return `${c.name} (${c.code || "N/A"})`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1A202C]">Manage Course Teachers</h2>
          <p className="text-xs text-[#A0AEC0] mt-0.5">
            Add or edit course teachers. Details will be shown in the portal and can be selected inside generators.
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="small"
          style={{ background: "#006B3F" }}
        >
          Add Teacher
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[#A0AEC0] text-center py-8">Loading...</p>
      ) : teachers.length === 0 ? (
        <p className="text-sm text-[#A0AEC0] text-center py-8">
          No teachers added yet. Click &quot;Add Teacher&quot; to list one.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachers.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4 min-w-0 w-full">
                <Avatar
                  src={t.avatar_url || undefined}
                  sx={{ width: 64, height: 64, bgcolor: "#EBF5FB", color: "#1B4F72", fontWeight: 600, flexShrink: 0 }}
                >
                  {t.full_name[0]?.toUpperCase()}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[#1A202C] truncate">
                    {t.full_name}
                  </h3>
                  <p className="text-xs text-[#4A5568] truncate">{t.designation}</p>
                  <p className="text-[11px] text-[#006B3F] font-medium mt-1 truncate">
                    📚 Course: {getCourseInfo(t)}
                  </p>
                  <div className="text-[11px] text-[#A0AEC0] mt-1 space-y-0.5">
                    {t.email && <p className="truncate">📧 {t.email}</p>}
                    {t.phone_number && <p className="truncate">📞 {t.phone_number}</p>}
                  </div>
                </div>
              </div>
              <div className="flex flex-row sm:flex-col gap-1 justify-end w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 mt-1 sm:mt-0">
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
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId ? "Edit Teacher" : "Add Teacher"}
        </DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2 py-2">
            <Avatar
              src={avatarPreview || undefined}
              sx={{ width: 80, height: 80, border: "2px solid #006B3F" }}
            />
            <Button
              variant="outlined"
              component="label"
              size="small"
              startIcon={<CloudUploadIcon />}
              style={{ borderColor: "#006B3F", color: "#006B3F" }}
            >
              Upload Photo
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
            label="Full Name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            margin="dense"
            required
            disabled={saving}
          />

          <TextField
            fullWidth
            label="Designation"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            margin="dense"
            required
            disabled={saving}
            placeholder="e.g. Lecturer, Dept. of CSE"
          />

          <TextField
            fullWidth
            select
            label="Associated Course (Optional)"
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            margin="dense"
            disabled={saving}
          >
            <MenuItem value="">None / General</MenuItem>
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} {c.code ? `(${c.code})` : ""}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Phone Number"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            margin="dense"
            disabled={saving}
            placeholder="e.g. +88017XXXXXXXX"
          />

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            margin="dense"
            disabled={saving}
            placeholder="e.g. name@baust.edu.bd"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !form.full_name.trim() || !form.designation.trim()}
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
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Teacher?</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#4A5568]">
            This action cannot be undone. This teacher will be removed from the directory.
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
