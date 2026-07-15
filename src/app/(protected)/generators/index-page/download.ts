export interface ExperimentEntry {
  no: string;
  name: string;
  experimentDate: string;
  submissionDate: string;
  mark: string;
}

export interface TeacherEntry {
  name: string;
  designation: string;
}

export interface IndexFormData {
  studentName: string;
  studentId: string;
  level: string;
  term: string;
  section: string;
  dateOfSubmission: string;
  teachers: TeacherEntry[];
  experiments: ExperimentEntry[];
}

function getFilename(data: IndexFormData, ext: string): string {
  const name = data.studentName || "IndexPage";
  const sanitized = name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
  return `${sanitized}_IndexPage.${ext}`;
}

export async function downloadPDF(
  element: HTMLElement,
  data: IndexFormData
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  // Capture the element as a high-res image
  const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.98);

  // A4 dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // Create PDF and place the image scaled to fill the entire A4 page
  const pdf = new jsPDF({ unit: "mm", format: [pdfWidth, Math.max(297, pdfHeight)], orientation: "portrait" });
  pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(getFilename(data, "pdf"));
}

export async function downloadPNG(
  element: HTMLElement,
  data: IndexFormData
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
  });
  const link = document.createElement("a");
  link.download = getFilename(data, "png");
  link.href = canvas.toDataURL("image/png");
  link.click();
}
