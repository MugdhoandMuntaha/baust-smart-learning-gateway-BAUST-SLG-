"use client";

import React from "react";
import { motion } from "framer-motion";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DownloadIcon from "@mui/icons-material/Download";
import type { Document as DocType } from "@/types/documents";
import { formatFileSize, getFileIcon } from "@/types/documents";
import { triggerDirectDownload } from "@/lib/download";

interface FileCardProps {
  document: DocType;
  index: number;
}

export default function FileCard({ document, index }: FileCardProps) {
  const icon = getFileIcon(document.file_name);
  const size = formatFileSize(document.file_size);
  const uploadDate = new Date(document.upload_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8F9FA] hover:border-[#CBD5E1] transition-all group"
    >
      {/* File Icon */}
      <div className="text-xl shrink-0">{icon}</div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A202C] truncate">
          {document.file_name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[#A0AEC0]">{size}</span>
          <span className="text-xs text-[#E2E8F0]">•</span>
          <span className="text-xs text-[#A0AEC0]">{uploadDate}</span>
        </div>
      </div>

      {/* Download Button */}
      <Tooltip title="Download" arrow>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            triggerDirectDownload(document.file_path, document.file_name);
          }}
          size="small"
          sx={{
            opacity: 0.5,
            transition: "all 0.2s",
            color: "#006B3F",
            "&:hover": {
              opacity: 1,
              backgroundColor: "rgba(0, 107, 63, 0.08)",
            },
          }}
          className="group-hover:opacity-100"
        >
          <DownloadIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </motion.div>
  );
}
