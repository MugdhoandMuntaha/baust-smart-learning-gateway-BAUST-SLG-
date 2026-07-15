"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        router.push("/admin/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0faf5] via-white to-[#f5f9ff]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm mx-4"
      >
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(27, 79, 114, 0.1)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{
                background: "linear-gradient(135deg, #1B4F72 0%, #2471A3 100%)",
                boxShadow: "0 8px 24px rgba(27, 79, 114, 0.3)",
              }}
            >
              <AdminPanelSettingsIcon sx={{ fontSize: 28, color: "#FFFFFF" }} />
            </div>
            <h1 className="text-xl font-bold text-[#1A202C]">Admin Portal</h1>
            <p className="text-xs text-[#A0AEC0] mt-1">
              Sign in to manage class resources
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="small"
              required
              disabled={loading}
            />

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2, fontSize: "0.8rem" }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.2,
                background: "linear-gradient(135deg, #1B4F72 0%, #2471A3 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1F3A60 0%, #1B4F72 100%)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: "white" }} />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Button
              href="/dashboard"
              size="small"
              sx={{ color: "#A0AEC0", fontSize: "0.75rem" }}
            >
              ← Back to Portal
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
