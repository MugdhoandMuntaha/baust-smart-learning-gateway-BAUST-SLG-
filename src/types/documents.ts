export interface Document {
  id: string;
  file_name: string;
  file_size: number;
  file_path: string;
  course_name: string;
  subfolder_id?: string | null;
  upload_date: string;
}

export interface CourseFolder {
  course_name: string;
  documents: Document[];
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "📄";
    case "pptx":
    case "ppt":
      return "📊";
    case "docx":
    case "doc":
      return "📝";
    case "xlsx":
    case "xls":
      return "📈";
    case "zip":
    case "rar":
      return "📦";
    case "jpg":
    case "jpeg":
    case "png":
      return "🖼️";
    default:
      return "📁";
  }
}
