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
import { useAdminScope } from "@/hooks/useAdminScope";
import type { Deadline, DeadlineCategory } from "@/types/deadlines";
import { DEADLINE_CATEGORY_LABELS, getTimeRemaining } from "@/types/deadlines";

const CATEGORIES: DeadlineCategory[] = [
  "assignment",
  "quiz",
  "lab_report",
  "project",
  "mid_exam",
  "ct",
  "lab_evaluation",
  "viva",
];

const emptyForm = {
  title: "",
  description: "",
  category: "assignment" as DeadlineCategory,
  due_date: "",
  period: "",
  room_no: "",
  // New fields for lab_report / assignment / exams / ct / quiz
  exp_no: "",
  exp_name: "",
  assignment_no: "",
  assignment_name: "",
  course_id: "",
  course_name: "",
  course_code: "",
  teachers: "",
  experiment_date: "",
  assigned_date: "",
  syllabus: "",
};

export default function AdminDeadlinesPage() {
  const { scope, loading: scopeLoading } = useAdminScope();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  const fetchDeadlines = useCallback(async () => {
    if (scopeLoading || !scope) return;
    let query = supabase.from("deadlines").select("*");

    if (!scope.isSuperAdmin) {
      query = query
        .eq("level", scope.level)
        .eq("term", scope.term)
        .eq("section", scope.section);
    }

    const { data } = await query.order("due_date", { ascending: true });
    if (data) setDeadlines(data as Deadline[]);
  }, [supabase, scope, scopeLoading]);

  useEffect(() => {
    if (!scopeLoading && scope) {
      fetchDeadlines();
    }
  }, [fetchDeadlines, scope, scopeLoading]);

  // Fetch running courses for dropdown select options
  useEffect(() => {
    if (scopeLoading || !scope) return;
    const currentScope = scope;
    async function fetchCourses() {
      let q = supabase
        .from("courses")
        .select("id, name, code, type, teacher_name");
      if (!currentScope.isSuperAdmin) {
        q = q
          .eq("level", currentScope.level)
          .eq("term", currentScope.term)
          .eq("section", currentScope.section);
      }
      const { data } = await q.order("name", { ascending: true });
      if (data) setCourses(data);
    }
    fetchCourses();
  }, [scope, scopeLoading, supabase]);

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (deadline: Deadline) => {
    let isJson = false;
    let parsed: any = {};
    if (deadline.description && deadline.description.startsWith("{")) {
      try {
        parsed = JSON.parse(deadline.description);
        isJson = true;
      } catch (e) {}
    }

    const activeSyllabus = parsed.syllabus || deadline.syllabus || "";

    if (isJson) {
      const selectedCourse = courses.find(c => c.name === parsed.course_name && c.code === parsed.course_code);
      setForm({
        title: deadline.title,
        description: parsed.description || "",
        category: deadline.category,
        due_date: deadline.due_date ? deadline.due_date.slice(0, 16) : "",
        period: deadline.period || "",
        room_no: deadline.room_no || "",
        exp_no: parsed.exp_no || "",
        exp_name: parsed.exp_name || "",
        assignment_no: parsed.assignment_no || "",
        assignment_name: parsed.assignment_name || "",
        course_id: selectedCourse ? selectedCourse.id : "",
        course_name: parsed.course_name || "",
        course_code: parsed.course_code || "",
        teachers: parsed.teachers || "",
        experiment_date: parsed.experiment_date || "",
        assigned_date: parsed.assigned_date || "",
        syllabus: activeSyllabus,
      });
    } else {
      setForm({
        title: deadline.title,
        description: deadline.description || "",
        category: deadline.category,
        due_date: deadline.due_date ? deadline.due_date.slice(0, 16) : "",
        period: deadline.period || "",
        room_no: deadline.room_no || "",
        exp_no: "",
        exp_name: "",
        assignment_no: "",
        assignment_name: "",
        course_id: "",
        course_name: "",
        course_code: "",
        teachers: "",
        experiment_date: "",
        assigned_date: "",
        syllabus: activeSyllabus,
      });
    }
    setEditingId(deadline.id);
    setDialogOpen(true);
  };

  const handleCourseChange = (courseId: string) => {
    if (!courseId) {
      setForm((prev) => ({
        ...prev,
        course_id: "",
        course_name: "",
        course_code: "",
        teachers: "",
      }));
      return;
    }
    const selected = courses.find((c) => c.id === courseId);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        course_id: selected.id,
        course_name: selected.name,
        course_code: selected.code || "",
        teachers: selected.teacher_name || "",
      }));
    }
  };

  const handleSave = async () => {
    let payloadTitle = form.title;
    let payloadDescription: string | null = form.description || null;
    let payloadPeriod: string | null = form.period || null;
    let payloadRoomNo: string | null = form.room_no || null;

    if (form.category === "lab_report") {
      payloadTitle = `Experiment ${form.exp_no}: ${form.exp_name}`;
      payloadDescription = JSON.stringify({
        type: "lab_report",
        exp_no: form.exp_no,
        exp_name: form.exp_name,
        course_name: form.course_name,
        course_code: form.course_code,
        teachers: form.teachers,
        experiment_date: form.experiment_date,
        description: form.description || "",
      });
      payloadPeriod = null;
      payloadRoomNo = null;
    } else if (form.category === "assignment") {
      payloadTitle = `Assignment ${form.assignment_no}: ${form.assignment_name}`;
      payloadDescription = JSON.stringify({
        type: "assignment",
        assignment_no: form.assignment_no,
        assignment_name: form.assignment_name,
        course_name: form.course_name,
        course_code: form.course_code,
        teachers: form.teachers,
        assigned_date: form.assigned_date,
        description: form.description || "",
      });
      payloadPeriod = null;
      payloadRoomNo = null;
    } else if (
      form.category === "mid_exam" ||
      form.category === "ct" ||
      form.category === "quiz" ||
      form.category === "lab_evaluation" ||
      form.category === "viva"
    ) {
      payloadTitle = form.title;
      payloadDescription = JSON.stringify({
        type: form.category,
        course_name: form.course_name,
        course_code: form.course_code,
        teachers: form.teachers,
        syllabus: form.syllabus || "",
        description: form.description || "",
      });
      payloadPeriod = form.period || null;
      payloadRoomNo = form.room_no || null;
    }

    const payload: any = {
      title: payloadTitle,
      description: payloadDescription,
      syllabus: form.syllabus || null,
      category: form.category,
      due_date: new Date(form.due_date).toISOString(),
      period: payloadPeriod,
      room_no: payloadRoomNo,
      level: scope?.isSuperAdmin ? "1" : scope?.level || "1",
      term: scope?.isSuperAdmin ? "I" : scope?.term || "I",
      section: scope?.isSuperAdmin ? "A" : scope?.section || "A",
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

  const isFormValid = () => {
    if (form.category === "lab_report") {
      return (
        form.exp_no.trim() !== "" &&
        form.exp_name.trim() !== "" &&
        form.course_name.trim() !== "" &&
        form.experiment_date !== "" &&
        form.due_date !== ""
      );
    }
    if (form.category === "assignment") {
      return (
        form.assignment_no.trim() !== "" &&
        form.assignment_name.trim() !== "" &&
        form.course_name.trim() !== "" &&
        form.assigned_date !== "" &&
        form.due_date !== ""
      );
    }
    return form.title.trim() !== "" && form.due_date !== "";
  };

  const renderDescription = (dl: Deadline) => {
    let isJson = false;
    let parsed: any = {};
    if (dl.description && dl.description.startsWith("{")) {
      try {
        parsed = JSON.parse(dl.description);
        isJson = true;
      } catch (e) {}
    }

    const activeSyllabus = parsed.syllabus || dl.syllabus;

    if (isJson) {
      return (
        <div className="mt-1 text-xs text-[#4A5568] space-y-1 bg-[#F8FAFC] p-2.5 rounded border border-[#EDF2F7]">
          {parsed.course_name && (
            <div>
              <strong>Course:</strong> {parsed.course_name} {parsed.course_code ? `(${parsed.course_code})` : ""}
            </div>
          )}
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
          {activeSyllabus && (
            <div className="mt-1.5 pt-1.5 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-1 text-[#006B3F] font-bold mb-0.5">
                <span>📖</span>
                <span>Syllabus:</span>
              </div>
              <p className="text-xs text-[#2D3748] whitespace-pre-line bg-emerald-50 p-2 rounded border border-emerald-100 font-medium">
                {activeSyllabus}
              </p>
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
      <div className="mt-0.5 space-y-1">
        {activeSyllabus && (
          <div className="p-2 bg-emerald-50 rounded border border-emerald-100 text-xs">
            <div className="flex items-center gap-1 text-[#006B3F] font-bold mb-0.5">
              <span>📖</span>
              <span>Syllabus:</span>
            </div>
            <p className="text-xs text-[#2D3748] whitespace-pre-line font-medium">
              {activeSyllabus}
            </p>
          </div>
        )}
        {dl.description && (
          <p className="text-xs text-[#4A5568] line-clamp-2">
            {dl.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1A202C]">Manage Academic Schedule</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="small"
        >
          Add Schedule Item
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
                {renderDescription(dl)}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-[#718096]">
                  <span>📅 {new Date(dl.due_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</span>
                  {dl.period && (
                    <span>⏱️ {dl.period}</span>
                  )}
                  {dl.room_no && (
                    <span>📍 Room {dl.room_no}</span>
                  )}
                </div>
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
            No schedule items yet. Click &quot;Add Schedule Item&quot; to create one.
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
          {editingId ? "Edit Schedule Item" : "Create Schedule Item"}
        </DialogTitle>
        <DialogContent className="space-y-3 pt-2">
          {/* Category Selector */}
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

          {/* Dynamic input fields based on Category */}
          {form.category === "lab_report" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Experiment No (e.g. 01)"
                  value={form.exp_no}
                  onChange={(e) => setForm({ ...form, exp_no: e.target.value })}
                  margin="dense"
                  required
                />
                <TextField
                  fullWidth
                  label="Experiment Name"
                  value={form.exp_name}
                  onChange={(e) => setForm({ ...form, exp_name: e.target.value })}
                  margin="dense"
                  required
                />
              </div>

              {/* Sessional Course Name Select Dropdown */}
              <TextField
                fullWidth
                select
                label="Sessional Course"
                value={form.course_id}
                onChange={(e) => handleCourseChange(e.target.value)}
                margin="dense"
                required
              >
                {courses
                  .filter((c) => c.type === "sessional")
                  .map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
              </TextField>

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Course Code"
                  value={form.course_code}
                  margin="dense"
                  disabled
                />
                <TextField
                  fullWidth
                  label="Course Teacher(s)"
                  value={form.teachers}
                  margin="dense"
                  disabled
                />
              </div>

              <TextField
                fullWidth
                label="Date of Experiment"
                type="date"
                value={form.experiment_date}
                onChange={(e) => setForm({ ...form, experiment_date: e.target.value })}
                margin="dense"
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          ) : form.category === "assignment" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Assignment No (e.g. 01)"
                  value={form.assignment_no}
                  onChange={(e) => setForm({ ...form, assignment_no: e.target.value })}
                  margin="dense"
                  required
                />
                <TextField
                  fullWidth
                  label="Assignment Name"
                  value={form.assignment_name}
                  onChange={(e) => setForm({ ...form, assignment_name: e.target.value })}
                  margin="dense"
                  required
                />
              </div>

              {/* Theory Course Name Select Dropdown */}
              <TextField
                fullWidth
                select
                label="Theory Course"
                value={form.course_id}
                onChange={(e) => handleCourseChange(e.target.value)}
                margin="dense"
                required
              >
                {courses
                  .filter((c) => c.type === "theory")
                  .map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
              </TextField>

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Course Code"
                  value={form.course_code}
                  margin="dense"
                  disabled
                />
                <TextField
                  fullWidth
                  label="Course Teacher(s)"
                  value={form.teachers}
                  margin="dense"
                  disabled
                />
              </div>

              <TextField
                fullWidth
                label="Date of Assigned"
                type="date"
                value={form.assigned_date}
                onChange={(e) => setForm({ ...form, assigned_date: e.target.value })}
                margin="dense"
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          ) : form.category === "mid_exam" ||
            form.category === "ct" ||
            form.category === "quiz" ||
            form.category === "lab_evaluation" ||
            form.category === "viva" ? (
            <>
              {(() => {
                const categoryName =
                  form.category === "ct"
                    ? "Class Test (CT)"
                    : form.category === "mid_exam"
                    ? "Mid Exam"
                    : form.category === "lab_evaluation"
                    ? "Lab Evaluation"
                    : form.category === "viva"
                    ? "Viva"
                    : "Quiz";
                const titlePlaceholder =
                  form.category === "ct"
                    ? "e.g. CT-1: SQL & Normalization"
                    : form.category === "mid_exam"
                    ? "e.g. Mid Term Examination"
                    : form.category === "lab_evaluation"
                    ? "e.g. Lab Evaluation 1: Data Structures Lab"
                    : form.category === "viva"
                    ? "e.g. Lab Viva / Final Viva Voce"
                    : "e.g. Quiz 1: Relational Algebra";

                const isMultiCourse = form.category === "lab_evaluation" || form.category === "viva";

                return (
                  <>
                    <TextField
                      fullWidth
                      label={`${categoryName} Title`}
                      placeholder={titlePlaceholder}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      margin="dense"
                      required
                    />

                    {/* Course Name Select Dropdown */}
                    <TextField
                      fullWidth
                      select
                      label={isMultiCourse ? "Course (Theory / Sessional)" : "Theory Course (Optional)"}
                      value={form.course_id}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      margin="dense"
                    >
                      <MenuItem value="">
                        <em>None / General</em>
                      </MenuItem>
                      {courses
                        .filter((c) => (isMultiCourse ? true : c.type === "theory"))
                        .map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.code ? `${c.code} - ${c.name}` : c.name}
                          </MenuItem>
                        ))}
                    </TextField>

                    {/* Syllabus Input Field */}
                    <TextField
                      fullWidth
                      label={`📖 ${categoryName} Syllabus`}
                      placeholder={`Enter chapters, topics, or detailed syllabus for ${categoryName}`}
                      value={form.syllabus}
                      onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
                      margin="dense"
                      multiline
                      rows={3}
                      helperText={`Set by CR: Students will view this ${categoryName.toLowerCase()} syllabus in their schedule portal.`}
                    />
                  </>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Period / Time (e.g. 3rd period)"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  margin="dense"
                />
                <TextField
                  fullWidth
                  label="Room No (e.g. 407)"
                  value={form.room_no}
                  onChange={(e) => setForm({ ...form, room_no: e.target.value })}
                  margin="dense"
                />
              </div>
            </>
          ) : (
            <>
              <TextField
                fullWidth
                label="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                margin="dense"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Period / Time (e.g. 3rd period)"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  margin="dense"
                />
                <TextField
                  fullWidth
                  label="Room No (e.g. 407)"
                  value={form.room_no}
                  onChange={(e) => setForm({ ...form, room_no: e.target.value })}
                  margin="dense"
                />
              </div>
            </>
          )}

          {/* Date of Submission / Due Date */}
          <TextField
            fullWidth
            label={form.category === "lab_report" || form.category === "assignment" ? "Date of Submission" : "Due Date & Time"}
            type={form.category === "lab_report" || form.category === "assignment" ? "datetime-local" : "datetime-local"}
            value={form.due_date}
            onChange={(e) =>
              setForm({ ...form, due_date: e.target.value })
            }
            margin="dense"
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {/* Description field (optional) */}
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!isFormValid()}
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
