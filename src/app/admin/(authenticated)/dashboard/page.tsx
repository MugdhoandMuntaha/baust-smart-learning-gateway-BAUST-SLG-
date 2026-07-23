"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { useAdminScope } from "@/hooks/useAdminScope";

const ADMIN_MODULES = [
  {
    title: "Notices",
    description: "Create, edit, and pin announcements",
    href: "/admin/notices",
    iconKey: "notices",
    color: "#006B3F",
  },
  {
    title: "Routine",
    description: "Manage weekly class schedule",
    href: "/admin/routine",
    iconKey: "routine",
    color: "#1B4F72",
  },
  {
    title: "Academic Schedule",
    description: "Manage schedule and tasks",
    href: "/admin/deadlines",
    iconKey: "deadlines",
    color: "#006B3F",
  },
  {
    title: "Documents",
    description: "Upload and manage files",
    href: "/admin/documents",
    iconKey: "documents",
    color: "#C9A800",
  },
];

const getIcon = (key: string, color: string) => {
  switch (key) {
    case "notices":
      return <CampaignOutlinedIcon sx={{ fontSize: 32, color }} />;
    case "routine":
      return <CalendarTodayOutlinedIcon sx={{ fontSize: 32, color }} />;
    case "deadlines":
      return <TimerOutlinedIcon sx={{ fontSize: 32, color }} />;
    case "documents":
      return <FolderOutlinedIcon sx={{ fontSize: 32, color }} />;
    default:
      return null;
  }
};

export default function AdminDashboardPage() {
  const { scope, loading, updateScope } = useAdminScope();

  // Wizard state
  const [level, setLevel] = useState("1");
  const [term, setTerm] = useState("I");
  const [section, setSection] = useState("A");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleInitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setSaving(true);
    setError("");
    const { error: err } = await updateScope(level, term, section, fullName);
    setSaving(false);

    if (err) {
      setError(err.message || "Failed to initialize scope.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CircularProgress color="success" />
        <p className="text-sm text-[#718096] mt-4 font-medium">Loading session...</p>
      </div>
    );
  }

  // Show initialization wizard if they are not super admin and have no profile set yet
  const showWizard = scope && !scope.isSuperAdmin && !scope.hasProfile;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1A202C]">Admin Dashboard</h1>
          <p className="text-sm text-[#A0AEC0] mt-0.5">
            Manage your class resources from here
          </p>
        </div>
        {scope && (
          <div className="bg-[#EBF5FB] border border-[#AED6F1] px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2980B9] animate-pulse" />
            <div className="text-xs text-[#1B4F72] font-semibold">
              {scope.isSuperAdmin ? (
                <span>Scope: <strong className="uppercase">Universal Super Admin</strong></span>
              ) : (
                <span>
                  CR Scope: <strong>Level {scope.level} Term {scope.term} Section {scope.section}</strong> 
                  {scope.fullName && ` (${scope.fullName})`}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ADMIN_MODULES.map((mod, idx) => (
          <motion.div
            key={mod.href}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -3 }}
          >
            <Link href={mod.href} className="no-underline block">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group">
                <div className="mb-3">{getIcon(mod.iconKey, mod.color)}</div>
                <h3
                  className="font-semibold text-base mb-1"
                  style={{ color: mod.color }}
                >
                  {mod.title}
                </h3>
                <p className="text-sm text-[#4A5568]">{mod.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Batch Setup Dialog (Wizard) */}
      <Dialog
        open={!!showWizard}
        onClose={(_event: object, reason: string) => {
          if (reason === "escapeKeyDown" || reason === "backdropClick") return;
        }}
        slotProps={{
          paper: {
            style: { borderRadius: 16, padding: 8 }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#1A202C", pb: 1 }}>
          🎓 CR Profile & Batch Initialization
        </DialogTitle>
        <DialogContent>
          <p className="text-xs text-[#718096] mb-4">
            Welcome to the Smart Learning Gateway Admin Portal. Before proceeding, please configure the Level, Term, and Section you represent as a Class Representative (CR).
          </p>
          <form onSubmit={handleInitSubmit} className="space-y-4 pt-2">
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="CR Full Name"
              variant="outlined"
              fullWidth
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Shah Md Al Junaid"
              slotProps={{
                inputLabel: { shrink: true }
              }}
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1">
                  Level
                </label>
                <Select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  fullWidth
                  variant="outlined"
                >
                  {["1", "2", "3", "4"].map((lvl) => (
                    <MenuItem key={lvl} value={lvl}>
                      Level {lvl}
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1">
                  Term
                </label>
                <Select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  fullWidth
                  variant="outlined"
                >
                  {["I", "II"].map((trm) => (
                    <MenuItem key={trm} value={trm}>
                      Term {trm}
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1">
                  Section
                </label>
                <Select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  fullWidth
                  variant="outlined"
                >
                  {["A", "B", "C", "D"].map((sec) => (
                    <MenuItem key={sec} value={sec}>
                      Section {sec}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>

            <DialogActions sx={{ px: 0, pt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 4,
                  py: 1,
                  width: "100%",
                }}
              >
                {saving ? "Saving..." : "Confirm & Access Dashboard"}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
