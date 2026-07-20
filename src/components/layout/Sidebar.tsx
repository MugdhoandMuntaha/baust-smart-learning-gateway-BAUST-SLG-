"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import PersonIcon from "@mui/icons-material/Person";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import FormatListNumberedOutlinedIcon from "@mui/icons-material/FormatListNumberedOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <DashboardOutlinedIcon />,
  },
  {
    label: "AI Assistant",
    href: "/assistant",
    icon: <AutoAwesomeOutlinedIcon sx={{ color: "#006B3F" }} />,
  },
  {
    label: "Documents",
    href: "/documents",
    icon: <FolderOutlinedIcon />,
  },
  {
    label: "Class Routine",
    href: "/routine",
    icon: <CalendarMonthOutlinedIcon />,
  },
  {
    label: "Deadlines",
    href: "/deadlines",
    icon: <TimerOutlinedIcon />,
  },
  {
    label: "Notice Board",
    href: "/notices",
    icon: <CampaignOutlinedIcon />,
  },
  {
    label: "Running Courses",
    href: "/running-courses",
    icon: <MenuBookOutlinedIcon />,
  },
  {
    label: "Course Teachers",
    href: "/teachers",
    icon: <PeopleAltOutlinedIcon />,
  },
  {
    label: "Lab Report Cover",
    href: "/generators/lab-report",
    icon: <ScienceOutlinedIcon />,
  },
  {
    label: "Assignment Cover",
    href: "/generators/assignment",
    icon: <ArticleOutlinedIcon />,
  },
  {
    label: "Index Page",
    href: "/generators/index-page",
    icon: <FormatListNumberedOutlinedIcon />,
  },
  {
    label: "My Profile",
    href: "/profile",
    icon: <PersonIcon />,
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Spacer matching navbar height */}
      <Toolbar sx={{ minHeight: "64px !important" }} />

      {/* Nav Items */}
      <Box sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        <Box
          component="p"
          sx={{
            px: 1.5,
            mb: 1.5,
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#A0AEC0",
          }}
        >
          Navigation
        </Box>
        <List disablePadding>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  onClick={onMobileClose}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1.2,
                    backgroundColor: active
                      ? "rgba(0, 107, 63, 0.08)"
                      : "transparent",
                    borderLeft: active
                      ? "3px solid #006B3F"
                      : "3px solid transparent",
                    "&:hover": {
                      backgroundColor: active
                        ? "rgba(0, 107, 63, 0.12)"
                        : "rgba(0, 0, 0, 0.03)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: active ? "#006B3F" : "#A0AEC0",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: "0.85rem",
                          fontWeight: active ? 600 : 500,
                          color: active ? "#006B3F" : "#4A5568",
                        },
                      },
                    }}
                  />
                  {active && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#006B3F",
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom Status */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#16A34A",
          }}
        />
        <Box component="span" sx={{ fontSize: 12, color: "#4A5568" }}>
          Viewer Mode
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            borderRight: "1px solid #E2E8F0",
            backgroundColor: "#FAFBFC",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            borderRight: "1px solid #E2E8F0",
            backgroundColor: "#FAFBFC",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
