"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import MenuIcon from "@mui/icons-material/Menu";
import SchoolIcon from "@mui/icons-material/School";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import Avatar from "@mui/material/Avatar";
import Sidebar from "./Sidebar";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [settings, setSettings] = useState({
    university_name: "Bangladesh Army University of Science & Technology",
    department_name: "CSE",
    section_name: "Section A",
    batch_no: "Batch 19",
    logo_url: null as string | null,
  });

  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    avatar_url: string | null;
    is_admin: boolean;
  } | null>(null);

  const fetchUserProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("student_profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      const isAdmin = !data || user.email?.includes("admin") || false;
      if (isAdmin) {
        setUserProfile({
          full_name: "Class Representative",
          avatar_url: null,
          is_admin: true,
        });
      } else {
        setUserProfile({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          is_admin: false,
        });
      }
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    async function loadSettings() {
      const { data } = await supabase
        .from("portal_settings")
        .select("*")
        .eq("id", "settings")
        .single();
      if (data) {
        setSettings({
          university_name: data.university_name || "Bangladesh Army University of Science & Technology",
          department_name: data.department_name ,
          section_name: data.section_name,
          batch_no: data.batch_no,
          logo_url: data.logo_url || null,
        });
      }
    }
    loadSettings();
    fetchUserProfile();

    // Listen to profile updates
    window.addEventListener("profile-updated", fetchUserProfile);
    return () => window.removeEventListener("profile-updated", fetchUserProfile);
  }, []);

  const getPageTitle = () => {
    if (pathname.includes("/dashboard")) return "Dashboard";
    if (pathname.includes("/notices")) return "Notice Board";
    if (pathname.includes("/routine")) return "Class Routine";
    if (pathname.includes("/deadlines")) return "Deadline Tracker";
    if (pathname.includes("/documents")) return "Document Vault";
    return "BAUST Smart Learning Gateway";
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 2, md: 3 },
            minHeight: "64px !important",
          }}
        >
          {/* Left: Menu + Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ display: { xs: "flex", md: "none" }, color: "#006B3F" }}
            >
              <MenuIcon />
            </IconButton>

            <Link
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={settings.logo_url || "/logo.png"}
                  alt="Emblem"
                  style={{ width: "70%", height: "100%", objectFit: "contain" }}
                />
              </div>
            </Link>
          </Box>

          {/* Center: University Name Branding */}
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              textAlign: "center",
              pointerEvents: "none",
              width: { xs: "45%", sm: "65%", md: "80%" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                fontSize: { xs: "12px", sm: "17px", md: "22px" },
                fontWeight: 800,
                color: "#006B3F",
                lineHeight: 1.2,
                letterSpacing: "0.02em",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {settings.university_name}
              </Box>
              <Box style={{ fontSize: "20px", fontWeight: 800 }} component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                BAUST SLG
              </Box>
            </Box>
            <Box
              sx={{
                fontSize: { xs: "9px", sm: "11px", md: "12px" },
                color: "#00895a",
                fontWeight: 600,
                lineHeight: 1.2,
                marginTop: "3px",
                display: { xs: "none", sm: "block" },
              }}
            >
              {settings.department_name} • {settings.section_name} • {settings.batch_no}
            </Box>
          </Box>

          {/* Right Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {userProfile ? (
              <>
                <Tooltip title={`${userProfile.full_name} (${userProfile.is_admin ? "Admin" : "Student"})`} arrow>
                  <IconButton
                    component={Link}
                    href={userProfile.is_admin ? "/admin/dashboard" : "/profile"}
                    sx={{ p: 0 }}
                  >
                    <Avatar
                      src={userProfile.avatar_url || undefined}
                      sx={{
                        width: 34,
                        height: 34,
                        border: "2px solid #006B3F",
                        backgroundColor: "#F1F5F9",
                        color: "#006B3F",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {userProfile.full_name[0]?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Tooltip title="Sign Out" arrow>
                  <IconButton
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      window.location.href = "/";
                    }}
                    sx={{
                      color: "#006B3F",
                      border: "1px solid rgba(0, 107, 63, 0.3)",
                      borderRadius: 2,
                      width: 34,
                      height: 34,
                      "&:hover": {
                        backgroundColor: "rgba(0, 107, 63, 0.05)",
                        borderColor: "#006B3F",
                      },
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Tooltip title="Admin Portal" arrow>
                <IconButton
                  component={Link}
                  href="/admin/login"
                  sx={{
                    color: "#006B3F",
                    border: "1px solid rgba(0, 107, 63, 0.3)",
                    borderRadius: 2,
                    width: 36,
                    height: 36,
                    "&:hover": {
                      backgroundColor: "rgba(0, 107, 63, 0.05)",
                      borderColor: "#006B3F",
                      color: "#006B3F",
                    },
                  }}
                >
                  <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Sidebar Drawer */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
    </>
  );
}
