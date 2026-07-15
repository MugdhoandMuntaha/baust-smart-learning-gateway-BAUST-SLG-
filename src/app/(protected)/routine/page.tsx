"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import DownloadIcon from "@mui/icons-material/Download";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import TimetableGrid from "@/components/routine/TimetableGrid";
import { createClient } from "@/lib/supabase/client";
import type { ClassSlot, DayOfWeek, WeeklyRoutine } from "@/types/routine";
import { DAYS } from "@/types/routine";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function RoutinePage() {
  const [routine, setRoutine] = useState<WeeklyRoutine>({
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
  });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchRoutine() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("routine")
        .select("*")
        .order("start_time", { ascending: true });

      if (!error && data) {
        const grouped: WeeklyRoutine = {
          sunday: [],
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
        };

        (data as ClassSlot[]).forEach((slot) => {
          if (grouped[slot.day]) {
            grouped[slot.day].push(slot);
          }
        });

        setRoutine(grouped);
      }
      setLoading(false);
    }
    fetchRoutine();
  }, []);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("timetable-grid-card");
    if (!element) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate ratio to fit inside A4 landscape page width with some padding
      const padding = 10;
      const availableWidth = pdfWidth - padding * 2;
      const availableHeight = pdfHeight - padding * 2;
      
      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      
      const renderWidth = imgWidth * ratio;
      const renderHeight = imgHeight * ratio;
      
      const imgX = (pdfWidth - renderWidth) / 2;
      const imgY = 10;

      pdf.addImage(imgData, "PNG", imgX, imgY, renderWidth, renderHeight);
      pdf.save("Class_Routine.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloading(false);
    }
  };

  const totalClasses = Object.values(routine).flat().length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header and PDF Download Action */}
      {!loading && totalClasses > 0 && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleDownloadPDF}
            disabled={downloading}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              backgroundColor: "#1B4F72",
              "&:hover": {
                backgroundColor: "#153d58",
              },
            }}
          >
            {downloading ? "Generating PDF..." : "Download Routine as PDF"}
          </Button>
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[#1B4F72] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#A0AEC0]">Loading schedule...</p>
        </div>
      )}

      {/* Timetable */}
      {!loading && totalClasses > 0 && <TimetableGrid routine={routine} />}

      {/* Empty State */}
      {!loading && totalClasses === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
          <CalendarMonthOutlinedIcon sx={{ fontSize: 48, color: "#E2E8F0", mb: 2 }} />
          <h3 className="text-base font-semibold text-[#4A5568] mb-1">
            No schedule set
          </h3>
          <p className="text-sm text-[#A0AEC0]">
            The class routine will appear here once your CR sets it up
          </p>
        </div>
      )}
    </motion.div>
  );
}
