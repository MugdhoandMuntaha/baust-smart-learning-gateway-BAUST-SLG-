"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import SchoolIcon from "@mui/icons-material/School";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function StudentLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [settings, setSettings] = useState({
    university_name: "Bangladesh Army University of Science & Technology",
    department_name: "CSE",
    section_name: "Section A",
    batch_no: "Batch 19",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from("portal_settings")
        .select("*")
        .eq("id", "settings")
        .single();
      if (data) {
        setSettings({
          university_name: data.university_name,
          department_name: data.department_name,
          section_name: data.section_name,
          batch_no: data.batch_no,
        });
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData?.user) {
        const user = authData.user;

        // Check if student profile is approved
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("approved")
          .eq("id", user.id)
          .single();

        const isStudent = !!profile;

        if (!isStudent) {
          // If no student profile, user is the admin — redirect to admin dashboard
          router.push("/admin/dashboard");
        } else if (!profile.approved) {
          // Unapproved student — redirect to pending screen
          router.push("/pending");
        } else {
          // Approved student — redirect to student portal
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
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
        className="w-full max-w-md"
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{
                background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                boxShadow: "0 8px 24px rgba(0, 107, 63, 0.3)",
              }}
            >
              <SchoolIcon sx={{ fontSize: 32, color: "#FFFFFF" }} />
            </div>
            <h1 className="text-2xl font-bold text-[#1A202C] mb-1">
              BAUST Smart Learning Gateway
            </h1>
            <p className="text-sm text-[#4A5568] leading-relaxed">
              {settings.university_name}
            </p>
            <p className="text-xs text-[#718096] mt-1 font-semibold">
              {settings.department_name} • {settings.section_name} • {settings.batch_no}
            </p>
            <div
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(0, 107, 63, 0.08)",
                color: "#006B3F",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#006B3F] animate-pulse-soft" />
              Student Sign In
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <MailOutlineIcon sx={{ mr: 1, color: "#A0AEC0", fontSize: 20 }} />
                  ),
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <LockOutlinedIcon sx={{ mr: 1, color: "#A0AEC0", fontSize: 20 }} />
                  ),
                },
              }}
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
                fontSize: "0.95rem",
                background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #004d2d 0%, #006B3F 100%)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Sign In"
              )}
            </Button>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-5 text-center flex flex-col gap-2.5 text-xs text-[#718096]"
            style={{ borderTop: "1px solid #E2E8F0" }}
          >
            <div>
              New student?{" "}
              <Link href="/signup" style={{ color: "#006B3F", fontWeight: 600, textDecoration: "none" }}>
                Create an account
              </Link>
            </div>
            <div>
              Are you the CR?{" "}
              <Link href="/admin/login" style={{ color: "#1B4F72", fontWeight: 600, textDecoration: "none" }}>
                Go to CR Admin Portal
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom Branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-6 text-xs text-[#A0AEC0]"
        >
          Powered by <span className="font-semibold text-[#006B3F]">BAUST Smart Learning Gateway</span> • Class Resource Hub
        </motion.p>
      </motion.div>
    </div>
  );
}
