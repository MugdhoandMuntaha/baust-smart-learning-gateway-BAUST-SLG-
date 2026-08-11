"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import DownloadIcon from "@mui/icons-material/Download";
import CircularProgress from "@mui/material/CircularProgress";
import { useStudentScope } from "@/hooks/useStudentScope";
import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "model";
  content: string;
}

const SUGGESTIONS = [
  "Software Engineering er kono note ache?",
  "What is the nearest deadline?",
  "Who are my course teachers?",
  "Latest notice board details?",
];

// Helper to format ISO timestamp strings into human-readable dates
function formatDateStr(text: string): string {
  const trimmed = text.trim();
  if (trimmed.includes("T") && trimmed.includes(":")) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return text;
}

// Sub-helper to parse inline links [text](url) and bold **text** / *text*
function parseTextFormatting(text: string): React.ReactNode[] {
  if (!text) return [];

  // Fix malformed asterisk patterns like `• *Data Communication**`
  let cleaned = text.replace(/^\*([^\*]+)\*\*/g, "**$1**");

  // Matches markdown links [label](url) and bold **text** / *text*
  const regex = /(\[.*?\]\(.*?\)|(?:\*\*|\*)[^\*]+(?:\*\*|\*))/g;
  const parts = cleaned.split(regex);
  const elements: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (!part) return;

    if (part.startsWith("[") && part.includes("](")) {
      const labelMatch = part.match(/\[(.*?)\]/);
      const urlMatch = part.match(/\((.*?)\)/);
      if (labelMatch && urlMatch) {
        const label = labelMatch[1];
        const url = urlMatch[1];
        if (
          url.includes("/generators") ||
          url.includes("/documents") ||
          url.startsWith("http")
        ) {
          elements.push(
            <Button
              key={`btn-link-${index}`}
              variant="contained"
              href={url}
              target={url.startsWith("http") ? "_blank" : "_self"}
              size="small"
              startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
              sx={{
                textTransform: "none",
                fontSize: 11,
                fontWeight: 600,
                py: 0.4,
                px: 1.2,
                borderRadius: 1.5,
                backgroundColor: "#006B3F",
                color: "#FFFFFF",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                boxShadow: "0 2px 6px rgba(0, 107, 63, 0.15)",
                "&:hover": {
                  backgroundColor: "#005230",
                  boxShadow: "0 4px 10px rgba(0, 107, 63, 0.25)",
                },
              }}
            >
              {label}
            </Button>
          );
        } else {
          elements.push(
            <a
              key={`link-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#006B3F",
                textDecoration: "underline",
                fontWeight: 600,
                wordBreak: "break-all",
              }}
            >
              {label}
            </a>
          );
        }
      }
    } else if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("*") && part.endsWith("*"))
    ) {
      const boldText = part.replace(/^\*+|\*+$/g, "");
      elements.push(
        <strong key={`bold-${index}`} style={{ fontWeight: 700, color: "#0F172A" }}>
          {boldText}
        </strong>
      );
    } else {
      elements.push(formatDateStr(part));
    }
  });

  return elements;
}

// Helper to format message content into clean HTML elements & responsive tables
function formatMessageContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];

  const flushTable = (keyPrefix: string) => {
    if (tableRows.length === 0) return;

    // Filter out markdown table separator rows like |---|---|
    const validRows = tableRows.filter((row) =>
      !row.every((cell) => cell.startsWith("-"))
    );

    if (validRows.length > 0) {
      const headers = validRows[0];
      const bodyRows = validRows.slice(1);

      elements.push(
        <Box
          key={`table-container-${keyPrefix}`}
          sx={{
            my: 1.5,
            overflowX: "auto",
            borderRadius: 2,
            border: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 500,
              borderCollapse: "collapse",
              fontSize: 12,
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {headers.map((h, i) => (
                  <th
                    key={`th-${i}`}
                    style={{
                      padding: "10px 12px",
                      fontWeight: 600,
                      color: "#334155",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {parseTextFormatting(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr
                  key={`tr-${rIdx}`}
                  style={{
                    borderBottom: rIdx === bodyRows.length - 1 ? "none" : "1px solid #F1F5F9",
                    backgroundColor: rIdx % 2 === 1 ? "#FAFAFA" : "#FFFFFF",
                  }}
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={`td-${cIdx}`}
                      style={{
                        padding: "10px 12px",
                        color: "#1E293B",
                        verticalAlign: "middle",
                      }}
                    >
                      {parseTextFormatting(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      );
    }
    tableRows = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for Table row (starts and ends or contains '|')
    if (trimmed.startsWith("|") && trimmed.includes("|")) {
      const cells = trimmed
        .split("|")
        .map((c) => c.trim())
        .filter((_, i, arr) => i > 0 && i < arr.length - 1);
      tableRows.push(cells);
      return;
    } else {
      flushTable(`line-${index}`);
    }

    // List item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const text = trimmed.substring(2).trim();
      elements.push(
        <Box
          key={`list-${index}`}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            pl: 1,
            my: 0.5,
            fontSize: 13,
            color: "#334155",
          }}
        >
          <span style={{ color: "#006B3F", fontWeight: 700, lineHeight: 1.4 }}>•</span>
          <Box sx={{ flex: 1 }}>{parseTextFormatting(text)}</Box>
        </Box>
      );
      return;
    }

    // Blank line
    if (trimmed === "") {
      elements.push(<Box key={`space-${index}`} sx={{ height: 6 }} />);
      return;
    }

    // Standard paragraph line
    elements.push(
      <Typography
        key={`p-${index}`}
        sx={{ fontSize: 13, color: "#1E293B", lineHeight: 1.6, my: 0.5 }}
      >
        {parseTextFormatting(trimmed)}
      </Typography>
    );
  });

  // Flush remaining table rows at the end of message
  flushTable("end");

  return elements;
}

export default function AssistantPage() {
  const supabase = createClient();
  const { scope, loading: scopeLoading } = useStudentScope();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: `Hello! I am your **BAUST SLG AI Assistant** 🤖.

I can help you look up documents, notices, active deadlines, and allocated teachers for your courses in **Level ${scope?.level || "1"}, Term ${scope?.term || "I"} (Section ${scope?.section || "A"})**.

You can ask me questions in **Bangla**, **English**, or **Banglish**. Try one of the suggested prompts below!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Update greeting when scope finishes loading
  useEffect(() => {
    if (scope) {
      setMessages([
        {
          role: "model",
          content: `Hello ${scope.fullName}! I am your **BAUST SLG AI Assistant** 🤖.

I can help you look up documents, notices, active deadlines, and allocated teachers for your courses in **Level ${scope.level}, Term ${scope.term} (Section ${scope.section})**.

You can ask me questions in **Bangla**, **English**, or **Banglish**. Try one of the suggested prompts below!`,
        },
      ]);
    }
  }, [scope]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: textToSend });

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: history,
        }),
      });

      const data = await response.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "model", content: data.reply }]);
      } else {
        const errorMsg = data.error || "Unknown error occurred";
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: `Sorry, I encountered an issue: **${errorMsg}**. Please try again.`,
          },
        ]);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: `Network error occurred: ${err.message || err}. Please check your connection.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          sx={{
            background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
            width: 44,
            height: 44,
            boxShadow: "0 4px 10px rgba(0, 107, 63, 0.2)",
          }}
        >
          <SmartToyIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1A202C", m: 0 }}>
            AI Assistant
          </Typography>
          <Typography variant="caption" sx={{ color: "#718096" }}>
            Ask anything in English, Bangla, or Banglish
          </Typography>
        </Box>
      </Box>

      {/* Main chat card layout */}
      <Card
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
          overflow: "hidden",
        }}
      >
        {/* Messages list */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            overflowY: "auto",
            backgroundColor: "#FAFBFD",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  flexDirection: isUser ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  gap: 1.5,
                  maxWidth: isUser
                    ? { xs: "85%", sm: "70%" }
                    : { xs: "98%", sm: "90%" },
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    fontSize: 14,
                    fontWeight: 700,
                    backgroundColor: isUser ? "#64748B" : "#006B3F",
                    color: "#FFFFFF",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {isUser ? (
                    <PersonIcon sx={{ fontSize: 19 }} />
                  ) : (
                    <SmartToyIcon sx={{ fontSize: 19 }} />
                  )}
                </Avatar>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: isUser
                      ? "18px 4px 18px 18px"
                      : "4px 18px 18px 18px",
                    backgroundColor: isUser ? "#006B3F" : "#FFFFFF",
                    color: isUser ? "#FFFFFF" : "#1E293B",
                    boxShadow: isUser
                      ? "0 4px 12px rgba(0, 107, 63, 0.15)"
                      : "0 2px 10px rgba(0, 0, 0, 0.04)",
                    border: isUser ? "none" : "1px solid #E2E8F0",
                    width: "100%",
                  }}
                >
                  {isUser ? (
                    <Typography sx={{ fontSize: 13.5, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {msg.content}
                    </Typography>
                  ) : (
                    <Box sx={{ color: "#1E293B" }}>
                      {formatMessageContent(msg.content)}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}

          {sending && (
            <Box
              sx={{
                display: "flex",
                alignSelf: "flex-start",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  backgroundColor: "#006B3F",
                }}
              >
                <SmartToyIcon sx={{ fontSize: 19 }} />
              </Avatar>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "4px 18px 18px 18px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                <CircularProgress size={16} sx={{ color: "#006B3F" }} />
                <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
                  Searching SLG Assistant database...
                </Typography>
              </Box>
            </Box>
          )}
          <div ref={chatEndRef} />
        </Box>

        {/* Suggestion Chips */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.5,
            borderTop: "1px solid #F1F5F9",
            backgroundColor: "#FFFFFF",
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {SUGGESTIONS.map((s, idx) => (
            <Chip
              key={idx}
              label={s}
              onClick={() => handleSendMessage(s)}
              disabled={sending}
              sx={{
                fontSize: 11.5,
                fontWeight: 500,
                cursor: "pointer",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                color: "#475569",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(0, 107, 63, 0.06)",
                  borderColor: "#006B3F",
                  color: "#006B3F",
                },
              }}
            />
          ))}
        </Box>

        {/* Input box */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={
              scopeLoading
                ? "Loading student session..."
                : "Type your query here..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage(input);
              }
            }}
            disabled={sending || scopeLoading}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "24px",
                fontSize: 13.5,
                backgroundColor: "#F8FAFC",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#006B3F" },
                "&.Mui-focused fieldset": { borderColor: "#006B3F" },
              },
            }}
          />
          <IconButton
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || sending || scopeLoading}
            sx={{
              backgroundColor:
                input.trim() && !sending ? "#006B3F" : "#F1F5F9",
              color: input.trim() && !sending ? "#FFFFFF" : "#94A3B8",
              "&:hover": {
                backgroundColor: "#005230",
              },
              width: 42,
              height: 42,
              transition: "all 0.2s ease",
            }}
          >
            <SendIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Box>
      </Card>
    </motion.div>
  );
}
