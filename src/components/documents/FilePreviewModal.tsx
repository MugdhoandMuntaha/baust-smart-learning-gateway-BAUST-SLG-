"use client";

import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import InfoIcon from "@mui/icons-material/Info";

import type { Document as DocType } from "@/types/documents";
import { formatFileSize, getFileIcon } from "@/types/documents";
import { triggerDirectDownload } from "@/lib/download";

interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  document: DocType | null;
}

export default function FilePreviewModal({
  open,
  onClose,
  document,
}: FilePreviewModalProps) {
  if (!document) return null;

  const ext = document.file_name.split(".").pop()?.toLowerCase();
  const isPDF = ext === "pdf";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "");
  const isOffice = ["docx", "doc", "pptx", "ppt", "xlsx", "xls"].includes(ext || "");

  const getOfficeSchemeUrl = () => {
    if (!document) return "";
    const fileUrl = document.file_path;
    if (ext === "pptx" || ext === "ppt") {
      return `ms-powerpoint:ofv|u|${fileUrl}`;
    }
    if (ext === "docx" || ext === "doc") {
      return `ms-word:ofv|u|${fileUrl}`;
    }
    if (ext === "xlsx" || ext === "xls") {
      return `ms-excel:ofv|u|${fileUrl}`;
    }
    return "";
  };

  const getOfficeAppName = () => {
    if (ext === "pptx" || ext === "ppt") return "PowerPoint";
    if (ext === "docx" || ext === "doc") return "Word";
    if (ext === "xlsx" || ext === "xls") return "Excel";
    return "Office";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isPDF || isImage || isOffice ? "lg" : "xs"}
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 4,
          overflow: "hidden",
        },
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#F8F9FA",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, pr: 2 }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>
            {getFileIcon(document.file_name)}
          </span>
          <Box sx={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#1A202C",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {document.file_name}
            </div>
            <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
              {formatFileSize(document.file_size)} • {document.course_name}
            </div>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          {isOffice && (
            <Button
              variant="outlined"
              size="small"
              href={getOfficeSchemeUrl()}
              sx={{
                textTransform: "none",
                fontSize: 11,
                fontWeight: 600,
                color: "#006B3F",
                borderColor: "rgba(0, 107, 63, 0.3)",
                borderRadius: 2,
                height: 30,
                px: 1.5,
                mr: 1,
                "&:hover": {
                  borderColor: "#006B3F",
                  backgroundColor: "rgba(0, 107, 63, 0.04)",
                },
              }}
            >
              Open in {getOfficeAppName()}
            </Button>
          )}
          <IconButton
            onClick={() => triggerDirectDownload(document.file_path, document.file_name)}
            size="small"
            sx={{
              color: "#006B3F",
              backgroundColor: "rgba(0, 107, 63, 0.05)",
              "&:hover": {
                backgroundColor: "rgba(0, 107, 63, 0.12)",
              },
            }}
          >
            <DownloadIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton onClick={onClose} size="small" sx={{ color: "#718096" }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Modal Content */}
      <DialogContent sx={{ p: 0, backgroundColor: "#FAFBFC", minHeight: isPDF || isImage || isOffice ? 400 : "auto" }}>
        {isPDF ? (
          <Box sx={{ width: "100%", height: "70vh", overflow: "hidden" }}>
            <iframe
              src={`${document.file_path}#toolbar=0`}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
              title={document.file_name}
            />
          </Box>
        ) : isImage ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 3,
              width: "100%",
              height: "70vh",
              overflow: "auto",
            }}
          >
            <img
              src={document.file_path}
              alt={document.file_name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: 4,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            />
          </Box>
        ) : isOffice ? (
          <Box sx={{ width: "100%", height: "75vh", overflow: "hidden" }}>
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(document.file_path)}`}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
              title={document.file_name}
            />
          </Box>
        ) : (
          /* General preview placeholder with download action */
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 5,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              {getFileIcon(document.file_name)}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A202C", margin: "0 0 8px 0" }}>
              Preview Not Available
            </h3>
            <p style={{ fontSize: 13, color: "#718096", margin: "0 0 24px 0", maxWidth: 300, lineHeight: 1.5 }}>
              This file type (.{ext}) cannot be previewed directly in the browser. Please download the file to view its contents.
            </p>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => triggerDirectDownload(document.file_path, document.file_name)}
              sx={{
                py: 1.2,
                px: 4,
                borderRadius: 2,
                background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
              }}
            >
              Download Asset
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
