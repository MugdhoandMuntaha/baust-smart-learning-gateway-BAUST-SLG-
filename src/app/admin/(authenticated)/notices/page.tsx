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
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { createClient } from "@/lib/supabase/client";
import { useAdminScope } from "@/hooks/useAdminScope";
import type { Notice, NoticeCategory } from "@/types/notices";
import { CATEGORY_LABELS } from "@/types/notices";

const CATEGORIES: NoticeCategory[] = [
  "exam",
  "class_cancelled",
  "assignment",
  "urgent",
  "general",
];

const emptyForm = {
  title: "",
  content: "",
  category: "general" as NoticeCategory,
  is_pinned: false,
};

export default function AdminNoticesPage() {
  const { scope, loading: scopeLoading } = useAdminScope();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  const fetchNotices = useCallback(async () => {
    if (scopeLoading || !scope) return;
    let query = supabase.from("notices").select("*");

    if (!scope.isSuperAdmin) {
      query = query
        .eq("level", scope.level)
        .eq("term", scope.term)
        .eq("section", scope.section);
    }

    const { data } = await query
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setNotices(data as Notice[]);
  }, [supabase, scope, scopeLoading]);

  useEffect(() => {
    if (!scopeLoading && scope) {
      fetchNotices();
    }
  }, [fetchNotices, scope, scopeLoading]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (notice: Notice) => {
    setForm({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      is_pinned: notice.is_pinned,
    });
    setEditingId(notice.id);
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
      await supabase
        .from("notices")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingId);
    } else {
      await supabase.from("notices").insert(payload);
    }
    setDialogOpen(false);
    fetchNotices();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notices").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchNotices();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1A202C]">Manage Notices</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="small"
        >
          Add Notice
        </Button>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-start justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {notice.is_pinned && (
                  <span className="text-[10px] font-bold text-[#006B3F] uppercase">
                    📌 Pinned
                  </span>
                )}
                <span className={`badge-${notice.category} text-[10px] font-semibold px-2 py-0.5 rounded`}>
                  {CATEGORY_LABELS[notice.category]}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#1A202C] truncate">
                {notice.title}
              </h3>
              <p className="text-xs text-[#4A5568] line-clamp-2 mt-0.5">
                {notice.content}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <IconButton size="small" onClick={() => handleOpenEdit(notice)}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setDeleteConfirm(notice.id)}
                sx={{ color: "#DC2626" }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <p className="text-sm text-[#A0AEC0] text-center py-8">
            No notices yet. Click &quot;Add Notice&quot; to create one.
          </p>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId ? "Edit Notice" : "Create Notice"}
        </DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          <TextField
            fullWidth
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            margin="dense"
            required
          />
          <TextField
            fullWidth
            label="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            margin="dense"
            multiline
            rows={4}
            required
          />
          <TextField
            fullWidth
            select
            label="Category"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as NoticeCategory })
            }
            margin="dense"
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={form.is_pinned}
                onChange={(e) =>
                  setForm({ ...form, is_pinned: e.target.checked })
                }
                color="primary"
              />
            }
            label="Pin to Top"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!form.title.trim() || !form.content.trim()}
          >
            {editingId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Notice?</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#4A5568]">
            This action cannot be undone.
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
