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
import type { Deadline, DeadlineCategory } from "@/types/deadlines";
import { DEADLINE_CATEGORY_LABELS, getTimeRemaining } from "@/types/deadlines";

const CATEGORIES: DeadlineCategory[] = [
  "assignment",
  "quiz",
  "lab_report",
  "project",
];

const emptyForm = {
  title: "",
  description: "",
  category: "assignment" as DeadlineCategory,
  due_date: "",
};

export default function AdminDeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  const fetchDeadlines = useCallback(async () => {
    const { data } = await supabase
      .from("deadlines")
      .select("*")
      .order("due_date", { ascending: true });
    if (data) setDeadlines(data as Deadline[]);
  }, []);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (deadline: Deadline) => {
    setForm({
      title: deadline.title,
      description: deadline.description || "",
      category: deadline.category,
      due_date: deadline.due_date.slice(0, 16), // format for datetime-local
    });
    setEditingId(deadline.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category,
      due_date: new Date(form.due_date).toISOString(),
    };
    if (editingId) {
      await supabase
        .from("deadlines")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingId);
    } else {
      await supabase.from("deadlines").insert(payload);
    }
    setDialogOpen(false);
    fetchDeadlines();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("deadlines").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchDeadlines();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1A202C]">Manage Deadlines</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="small"
        >
          Add Deadline
        </Button>
      </div>

      {/* Deadlines List */}
      <div className="space-y-3">
        {deadlines.map((dl) => {
          const isPast = new Date(dl.due_date) < new Date();
          return (
            <div
              key={dl.id}
              className={`bg-white border rounded-lg p-4 flex items-start justify-between gap-3 ${
                isPast ? "border-[#FECACA] opacity-60" : "border-[#E2E8F0]"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-[#1B4F72] bg-[#EBF5FB] px-2 py-0.5 rounded">
                    {DEADLINE_CATEGORY_LABELS[dl.category]}
                  </span>
                  <span className="text-xs text-[#A0AEC0]">
                    {isPast ? "Overdue" : getTimeRemaining(dl.due_date)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[#1A202C]">
                  {dl.title}
                </h3>
                {dl.description && (
                  <p className="text-xs text-[#4A5568] mt-0.5 line-clamp-1">
                    {dl.description}
                  </p>
                )}
                <p className="text-xs text-[#A0AEC0] mt-1">
                  Due:{" "}
                  {new Date(dl.due_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <IconButton
                  size="small"
                  onClick={() => handleOpenEdit(dl)}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setDeleteConfirm(dl.id)}
                  sx={{ color: "#DC2626" }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </div>
            </div>
          );
        })}
        {deadlines.length === 0 && (
          <p className="text-sm text-[#A0AEC0] text-center py-8">
            No deadlines yet. Click &quot;Add Deadline&quot; to create one.
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
          {editingId ? "Edit Deadline" : "Create Deadline"}
        </DialogTitle>
        <DialogContent className="space-y-3 pt-2">
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
            label="Description (optional)"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            margin="dense"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            select
            label="Category"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value as DeadlineCategory,
              })
            }
            margin="dense"
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {DEADLINE_CATEGORY_LABELS[cat]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Due Date & Time"
            type="datetime-local"
            value={form.due_date}
            onChange={(e) =>
              setForm({ ...form, due_date: e.target.value })
            }
            margin="dense"
            required
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
            disabled={!form.title.trim() || !form.due_date}
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
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Deadline?</DialogTitle>
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
