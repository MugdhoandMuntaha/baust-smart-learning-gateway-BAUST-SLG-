import React, { useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import DownloadIcon from "@mui/icons-material/Download";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import type { Document as DocType } from "@/types/documents";

interface ZipDownloadButtonProps {
  selectedDocs: DocType[];
  onClearSelection: () => void;
}

export default function ZipDownloadButton({
  selectedDocs,
  onClearSelection,
}: ZipDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleDownload = async () => {
    if (selectedDocs.length === 0) return;
    setDownloading(true);
    setProgress("Preparing...");

    try {
      const zip = new JSZip();
      
      for (let i = 0; i < selectedDocs.length; i++) {
        const doc = selectedDocs[i];
        setProgress(`Fetching ${i + 1}/${selectedDocs.length}...`);
        
        const response = await fetch(doc.file_path);
        if (!response.ok) throw new Error("CORS or network error");
        const blob = await response.blob();
        
        // Add file to ZIP
        zip.file(doc.file_name, blob);
      }

      setProgress("Compressing...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      setProgress("Saving...");
      const zipName = `${selectedDocs[0].course_name.replace(/\s+/g, "_")}_documents.zip`;
      saveAs(zipBlob, zipName);
      
      onClearSelection();
    } catch (error) {
      console.error("ZIP creation failed, falling back to sequential downloads:", error);
      setProgress("Downloading...");
      
      // Fallback: Trigger downloads sequentially
      for (let i = 0; i < selectedDocs.length; i++) {
        const doc = selectedDocs[i];
        const link = document.createElement("a");
        link.href = doc.file_path;
        link.download = doc.file_name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Small delay to prevent browser blocking too many downloads
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      
      onClearSelection();
    } finally {
      setDownloading(false);
      setProgress("");
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleDownload}
      disabled={downloading}
      startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
      sx={{
        textTransform: "none",
        fontSize: 12,
        fontWeight: 600,
        height: 38,
        borderRadius: 2,
        background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
        boxShadow: "0 2px 6px rgba(0, 107, 63, 0.15)",
        "&:hover": {
          background: "linear-gradient(135deg, #005532 0%, #00704a 100%)",
        },
      }}
    >
      {downloading ? progress : `Download Selected (${selectedDocs.length})`}
    </Button>
  );
}
