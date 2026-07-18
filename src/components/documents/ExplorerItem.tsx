import React from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";

// Green Folder SVG matching screenshot style but in emerald website color scheme
export const GreenFolderSVG = () => (
  <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Back flap */}
    <path d="M4 12C4 9.79086 5.79086 8 8 8H24L28.8 14.4H56C58.2091 14.4 60 16.2091 60 18.4V52C60 54.2091 58.2091 56 56 56H8C5.79086 56 4 54.2091 4 52V12Z" fill="#005532" />
    {/* Inner document insert preview */}
    <rect x="12" y="14" width="40" height="24" rx="2" fill="#FFFFFF" opacity="0.6" />
    {/* Front flap */}
    <path d="M4 20.8C4 19.4745 5.07452 18.4 6.4 18.4H57.6C58.9255 18.4 60 19.4745 60 20.8V52C60 54.2091 58.2091 56 56 56H8C5.79086 56 4 54.2091 4 52V20.8Z" fill="#006B3F" />
  </svg>
);

// Green Accent File SVG
export const GreenFileSVG = ({ fileName }: { fileName: string }) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  
  let brandColor = "#10B981"; // default emerald green
  let labelText = ext?.toUpperCase() || "FILE";

  if (ext === "pdf") {
    brandColor = "#EF4444"; // keep standard red line indicator for PDF for quick recognition
  } else if (ext === "doc" || ext === "docx") {
    brandColor = "#2563EB"; // blue line for doc
  } else if (ext === "ppt" || ext === "pptx") {
    brandColor = "#EA580C"; // orange line for ppt
  }

  // Determine file-type logos inside page:
  let pageLogo = null;
  if (ext === "json") {
    pageLogo = (
      <text x="32" y="38" fill="#006B3F" fontSize="18" fontWeight="bold" textAnchor="middle">{"{}"}</text>
    );
  } else if (["ts", "tsx", "js", "jsx"].includes(ext || "")) {
    pageLogo = (
      <text x="32" y="38" fill="#006B3F" fontSize="11" fontWeight="bold" textAnchor="middle">JS/TS</text>
    );
  } else {
    pageLogo = (
      <text x="32" y="38" fill="#006B3F" fontSize="12" fontWeight="bold" textAnchor="middle">{labelText}</text>
    );
  }

  return (
    <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Page background */}
      <path d="M16 8C16 6.89543 16.8954 6 18 6H42L52 16V56C52 57.1046 51.1046 58 50 58H18C16.8954 58 16 57.1046 16 56V8Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      {/* Corner fold */}
      <path d="M42 6V16H52L42 6Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" strokeLinejoin="round" />
      {/* Color accent line strip */}
      <rect x="22" y="48" width="20" height="3" rx="1.5" fill={brandColor} />
      {/* Center file type text */}
      {pageLogo}
    </svg>
  );
};

interface ExplorerItemProps {
  type: "folder" | "file";
  name: string;
  fileSize?: number;
  uploadDate?: string;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

export default function ExplorerItem({
  type,
  name,
  isSelected,
  onSelect,
  onClick,
  onDownload,
  onRename,
  onDelete,
  isAdmin,
}: ExplorerItemProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event: React.MouseEvent) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        width: 105,
        height: 115,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        borderRadius: 2,
        border: "1px solid transparent",
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: "#E2E8F0",
          backgroundColor: "rgba(0, 107, 63, 0.04)",
          "& .item-checkbox, & .item-menu": {
            opacity: 1,
          },
        },
        ...(isSelected && {
          borderColor: "#bbf7d0",
          backgroundColor: "rgba(0, 107, 63, 0.08)",
        }),
      }}
    >
      {/* Checkbox overlay for multi-select (Files only) */}
      {type === "file" && onSelect && (
        <Box
          className="item-checkbox"
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: "absolute",
            top: 2,
            left: 2,
            opacity: isSelected ? 1 : 0,
            transition: "opacity 0.15s ease",
            zIndex: 10,
          }}
        >
          <Checkbox
            size="small"
            checked={!!isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            sx={{
              p: 0.5,
              color: "#A0AEC0",
              "&.Mui-checked": { color: "#006B3F" },
            }}
          />
        </Box>
      )}

      {/* Action Menu Trigger (Only for Admin, or Files download) */}
      {((isAdmin && (onRename || onDelete)) || (!isAdmin && type === "file" && onDownload)) && (
        <Box
          className="item-menu"
          sx={{
            position: "absolute",
            top: 2,
            right: 2,
            opacity: openMenu ? 1 : 0,
            transition: "opacity 0.15s ease",
            zIndex: 10,
          }}
        >
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{
              p: 0.5,
              color: "#718096",
              "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
            }}
          >
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      {/* Custom SVG Icon Container */}
      <Box sx={{ mb: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {type === "folder" ? <GreenFolderSVG /> : <GreenFileSVG fileName={name} />}
      </Box>

      {/* Item label */}
      <Box
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: "#2D3748",
          textAlign: "center",
          px: 1,
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
        title={name}
      >
        {name}
      </Box>

      {/* Action Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: {
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.08)",
              border: "1px solid #E2E8F0",
              borderRadius: 1.5,
              minWidth: 100,
            },
          },
        }}
      >
        {type === "file" && onDownload && (
          <MenuItem
            onClick={(e) => {
              handleMenuClose(e);
              onDownload();
            }}
            sx={{ fontSize: 12, gap: 1 }}
          >
            <DownloadIcon sx={{ fontSize: 14, color: "#006B3F" }} /> Download
          </MenuItem>
        )}
        {isAdmin && onRename && (
          <MenuItem
            onClick={(e) => {
              handleMenuClose(e);
              onRename();
            }}
            sx={{ fontSize: 12, gap: 1 }}
          >
            <EditIcon sx={{ fontSize: 14, color: "#718096" }} /> Rename
          </MenuItem>
        )}
        {isAdmin && onDelete && (
          <MenuItem
            onClick={(e) => {
              handleMenuClose(e);
              onDelete();
            }}
            sx={{ fontSize: 12, gap: 1, color: "#E53E3E" }}
          >
            <DeleteIcon sx={{ fontSize: 14, color: "#E53E3E" }} /> Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
