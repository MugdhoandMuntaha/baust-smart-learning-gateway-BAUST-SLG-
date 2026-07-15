"use client";

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import BookIcon from "@mui/icons-material/Book";
import SchoolIcon from "@mui/icons-material/School";
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string;
  name: string;
  code: string | null;
  teacher_name: string | null;
  teacher_designation: string | null;
  teacher_avatar_url: string | null;
  level: string | null;
  term: string | null;
  teachers?: Array<{
    full_name: string;
    designation: string;
    avatar_url: string | null;
  }> | null;
}

export default function RunningCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("courses")
          .select("*, teachers(full_name, designation, avatar_url)")
          .order("name", { ascending: true });

        if (error) throw error;
        setCourses(data as any[]);
      } catch (err) {
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  return (
    <Box sx={{ py: 2 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A202C", mb: 0.5 }}>
          📚 Running Courses
        </Typography>
        <Typography variant="body2" sx={{ color: "#718096" }}>
          All active sessional and theory courses currently running for this batch.
        </Typography>
      </Box>

      {loading ? (
        <Typography sx={{ color: "#A0AEC0", textAlign: "center", py: 8 }}>
          Loading active courses...
        </Typography>
      ) : courses.length === 0 ? (
        <Typography sx={{ color: "#A0AEC0", textAlign: "center", py: 8 }}>
          No active courses listed for the current session.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
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
                <CardContent sx={{ flexGrow: 1, p: 3, display: "flex", flexDirection: "column" }}>
                  {/* Top line: Code + Level/Term Chips */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Chip
                      label={course.code || "N/A"}
                      size="small"
                      sx={{
                        backgroundColor: "rgba(0, 107, 63, 0.08)",
                        color: "#006B3F",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      }}
                    />
                    <Chip
                      label={`L-${course.level || "1"} T-${course.term || "I"}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: "#E2E8F0",
                        color: "#718096",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    />
                  </Box>

                  {/* Course Title */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1A202C", mb: 3, minHeight: 48, lineHeight: 1.3 }}>
                    {course.name}
                  </Typography>

                  {/* Divider */}
                  <Box sx={{ borderTop: "1px solid #EDF2F7", pt: 2, mt: "auto" }}>
                    <Typography variant="caption" sx={{ display: "block", color: "#A0AEC0", fontWeight: 700, textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.05em", mb: 1 }}>
                      Assigned Instructor
                    </Typography>
                    
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      {(() => {
                        const displayTeacher = course.teachers && course.teachers.length > 0 
                          ? { 
                              name: course.teachers[0].full_name, 
                              designation: course.teachers[0].designation, 
                              avatar: course.teachers[0].avatar_url 
                            }
                          : { 
                              name: course.teacher_name, 
                              designation: course.teacher_designation, 
                              avatar: course.teacher_avatar_url 
                            };
                        return (
                          <>
                            <Avatar
                              src={displayTeacher.avatar || undefined}
                              sx={{
                                width: 38,
                                height: 38,
                                border: "1.5px solid #006B3F",
                                bgcolor: "#F1F5F9",
                                color: "#006B3F",
                                fontSize: "14px",
                                fontWeight: 700,
                              }}
                            >
                              {displayTeacher.name ? displayTeacher.name[0]?.toUpperCase() : <SchoolIcon />}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: "#2D3748", fontSize: "0.8rem" }}>
                                {displayTeacher.name || "Unassigned"}
                              </Typography>
                              {displayTeacher.designation && (
                                <Typography variant="caption" noWrap sx={{ color: "#718096", display: "block", fontSize: "0.65rem", fontStyle: "italic" }}>
                                  {displayTeacher.designation}
                                </Typography>
                              )}
                            </Box>
                          </>
                        );
                      })()}
                    </Box>
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
