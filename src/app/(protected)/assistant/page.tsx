"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// Helper to format/parse basic markdown into clean HTML/react elements
function formatMessageContent(content: string) {
  // Split content by lines
  const lines = content.split("\n");
  let inList = false;
  let inTable = false;
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    let currentLine = line.trim();

    // Check for Table rows (e.g. starting/ending with |)
    if (currentLine.startsWith("|")) {
      inTable = true;
      const cells = currentLine
        .split("|")
        .map((c) => c.trim())
        .filter((c, i, arr) => i > 0 && i < arr.length - 1);

      // Skip separator rows (e.g., |---|---|)
      if (cells.every((c) => c.startsWith("-"))) {
        return;
      }

      elements.push(
        <div
          key={`table-row-${index}`}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
            borderBottom: "1px solid #E2E8F0",
            padding: "6px 8px",
            backgroundColor: index === 0 ? "#F8FAFC" : "transparent",
            fontWeight: index === 0 ? 600 : "normal",
            fontSize: 12,
          }}
        >
          {cells.map((cell, cIdx) => (
            <span key={`cell-${cIdx}`} style={{ paddingRight: 4 }}>
              {parseTextFormatting(cell)}
            </span>
          ))}
        </div>
      );
      return;
    } else {
      if (inTable) {
        inTable = false;
        // Add a line break after table
        elements.push(<div key={`table-sep-${index}`} style={{ margin: "8px 0" }} />);
      }
    }

    // Check for List Items
    if (currentLine.startsWith("-") || currentLine.startsWith("*")) {
      inList = true;
      const text = currentLine.substring(1).trim();
      elements.push(
        <div key={`list-item-${index}`} style={{ display: "flex", gap: 8, paddingLeft: 12, margin: "2px 0", fontSize: 13 }}>
          <span>•</span>
          <span>{parseTextFormatting(text)}</span>
        </div>
      );
      return;
    }

    // Empty Lines
    if (currentLine === "") {
      elements.push(<div key={`empty-${index}`} style={{ height: 8 }} />);
      return;
    }

    // Normal paragraph lines
    elements.push(
      <div key={`paragraph-${index}`} style={{ margin: "4px 0", fontSize: 13, lineHeight: 1.5 }}>
        {parseTextFormatting(currentLine)}
      </div>
    );
  });

  return elements;
}

// Sub-helper to parse inline links [text](url) and bold **text**
function parseTextFormatting(text: string): React.ReactNode[] {
  // Match markdown bold **text** and markdown link [label](url)
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);
  const elements: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      // Bold Text
      const boldText = part.slice(2, -2);
      elements.push(<strong key={`bold-${index}`} style={{ fontWeight: 700, color: "#1A202C" }}>{boldText}</strong>);
    } else if (part.startsWith("[") && part.includes("](")) {
      // Link
      const labelMatch = part.match(/\[(.*?)\]/);
      const urlMatch = part.match(/\((.*?)\)/);
      if (labelMatch && urlMatch) {
        const label = labelMatch[1];
        const url = urlMatch[1];
        if (url.includes("/generators/lab-report")) {
          elements.push(
            <Button
              key={`btn-download-${index}`}
              variant="contained"
              href={url}
              target="_blank"
              size="small"
              startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
              sx={{
                textTransform: "none",
                fontSize: 11,
                fontWeight: 600,
                py: 0.5,
                px: 1.5,
                borderRadius: 2,
                backgroundColor: "#006B3F",
                color: "#FFFFFF",
                mt: 0.5,
                mb: 0.5,
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
    } else {
      elements.push(part);
    }
  });

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
      // Build the prompt history
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: "user", content: textToSend });

      // Retrieve active session token to bypass cookie limitations in native WebViews
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
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
          { role: "model", content: `Sorry, I encountered an issue: **${errorMsg}**. Please try again.` },
        ]);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: `Network error occurred: ${err.message || err}. Please check your connection.` },
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

      {/* Main chat layout */}
      <Card
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.015)",
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
                  maxWidth: { xs: "90%", sm: "75%" },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 14,
                    fontWeight: 700,
                    backgroundColor: isUser ? "#CBD5E1" : "#006B3F",
                    color: "#FFFFFF",
                  }}
                >
                  {isUser ? <PersonIcon sx={{ fontSize: 18 }} /> : <SmartToyIcon sx={{ fontSize: 18 }} />}
                </Avatar>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    backgroundColor: isUser ? "#006B3F" : "#FFFFFF",
                    color: isUser ? "#FFFFFF" : "#1A202C",
                    boxShadow: isUser
                      ? "0 4px 10px rgba(0, 107, 63, 0.1)"
                      : "0 2px 8px rgba(0, 0, 0, 0.04)",
                    border: isUser ? "none" : "1px solid #E2E8F0",
                  }}
                >
                  {isUser ? (
                    <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </Typography>
                  ) : (
                    <Box sx={{ color: "#1A202C" }}>
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
                  width: 32,
                  height: 32,
                  backgroundColor: "#006B3F",
                }}
              >
                <SmartToyIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "4px 16px 16px 16px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                <CircularProgress size={16} color="primary" />
                <Typography sx={{ fontSize: 12, color: "#718096" }}>Typing...</Typography>
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
                fontSize: 11,
                cursor: "pointer",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                "&:hover": {
                  backgroundColor: "rgba(0, 107, 63, 0.04)",
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
            placeholder={scopeLoading ? "Loading student session..." : "Type your query here..."}
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
                fontSize: 13,
                backgroundColor: "#F8FAFC",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#006B3F" },
              },
            }}
          />
          <IconButton
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || sending || scopeLoading}
            sx={{
              backgroundColor: input.trim() && !sending ? "#006B3F" : "#F1F5F9",
              color: input.trim() && !sending ? "#FFFFFF" : "#94A3B8",
              "&:hover": {
                backgroundColor: "#005532",
              },
              width: 40,
              height: 40,
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Card>
    </motion.div>
  );
}
