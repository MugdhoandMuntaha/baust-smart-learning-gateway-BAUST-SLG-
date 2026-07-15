"use client";

import React from "react";
import { motion } from "framer-motion";
import Button from "@mui/material/Button";
import SchoolIcon from "@mui/icons-material/School";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PendingApprovalPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
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
            border: "1px solid rgba(245, 176, 65, 0.15)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.05)",
          }}
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
            Class Representative (Admin).
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
              • Once approved, you'll immediately gain access to notice board, timetables, and resource assets downloads.
            </p>
          </div>

          <Button
            onClick={handleLogout}
            variant="outlined"
            startIcon={<LogoutIcon />}
            sx={{
              borderColor: "#CBD5E1",
              color: "#4A5568",
              "&:hover": {
                borderColor: "#94A3B8",
                backgroundColor: "#F8F9FA",
              },
            }}
          >
            Sign Out
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-[#A0AEC0]">
          Powered by <span className="font-semibold text-[#006B3F]">BAUST Smart Learning Gateway</span>
        </p>
      </motion.div>
    </div>
  );
}
