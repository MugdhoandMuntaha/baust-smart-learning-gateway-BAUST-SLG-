"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@mui/material/Button";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import CircularProgress from "@mui/material/CircularProgress";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PendingApprovalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function checkApproval() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("student_profiles")
        .select("approved")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && profile) {
        if (profile.approved) {
          setApproved(true);
          // If approved, we can clear the polling interval
          clearInterval(intervalId);
        }
      }
      setLoading(false);
    }

    checkApproval();
    // Poll status check every 4 seconds
    intervalId = setInterval(checkApproval, 4000);

    return () => clearInterval(intervalId);
  }, []);

  const handleProceedToLogin = async () => {
    // Clear unapproved session to log in fresh
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#fffdf5] via-white to-[#f0faf5] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(20px)",
            border: approved ? "1px solid rgba(0, 107, 63, 0.15)" : "1px solid rgba(245, 176, 65, 0.15)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.05)",
            transition: "all 0.5s ease",
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "32px", paddingBottom: "32px" }}>
              <CircularProgress sx={{ color: "#F39C12", marginBottom: "16px" }} />
              <p className="text-xs text-[#718096]">Loading status...</p>
            </Box>
          ) : (
            <AnimatePresence mode="wait">
              {approved ? (
                <motion.div
                  key="approved-state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Approved Icon */}
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{
                      background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                      boxShadow: "0 8px 24px rgba(0, 107, 63, 0.3)",
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 32, color: "#FFFFFF" }} />
                  </div>

                  <h1 className="text-2xl font-bold text-[#006B3F] mb-2">
                    Request Approved! 🎉
                  </h1>
                  <p className="text-sm text-[#4A5568] leading-relaxed mb-6">
                    Congratulations! Your Class Representative (CR) has approved your gateway registration. 
                    You can now proceed to log in to access notices, timetables, and resource vault downloads.
                  </p>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleProceedToLogin}
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<LoginIcon />}
                      sx={{
                        py: 1.3,
                        background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                        boxShadow: "0 4px 12px rgba(0, 107, 63, 0.2)",
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": {
                          background: "linear-gradient(135deg, #004d2d 0%, #006B3F 100%)",
                        },
                      }}
                    >
                      Proceed to Sign In
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="pending-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Hourglass/Pending Icon */}
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{
                      background: "linear-gradient(135deg, #F39C12 0%, #F5B041 100%)",
                      boxShadow: "0 8px 24px rgba(243, 156, 18, 0.3)",
                    }}
                  >
                    <AccessTimeFilledIcon sx={{ fontSize: 32, color: "#FFFFFF" }} />
                  </div>

                  <h1 className="text-2xl font-bold text-[#1A202C] mb-2">
                    Verification Pending
                  </h1>
                  <p className="text-sm text-[#4A5568] leading-relaxed mb-6">
                    Thank you for registering! Your join request has been successfully submitted to your 
                    Class Representative (Admin) for approval.
                  </p>

                  <div
                    className="p-4 rounded-xl text-left text-xs space-y-2 mb-6"
                    style={{
                      backgroundColor: "rgba(243, 156, 18, 0.06)",
                      border: "1px dashed rgba(243, 156, 18, 0.3)",
                      color: "#6E2C00",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 700 }}>Next steps:</p>
                    <p style={{ margin: "4px 0 0 0" }}>
                      • Let your CR know that you registered your account.
                    </p>
                    <p style={{ margin: "2px 0 0 0" }}>
                      • Once approved, this screen will update instantly to let you sign in.
                    </p>
                  </div>

                  <Button
                    onClick={handleSignOut}
                    variant="outlined"
                    startIcon={<LogoutIcon />}
                    sx={{
                      borderColor: "#CBD5E1",
                      color: "#4A5568",
                      textTransform: "none",
                      px: 3,
                      "&:hover": {
                        borderColor: "#94A3B8",
                        backgroundColor: "#F8F9FA",
                      },
                    }}
                  >
                    Cancel & Sign Out
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-[#A0AEC0]">
          Powered by <span className="font-semibold text-[#006B3F]">BAUST Smart Learning Gateway</span>
        </p>
      </motion.div>
    </div>
  );
}

// Inline Box wrapper implementation to avoid styled-components dependencies
function Box({ children, sx }: { children: React.ReactNode; sx?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", ...sx }}>
      {children}
    </div>
  );
}
