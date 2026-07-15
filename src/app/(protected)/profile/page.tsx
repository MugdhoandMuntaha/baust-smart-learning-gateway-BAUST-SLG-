"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import PersonIcon from "@mui/icons-material/Person";
import SaveIcon from "@mui/icons-material/Save";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

import { createClient } from "@/lib/supabase/client";

interface StudentProfile {
  full_name: string;
  student_id: string;
  department: string;
  section: string;
  level: string;
  term: string;
  avatar_url: string | null;
  email: string;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile>({
    full_name: "",
    student_id: "",
    department: "CSE",
    section: "C",
    level: "1",
    term: "I",
    avatar_url: null,
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<StudentProfile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const startEditing = () => {
    setTempProfile({ ...profile });
    setIsEditing(true);
    setMessage(null);
  };

  const cancelEditing = () => {
    if (tempProfile) {
      setProfile({ ...tempProfile });
    }
    setIsEditing(false);
    setMessage(null);
  };

  useEffect(() => {
    async function loadProfile() {
      // 1. Get current logged in user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Load profile data
      const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile({
          full_name: data.full_name,
          student_id: data.student_id,
          department: data.department,
          section: data.section,
          level: data.level || "1",
          term: data.term || "I",
          avatar_url: data.avatar_url,
          email: user.email || "",
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("student_profiles")
      .update({
        full_name: profile.full_name.trim(),
        student_id: profile.student_id.trim(),
        department: profile.department,
        section: profile.section.trim(),
        level: profile.level,
        term: profile.term,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: `Failed to update profile: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
      // Instantly dispatch event to let Navbar refresh its user avatar
      window.dispatchEvent(new Event("profile-updated"));
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingAvatar(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${user.id}_${Date.now()}.${fileExt}`;

      // 1. Upload to Supabase Storage documents bucket
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // 3. Update database
      const { error: dbError } = await supabase
        .from("student_profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (dbError) throw dbError;

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
      setMessage({ type: "success", text: "Profile picture updated successfully!" });
      // Refresh Navbar
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      setMessage({ type: "error", text: `Failed to upload avatar: ${err.message || err}` });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <CircularProgress color="primary" />
        <p style={{ fontSize: 14, color: "#A0AEC0", marginTop: 8 }}>Loading profile details...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600, margin: "0 auto" }}
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
            background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
            boxShadow: "0 4px 12px rgba(0, 107, 63, 0.25)",
          }}
        >
          <PersonIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A202C", margin: 0 }}>
            Student Profile
          </h2>
          <p style={{ fontSize: 13, color: "#718096", margin: "2px 0 0 0" }}>
            Manage your personal profile, student ID registration, and profile picture avatar.
          </p>
        </div>
      </Box>

      <Card sx={{ p: 4, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Avatar Section */}
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
          <Box sx={{ position: "relative" }}>
            {uploadingAvatar ? (
              <Box sx={{ width: 80, height: 80, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#E2E8F0", borderRadius: "50%" }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Avatar
                src={profile.avatar_url || undefined}
                sx={{ width: 80, height: 80, border: "2px solid #006B3F" }}
              >
                {profile.full_name ? profile.full_name[0].toUpperCase() : <PersonIcon />}
              </Avatar>
            )}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A202C" }}>Profile Picture</div>
            <div style={{ fontSize: 11, color: "#718096", marginBottom: 6 }}>
              {isEditing ? "Upload a clear profile picture for section identification." : "Profile picture registered."}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              style={{ display: "none" }}
            />
            {isEditing && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCameraIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                sx={{ alignSelf: "flex-start", borderColor: "#006B3F", color: "#006B3F" }}
              >
                Change Photo
              </Button>
            )}
          </Box>
        </Box>

        {/* Profile Info Form */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TextField
            fullWidth
            label="Email Address"
            value={profile.email}
            disabled
            helperText="Auth email cannot be changed"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <TextField
              label="Full Name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              required
              disabled={!isEditing || saving}
            />
            <TextField
              label="Student ID / Roll"
              value={profile.student_id}
              onChange={(e) => setProfile({ ...profile, student_id: e.target.value })}
              required
              disabled={!isEditing || saving}
              placeholder="e.g. 200201040"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <TextField
              fullWidth
              select
              label="Department"
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              required
              disabled={!isEditing || saving}
            >
              {["CSE", "EEE", "ME", "CE", "IPE", "BBA"].map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Section"
              value={profile.section}
              onChange={(e) => setProfile({ ...profile, section: e.target.value })}
              required
              disabled={!isEditing || saving}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <TextField
              fullWidth
              select
              label="Level"
              value={profile.level}
              onChange={(e) => setProfile({ ...profile, level: e.target.value })}
              required
              disabled={!isEditing || saving}
            >
              {["1", "2", "3", "4"].map((lvl) => (
                <MenuItem key={lvl} value={lvl}>
                  Level {lvl}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              label="Term"
              value={profile.term}
              onChange={(e) => setProfile({ ...profile, term: e.target.value })}
              required
              disabled={!isEditing || saving}
            >
              {["I", "II"].map((t) => (
                <MenuItem key={t} value={t}>
                  Term {t}
                </MenuItem>
              ))}
            </TextField>
          </div>

          {message && (
            <Alert severity={message.type} sx={{ borderRadius: 2 }}>
              {message.text}
            </Alert>
          )}

          {!isEditing ? (
            <Button
              type="button"
              variant="contained"
              onClick={startEditing}
              sx={{
                py: 1.5,
                background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #004d2d 0%, #006B3F 100%)",
                },
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <div style={{ display: "flex", gap: 16 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} sx={{ color: "white" }} /> : <SaveIcon />}
                sx={{
                  flex: 1,
                  py: 1.5,
                  background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #004d2d 0%, #006B3F 100%)",
                  },
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={cancelEditing}
                disabled={saving}
                sx={{
                  flex: 1,
                  py: 1.5,
                  borderColor: "#CBD5E1",
                  color: "#4A5568",
                  "&:hover": {
                    borderColor: "#94A3B8",
                    backgroundColor: "#F8F9FA",
                  },
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </form>
      </Card>
    </motion.div>
  );
}
