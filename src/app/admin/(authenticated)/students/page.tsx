"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import GroupIcon from "@mui/icons-material/Group";
import DeleteIcon from "@mui/icons-material/Delete";

import { createClient } from "@/lib/supabase/client";
import { useAdminScope } from "@/hooks/useAdminScope";

interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  department: string;
  section: string;
  avatar_url: string | null;
  approved: boolean;
  created_at: string;
}

export default function AdminStudentsPage() {
  const { scope, loading: scopeLoading } = useAdminScope();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  const fetchStudents = useCallback(async () => {
    if (scopeLoading || !scope) return;
    setLoading(true);
    let query = supabase.from("student_profiles").select("*");

    if (!scope.isSuperAdmin) {
      query = query
        .eq("level", scope.level)
        .eq("term", scope.term)
        .eq("section", scope.section);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (!error && data) {
      setStudents(data as StudentProfile[]);
    }
    setLoading(false);
  }, [supabase, scope, scopeLoading]);

  useEffect(() => {
    if (!scopeLoading && scope) {
      fetchStudents();
    }
  }, [fetchStudents, scope, scopeLoading]);

  const handleApprove = async (id: string) => {
    setActioningId(id);
    setMessage(null);
    const { error } = await supabase
      .from("student_profiles")
      .update({ approved: true })
      .eq("id", id);

    if (error) {
      setMessage({ type: "error", text: `Failed to approve: ${error.message}` });
    } else {
      setMessage({ type: "success", text: "Student registration request approved successfully!" });
      fetchStudents();
    }
    setActioningId(null);
  };

  const handleRejectOrDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke access and delete the profile for ${name}?`)) {
      return;
    }
    setActioningId(id);
    setMessage(null);

    // Delete the profile row
    const { error } = await supabase
      .from("student_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage({ type: "error", text: `Failed to delete profile: ${error.message}` });
    } else {
      setMessage({ type: "success", text: `Access revoked for ${name}.` });
      fetchStudents();
    }
    setActioningId(null);
  };

  const pendingList = students.filter((s) => !s.approved);
  const approvedList = students.filter((s) => s.approved);

  const filteredApproved = approvedList.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.section.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <CircularProgress color="primary" />
        <p style={{ fontSize: 14, color: "#A0AEC0", marginTop: 8 }}>Loading student accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1B4F72 0%, #2471A3 100%)",
            boxShadow: "0 4px 12px rgba(27, 79, 114, 0.25)",
          }}
        >
          <GroupIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A202C", margin: 0 }}>
            Student Management & Requests
          </h2>
          <p style={{ fontSize: 13, color: "#718096", margin: "2px 0 0 0" }}>
            Review pending registration join requests and manage active student directory access.
          </p>
        </div>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* 1. Pending Join Requests Section */}
      <Card sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1B4F72", margin: 0 }}>
          ⏳ Pending Join Requests ({pendingList.length})
        </h3>
        
        {pendingList.length === 0 ? (
          <p style={{ fontSize: 13, color: "#A0AEC0", margin: "8px 0" }}>No pending requests awaiting approval.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingList.map((req) => (
              <Box
                key={req.id}
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                  padding: 2,
                  border: "1px solid #E2E8F0",
                  borderRadius: 2,
                  backgroundColor: "#FAFBFC",
                  gap: 2,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar src={req.avatar_url || undefined} sx={{ width: 44, height: 44 }}>
                    {req.full_name[0]?.toUpperCase()}
                  </Avatar>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1A202C" }}>
                      {req.full_name}
                    </div>
                    <div style={{ fontSize: 12, color: "#718096" }}>
                      ID: {req.student_id} • {req.department} Section {req.section}
                    </div>
                    <div style={{ fontSize: 10, color: "#A0AEC0", marginTop: 2 }}>
                      Registered: {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckIcon />}
                    onClick={() => handleApprove(req.id)}
                    disabled={actioningId !== null}
                    sx={{
                      background: "linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)",
                      textTransform: "none",
                      fontSize: 12,
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={() => handleRejectOrDelete(req.id, req.full_name)}
                    disabled={actioningId !== null}
                    sx={{
                      textTransform: "none",
                      fontSize: 12,
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </Box>
            ))}
          </div>
        )}
      </Card>

      {/* 2. Active Approved Directory Table */}
      <Card sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#006B3F", margin: 0 }}>
            👥 Approved Student Directory ({approvedList.length})
          </h3>
          <TextField
            size="small"
            placeholder="Search by name, ID, class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ color: "#A0AEC0", mr: 1, fontSize: 18 }} />,
              },
            }}
            sx={{ maxWidth: 300, width: "100%" }}
          />
        </div>

        {filteredApproved.length === 0 ? (
          <p style={{ fontSize: 13, color: "#A0AEC0", textAlign: "center", padding: "16px 0" }}>
            {search ? "No students matching your search criteria." : "No approved student accounts directory."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }} className="scrollbar-none">
            <table
              style={{
                width: "100%",
                minWidth: 700,
                borderCollapse: "collapse",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#718096" }}>
                  <th style={{ padding: "12px 8px", fontWeight: 600 }}>Avatar</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600 }}>Name</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600 }}>Student ID</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600 }}>Dept & Sec</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600 }}>Email</th>
                  <th style={{ padding: "12px 8px", fontWeight: 600, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApproved.map((student) => (
                  <tr
                    key={student.id}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      transition: "background-color 0.2s",
                    }}
                    className="hover:bg-slate-50"
                  >
                    <td style={{ padding: "8px" }}>
                      <Avatar src={student.avatar_url || undefined} sx={{ width: 34, height: 34 }}>
                        {student.full_name[0]?.toUpperCase()}
                      </Avatar>
                    </td>
                    <td style={{ padding: "8px", fontWeight: 600, color: "#1A202C" }}>
                      {student.full_name}
                    </td>
                    <td style={{ padding: "8px", color: "#4A5568" }}>
                      {student.student_id}
                    </td>
                    <td style={{ padding: "8px", color: "#4A5568" }}>
                      {student.department} • {student.section}
                    </td>
                    <td style={{ padding: "8px", color: "#718096" }}>
                      {student.email}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <Tooltip title="Revoke Access" arrow>
                        <IconButton
                          color="error"
                          onClick={() => handleRejectOrDelete(student.id, student.full_name)}
                          disabled={actioningId !== null}
                          size="small"
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
