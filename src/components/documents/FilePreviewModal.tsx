"use client";

import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import useMediaQuery from "@mui/material/useMediaQuery";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

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
  const isMobile = useMediaQuery("(max-width:768px)");
  const [viewerMode, setViewerMode] = useState<"auto" | "google" | "native">("auto");

  useEffect(() => {
    // Reset viewer mode when document changes
    setViewerMode("auto");
  }, [document]);

  if (!document) return null;

  const ext = document.file_name.split(".").pop()?.toLowerCase();
  const isPDF = ext === "pdf";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "");
  const isOffice = ["docx", "doc", "pptx", "ppt", "xlsx", "xls"].includes(ext || "");

  const getAbsoluteFileUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    return path;
  };

  const fileUrl = getAbsoluteFileUrl(document.file_path);
  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
  
  // Decide whether to use Google PDF viewer (Default on mobile for reliable rendering)
  const useGoogleViewer = isPDF && (viewerMode === "google" || (viewerMode === "auto" && isMobile));

  const getOfficeSchemeUrl = () => {
    if (!document) return "";
    if (ext === "pptx" || ext === "ppt") {
      return `ms-powerpoint:ofv|u|${document.file_path}`;
    }
    if (ext === "docx" || ext === "doc") {
      return `ms-word:ofv|u|${document.file_path}`;
    }
    if (ext === "xlsx" || ext === "xls") {
      return `ms-excel:ofv|u|${document.file_path}`;
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
          borderRadius: { xs: 3, sm: 4 },
          overflow: "hidden",
          margin: { xs: 1, sm: 2 },
          width: { xs: "calc(100% - 16px)", sm: "100%" },
          maxHeight: { xs: "92vh", sm: "90vh" },
        },
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: { xs: 1.5, sm: 2 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 1, sm: 0 },
          borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#F8F9FA",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, width: "100%" }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>
            {getFileIcon(document.file_name)}
          </span>
          <Box sx={{ minWidth: 0, flex: 1 }}>
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

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "space-between", sm: "flex-end" },
            width: { xs: "100%", sm: "auto" },
            gap: 0.8,
            flexShrink: 0,
          }}
        >
          {isPDF && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Chip
                icon={<PictureAsPdfIcon sx={{ fontSize: 14 }} />}
                label={useGoogleViewer ? "Google PDF Viewer" : "Native Viewer"}
                size="small"
                color="success"
                variant={useGoogleViewer ? "filled" : "outlined"}
                onClick={() => setViewerMode(useGoogleViewer ? "native" : "google")}
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  height: 26,
                  cursor: "pointer",
                  backgroundColor: useGoogleViewer ? "#006B3F" : "transparent",
                  borderColor: "#006B3F",
                  color: useGoogleViewer ? "#fff" : "#006B3F",
                  "& .MuiChip-icon": {
                    color: useGoogleViewer ? "#fff" : "#006B3F",
                  },
                }}
              />
              <IconButton
                component="a"
                href={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                title="Open in Google PDF Viewer Tab"
                sx={{
                  color: "#006B3F",
                  backgroundColor: "rgba(0, 107, 63, 0.05)",
                  "&:hover": { backgroundColor: "rgba(0, 107, 63, 0.12)" },
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          )}

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
                height: 28,
                px: 1.2,
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
            title="Download file"
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
      <DialogContent
        sx={{
          p: 0,
          backgroundColor: "#FAFBFC",
          minHeight: isPDF || isImage || isOffice ? { xs: 350, sm: 400 } : "auto",
        }}
      >
        {isPDF ? (
          <Box sx={{ width: "100%", height: { xs: "75vh", sm: "70vh" }, overflow: "hidden" }}>
            <iframe
              src={useGoogleViewer ? googleViewerUrl : `${document.file_path}#toolbar=0`}
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
              p: { xs: 1.5, sm: 3 },
              width: "100%",
              height: { xs: "75vh", sm: "70vh" },
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
          <Box sx={{ width: "100%", height: { xs: "75vh", sm: "75vh" }, overflow: "hidden" }}>
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
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
              p: { xs: 3, sm: 5 },
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
