"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import MenuItem from "@mui/material/MenuItem";

import SaveIcon from "@mui/icons-material/Save";
import SettingsIcon from "@mui/icons-material/Settings";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import BookIcon from "@mui/icons-material/Book";

import { createClient } from "@/lib/supabase/client";
import { useAdminScope } from "@/hooks/useAdminScope";

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

export default function AdminSettingsPage() {
  const { scope, loading: scopeLoading } = useAdminScope();
  const [settings, setSettings] = useState<PortalSettings>({
    university_name: "Bangladesh Army University of Science & Technology",
    department_name: "CSE",
    section_name: "Section A",
    batch_no: "Batch 19",
    batch_advisor: "Md. Zahim Hassan",
    dpc_name: "Md. Zahim Hassan",
    dpc_phone: "01736393334",
    logo_url: null,
  });
  interface Course {
    id: string;
    name: string;
    code: string;
    teacher_name: string;
    teacher_designation: string;
    teacher_avatar_url: string | null;
    teachers?: Array<{
      full_name: string;
      designation: string;
      avatar_url: string | null;
    }> | null;
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherDesignation, setTeacherDesignation] = useState("");
  const [teacherAvatarFile, setTeacherAvatarFile] = useState<File | null>(null);
  const [teacherAvatarPreview, setTeacherAvatarPreview] = useState<string | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const teacherFileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchCourses = async () => {
    if (scopeLoading || !scope) return;
    setCoursesLoading(true);
    let query = supabase
      .from("courses")
      .select("*, teachers(full_name, designation, avatar_url)");

    if (!scope.isSuperAdmin) {
      query = query
        .eq("level", scope.level)
        .eq("term", scope.term)
        .eq("section", scope.section);
    }

    const { data, error } = await query.order("name", { ascending: true });
    if (!error && data) {
      setCourses(data as any[]);
    }
    setCoursesLoading(false);
  };

  const handleOpenCourseDialog = (course: Course | null = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseName(course.name);
      setCourseCode(course.code || "");
      setTeacherName(course.teacher_name || "");
      setTeacherDesignation(course.teacher_designation || "");
      setTeacherAvatarPreview(course.teacher_avatar_url || null);
    } else {
      setEditingCourse(null);
      setCourseName("");
      setCourseCode("");
      setTeacherName("");
      setTeacherDesignation("");
      setTeacherAvatarPreview(null);
    }
    setTeacherAvatarFile(null);
    setCourseDialogOpen(true);
  };

  const handleTeacherAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setTeacherAvatarFile(file);
      setTeacherAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCourse(true);

    try {
      let finalAvatarUrl = teacherAvatarPreview;

      // 1. Upload new photo if selected
      if (teacherAvatarFile) {
        const fileExt = teacherAvatarFile.name.split(".").pop();
        const filePath = `teacher_avatars/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, teacherAvatarFile, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);
        finalAvatarUrl = urlData.publicUrl;
      }

      const payload = {
        name: courseName.trim(),
        code: courseCode.trim(),
        teacher_name: teacherName.trim(),
        teacher_designation: teacherDesignation.trim(),
        teacher_avatar_url: finalAvatarUrl,
        level: scope?.isSuperAdmin ? "1" : scope?.level || "1",
        term: scope?.isSuperAdmin ? "I" : scope?.term || "I",
        section: scope?.isSuperAdmin ? "A" : scope?.section || "A",
      };

      if (editingCourse) {
        // Edit existing course
        const { error } = await supabase
          .from("courses")
          .update(payload)
          .eq("id", editingCourse.id);
        if (error) throw error;
      } else {
        // Insert new course
        const { error } = await supabase
          .from("courses")
          .insert(payload);
        if (error) throw error;
      }

      setCourseDialogOpen(false);
      fetchCourses();
    } catch (err: any) {
      alert(`Error saving course: ${err.message || err}`);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the course "${name}"?`)) {
      return;
    }
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);
    if (!error) {
      fetchCourses();
    } else {
      alert(`Error deleting course: ${error.message}`);
    }
  };

  const loadSettings = async () => {
    if (scopeLoading || !scope) return;
    const settingsId = scope.isSuperAdmin ? "settings" : `settings_${scope.level}_${scope.term}_${scope.section}`;
    const { data, error } = await supabase
      .from("portal_settings")
      .select("*")
      .eq("id", settingsId)
      .maybeSingle();

    if (!error && data) {
      setSettings({
        university_name: data.university_name || "Bangladesh Army University of Science & Technology",
        department_name: data.department_name || "CSE",
        section_name: data.section_name || scope.section,
        batch_no: data.batch_no || `L-${scope.level} T-${scope.term}`,
        batch_advisor: data.batch_advisor || "Md. Zahim Hassan",
        dpc_name: data.dpc_name || "Md. Zahim Hassan",
        dpc_phone: data.dpc_phone || "01736393334",
        logo_url: data.logo_url || null,
      });
    } else {
      // Default placeholder if settings do not exist yet
      setSettings({
        university_name: "Bangladesh Army University of Science & Technology",
        department_name: "CSE",
        section_name: scope.section,
        batch_no: `L-${scope.level} T-${scope.term}`,
        batch_advisor: "Md. Zahim Hassan",
        dpc_name: "Md. Zahim Hassan",
        dpc_phone: "01736393334",
        logo_url: null,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!scopeLoading && scope) {
      loadSettings();
      fetchCourses();
    }
  }, [scope, scopeLoading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const settingsId = scope?.isSuperAdmin ? "settings" : `settings_${scope?.level}_${scope?.term}_${scope?.section}`;
    const { error } = await supabase
      .from("portal_settings")
      .upsert({
        id: settingsId,
        university_name: settings.university_name.trim(),
        department_name: settings.department_name.trim(),
        section_name: settings.section_name.trim(),
        batch_no: settings.batch_no.trim(),
        batch_advisor: settings.batch_advisor.trim(),
        dpc_name: settings.dpc_name.trim(),
        dpc_phone: settings.dpc_phone.trim(),
        logo_url: settings.logo_url,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      setMessage({ type: "error", text: `Failed to save settings: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Portal settings updated successfully!" });
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingLogo(true);
    setMessage(null);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `branding/logo_${Date.now()}.${fileExt}`;

      // Upload logo file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Instantly update settings state and upsert to db
      const updatedLogoUrl = urlData.publicUrl;
      setSettings((prev) => ({ ...prev, logo_url: updatedLogoUrl }));

      const { error: dbError } = await supabase
        .from("portal_settings")
        .upsert({
          id: "settings",
          ...settings,
          logo_url: updatedLogoUrl,
          updated_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      setMessage({ type: "success", text: "Logo uploaded and updated successfully!" });
    } catch (err: any) {
      console.error("Logo upload error:", err);
      setMessage({ type: "error", text: `Failed to upload logo: ${err.message || err}` });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <CircularProgress color="primary" />
        <p style={{ fontSize: 14, color: "#A0AEC0", marginTop: 8 }}>Loading portal configurations...</p>
      </div>
    );
  }

  const logoSrc = settings.logo_url || "/logo.png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 650, margin: "0 auto" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1B4F72 0%, #2471A3 100%)",
            boxShadow: "0 4px 12px rgba(27, 79, 114, 0.25)",
          }}
        >
          <SettingsIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A202C", margin: 0 }}>
            Portal Settings & Configuration
          </h2>
          <p style={{ fontSize: 13, color: "#718096", margin: "2px 0 0 0" }}>
            Configure class batch, section details, batch advisor, DPC details, and upload the university logo.
          </p>
        </div>
      </Box>

      <Card sx={{ p: 4, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Logo Configuration section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            p: 2,
            backgroundColor: "#FAFBFC",
            borderRadius: 2,
            border: "1px solid #E2E8F0",
          }}
        >
          <Box sx={{ position: "relative", width: 90, height: 100, border: "1px solid #CBD5E1", borderRadius: 1.5, p: 0.5, backgroundColor: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {uploadingLogo ? (
              <CircularProgress size={32} />
            ) : (
              <img
                src={logoSrc}
                alt="Branding Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            )}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A202C" }}>Institutional Logo</div>
            <div style={{ fontSize: 11, color: "#718096" }}>
              Upload your official university emblem to display on headers and routines.
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              style={{ display: "none" }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<PhotoCameraIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              sx={{ alignSelf: "flex-start", mt: 0.5, borderColor: "#1B4F72", color: "#1B4F72" }}
            >
              Upload Emblem
            </Button>
          </Box>
        </Box>

        {/* Configurations Form */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <TextField
            fullWidth
            label="University / Institution Name"
            value={settings.university_name}
            onChange={(e) => setSettings({ ...settings, university_name: e.target.value })}
            required
            disabled={saving}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Department / Program"
              value={settings.department_name}
              onChange={(e) => setSettings({ ...settings, department_name: e.target.value })}
              required
              disabled={saving}
              placeholder="e.g., Department of Computer Science & Engineering"
            />
            <TextField
              label="Section"
              value={settings.section_name}
              onChange={(e) => setSettings({ ...settings, section_name: e.target.value })}
              required
              disabled={saving}
              placeholder="e.g., C"
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Level-Term (e.g., 2-II)"
              value={settings.batch_no}
              onChange={(e) => setSettings({ ...settings, batch_no: e.target.value })}
              required
              disabled={saving}
            />
            <TextField
              label="Batch Advisor Name"
              value={settings.batch_advisor}
              onChange={(e) => setSettings({ ...settings, batch_advisor: e.target.value })}
              required
              disabled={saving}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="DPC/G2 Name"
              value={settings.dpc_name}
              onChange={(e) => setSettings({ ...settings, dpc_name: e.target.value })}
              required
              disabled={saving}
            />
            <TextField
              label="DPC Phone Number"
              value={settings.dpc_phone}
              onChange={(e) => setSettings({ ...settings, dpc_phone: e.target.value })}
              required
              disabled={saving}
            />
          </Box>

          {message && (
            <Alert severity={message.type} sx={{ borderRadius: 2 }}>
              {message.text}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} sx={{ color: "white" }} /> : <SaveIcon />}
            sx={{
              py: 1.5,
              background: "linear-gradient(135deg, #1B4F72 0%, #2471A3 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #153d58 0%, #1B4F72 100%)",
              },
            }}
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </Button>
        </form>
      </Card>

      {/* Card 2: Course Folders Management */}
      <Card sx={{ p: 4, display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #1B4F72 0%, #2471A3 100%)",
                boxShadow: "0 4px 12px rgba(27, 79, 114, 0.2)",
              }}
            >
              <BookIcon sx={{ fontSize: 18, color: "#FFFFFF" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A202C", margin: 0 }}>
                Course Folders & Teachers
              </h3>
              <p style={{ fontSize: 12, color: "#718096", margin: "2px 0 0 0" }}>
                Add and manage course codes, folder names, and course teacher profiles.
              </p>
            </div>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCourseDialog(null)}
            sx={{
              background: "linear-gradient(135deg, #1B4F72 0%, #2471A3 100%)",
              textTransform: "none",
            }}
          >
            Add Course
          </Button>
        </Box>

        {coursesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : courses.length === 0 ? (
          <p style={{ fontSize: 13, color: "#A0AEC0", textAlign: "center", padding: "16px 0", margin: 0 }}>
            No courses folders created yet. Click "Add Course" to get started.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {courses.map((course) => {
              const displayTeacher = course.teachers && course.teachers.length > 0 
                ? { 
                    name: course.teachers[0].full_name, 
                    designation: course.teachers[0].designation, 
                    avatar: course.teachers[0].avatar_url 
                  }
                : { 
                    name: course.teacher_name, 
                    designation: course.teacher_designation, 
                    avatar: course.teacher_avatar_url 
                  };
              return (
                <div
                  key={course.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    backgroundColor: "#FAFBFC",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar
                      src={displayTeacher.avatar || undefined}
                      sx={{ width: 44, height: 44, border: "1.5px solid #1B4F72" }}
                    >
                      {displayTeacher.name ? displayTeacher.name[0].toUpperCase() : <BookIcon />}
                    </Avatar>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C" }}>
                        {course.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#718096", fontWeight: 600 }}>
                        Code: {course.code || "N/A"}
                      </div>
                      <div style={{ fontSize: 12, color: "#4A5568", marginTop: 2, display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600 }}>{displayTeacher.name || "No Teacher"}</span>
                        {displayTeacher.designation && (
                          <span style={{ fontSize: 10, color: "#718096", fontStyle: "italic" }}>
                            {displayTeacher.designation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Tooltip title="Edit Course" arrow>
                      <IconButton size="small" onClick={() => handleOpenCourseDialog(course)} color="primary">
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Course" arrow>
                      <IconButton size="small" onClick={() => handleDeleteCourse(course.id, course.name)} color="error">
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Dialog Form for Course Creation / Editing */}
      <Dialog open={courseDialogOpen} onClose={() => setCourseDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, color: "#1B4F72" }}>
          {editingCourse ? "Edit Course Folder" : "Add Course Folder"}
        </DialogTitle>
        <form onSubmit={handleSaveCourse}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            {/* Teacher Avatar Uploader preview */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  position: "relative",
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  border: "2px solid #1B4F72",
                  overflow: "hidden",
                  backgroundColor: "#F1F5F9",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {teacherAvatarPreview ? (
                  <img
                    src={teacherAvatarPreview}
                    alt="Teacher Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <BookIcon sx={{ fontSize: 32, color: "#94A3B8" }} />
                )}
              </Box>
              <input
                type="file"
                ref={teacherFileInputRef}
                onChange={handleTeacherAvatarChange}
                accept="image/*"
                style={{ display: "none" }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCameraIcon />}
                onClick={() => teacherFileInputRef.current?.click()}
                sx={{ borderColor: "#1B4F72", color: "#1B4F72", textTransform: "none", fontSize: 11 }}
              >
                Upload Teacher Photo
              </Button>
            </Box>

            <TextField
              fullWidth
              label="Course Folder Name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
              placeholder="e.g., Machine Learning"
              size="small"
            />

            <TextField
              fullWidth
              label="Course Code"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              required
              placeholder="e.g., CSE-4101"
              size="small"
            />

            <TextField
              fullWidth
              label="Teacher Name"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              required
              placeholder="e.g., Dr. Md. Al Amin"
              size="small"
            />

            <TextField
              fullWidth
              label="Teacher Designation"
              value={teacherDesignation}
              onChange={(e) => setTeacherDesignation(e.target.value)}
              required
              placeholder="e.g., Lecturer or Assistant Professor"
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCourseDialogOpen(false)} sx={{ color: "#718096" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingCourse}
              sx={{
                background: "linear-gradient(135deg, #1B4F72 0%, #2471A3 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #153d58 0%, #1B4F72 100%)",
                },
              }}
            >
              {savingCourse ? "Saving..." : "Save Course"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </motion.div>
  );
}
