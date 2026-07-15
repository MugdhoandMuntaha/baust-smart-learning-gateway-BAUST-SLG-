export async function triggerDirectDownload(filePath: string, fileName: string) {
  try {
    const response = await fetch(filePath);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Direct download failed, falling back to open in tab:", error);
    // Fallback if fetch fails (e.g. CORS or network error)
    const a = document.createElement("a");
    a.href = filePath;
    a.target = "_blank";
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
