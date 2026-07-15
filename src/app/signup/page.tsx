"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import MenuItem from "@mui/material/MenuItem";
import SchoolIcon from "@mui/icons-material/School";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function StudentSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [section, setSection] = useState("C");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      // 1. Register Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData?.user) {
        const userId = authData.user.id;
        let finalAvatarUrl = null;

        // 2. Upload avatar if selected
        if (avatarFile) {
          const fileExt = avatarFile.name.split(".").pop();
          const filePath = `avatars/${userId}_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, avatarFile, { cacheControl: "3600", upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("documents")
              .getPublicUrl(filePath);
            finalAvatarUrl = urlData.publicUrl;
          }
        }

        // 3. Create student profile in database
        const { error: profileError } = await supabase
          .from("student_profiles")
          .insert({
            id: userId,
            email: email.trim(),
            full_name: fullName.trim(),
            student_id: studentId.trim(),
            department: department,
            section: section,
            avatar_url: finalAvatarUrl,
            approved: false, // join request pending
          });

        if (profileError) {
          setError(`Auth created, but profile failed: ${profileError.message}`);
          setLoading(false);
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/pending");
        }, 1500);
      }
    } catch (err: any) {
      setError("An unexpected error occurred during signup.");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f0faf5] via-white to-[#f5f9ff] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 107, 63, 0.1)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Back to Login link */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#006B3F",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              marginBottom: 20,
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 14 }} /> Back to Sign In
          </Link>

          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{
                background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                boxShadow: "0 8px 24px rgba(0, 107, 63, 0.25)",
              }}
            >
              <SchoolIcon sx={{ fontSize: 28, color: "#FFFFFF" }} />
            </div>
            <h1 className="text-xl font-bold text-[#1A202C]">Student Registration</h1>
            <p className="text-xs text-[#718096] mt-1">
              Create an account. Access requires CR validation approval.
            </p>
          </div>

          {success ? (
            <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
              Account created successfully! Redirecting to pending page...
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Uploader preview */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2, gap: 1 }}>
                <Box
                  sx={{
                    position: "relative",
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "2px solid #006B3F",
                    overflow: "hidden",
                    backgroundColor: "#F1F5F9",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <SchoolIcon sx={{ fontSize: 40, color: "#94A3B8" }} />
                  )}
                </Box>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ borderColor: "#006B3F", color: "#006B3F", textTransform: "none", fontSize: 12 }}
                >
                  Upload Photo
                </Button>
              </Box>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Student ID / Roll"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="e.g. 200201040"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <TextField
                  fullWidth
                  select
                  label="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  disabled={loading}
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
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="e.g. C"
                />
              </div>

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              <TextField
                fullWidth
                label="Choose Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                helperText="Must be at least 6 characters"
              />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #004d2d 0%, #006B3F 100%)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Submit Join Request"
                )}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
