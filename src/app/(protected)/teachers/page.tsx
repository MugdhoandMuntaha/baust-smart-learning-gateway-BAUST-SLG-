"use client";

import React, { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { createClient } from "@/lib/supabase/client";

interface Course {
  name: string;
  code: string | null;
}

interface Teacher {
  id: string;
  full_name: string;
  designation: string;
  phone_number: string | null;
  email: string | null;
  avatar_url: string | null;
  courses?: Course | null;
}

export default function CourseTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("teachers")
          .select("id, full_name, designation, phone_number, email, avatar_url, courses(name, code)")
          .order("full_name", { ascending: true });

        if (error) throw error;
        setTeachers(data as any[]);
      } catch (err) {
        console.error("Error loading teachers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeachers();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const getCourseInfo = (t: Teacher) => {
    const c = Array.isArray(t.courses) ? t.courses[0] : t.courses;
    if (!c) return "General / Other sessional";
    return `${c.name} (${c.code || "N/A"})`;
  };

  return (
    <Box sx={{ py: 2 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A202C", mb: 0.5 }}>
          Course Teachers Directory
        </Typography>
        <Typography variant="body2" sx={{ color: "#718096" }}>
          Contact details and sessional course allocations for our honorable faculty members.
        </Typography>
      </Box>

      {loading ? (
        <Typography sx={{ color: "#A0AEC0", textAlign: "center", py: 8 }}>
          Loading teacher details...
        </Typography>
      ) : teachers.length === 0 ? (
        <Typography sx={{ color: "#A0AEC0", textAlign: "center", py: 8 }}>
          No teacher contact profiles available yet.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {teachers.map((teacher) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={teacher.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    borderColor: "#006B3F",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", pt: 4, pb: 3, px: 3 }}>
                  <Avatar
                    src={teacher.avatar_url || undefined}
                    sx={{
                      width: 90,
                      height: 90,
                      mb: 2.5,
                      border: "3px solid #E2E8F0",
                      bgcolor: "#EBF5FB",
                      color: "#1B4F72",
                      fontSize: 28,
                      fontWeight: 700,
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    {teacher.full_name[0]?.toUpperCase()}
                  </Avatar>

                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1A202C", textAlign: "center", mb: 0.5, lineHeight: 1.3 }}>
                    {teacher.full_name}
                  </Typography>

                  <Typography variant="body2" sx={{ color: "#4A5568", textAlign: "center", mb: 2, fontSize: "0.825rem" }}>
                    {teacher.designation}
                  </Typography>

                  <Box
                    sx={{
                      backgroundColor: "rgba(0, 107, 63, 0.04)",
                      border: "1px solid rgba(0, 107, 63, 0.1)",
                      borderRadius: "8px",
                      px: 2,
                      py: 1,
                      width: "100%",
                      textAlign: "center",
                      mb: 3,
                    }}
                  >
                    <Typography variant="caption" sx={{ display: "block", color: "#006B3F", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.05em", mb: 0.5 }}>
                      Associated Course
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#2D3748", fontWeight: 600, fontSize: "0.775rem", lineHeight: 1.3 }}>
                      {getCourseInfo(teacher)}
                    </Typography>
                  </Box>

                  {/* Actions / Contacts */}
                  <Box sx={{ mt: "auto", width: "100%", pt: 2, borderTop: "1px solid #EDF2F7", display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {teacher.email && (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                          <EmailIcon sx={{ fontSize: 16, color: "#718096" }} />
                          <Typography variant="body2" sx={{ color: "#4A5568", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {teacher.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Copy Email" arrow>
                            <IconButton size="small" onClick={() => handleCopy(teacher.email!, "Email")}>
                              <ContentCopyIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Email" arrow>
                            <IconButton size="small" component="a" href={`mailto:${teacher.email}`}>
                              <EmailIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    )}

                    {teacher.phone_number && (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: "#718096" }} />
                          <Typography variant="body2" sx={{ color: "#4A5568", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {teacher.phone_number}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Copy Phone" arrow>
                            <IconButton size="small" onClick={() => handleCopy(teacher.phone_number!, "Phone number")}>
                              <ContentCopyIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Call" arrow>
                            <IconButton size="small" component="a" href={`tel:${teacher.phone_number}`}>
                              <PhoneIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
