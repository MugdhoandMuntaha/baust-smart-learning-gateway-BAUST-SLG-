import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    TableLayoutType,
} from "docx";
import { saveAs } from "file-saver";

export interface AssignmentFormData {
    department: string;
    courseTitle: string;
    courseNo: string;
    assignmentNo: string;
    assignmentTopic: string;
    studentName: string;
    studentId: string;
    level: string;
    term: string;
    submissionDate: string;
    teachers: { name: string; designation: string }[];
}

export interface ReportContent {
    objectives: string[];
    introduction: string;
    algorithm: string[];
    sourceCode: string;
    diagram: string;
    conclusion: string;
}

function formatDate(dateStr: string): string {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getFilename(data: AssignmentFormData, ext: string): string {
    const name = data.studentName || "Assignment";
    const sanitized = name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
    const suffix = data.assignmentNo ? `_Assgn${data.assignmentNo}` : "";
    return `${sanitized}${suffix}_Assignment.${ext}`;
}

export async function downloadPDF(
    element: HTMLElement,
    data: AssignmentFormData
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
    data: AssignmentFormData
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

export async function downloadDOCX(data: AssignmentFormData, reportContent?: ReportContent | null): Promise<void> {
    const noBorder = {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
    };

    const thinBorder = {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
    };

    function makeInfoRow(label: string, value: string) {
        return new TableRow({
            children: [
                new TableCell({
                    borders: noBorder,
                    width: { size: 3200, type: WidthType.DXA },
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: label,
                                    bold: true,
                                    italics: true,
                                    size: 24,
                                    font: "Times New Roman",
                                }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    borders: noBorder,
                    width: { size: 400, type: WidthType.DXA },
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: ":",
                                    bold: true,
                                    size: 24,
                                    font: "Times New Roman",
                                }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    borders: noBorder,
                    width: { size: 5300, type: WidthType.DXA },
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: value || "",
                                    size: 24,
                                    font: "Times New Roman",
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });
    }

    const courseInfoTable = new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 8900, type: WidthType.DXA },
        rows: [
            makeInfoRow("Department", data.department),
            makeInfoRow("Course Title", data.courseTitle),
            makeInfoRow("Course No", data.courseNo),
            makeInfoRow("Assignment No", data.assignmentNo),
            makeInfoRow("Assignment Topic", data.assignmentTopic),
        ],
    });

    // Teacher paragraphs
    const teacherParagraphs: Paragraph[] = [];
    data.teachers.forEach((teacher, i) => {
        if (i > 0) {
            teacherParagraphs.push(
                new Paragraph({ spacing: { before: 100 }, children: [] })
            );
        }
        teacherParagraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Name of the Teacher:",
                        bold: true,
                        italics: true,
                        size: 22,
                        font: "Times New Roman",
                    }),
                ],
            })
        );
        teacherParagraphs.push(
            new Paragraph({
                indent: { left: 200 },
                children: [
                    new TextRun({
                        text: teacher.name,
                        size: 22,
                        font: "Times New Roman",
                    }),
                ],
            })
        );
        teacherParagraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Designation:",
                        bold: true,
                        italics: true,
                        size: 22,
                        font: "Times New Roman",
                    }),
                ],
            })
        );
        teacherParagraphs.push(
            new Paragraph({
                indent: { left: 200 },
                children: [
                    new TextRun({
                        text: teacher.designation,
                        size: 22,
                        font: "Times New Roman",
                    }),
                ],
            })
        );
    });

    // Single signature
    teacherParagraphs.push(
        new Paragraph({ spacing: { before: 200 }, children: [] })
    );
    teacherParagraphs.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "Signature: .............................................",
                    bold: true,
                    italics: true,
                    size: 22,
                    font: "Times New Roman",
                }),
            ],
        })
    );

    const submissionTable = new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 8900, type: WidthType.DXA },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        borders: noBorder,
                        width: { size: 4450, type: WidthType.DXA },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 100 },
                                children: [
                                    new TextRun({
                                        text: "Submitted By",
                                        bold: true,
                                        italics: true,
                                        size: 26,
                                        font: "Times New Roman",
                                    }),
                                ],
                            }),
                        ],
                    }),
                    new TableCell({
                        borders: noBorder,
                        width: { size: 4450, type: WidthType.DXA },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 100 },
                                children: [
                                    new TextRun({
                                        text: "Submitted To",
                                        bold: true,
                                        italics: true,
                                        size: 26,
                                        font: "Times New Roman",
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({
                        borders: thinBorder,
                        width: { size: 4450, type: WidthType.DXA },
                        children: [
                            new Paragraph({
                                spacing: { after: 40 },
                                children: [
                                    new TextRun({ text: "Name: ", bold: true, italics: true, size: 22, font: "Times New Roman" }),
                                    new TextRun({ text: data.studentName, size: 22, font: "Times New Roman" }),
                                ],
                            }),
                            new Paragraph({
                                spacing: { after: 40 },
                                children: [
                                    new TextRun({ text: "Id: ", bold: true, italics: true, size: 22, font: "Times New Roman" }),
                                    new TextRun({ text: data.studentId, size: 22, font: "Times New Roman" }),
                                ],
                            }),
                            new Paragraph({
                                spacing: { after: 40 },
                                children: [
                                    new TextRun({ text: "Level: ", bold: true, italics: true, size: 22, font: "Times New Roman" }),
                                    new TextRun({ text: data.level || "", size: 22, font: "Times New Roman" }),
                                    new TextRun({ text: "        Term: ", bold: true, italics: true, size: 22, font: "Times New Roman" }),
                                    new TextRun({ text: data.term || "", size: 22, font: "Times New Roman" }),
                                ],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Date of submission: ", bold: true, italics: true, size: 22, font: "Times New Roman" }),
                                    new TextRun({ text: data.submissionDate ? formatDate(data.submissionDate) : "", size: 22, font: "Times New Roman" }),
                                ],
                            }),
                        ],
                    }),
                    new TableCell({
                        borders: thinBorder,
                        width: { size: 4450, type: WidthType.DXA },
                        children: teacherParagraphs,
                    }),
                ],
            }),
        ],
    });

    // Comments box
    const commentsLabel = new Paragraph({
        spacing: { after: 80 },
        children: [
            new TextRun({
                text: "Comments:",
                bold: true,
                italics: true,
                size: 24,
                font: "Times New Roman",
            }),
        ],
    });

    const commentsBox = new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 8900, type: WidthType.DXA },
        rows: [
            new TableRow({
                height: { value: 1200, rule: "atLeast" },
                children: [
                    new TableCell({
                        borders: thinBorder,
                        width: { size: 8900, type: WidthType.DXA },
                        children: [new Paragraph({ children: [] })],
                    }),
                ],
            }),
        ],
    });

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 800, right: 1000, bottom: 800, left: 1000 },
                    },
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 100 },
                        children: [
                            new TextRun({
                                text: "Bangladesh Army University of Science",
                                bold: true,
                                size: 36,
                                font: "Times New Roman",
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: "and Technology (BAUST), Saidpur",
                                bold: true,
                                size: 36,
                                font: "Times New Roman",
                            }),
                        ],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 300 },
                        children: [
                            new TextRun({
                                text: "Assignment",
                                bold: true,
                                size: 40,
                                font: "Times New Roman",
                            }),
                        ],
                    }),
                    courseInfoTable,
                    new Paragraph({ spacing: { before: 200 }, children: [] }),
                    commentsLabel,
                    commentsBox,
                    new Paragraph({ spacing: { before: 200 }, children: [] }),
                    submissionTable,
                ],
            },
            // AI-generated content pages
            ...(reportContent ? [{
                properties: {
                    page: {
                        margin: { top: 1000, right: 1200, bottom: 1000, left: 1200 },
                    },
                },
                children: [
                    // Objectives
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "Objectives:", bold: true, size: 28, font: "Times New Roman" }),
                        ],
                    }),
                    ...reportContent.objectives.map((obj) =>
                        new Paragraph({
                            spacing: { after: 60 },
                            indent: { left: 400 },
                            children: [
                                new TextRun({ text: `• ${obj}`, size: 24, font: "Times New Roman" }),
                            ],
                        })
                    ),
                    new Paragraph({ spacing: { after: 300 }, children: [] }),
                    // Introduction
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "Introduction:", bold: true, size: 28, font: "Times New Roman" }),
                        ],
                    }),
                    new Paragraph({
                        spacing: { after: 300 },
                        children: [
                            new TextRun({ text: reportContent.introduction, size: 24, font: "Times New Roman" }),
                        ],
                    }),
                    // Algorithm
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "Algorithm:", bold: true, size: 28, font: "Times New Roman" }),
                        ],
                    }),
                    ...reportContent.algorithm.map((step, i) =>
                        new Paragraph({
                            spacing: { after: 80 },
                            indent: { left: 400 },
                            children: [
                                new TextRun({ text: `Step ${i + 1}: `, bold: true, size: 24, font: "Times New Roman" }),
                                new TextRun({ text: step, size: 24, font: "Times New Roman" }),
                            ],
                        })
                    ),
                    new Paragraph({ spacing: { after: 300 }, children: [] }),
                    // Source Code
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "Source code:", bold: true, size: 28, font: "Times New Roman" }),
                        ],
                    }),
                    new Paragraph({
                        spacing: { after: 300 },
                        children: [
                            new TextRun({ text: reportContent.sourceCode, size: 20, font: "Courier New" }),
                        ],
                    }),
                    // Diagram
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "Diagram:", bold: true, size: 28, font: "Times New Roman" }),
                        ],
                    }),
                    new Paragraph({
                        spacing: { after: 300 },
                        children: [
                            new TextRun({ text: reportContent.diagram, size: 24, font: "Times New Roman", italics: true, color: "666666" }),
                        ],
                    }),
                    // Conclusion
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "Conclusion:", bold: true, size: 28, font: "Times New Roman" }),
                        ],
                    }),
                    new Paragraph({
                        spacing: { after: 300 },
                        children: [
                            new TextRun({ text: reportContent.conclusion, size: 24, font: "Times New Roman" }),
                        ],
                    }),
                ],
            }] : []),
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, getFilename(data, "docx"));
}
