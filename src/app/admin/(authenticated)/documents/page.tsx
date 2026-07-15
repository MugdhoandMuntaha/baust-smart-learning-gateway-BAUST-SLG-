"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { triggerDirectDownload } from "@/lib/download";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CoPresentIcon from "@mui/icons-material/CoPresent";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderIcon from "@mui/icons-material/Folder";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import LinearProgress from "@mui/material/LinearProgress";
import Avatar from "@mui/material/Avatar";
import BookIcon from "@mui/icons-material/Book";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

import { createClient } from "@/lib/supabase/client";
import type { Document as DocType } from "@/types/documents";
import { formatFileSize, getFileIcon } from "@/types/documents";
import FilePreviewModal from "@/components/documents/FilePreviewModal";

interface Course {
  id: string;
  name: string;
  code?: string;
  teacher_name?: string;
  teacher_designation?: string;
  teacher_avatar_url?: string | null;
  teachers?: Array<{
    full_name: string;
    designation: string;
    avatar_url: string | null;
  }> | null;
}

interface Subfolder {
  id: string;
  name: string;
  course_id: string;
  created_at: string;
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subfolders, setSubfolders] = useState<Subfolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Dialog controls
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [subfolderDialogOpen, setSubfolderDialogOpen] = useState(false);
  const [renameCourseDialog, setRenameCourseDialog] = useState<Course | null>(null);
  const [deleteCourseDialog, setDeleteCourseDialog] = useState<Course | null>(null);
  const [renameDocDialog, setRenameDocDialog] = useState<DocType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DocType | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocType | null>(null);

  // Form states
  const [selectedCourse, setSelectedCourse] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newSubfolderName, setNewSubfolderName] = useState("");
  const [savingSubfolder, setSavingSubfolder] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherDesignation, setNewTeacherDesignation] = useState("");
  const [newTeacherAvatarFile, setNewTeacherAvatarFile] = useState<File | null>(null);
  const [newTeacherAvatarPreview, setNewTeacherAvatarPreview] = useState<string | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);

  const [editedCourseName, setEditedCourseName] = useState("");
  const [editedCourseCode, setEditedCourseCode] = useState("");
  const [editedTeacherName, setEditedTeacherName] = useState("");
  const [editedTeacherDesignation, setEditedTeacherDesignation] = useState("");
  const [editedTeacherAvatarPreview, setEditedTeacherAvatarPreview] = useState<string | null>(null);
  const [editedTeacherAvatarFile, setEditedTeacherAvatarFile] = useState<File | null>(null);
  const [editedDocName, setEditedDocName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const courseTeacherFileInputRef = useRef<HTMLInputElement>(null);
  const editTeacherFileInputRef = useRef<HTMLInputElement>(null);

  // File Explorer directory states
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [inRunningCourses, setInRunningCourses] = useState(false);
  const [currentSubfolder, setCurrentSubfolder] = useState<Subfolder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date"); // 'name' | 'size' | 'date'
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const supabase = createClient();

  const fetchCourses = useCallback(async () => {
    // Attempt to fetch from the `courses` database table
    const { data, error } = await supabase
      .from("courses")
      .select("*, teachers(full_name, designation, avatar_url)")
      .order("name", { ascending: true });

    if (!error && data) {
      setCourses(data as any[]);
    } else {
      // Fallback: If table is not created yet, populate empty array
      setCourses([]);
    }
  }, []);

  const fetchSubfolders = useCallback(async () => {
    const { data, error } = await supabase
      .from("subfolders")
      .select("*")
      .order("name", { ascending: true });
    if (!error && data) {
      setSubfolders(data as Subfolder[]);
    } else {
      setSubfolders([]);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("course_name")
      .order("upload_date", { ascending: false });
    if (data) setDocuments(data as DocType[]);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCourses(), fetchSubfolders(), fetchDocuments()]);
    setLoading(false);
  }, [fetchCourses, fetchSubfolders, fetchDocuments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derive unique courses from documents database (as local fallbacks or extra protection)
  const derivedCourseNames = [...new Set(documents.map((d) => d.course_name))];

  // Combine courses from the table with derived ones that might not be in the table yet
  const combinedCourseNames = [
    ...new Set([
      ...courses.map((c) => c.name),
      ...derivedCourseNames
    ])
  ].sort();

  // Helper to categorize document types
  const getFileTypeCategory = (fileName: string): "pdf" | "ppt" | "doc" | "other" => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "ppt" || ext === "pptx") return "ppt";
    if (ext === "doc" || ext === "docx") return "doc";
    return "other";
  };

  // Group document stats
  const pdfCount = documents.filter((d) => getFileTypeCategory(d.file_name) === "pdf").length;
  const pptCount = documents.filter((d) => getFileTypeCategory(d.file_name) === "ppt").length;
  const docCount = documents.filter((d) => getFileTypeCategory(d.file_name) === "doc").length;
  const otherCount = documents.filter((d) => getFileTypeCategory(d.file_name) === "other").length;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedCourse) return;
    setUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const filePath = `${selectedCourse}/${Date.now()}_${file.name}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        alert(`Upload failed for ${file.name}: ${uploadError.message}\n\nPlease check that the 'documents' storage bucket exists in Supabase and your policies allow writes.`);
        break;
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Insert metadata record
      const { error: insertError } = await supabase.from("documents").insert({
        file_name: file.name,
        file_size: file.size,
        file_path: urlData.publicUrl,
        course_name: selectedCourse,
        subfolder_id: currentSubfolder ? currentSubfolder.id : null,
      });

      if (insertError) {
        console.error("Insert error details:", insertError);
        alert(`Failed to save database metadata for ${file.name}: ${insertError.message}`);
        break;
      }
      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    setUploading(false);
    setUploadDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchDocuments();
  };

  const handleDelete = async (doc: DocType) => {
    const pathParts = doc.file_path.split("/documents/");
    if (pathParts.length > 1) {
      await supabase.storage.from("documents").remove([pathParts[1]]);
    }
    await supabase.from("documents").delete().eq("id", doc.id);
    setDeleteConfirm(null);
    fetchDocuments();
  };

  const handleNewTeacherAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setNewTeacherAvatarFile(file);
      setNewTeacherAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleEditedTeacherAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setEditedTeacherAvatarFile(file);
      setEditedTeacherAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateCourse = async () => {
    const name = newCourseName.trim();
    if (!name) return;

    if (combinedCourseNames.includes(name)) {
      alert("Course folder already exists!");
      return;
    }

    setSavingCourse(true);
    try {
      let finalAvatarUrl = null;

      // Upload avatar if chosen
      if (newTeacherAvatarFile) {
        const fileExt = newTeacherAvatarFile.name.split(".").pop();
        const filePath = `teacher_avatars/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, newTeacherAvatarFile, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);
        finalAvatarUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("courses").insert({
        name,
        code: newCourseCode.trim(),
        teacher_name: newTeacherName.trim(),
        teacher_designation: newTeacherDesignation.trim(),
        teacher_avatar_url: finalAvatarUrl,
      });

      if (error) throw error;

      setNewCourseName("");
      setNewCourseCode("");
      setNewTeacherName("");
      setNewTeacherDesignation("");
      setNewTeacherAvatarFile(null);
      setNewTeacherAvatarPreview(null);
      setCourseDialogOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating course: ${err.message || err}`);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleCreateSubfolder = async () => {
    if (!newSubfolderName.trim() || !currentFolder) return;
    setSavingSubfolder(true);
    try {
      const parentCourse = courses.find((c) => c.name === currentFolder);
      if (!parentCourse) throw new Error("Parent course folder not found");

      const { error } = await supabase.from("subfolders").insert({
        name: newSubfolderName.trim(),
        course_id: parentCourse.id,
      });

      if (error) throw error;

      setNewSubfolderName("");
      setSubfolderDialogOpen(false);
      fetchSubfolders();
    } catch (err: any) {
      alert(`Error creating subfolder: ${err.message || err}`);
    } finally {
      setSavingSubfolder(false);
    }
  };

  const handleDeleteSubfolder = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the subfolder "${name}"? This will delete all files inside it.`)) {
      return;
    }
    const { error } = await supabase.from("subfolders").delete().eq("id", id);
    if (!error) {
      fetchSubfolders();
      fetchDocuments();
    } else {
      alert(`Error deleting subfolder: ${error.message}`);
    }
  };

  const handleRenameCourse = async () => {
    if (!renameCourseDialog) return;
    const oldName = renameCourseDialog.name;
    const newName = editedCourseName.trim();
    if (!newName) return;

    setSavingCourse(true);
    try {
      let finalAvatarUrl = editedTeacherAvatarPreview;

      // Upload new avatar if chosen
      if (editedTeacherAvatarFile) {
        const fileExt = editedTeacherAvatarFile.name.split(".").pop();
        const filePath = `teacher_avatars/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, editedTeacherAvatarFile, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);
        finalAvatarUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("courses")
        .update({
          name: newName,
          code: editedCourseCode.trim(),
          teacher_name: editedTeacherName.trim(),
          teacher_designation: editedTeacherDesignation.trim(),
          teacher_avatar_url: finalAvatarUrl,
        })
        .eq("id", renameCourseDialog.id);

      if (error) throw error;

      // Update documents' course names if name changed
      if (oldName !== newName) {
        await supabase
          .from("documents")
          .update({ course_name: newName })
          .eq("course_name", oldName);
      }

      setRenameCourseDialog(null);
      setEditedCourseName("");
      setEditedCourseCode("");
      setEditedTeacherName("");
      setEditedTeacherDesignation("");
      setEditedTeacherAvatarFile(null);
      setEditedTeacherAvatarPreview(null);
      loadData();
    } catch (err: any) {
      alert(`Error saving changes: ${err.message || err}`);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourseDialog) return;
    const courseName = deleteCourseDialog.name;

    // Get all documents in this course
    const courseDocs = documents.filter((d) => d.course_name === courseName);

    // Remove all files from Supabase Storage
    for (const doc of courseDocs) {
      const pathParts = doc.file_path.split("/documents/");
      if (pathParts.length > 1) {
        await supabase.storage.from("documents").remove([pathParts[1]]);
      }
    }

    // Delete documents metadata records
    await supabase.from("documents").delete().eq("course_name", courseName);

    // Delete course record
    await supabase.from("courses").delete().eq("id", deleteCourseDialog.id);

    setDeleteCourseDialog(null);
    if (currentFolder === courseName) {
      setCurrentFolder(null);
    }
    loadData();
  };

  const handleRenameDoc = async () => {
    if (!renameDocDialog || !editedDocName.trim()) return;

    await supabase
      .from("documents")
      .update({ file_name: editedDocName.trim() })
      .eq("id", renameDocDialog.id);

    setRenameDocDialog(null);
    setEditedDocName("");
    fetchDocuments();
  };

  // Filtered and sorted documents inside current folder/subfolder
  const currentFolderDocs = documents
    .filter((doc) => {
      if (currentFolder === null) return false;
      const matchesFolder = doc.course_name === currentFolder;

      // If inside a subfolder, match subfolder_id. Else, show only direct folder files (no subfolder).
      const matchesSubfolder = currentSubfolder
        ? doc.subfolder_id === currentSubfolder.id
        : !doc.subfolder_id;

      const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesType = true;
      if (filterType !== "all") {
        const ext = doc.file_name.split(".").pop()?.toLowerCase();
        if (filterType === "pdf") {
          matchesType = ext === "pdf";
        } else if (filterType === "image") {
          matchesType = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext || "");
        } else if (filterType === "ppt") {
          matchesType = ["ppt", "pptx"].includes(ext || "");
        } else if (filterType === "word") {
          matchesType = ["doc", "docx"].includes(ext || "");
        }
      }

      return matchesFolder && matchesSubfolder && matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.file_name.localeCompare(b.file_name);
      } else if (sortBy === "size") {
        comparison = a.file_size - b.file_size;
      } else if (sortBy === "date") {
        comparison = new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const renderFilterSortBar = () => {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
          p: 2,
          backgroundColor: "#F8FAFC",
          borderRadius: 2.5,
          border: "1px solid #E2E8F0",
        }}
      >
        {/* File Type Filter Chips */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#4A5568", marginRight: 8 }}>Filter:</span>
          {[
            { value: "all", label: "📁 All Files" },
            { value: "pdf", label: "📄 PDF" },
            { value: "image", label: "🖼️ Images" },
            { value: "ppt", label: "📊 Slides (PPT)" },
            { value: "word", label: "📝 Word" },
          ].map((type) => (
            <Chip
              key={type.value}
              label={type.label}
              onClick={() => setFilterType(type.value)}
              variant={filterType === type.value ? "filled" : "outlined"}
              sx={{
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: filterType === type.value ? "#006B3F" : "transparent",
                color: filterType === type.value ? "#FFFFFF" : "#4A5568",
                borderColor: filterType === type.value ? "#006B3F" : "#CBD5E1",
                "&:hover": {
                  backgroundColor: filterType === type.value ? "#005532" : "rgba(0, 107, 63, 0.04)",
                },
              }}
              size="small"
            />
          ))}
        </Box>

        {/* Sorting Controls */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#4A5568" }}>Sort by:</span>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            size="small"
            sx={{
              fontSize: 12,
              height: 32,
              backgroundColor: "#FFFFFF",
              borderRadius: 1.5,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E1" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#006B3F" },
            }}
          >
            <MenuItem value="name" sx={{ fontSize: 12 }}>Name</MenuItem>
            <MenuItem value="size" sx={{ fontSize: 12 }}>Size</MenuItem>
            <MenuItem value="date" sx={{ fontSize: 12 }}>Upload Date</MenuItem>
          </Select>

          <IconButton
            size="small"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            sx={{
              border: "1px solid #CBD5E1",
              borderRadius: 1.5,
              backgroundColor: "#FFFFFF",
              p: 0.75,
              "&:hover": { borderColor: "#006B3F", backgroundColor: "rgba(0, 107, 63, 0.04)" },
            }}
          >
            {sortOrder === "asc" ? (
              <span style={{ fontSize: 12, fontWeight: 700 }}>↑</span>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 700 }}>↓</span>
            )}
          </IconButton>
        </Box>
      </Box>
    );
  };

  // Find active course object
  const activeCourseObj = courses.find((c) => c.name === currentFolder);

  // Subfolders belonging to the current course folder
  const activeSubfolders = currentFolder && activeCourseObj
    ? subfolders.filter((sf) => sf.course_id === activeCourseObj.id)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A202C", margin: 0 }}>
            Manage Vault Assets
          </h2>
          <p style={{ fontSize: 13, color: "#718096", margin: "4px 0 0 0" }}>
            Create course folders, add subfolders, and upload/manage resource documents in an interactive explorer.
          </p>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCourseDialogOpen(true)}
            sx={{ borderColor: "#006B3F", color: "#006B3F", textTransform: "none", "&:hover": { borderColor: "#004d2d" } }}
          >
            Create Course
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={!currentFolder}
            onClick={() => {
              if (currentFolder) {
                setSelectedCourse(currentFolder);
                setUploadDialogOpen(true);
              }
            }}
            sx={{
              textTransform: "none",
              background: currentFolder ? "linear-gradient(135deg, #006B3F 0%, #00895a 100%)" : undefined,
            }}
          >
            {currentSubfolder
              ? `Upload to "${currentSubfolder.name}"`
              : currentFolder
                ? "Upload to Folder Root"
                : "Open a Folder to Upload"}
          </Button>
        </Box>
      </Box>

      {/* Explorer Container */}
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: 450,
          border: "1px solid #E2E8F0",
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
        }}
      >
        {/* Explorer Navbar */}
        <Box
          sx={{
            px: 3,
            py: 2,
            backgroundColor: "#FAFBFC",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          {/* Breadcrumb Path */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13, color: "#4A5568", fontWeight: 600 }}>
            <span
              onClick={() => {
                setInRunningCourses(false);
                setCurrentFolder(null);
                setCurrentSubfolder(null);
                setSearchQuery("");
              }}
              style={{ cursor: "pointer", color: inRunningCourses ? "#006B3F" : "#1A202C", display: "flex", alignItems: "center", gap: 4 }}
            >
              📁 Root
            </span>
            {inRunningCourses && (
              <>
                <span style={{ color: "#CBD5E1" }}>/</span>
                <span
                  onClick={() => {
                    setCurrentFolder(null);
                    setCurrentSubfolder(null);
                    setSearchQuery("");
                  }}
                  style={{ cursor: "pointer", color: currentFolder ? "#006B3F" : "#1A202C" }}
                >
                  Running Courses
                </span>
              </>
            )}
            {currentFolder && (
              <>
                <span style={{ color: "#CBD5E1" }}>/</span>
                <span
                  onClick={() => {
                    setCurrentSubfolder(null);
                    setSearchQuery("");
                  }}
                  style={{ cursor: "pointer", color: currentSubfolder ? "#006B3F" : "#1A202C" }}
                >
                  {currentFolder}
                </span>
              </>
            )}
            {currentSubfolder && (
              <>
                <span style={{ color: "#CBD5E1" }}>/</span>
                <span style={{ color: "#1A202C", fontWeight: 700 }}>
                  {currentSubfolder.name}
                </span>
              </>
            )}
          </Box>

          {/* Toolbar Right-side Action */}
          {currentFolder === null ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCourseDialogOpen(true)}
              sx={{
                borderColor: "#E2E8F0",
                color: "#4A5568",
                textTransform: "none",
                fontSize: 12,
                borderRadius: 2,
                "&:hover": {
                  borderColor: "#006B3F",
                  backgroundColor: "rgba(0, 107, 63, 0.04)",
                  color: "#006B3F",
                },
              }}
            >
              New Folder
            </Button>
          ) : (
            <TextField
              size="small"
              placeholder={currentSubfolder ? "Search files in subfolder..." : "Search files in this folder..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#006B3F", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                width: 320,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "50px",
                  fontSize: 13,
                  backgroundColor: "#FFFFFF",
                  paddingLeft: 2,
                  height: 40,
                  transition: "all 0.2s ease-in-out",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  "& fieldset": {
                    borderColor: "#D8E2DC",
                  },
                  "&:hover fieldset": {
                    borderColor: "#006B3F",
                  },
                  "&.Mui-focused": {
                    boxShadow: "0 4px 12px rgba(0, 107, 63, 0.12)",
                    "& fieldset": {
                      borderColor: "#006B3F",
                      borderWidth: "2px",
                    },
                  },
                },
              }}
            />
          )}
        </Box>

        {/* Explorer Body */}
        <Box sx={{ flexGrow: 1, p: 3, backgroundColor: "#FFFFFF" }}>
          {/* LEVEL 1: Course Folders (Root or inside Running Courses) */}
          {currentFolder === null ? (
            !inRunningCourses ? (
              <Box>
                <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Folders (1)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: 16,
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      backgroundColor: "#FFFFFF",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    className="hover:border-[#006B3F] hover:bg-slate-50/50 hover:shadow-sm"
                    onClick={() => setInRunningCourses(true)}
                  >
                    <FolderIcon sx={{ fontSize: 44, color: "#006B3F" }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C" }}>
                        Running Courses
                      </div>
                      <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
                        {courses.length} course folders
                      </div>
                    </div>
                  </div>
                </div>
              </Box>
            ) : (
              <Box>
                <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Course Folders ({courses.length})
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                  {courses.map((course) => {
                    const courseDocs = documents.filter((d) => d.course_name === course.name);
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
                      <div
                        key={course.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 16,
                          border: "1px solid #E2E8F0",
                          borderRadius: 12,
                          backgroundColor: "#FFFFFF",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        className="hover:border-[#006B3F] hover:bg-slate-50/50 hover:shadow-sm"
                        onClick={() => setCurrentFolder(course.name)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <FolderIcon sx={{ fontSize: 44, color: "#A0AEC0" }} />
                            <Avatar
                              src={displayTeacher.avatar || undefined}
                              sx={{
                                position: "absolute",
                                bottom: -2,
                                right: -4,
                                width: 22,
                                height: 22,
                                border: "1.5px solid #FFFFFF",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                fontSize: 9,
                                fontWeight: 700,
                                backgroundColor: "#F1F5F9",
                                color: "#006B3F",
                              }}
                            >
                              {displayTeacher.name ? displayTeacher.name[0].toUpperCase() : <BookIcon style={{ fontSize: 10 }} />}
                            </Avatar>
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {course.name}
                            </div>
                            {course.code && (
                              <div style={{ fontSize: 10, color: "#00895a", fontWeight: 600, marginTop: 1 }}>
                                {course.code}
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: "#718096", marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                              <span style={{ fontWeight: 600 }}>{displayTeacher.name || "No Teacher"}</span>
                              {displayTeacher.designation && (
                                <span style={{ fontSize: 10, fontStyle: "italic", color: "#A0AEC0" }}>
                                  {displayTeacher.designation}
                                </span>
                              )}
                              <span style={{ fontSize: 10, color: "#718096", marginTop: 2 }}>{courseDocs.length} files</span>
                            </div>
                          </div>
                        </div>

                        {/* Folder Controls */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginLeft: 8 }} onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setRenameCourseDialog(course);
                              setEditedCourseName(course.name);
                              setEditedCourseCode(course.code || "");
                              setEditedTeacherName(course.teacher_name || "");
                              setEditedTeacherDesignation(course.teacher_designation || "");
                              setEditedTeacherAvatarPreview(course.teacher_avatar_url || null);
                            }}
                          >
                            <EditIcon sx={{ fontSize: 15, color: "#718096" }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteCourseDialog(course)}
                            sx={{ color: "#DC2626" }}
                          >
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </div>
                      </div>
                    );
                  })}

                  {/* Create Folder Card */}
                  <div
                    onClick={() => setCourseDialogOpen(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      padding: 24,
                      border: "2px dashed #CBD5E1",
                      borderRadius: 12,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      minHeight: 88,
                    }}
                    className="hover:border-[#006B3F] hover:bg-slate-50/20"
                  >
                    <AddIcon sx={{ color: "#A0AEC0", mb: 0.5, fontSize: 24 }} />
                  </div>
                </div>
              </Box>
            )
          ) : currentSubfolder === null ? (
            /* LEVEL 2: Course folder interior: Subfolders + Direct files */
            <Box>
              {/* Back to Root button & Folder quick options */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Button
                  onClick={() => {
                    setCurrentFolder(null);
                    setSearchQuery("");
                  }}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: "#E2E8F0",
                    color: "#4A5568",
                    textTransform: "none",
                    fontSize: 12,
                    borderRadius: 2,
                    "&:hover": {
                      borderColor: "#006B3F",
                      backgroundColor: "rgba(0, 107, 63, 0.04)",
                    },
                  }}
                >
                  ← Back to Root
                </Button>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setSubfolderDialogOpen(true)}
                    sx={{
                      borderColor: "#006B3F",
                      color: "#006B3F",
                      textTransform: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 2,
                      height: 38,
                      px: 2,
                      "&:hover": {
                        borderColor: "#00895a",
                        backgroundColor: "rgba(0, 107, 63, 0.04)",
                      },
                    }}
                  >
                    New Subfolder
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => {
                      setSelectedCourse(currentFolder);
                      setUploadDialogOpen(true);
                    }}
                    sx={{
                      textTransform: "none",
                      fontSize: 12,
                      background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                      height: 38,
                      borderRadius: 2,
                      boxShadow: "0 2px 6px rgba(0, 107, 63, 0.15)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #005532 0%, #00704a 100%)",
                      }
                    }}
                  >
                    Upload File here
                  </Button>
                </Box>
              </Box>

              {/* Subfolders Grid Section */}
              <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Subfolders ({activeSubfolders.length})
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                {activeSubfolders.map((sf) => {
                  const sfDocs = documents.filter((d) => d.course_name === currentFolder && d.subfolder_id === sf.id);
                  return (
                    <div
                      key={sf.id}
                      onClick={() => setCurrentSubfolder(sf)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 12,
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        backgroundColor: "#FAFBFC",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      className="hover:border-[#00895a] hover:bg-slate-50"
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
                        <FolderIcon sx={{ color: "#00895a", fontSize: 32 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {sf.name}
                          </div>
                          <div style={{ fontSize: 10, color: "#718096" }}>
                            {sfDocs.length} files
                          </div>
                        </div>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubfolder(sf.id, sf.name);
                        }}
                        sx={{ color: "#DC2626", p: 0.5 }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </div>
                  );
                })}

                {/* Add Subfolder Quick Card */}
                <div
                  onClick={() => setSubfolderDialogOpen(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: 12,
                    border: "1.5px dashed #CBD5E1",
                    borderRadius: 8,
                    cursor: "pointer",
                    minHeight: 46,
                  }}
                  className="hover:border-[#006B3F] hover:bg-slate-50/20"
                >
                  <AddIcon sx={{ color: "#A0AEC0", fontSize: 18 }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#718096" }}>Create Subfolder</div>
                </div>
              </div>

              {/* Direct Files Section */}
              {renderFilterSortBar()}
              <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Files inside folder ({currentFolderDocs.length})
              </div>

              {currentFolderDocs.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center", border: "1px dashed #E2E8F0", borderRadius: 3 }}>
                  <p style={{ fontSize: 12, color: "#A0AEC0", margin: 0 }}>
                    No direct files in this directory. Upload files or navigate inside subfolders.
                  </p>
                </Box>
              ) : (
                /* Renders file table */
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1.2fr 100px",
                      padding: "8px 16px",
                      borderBottom: "2px solid #E2E8F0",
                      color: "#718096",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    <div>Name</div>
                    <div>Size</div>
                    <div>Uploaded Date</div>
                    <div style={{ textAlign: "right" }}>Actions</div>
                  </div>

                  {currentFolderDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setPreviewDoc(doc)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1.2fr 100px",
                        alignItems: "center",
                        padding: "12px 16px",
                        borderBottom: "1px solid #F1F5F9",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      className="hover:bg-slate-50/70"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <span style={{ fontSize: 20, flexShrink: 0, display: "flex", alignItems: "center" }}>
                          {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(doc.file_name) ? (
                            <img
                              src={doc.file_path}
                              alt={doc.file_name}
                              style={{
                                width: 24,
                                height: 24,
                                objectFit: "cover",
                                borderRadius: 4,
                                border: "1px solid #E2E8F0",
                              }}
                            />
                          ) : (
                            getFileIcon(doc.file_name)
                          )}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1A202C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {doc.file_name}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#4A5568" }}>{formatFileSize(doc.file_size)}</div>
                      <div style={{ fontSize: 12, color: "#718096" }}>{new Date(doc.upload_date).toLocaleDateString()}</div>
                      <div style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setRenameDocDialog(doc);
                            setEditedDocName(doc.file_name);
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16, color: "#718096" }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => triggerDirectDownload(doc.file_path, doc.file_name)}
                          sx={{ color: "#006B3F" }}
                        >
                          <DownloadIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleteConfirm(doc)} sx={{ color: "#DC2626" }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Box>
          ) : (
            /* LEVEL 3: Inside a Subfolder. Show files belonging specifically to subfolder_id */
            <Box>
              {/* Back to Course folder button & Upload */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Button
                  onClick={() => {
                    setCurrentSubfolder(null);
                    setSearchQuery("");
                  }}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: "#E2E8F0",
                    color: "#4A5568",
                    textTransform: "none",
                    fontSize: 12,
                    borderRadius: 2,
                    "&:hover": {
                      borderColor: "#006B3F",
                      backgroundColor: "rgba(0, 107, 63, 0.04)",
                    },
                  }}
                >
                  ← Up to Course Root
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => {
                    setSelectedCourse(currentFolder);
                    setUploadDialogOpen(true);
                  }}
                  sx={{
                    textTransform: "none",
                    fontSize: 12,
                    background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
                    height: 38,
                    borderRadius: 2,
                    boxShadow: "0 2px 6px rgba(0, 107, 63, 0.15)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #005532 0%, #00704a 100%)",
                    }
                  }}
                >
                  Upload to Subfolder
                </Button>
              </Box>

              {renderFilterSortBar()}
              <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Files in "{currentSubfolder.name}" ({currentFolderDocs.length})
              </div>

              {currentFolderDocs.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 44, color: "#CBD5E1", marginBottom: 12 }}>📁</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#4A5568" }}>
                    This subfolder is empty
                  </div>
                  <p style={{ fontSize: 11, color: "#A0AEC0", margin: "4px 0 0 0" }}>
                    Click "Upload to Subfolder" to add documents inside this folder.
                  </p>
                </Box>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {/* Header Row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1.2fr 100px",
                      padding: "8px 16px",
                      borderBottom: "2px solid #E2E8F0",
                      color: "#718096",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    <div>Name</div>
                    <div>Size</div>
                    <div>Uploaded Date</div>
                    <div style={{ textAlign: "right" }}>Actions</div>
                  </div>

                  {/* Files Loop */}
                  {currentFolderDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setPreviewDoc(doc)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1.2fr 100px",
                        alignItems: "center",
                        padding: "12px 16px",
                        borderBottom: "1px solid #F1F5F9",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      className="hover:bg-slate-50/70"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <span style={{ fontSize: 20, flexShrink: 0, display: "flex", alignItems: "center" }}>
                          {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(doc.file_name) ? (
                            <img
                              src={doc.file_path}
                              alt={doc.file_name}
                              style={{
                                width: 24,
                                height: 24,
                                objectFit: "cover",
                                borderRadius: 4,
                                border: "1px solid #E2E8F0",
                              }}
                            />
                          ) : (
                            getFileIcon(doc.file_name)
                          )}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1A202C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {doc.file_name}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#4A5568" }}>{formatFileSize(doc.file_size)}</div>
                      <div style={{ fontSize: 12, color: "#718096" }}>{new Date(doc.upload_date).toLocaleDateString()}</div>
                      <div style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setRenameDocDialog(doc);
                            setEditedDocName(doc.file_name);
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16, color: "#718096" }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => triggerDirectDownload(doc.file_path, doc.file_name)}
                          sx={{ color: "#006B3F" }}
                        >
                          <DownloadIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleteConfirm(doc)} sx={{ color: "#DC2626" }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Box>
          )}
        </Box>
      </Card>

      {/* Dialog: Upload File */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Upload Document</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3.5, pt: 1.5 }}>
          <TextField
            select
            fullWidth
            label="Course Folder"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            {combinedCourseNames.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          {/* Upload Zone */}
          <Box
            onClick={() => !uploading && fileInputRef.current?.click()}
            sx={{
              border: "2px dashed #CBD5E1",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              backgroundColor: "#FAFBFC",
              "&:hover": {
                borderColor: uploading ? "#CBD5E1" : "#006B3F",
                backgroundColor: uploading ? "#FAFBFC" : "rgba(0, 107, 63, 0.01)",
              },
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.zip,.rar,.jpg,.jpeg,.png"
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
            <CloudUploadIcon sx={{ fontSize: 40, color: "#A0AEC0", mb: 1.5 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#4A5568" }}>
              {uploading ? "Uploading files..." : "Click to select or drop files here"}
            </div>
            <div style={{ fontSize: 11, color: "#A0AEC0", marginTop: 6 }}>
              Supports PDF, Slides, Sheets, Documents, and Images up to 50MB
            </div>
          </Box>

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ width: "100%" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <span style={{ fontSize: 11, color: "#4A5568", fontWeight: 600 }}>Uploading assets...</span>
                <span style={{ fontSize: 11, color: "#4A5568", fontWeight: 600 }}>{uploadProgress}%</span>
              </Box>
              <LinearProgress variant="determinate" value={uploadProgress} color="primary" sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setUploadDialogOpen(false)} color="inherit" disabled={uploading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Create Course */}
      <Dialog
        open={courseDialogOpen}
        onClose={() => setCourseDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, color: "#006B3F" }}>Create Course Folder</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); handleCreateCourse(); }}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
            {/* Teacher Avatar Uploader preview */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  position: "relative",
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  border: "2px solid #006B3F",
                  overflow: "hidden",
                  backgroundColor: "#F1F5F9",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {newTeacherAvatarPreview ? (
                  <img
                    src={newTeacherAvatarPreview}
                    alt="Teacher Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <BookIcon sx={{ fontSize: 32, color: "#94A3B8" }} />
                )}
              </Box>
              <input
                type="file"
                ref={courseTeacherFileInputRef}
                onChange={handleNewTeacherAvatarChange}
                accept="image/*"
                style={{ display: "none" }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCameraIcon />}
                onClick={() => courseTeacherFileInputRef.current?.click()}
                sx={{ borderColor: "#006B3F", color: "#006B3F", textTransform: "none", fontSize: 11 }}
              >
                Upload Teacher Photo
              </Button>
            </Box>

            <TextField
              fullWidth
              label="Course Folder Name"
              placeholder="e.g., Machine Learning"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              required
              size="small"
            />

            <TextField
              fullWidth
              label="Course Code"
              placeholder="e.g., CSE-4101"
              value={newCourseCode}
              onChange={(e) => setNewCourseCode(e.target.value)}
              required
              size="small"
            />

            <TextField
              fullWidth
              label="Teacher Name"
              placeholder="e.g., Dr. Md. Al Amin"
              value={newTeacherName}
              onChange={(e) => setNewTeacherName(e.target.value)}
              required
              size="small"
            />

            <TextField
              fullWidth
              label="Teacher Designation"
              placeholder="e.g., Assistant Professor"
              value={newTeacherDesignation}
              onChange={(e) => setNewTeacherDesignation(e.target.value)}
              required
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setCourseDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingCourse || !newCourseName.trim()}
              sx={{ background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)" }}
            >
              {savingCourse ? "Saving..." : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog: Create Subfolder */}
      <Dialog
        open={subfolderDialogOpen}
        onClose={() => setSubfolderDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, color: "#006B3F" }}>Create Subfolder</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); handleCreateSubfolder(); }}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
            <TextField
              fullWidth
              label="Subfolder Name"
              placeholder="e.g., Lectures, Lab Sheets, Reference Books"
              value={newSubfolderName}
              onChange={(e) => setNewSubfolderName(e.target.value)}
              required
              autoFocus
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setSubfolderDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingSubfolder || !newSubfolderName.trim()}
              sx={{ background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)" }}
            >
              {savingSubfolder ? "Saving..." : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog: Edit Course Folder */}
      <Dialog
        open={!!renameCourseDialog}
        onClose={() => setRenameCourseDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, color: "#006B3F" }}>Edit Course Folder</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); handleRenameCourse(); }}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
            {/* Teacher Avatar Uploader preview */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  position: "relative",
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  border: "2px solid #006B3F",
                  overflow: "hidden",
                  backgroundColor: "#F1F5F9",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {editedTeacherAvatarPreview ? (
                  <img
                    src={editedTeacherAvatarPreview}
                    alt="Teacher Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <BookIcon sx={{ fontSize: 32, color: "#94A3B8" }} />
                )}
              </Box>
              <input
                type="file"
                ref={editTeacherFileInputRef}
                onChange={handleEditedTeacherAvatarChange}
                accept="image/*"
                style={{ display: "none" }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCameraIcon />}
                onClick={() => editTeacherFileInputRef.current?.click()}
                sx={{ borderColor: "#006B3F", color: "#006B3F", textTransform: "none", fontSize: 11 }}
              >
                Change Teacher Photo
              </Button>
            </Box>

            <TextField
              fullWidth
              label="Course Folder Name"
              value={editedCourseName}
              onChange={(e) => setEditedCourseName(e.target.value)}
              required
              size="small"
            />

            <TextField
              fullWidth
              label="Course Code"
              value={editedCourseCode}
              onChange={(e) => setEditedCourseCode(e.target.value)}
              required
              size="small"
            />

            <TextField
              fullWidth
              label="Teacher Name"
              value={editedTeacherName}
              onChange={(e) => setEditedTeacherName(e.target.value)}
              required
              size="small"
            />

            <TextField
              fullWidth
              label="Teacher Designation"
              value={editedTeacherDesignation}
              onChange={(e) => setEditedTeacherDesignation(e.target.value)}
              required
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setRenameCourseDialog(null)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingCourse || !editedCourseName.trim()}
              sx={{ background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)" }}
            >
              {savingCourse ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog: Rename Document */}
      <Dialog
        open={!!renameDocDialog}
        onClose={() => setRenameDocDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Rename File</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <TextField
            fullWidth
            label="File Name"
            value={editedDocName}
            onChange={(e) => setEditedDocName(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRenameDocDialog(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleRenameDoc}
            variant="contained"
            disabled={!editedDocName.trim() || editedDocName === renameDocDialog?.file_name}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Delete Course Confirmation */}
      <Dialog
        open={!!deleteCourseDialog}
        onClose={() => setDeleteCourseDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Course Folder?</DialogTitle>
        <DialogContent>
          <p style={{ fontSize: 13, color: "#4A5568", margin: "0 0 12px 0" }}>
            Are you sure you want to permanently delete course folder <strong>{deleteCourseDialog?.name}</strong>?
          </p>
          {documents.filter((d) => d.course_name === deleteCourseDialog?.name).length > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Warning: This course contains <strong>{documents.filter((d) => d.course_name === deleteCourseDialog?.name).length}</strong> documents. Deleting this folder will permanently delete all files stored inside it from both the vault and Supabase Storage!
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteCourseDialog(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteCourse} variant="contained" color="error">
            Delete Everything
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Delete File Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete File?</DialogTitle>
        <DialogContent>
          <p style={{ fontSize: 13, color: "#4A5568", margin: 0 }}>
            Are you sure you want to permanently delete <strong>{deleteConfirm?.file_name}</strong>? This action cannot be undone.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reusable File Preview Modal */}
      <FilePreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  );
}
