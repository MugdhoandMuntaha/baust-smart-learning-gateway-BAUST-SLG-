"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import FolderIcon from "@mui/icons-material/Folder";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CoPresentIcon from "@mui/icons-material/CoPresent";
import AssignmentIcon from "@mui/icons-material/Assignment";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import Avatar from "@mui/material/Avatar";
import BookIcon from "@mui/icons-material/Book";
import Checkbox from "@mui/material/Checkbox";
import GridViewIcon from "@mui/icons-material/GridView";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import ExplorerItem from "@/components/documents/ExplorerItem";

import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useStudentScope } from "@/hooks/useStudentScope";
import type { Document as DocType } from "@/types/documents";
import { formatFileSize, getFileIcon } from "@/types/documents";
import FilePreviewModal from "@/components/documents/FilePreviewModal";
import ZipDownloadButton from "@/components/documents/ZipDownloadButton";
import { triggerDirectDownload } from "@/lib/download";

interface Course {
  id: string;
  name: string;
  code: string;
  teacher_name: string;
  teacher_designation?: string;
  teacher_avatar_url: string | null;
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
  parent_id?: string | null;
}

function DocumentsPageContent() {
  const { scope, loading: scopeLoading } = useStudentScope();
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [dbCourses, setDbCourses] = useState<Course[]>([]);
  const [subfolders, setSubfolders] = useState<Subfolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<DocType | null>(null);
  
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [inRunningCourses, setInRunningCourses] = useState(true);
  const [subfolderPath, setSubfolderPath] = useState<Subfolder[]>([]);
  const currentSubfolder = subfolderPath.length > 0 ? subfolderPath[subfolderPath.length - 1] : null;
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date"); // 'name' | 'size' | 'date'
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const searchParams = useSearchParams();

  useEffect(() => {
    setSelectedDocIds([]);
  }, [currentFolder, subfolderPath]);

  useEffect(() => {
    if (scopeLoading || !scope) return;
    const s = scope;
    async function fetchData() {
      const supabase = createClient();
      
      // Load documents
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .select("*")
        .order("course_name", { ascending: true })
        .order("upload_date", { ascending: false });

      if (!docError && docData) {
        setDocuments(docData as DocType[]);
      }

      // Load courses (filtered by student scope)
      let courseQuery = supabase
        .from("courses")
        .select("*, teachers(full_name, designation, avatar_url)");
      
      courseQuery = courseQuery
        .eq("level", s.level)
        .eq("term", s.term)
        .eq("section", s.section);

      const { data: courseData, error: courseError } = await courseQuery
        .order("name", { ascending: true });

      if (!courseError && courseData) {
        setDbCourses(courseData as any[]);
      }

      // Load subfolders
      const { data: sfData, error: sfError } = await supabase
        .from("subfolders")
        .select("*")
        .order("name", { ascending: true });

      if (!sfError && sfData) {
        setSubfolders(sfData as Subfolder[]);
      }

      setLoading(false);
    }
    fetchData();
  }, [scope, scopeLoading]);

  // Listen to folder query parameter to auto-open a course folder
  useEffect(() => {
    const folderParam = searchParams.get("folder");
    if (folderParam && dbCourses.length > 0) {
      const matched = dbCourses.find(
        (c) => c.name.toLowerCase() === folderParam.toLowerCase() || c.code?.toLowerCase() === folderParam.toLowerCase()
      );
      if (matched) {
        setCurrentFolder(matched.name);
        setInRunningCourses(true);
        setSubfolderPath([]);
      }
    }
  }, [searchParams, dbCourses]);

  // Helper to categorize document types
  const getFileTypeCategory = (fileName: string): "pdf" | "ppt" | "doc" | "other" => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "ppt" || ext === "pptx") return "ppt";
    if (ext === "doc" || ext === "docx") return "doc";
    return "other";
  };

  // Filtered and sorted documents inside current folder/subfolder
  const currentFolderDocs = documents
    .filter((doc) => {
      if (currentFolder === null) return false;
      const matchesFolder = doc.course_name === currentFolder;
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
          {/* Layout Toggle */}
          <IconButton
            size="small"
            onClick={() => setViewMode("grid")}
            sx={{
              border: "1px solid #CBD5E1",
              borderRadius: 1.5,
              backgroundColor: viewMode === "grid" ? "rgba(0, 107, 63, 0.08)" : "#FFFFFF",
              borderColor: viewMode === "grid" ? "#006B3F" : "#CBD5E1",
              color: viewMode === "grid" ? "#006B3F" : "#718096",
              p: 0.5,
              "&:hover": { borderColor: "#006B3F", backgroundColor: "rgba(0, 107, 63, 0.04)" },
            }}
            title="Grid View"
          >
            <GridViewIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setViewMode("list")}
            sx={{
              border: "1px solid #CBD5E1",
              borderRadius: 1.5,
              backgroundColor: viewMode === "list" ? "rgba(0, 107, 63, 0.08)" : "#FFFFFF",
              borderColor: viewMode === "list" ? "#006B3F" : "#CBD5E1",
              color: viewMode === "list" ? "#006B3F" : "#718096",
              p: 0.5,
              "&:hover": { borderColor: "#006B3F", backgroundColor: "rgba(0, 107, 63, 0.04)" },
            }}
            title="List View"
          >
            <FormatListBulletedIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <Box sx={{ width: "1px", height: 20, backgroundColor: "#E2E8F0", mx: 0.5 }} />

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

  const coursesList = [...new Set(documents.map((d) => d.course_name))].sort();

  // Active course and its subfolders
  const activeCourseObj = dbCourses.find((c) => c.name === currentFolder);
  const activeSubfolders = currentFolder && activeCourseObj
    ? subfolders.filter((sf) => 
        sf.course_id === activeCourseObj.id &&
        (currentSubfolder ? sf.parent_id === currentSubfolder.id : !sf.parent_id)
      )
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
              boxShadow: "0 4px 12px rgba(0, 107, 63, 0.25)",
            }}
          >
            <FolderOutlinedIcon sx={{ fontSize: 22, color: "#FFFFFF" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A202C", margin: 0 }}>
              Document Vault
            </h1>
            <p style={{ fontSize: 12, color: "#718096", margin: "2px 0 0 0" }}>
              {dbCourses.length} {dbCourses.length === 1 ? "course" : "courses"} • {documents.length} {documents.length === 1 ? "file" : "files"} total
            </p>
          </div>
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <CircularProgress color="primary" />
          <p style={{ fontSize: 14, color: "#A0AEC0", marginTop: 8 }}>Loading files Explorer...</p>
        </div>
      )}

      {!loading && (
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
          {/* File Explorer Navigation & Search Bar */}
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
                  setSubfolderPath([]);
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
                      setSubfolderPath([]);
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
                      setSubfolderPath([]);
                      setSearchQuery("");
                    }}
                    style={{ cursor: "pointer", color: subfolderPath.length > 0 ? "#006B3F" : "#1A202C" }}
                  >
                    {currentFolder}
                  </span>
                </>
              )}
              {subfolderPath.map((sf, idx) => (
                <React.Fragment key={sf.id}>
                  <span style={{ color: "#CBD5E1" }}>/</span>
                  <span
                    onClick={() => {
                      setSubfolderPath(subfolderPath.slice(0, idx + 1));
                      setSearchQuery("");
                    }}
                    style={{
                      cursor: "pointer",
                      color: idx === subfolderPath.length - 1 ? "#1A202C" : "#006B3F",
                      fontWeight: idx === subfolderPath.length - 1 ? 700 : "normal"
                    }}
                  >
                    {sf.name}
                  </span>
                </React.Fragment>
              ))}
            </Box>

            {/* Search Input inside folder */}
            {currentFolder && (
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

          {/* Explorer View Body */}
          <Box sx={{ flexGrow: 1, p: 3, backgroundColor: "#FFFFFF" }}>
            {/* LEVEL 1: ROOT - List Course Folders */}
            {currentFolder === null ? (
              !inRunningCourses ? (
                <Box>
                  <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Folders (1)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
                    <div
                      onClick={() => setInRunningCourses(true)}
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
                    >
                      <FolderIcon sx={{ fontSize: 44, color: "#006B3F" }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C" }}>
                          Running Courses
                        </div>
                        <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
                          {dbCourses.length > 0 ? dbCourses.length : coursesList.length} course folders
                        </div>
                      </div>
                    </div>
                  </div>
                </Box>
              ) : (
                <Box>
                  <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Course Folders ({dbCourses.length > 0 ? dbCourses.length : coursesList.length})
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
                    {(dbCourses.length > 0
                      ? dbCourses
                      : coursesList.map(name => ({
                          id: name,
                          name: name,
                          code: "",
                          teacher_name: "",
                          teacher_designation: "",
                          teacher_avatar_url: null,
                          teachers: null
                        }))
                    ).map((course: Course) => {
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
                        onClick={() => setCurrentFolder(course.name)}
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
                      >
                        <div style={{ position: "relative" }}>
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
                    );
                  })}
                </div>
              </Box>
            )
          ) : currentSubfolder === null ? (
              /* LEVEL 2: Course folder interior - Subfolders + Direct files */
              <Box>
                <Button
                  onClick={() => {
                    setCurrentFolder(null);
                    setSearchQuery("");
                  }}
                  variant="outlined"
                  size="small"
                  sx={{
                    mb: 3,
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
                  {inRunningCourses ? "← Back to Running Courses" : "← Back to Root"}
                </Button>

                {renderFilterSortBar()}

                {viewMode === "grid" ? (
                  <Box>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Content ({activeSubfolders.length + currentFolderDocs.length})
                      </div>
                      {selectedDocIds.length > 0 && (
                        <ZipDownloadButton
                          selectedDocs={currentFolderDocs.filter(d => selectedDocIds.includes(d.id))}
                          onClearSelection={() => setSelectedDocIds([])}
                        />
                      )}
                    </div>

                    {activeSubfolders.length === 0 && currentFolderDocs.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: "center", border: "1px dashed #E2E8F0", borderRadius: 3 }}>
                        <p style={{ fontSize: 12, color: "#A0AEC0", margin: 0 }}>This folder is empty.</p>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "16px",
                          p: 2,
                          backgroundColor: "#F8FAFC",
                          borderRadius: 3,
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        {/* Folders first */}
                        {activeSubfolders.map((sf) => (
                          <ExplorerItem
                            key={sf.id}
                            type="folder"
                            name={sf.name}
                            onClick={() => setSubfolderPath([...subfolderPath, sf])}
                          />
                        ))}
                        {/* Files next */}
                        {currentFolderDocs.map((doc) => (
                          <ExplorerItem
                            key={doc.id}
                            type="file"
                            name={doc.file_name}
                            isSelected={selectedDocIds.includes(doc.id)}
                            onSelect={(selected) => {
                              if (selected) {
                                setSelectedDocIds([...selectedDocIds, doc.id]);
                              } else {
                                setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                              }
                            }}
                            onClick={() => setPreviewDoc(doc)}
                            onDownload={() => triggerDirectDownload(doc.file_path, doc.file_name)}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    {/* Subfolders Section */}
                    {activeSubfolders.length > 0 && (
                      <>
                        <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Subfolders ({activeSubfolders.length})
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                          {activeSubfolders.map((sf) => {
                            const sfDocs = documents.filter((d) => d.course_name === currentFolder && d.subfolder_id === sf.id);
                            return (
                              <div
                                key={sf.id}
                                onClick={() => setSubfolderPath([...subfolderPath, sf])}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: 12,
                                  border: "1px solid #E2E8F0",
                                  borderRadius: 8,
                                  backgroundColor: "#FAFBFC",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                                className="hover:border-[#00895a] hover:bg-slate-50"
                              >
                                <FolderIcon sx={{ color: "#00895a", fontSize: 32 }} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {sf.name}
                                  </div>
                                  <div style={{ fontSize: 10, color: "#718096" }}>
                                    {sfDocs.length} files
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {/* Direct Files Section */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Files ({currentFolderDocs.length})
                      </div>
                      {selectedDocIds.length > 0 && (
                        <ZipDownloadButton
                          selectedDocs={currentFolderDocs.filter(d => selectedDocIds.includes(d.id))}
                          onClearSelection={() => setSelectedDocIds([])}
                        />
                      )}
                    </div>

                    {currentFolderDocs.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: "center", border: "1px dashed #E2E8F0", borderRadius: 3 }}>
                        <p style={{ fontSize: 12, color: "#A0AEC0", margin: 0 }}>
                          {activeSubfolders.length > 0
                            ? "No direct files. Navigate into subfolders to find documents."
                            : "No documents uploaded in this course yet."}
                        </p>
                      </Box>
                    ) : (
                      <div style={{ overflowX: "auto" }} className="scrollbar-none">
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 640 }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "40px 2fr 1fr 1fr 40px",
                            padding: "8px 16px",
                            borderBottom: "2px solid #E2E8F0",
                            color: "#718096",
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <Checkbox
                              size="small"
                              indeterminate={selectedDocIds.length > 0 && selectedDocIds.length < currentFolderDocs.length}
                              checked={selectedDocIds.length === currentFolderDocs.length && currentFolderDocs.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocIds(currentFolderDocs.map(d => d.id));
                                } else {
                                  setSelectedDocIds([]);
                                }
                              }}
                              sx={{ p: 0, color: "#A0AEC0", "&.Mui-checked": { color: "#006B3F" } }}
                            />
                          </div>
                          <div>Name</div>
                          <div>Size</div>
                          <div>Uploaded Date</div>
                          <div style={{ textAlign: "right" }}>Action</div>
                        </div>
                        {currentFolderDocs.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => setPreviewDoc(doc)}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "40px 2fr 1fr 1fr 40px",
                              alignItems: "center",
                              padding: "12px 16px",
                              borderBottom: "1px solid #F1F5F9",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                            className="hover:bg-slate-50/70"
                          >
                            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center" }}>
                              <Checkbox
                                size="small"
                                checked={selectedDocIds.includes(doc.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDocIds([...selectedDocIds, doc.id]);
                                  } else {
                                    setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                                  }
                                }}
                                sx={{ p: 0, color: "#A0AEC0", "&.Mui-checked": { color: "#006B3F" } }}
                              />
                            </div>
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
                            <div style={{ textAlign: "right" }}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerDirectDownload(doc.file_path, doc.file_name);
                                }}
                                sx={{ color: "#006B3F", backgroundColor: "rgba(0, 107, 63, 0.04)", "&:hover": { backgroundColor: "rgba(0, 107, 63, 0.08)" } }}
                              >
                                <DownloadIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </div>
                          </div>
                        ))}
                        </div>
                      </div>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              /* LEVEL 3: Inside a Subfolder */
              <Box>
                <Button
                  onClick={() => {
                    setSubfolderPath(subfolderPath.slice(0, -1));
                    setSearchQuery("");
                  }}
                  variant="outlined"
                  size="small"
                  sx={{
                    mb: 3,
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
                  ← Back to {subfolderPath.length > 1 ? subfolderPath[subfolderPath.length - 2].name : currentFolder}
                </Button>

                {renderFilterSortBar()}

                {viewMode === "grid" ? (
                  <Box>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Content ({activeSubfolders.length + currentFolderDocs.length})
                      </div>
                      {selectedDocIds.length > 0 && (
                        <ZipDownloadButton
                          selectedDocs={currentFolderDocs.filter(d => selectedDocIds.includes(d.id))}
                          onClearSelection={() => setSelectedDocIds([])}
                        />
                      )}
                    </div>

                    {activeSubfolders.length === 0 && currentFolderDocs.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: "center", border: "1px dashed #E2E8F0", borderRadius: 3 }}>
                        <p style={{ fontSize: 12, color: "#A0AEC0", margin: 0 }}>This folder is empty.</p>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "16px",
                          p: 2,
                          backgroundColor: "#F8FAFC",
                          borderRadius: 3,
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        {/* Folders first */}
                        {activeSubfolders.map((sf) => (
                          <ExplorerItem
                            key={sf.id}
                            type="folder"
                            name={sf.name}
                            onClick={() => setSubfolderPath([...subfolderPath, sf])}
                          />
                        ))}
                        {/* Files next */}
                        {currentFolderDocs.map((doc) => (
                          <ExplorerItem
                            key={doc.id}
                            type="file"
                            name={doc.file_name}
                            isSelected={selectedDocIds.includes(doc.id)}
                            onSelect={(selected) => {
                              if (selected) {
                                setSelectedDocIds([...selectedDocIds, doc.id]);
                              } else {
                                setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                              }
                            }}
                            onClick={() => setPreviewDoc(doc)}
                            onDownload={() => triggerDirectDownload(doc.file_path, doc.file_name)}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    {/* Subfolders Section */}
                    {activeSubfolders.length > 0 && (
                      <>
                        <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Subfolders ({activeSubfolders.length})
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                          {activeSubfolders.map((sf) => {
                            const sfDocs = documents.filter((d) => d.course_name === currentFolder && d.subfolder_id === sf.id);
                            return (
                              <div
                                key={sf.id}
                                onClick={() => setSubfolderPath([...subfolderPath, sf])}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: 12,
                                  border: "1px solid #E2E8F0",
                                  borderRadius: 8,
                                  backgroundColor: "#FAFBFC",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                                className="hover:border-[#00895a] hover:bg-slate-50"
                              >
                                <FolderIcon sx={{ color: "#00895a", fontSize: 32 }} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A202C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {sf.name}
                                  </div>
                                  <div style={{ fontSize: 10, color: "#718096" }}>
                                    {sfDocs.length} files
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Files in "{currentSubfolder.name}" ({currentFolderDocs.length})
                      </div>
                      {selectedDocIds.length > 0 && (
                        <ZipDownloadButton
                          selectedDocs={currentFolderDocs.filter(d => selectedDocIds.includes(d.id))}
                          onClearSelection={() => setSelectedDocIds([])}
                        />
                      )}
                    </div>

                    {currentFolderDocs.length === 0 ? (
                      <Box sx={{ py: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 44, color: "#CBD5E1", marginBottom: 12 }}>📁</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#4A5568" }}>
                          This subfolder is empty
                        </div>
                        <p style={{ fontSize: 11, color: "#A0AEC0", margin: "4px 0 0 0" }}>
                          No documents have been uploaded in this subfolder yet.
                        </p>
                      </Box>
                    ) : (
                      <div style={{ overflowX: "auto" }} className="scrollbar-none">
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 640 }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "40px 2fr 1fr 1fr 40px",
                            padding: "8px 16px",
                            borderBottom: "2px solid #E2E8F0",
                            color: "#718096",
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <Checkbox
                              size="small"
                              indeterminate={selectedDocIds.length > 0 && selectedDocIds.length < currentFolderDocs.length}
                              checked={selectedDocIds.length === currentFolderDocs.length && currentFolderDocs.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocIds(currentFolderDocs.map(d => d.id));
                                } else {
                                  setSelectedDocIds([]);
                                }
                              }}
                              sx={{ p: 0, color: "#A0AEC0", "&.Mui-checked": { color: "#006B3F" } }}
                            />
                          </div>
                          <div>Name</div>
                          <div>Size</div>
                          <div>Uploaded Date</div>
                          <div style={{ textAlign: "right" }}>Action</div>
                        </div>
                        {currentFolderDocs.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => setPreviewDoc(doc)}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "40px 2fr 1fr 1fr 40px",
                              alignItems: "center",
                              padding: "12px 16px",
                              borderBottom: "1px solid #F1F5F9",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                            className="hover:bg-slate-50/70"
                          >
                            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center" }}>
                              <Checkbox
                                size="small"
                                checked={selectedDocIds.includes(doc.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDocIds([...selectedDocIds, doc.id]);
                                  } else {
                                    setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                                  }
                                }}
                                sx={{ p: 0, color: "#A0AEC0", "&.Mui-checked": { color: "#006B3F" } }}
                              />
                            </div>
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
                            <div style={{ textAlign: "right" }}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerDirectDownload(doc.file_path, doc.file_name);
                                }}
                                sx={{ color: "#006B3F", backgroundColor: "rgba(0, 107, 63, 0.04)", "&:hover": { backgroundColor: "rgba(0, 107, 63, 0.08)" } }}
                              >
                                <DownloadIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </div>
                          </div>
                        ))}
                        </div>
                      </div>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Card>
      )}

      {/* Reusable File Preview Modal */}
      <FilePreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </motion.div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
        <CircularProgress color="success" />
      </Box>
    }>
      <DocumentsPageContent />
    </Suspense>
  );
}
