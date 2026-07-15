"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FileCard from "./FileCard";
import type { CourseFolder } from "@/types/documents";

interface CourseSectionProps {
  folder: CourseFolder;
  defaultOpen?: boolean;
}

export default function CourseSection({ folder, defaultOpen = false }: CourseSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F8F9FA] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <FolderOpenIcon sx={{ fontSize: 22, color: "#006B3F" }} />
          <div className="text-left">
            <h3 className="text-sm font-semibold text-[#1A202C]">
              {folder.course_name}
            </h3>
            <p className="text-xs text-[#A0AEC0]">
              {folder.documents.length} {folder.documents.length === 1 ? "file" : "files"}
            </p>
          </div>
        </div>

        <IconButton size="small" sx={{ transition: "transform 0.2s" }}>
          <ExpandMoreIcon
            sx={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              color: "#4A5568",
            }}
          />
        </IconButton>
      </button>

      {/* Files List */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-[#F1F5F9] pt-3">
              {folder.documents.length === 0 ? (
                <p className="text-sm text-[#A0AEC0] text-center py-4">
                  No files uploaded yet
                </p>
              ) : (
                folder.documents.map((doc, index) => (
                  <FileCard key={doc.id} document={doc} index={index} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
