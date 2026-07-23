"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { AssignmentFormData, ReportContent } from "./download";
import { createClient } from "@/lib/supabase/client";

const DEPT_MAP: Record<string, string> = {
  CSE: "Computer Science and Engineering (CSE)",
  EEE: "Electrical and Electronic Engineering (EEE)",
  CE: "Civil Engineering (CE)",
  ME: "Mechanical Engineering (ME)",
  TE: "Textile Engineering (TE)",
  IPE: "Industrial and Production Engineering (IPE)",
  BBA: "Business Administration (BBA)",
  Architecture: "Architecture",
};

const COURSE_PRESETS = [
  { courseNo: "CSE 2201", courseTitle: "Data Structures and Algorithm II" },
  { courseNo: "CSE 2202", courseTitle: "Data Structures and Algorithm II Sessional" },
  { courseNo: "CSE 2203", courseTitle: "Theory of Computation" },
  { courseNo: "CSE 2205", courseTitle: "Database Management Systems" },
  { courseNo: "CSE 2206", courseTitle: "Database Management Systems Sessional" },
  { courseNo: "EEE 2269", courseTitle: "Electrical Drives and Instrumentation" },
  { courseNo: "EEE 2270", courseTitle: "Electrical Drives and Instrumentation Sessional" },
  { courseNo: "HUM 2221", courseTitle: "History of the Emergence of Bangladesh" },
  { courseNo: "MATH 2247", courseTitle: "Laplace Transformation and Fourier Analysis" },
];

const TEACHER_PRESETS = [
  { name: "Md Atiq Shariar", designation: "Lecturer, Dept. of EEE, BAUST" },
  { name: "Roman Raihan", designation: "Lecturer, Dept. of CSE, BAUST" },
  { name: "Shifa Tasmiah Tisha", designation: "Lecturer, Dept. of CSE, BAUST" },
  { name: "AKZ Rasel Rahman", designation: "Lecturer, Dept. of CSE, BAUST" },
  { name: "Md. Osama", designation: "Lecturer, Dept. of CSE, BAUST" },
  { name: "S. M Golam Rifat", designation: "Lecturer, Dept. of CSE, BAUST" },
];

const INITIAL_FORM: AssignmentFormData = {
  department: "",
  courseTitle: "",
  courseNo: "",
  assignmentNo: "",
  assignmentTopic: "",
  studentName: "",
  studentId: "",
  level: "",
  term: "",
  submissionDate: "",
  teachers: [],
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

import Link from "next/link";

export default function GeneratorPage() {
  const [form, setForm] = useState<AssignmentFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState({ pdf: false, png: false, docx: false });
  const [aiLoading, setAiLoading] = useState(false);
  const [reportContent, setReportContent] = useState<ReportContent | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState<Array<{
    id: string; title: string; no: string; experiment_date: string | null; submission_date: string | null;
    courses: { name: string; code: string | null; teacher_name: string | null; teacher_designation: string | null } | null;
  }>>([]);
  const [dbTeachers, setDbTeachers] = useState<Array<{ id: string; full_name: string; designation: string; course_id?: string | null }>>([]);

  // Auto-fill from student profile + fetch templates + fetch teachers
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [profileRes, templatesRes, teachersRes] = await Promise.all([
        supabase
          .from("student_profiles")
          .select("full_name, student_id, department, level, term")
          .eq("id", user.id)
          .single(),
        supabase
          .from("generator_templates")
          .select("id, title, no, experiment_date, submission_date, courses(id, name, code, teacher_name, teacher_designation)")
          .eq("type", "assignment")
          .order("created_at", { ascending: false }),
        supabase
          .from("teachers")
          .select("id, full_name, designation, course_id")
          .order("full_name", { ascending: true }),
      ]);
      if (profileRes.data) {
        const data = profileRes.data;
        setForm((prev) => ({
          ...prev,
          studentName: data.full_name || prev.studentName,
          studentId: data.student_id || prev.studentId,
          department: DEPT_MAP[data.department] || data.department || prev.department,
          level: data.level || prev.level,
          term: data.term || prev.term,
        }));
      }
      if (templatesRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTemplates(templatesRes.data as any);
      }
      if (teachersRes.data) {
        setDbTeachers(teachersRes.data as any[]);
      }
    }
    loadData();
  }, []);

  const update = useCallback(
    (field: keyof Omit<AssignmentFormData, "teachers">, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateTeacher = useCallback(
    (index: number, field: "name" | "designation", value: string) => {
      setForm((prev) => {
        const teachers = [...prev.teachers];
        teachers[index] = { ...teachers[index], [field]: value };
        return { ...prev, teachers };
      });
    },
    []
  );

  const addTeacher = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      teachers: [...prev.teachers, { name: "", designation: "" }],
    }));
  }, []);

  const removeTeacher = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((_, i) => i !== index),
    }));
  }, []);

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setLoading((l) => ({ ...l, pdf: true }));
    try {
      const { downloadPDF } = await import("./download");
      await downloadPDF(previewRef.current, form);
    } catch (e) {
      console.error(e);
      alert("Error generating PDF.");
    }
    setLoading((l) => ({ ...l, pdf: false }));
  };

  const handleDownloadPNG = async () => {
    if (!previewRef.current) return;
    setLoading((l) => ({ ...l, png: true }));
    try {
      const { downloadPNG } = await import("./download");
      await downloadPNG(previewRef.current, form);
    } catch (e) {
      console.error(e);
      alert("Error generating PNG.");
    }
    setLoading((l) => ({ ...l, png: false }));
  };

  const handleDownloadDOCX = async () => {
    setLoading((l) => ({ ...l, docx: true }));
    try {
      const { downloadDOCX } = await import("./download");
      await downloadDOCX(form, reportContent);
    } catch (e) {
      console.error(e);
      alert("Error generating DOCX.");
    }
    setLoading((l) => ({ ...l, docx: false }));
  };

  const handleGenerateAI = async () => {
    if (!form.assignmentTopic.trim()) {
      alert("Please enter an Assignment Topic first.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experimentName: form.assignmentTopic,
          courseTitle: form.courseTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to generate assignment.");
      } else {
        setReportContent(data.report);
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Please try again.");
    }
    setAiLoading(false);
  };

  const updateReportField = (field: keyof ReportContent, value: string) => {
    setReportContent((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <>
      <main style={{ display: 'flex', gap: '2rem', padding: '2rem', alignItems: 'flex-start' }}>
        <section className="preview-panel" style={{ padding: 0 }}>
          <div className="preview-wrapper" style={{ padding: 0 }}>
            <div className="a4-page" id="assignmentPreview" ref={previewRef}>
              {/* University Name */}
              <div className="report-header">
                <h1 className="university-name">
                  Bangladesh Army University of Science and Technology (BAUST),
                  Saidpur
                </h1>
              </div>

              {/* Logo */}
              <div className="logo-section flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/baust-logo.png"
                  alt="BAUST Logo"
                  width={110}
                  height={110}
                  className="university-logo"
                />
              </div>

              {/* Assignment Title */}
              <div className="report-title-section">
                <h2 className="report-type">Assignment</h2>
              </div>

              {/* Course Info Table */}
              <div className="report-course-info">
                <table className="info-table">
                  <tbody>
                    <tr>
                      <td className="label-cell">
                        <b><i>Department</i></b>
                      </td>
                      <td className="separator-cell"><b>:</b></td>
                      <td className="value-cell">{form.department}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">
                        <b><i>Course Title</i></b>
                      </td>
                      <td className="separator-cell"><b>:</b></td>
                      <td className="value-cell">{form.courseTitle}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">
                        <b><i>Course No</i></b>
                      </td>
                      <td className="separator-cell"><b>:</b></td>
                      <td className="value-cell">{form.courseNo}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">
                        <b><i>Assignment No</i></b>
                      </td>
                      <td className="separator-cell"><b>:</b></td>
                      <td className="value-cell">{form.assignmentNo}</td>
                    </tr>
                    <tr>
                      <td className="label-cell">
                        <b><i>Assignment Topic</i></b>
                      </td>
                      <td className="separator-cell"><b>:</b></td>
                      <td className="value-cell">{form.assignmentTopic}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Comments */}
              <div className="report-comments">
                <p className="comments-label">
                  <b><i>Comments:</i></b>
                </p>
                <div className="comments-box" />
              </div>

              {/* Submitted By / Submitted To */}
              <div className="report-submission">
                <div className="submission-label-row">
                  <span className="submission-label">
                    <b><i>Submitted By</i></b>
                  </span>
                  <span className="submission-label">
                    <b><i>Submitted To</i></b>
                  </span>
                </div>
                <div className="submission-boxes">
                  {/* Submitted By Box */}
                  <div className="submission-box">
                    <p>
                      <b><i>Name:</i></b> {form.studentName}
                    </p>
                    <p>
                      <b><i>Id:</i></b> {form.studentId}
                    </p>
                    <p className="level-term-line">
                      <span>
                        <b><i>Level:</i></b> {form.level}
                      </span>
                      <span>
                        <b><i>Term:</i></b> {form.term}
                      </span>
                    </p>
                    <p>
                      <b><i>Date of submission:</i></b>{" "}
                      {formatDate(form.submissionDate)}
                    </p>
                  </div>

                  {/* Submitted To Box */}
                  <div className="submission-box submitted-to-box">
                    <div className="teachers-container">
                      {form.teachers.map((teacher, i) => (
                        <div key={i}>
                          <div className="teacher-preview-entry">
                            <p>
                              <b><i>Name of the Teacher:</i></b>
                            </p>
                            <p className="teacher-value">{teacher.name}</p>
                            <p>
                              <b><i>Designation:</i></b>
                            </p>
                            <p className="teacher-value">
                              {teacher.designation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="signature-line">
                      <b><i>Signature:</i></b>{" "}
                      .............................................
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right side form panel */}
        <aside style={{ flexGrow: 1, minWidth: '300px', maxWidth: '400px', position: 'sticky', top: '2rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 4rem)' }}>
            
            <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Assignment Settings</h3>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Template Selector */}
              {templates.length > 0 && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#15803d' }}>⚡ Quick Fill from Template</label>
                  <select
                    onChange={(e) => {
                      const t = templates.find(t => t.id === e.target.value);
                      if (!t) return;
                      // Supabase may return courses as object or array depending on version
                      const course = Array.isArray(t.courses) ? t.courses[0] : t.courses;
                      
                      // Map the teachers associated with this course from the teachers table
                      const courseTeachers = course
                        ? dbTeachers.filter(teacher => teacher.course_id === (course as any).id)
                        : [];

                      setForm(prev => ({
                        ...prev,
                        courseTitle: course?.name || '',
                        courseNo: course?.code || '',
                        assignmentNo: t.no,
                        assignmentTopic: t.title,
                        submissionDate: t.submission_date || '',
                        teachers: courseTeachers.length > 0
                          ? courseTeachers.map(ct => ({ name: ct.full_name, designation: ct.designation }))
                          : (course?.teacher_name
                            ? [{ name: course.teacher_name, designation: course.teacher_designation || '' }]
                            : prev.teachers),
                      }));
                      e.target.value = '';
                    }}
                    defaultValue=""
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.875rem', background: '#fff', color: '#374151' }}
                  >
                    <option value="" disabled>Select a template...</option>
                    {templates.map(t => {
                      const c = Array.isArray(t.courses) ? t.courses[0] : t.courses;
                      return (
                        <option key={t.id} value={t.id}>
                          #{t.no} — {t.title} ({c?.code || 'N/A'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Course Title</label>
                <input type="text" value={form.courseTitle} onChange={e => setForm({...form, courseTitle: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }} placeholder="e.g. Data Structures and Algorithm II" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Course No</label>
                <input type="text" value={form.courseNo} onChange={e => setForm({...form, courseNo: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }} placeholder="e.g. CSE 2201" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Assignment No</label>
                <input type="text" value={form.assignmentNo} onChange={e => setForm({...form, assignmentNo: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }} placeholder="e.g. 01" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Assignment Topic</label>
                <input type="text" value={form.assignmentTopic} onChange={e => setForm({...form, assignmentTopic: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }} placeholder="e.g. Applications of Stack and Queue" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Submission Date</label>
                <input type="date" value={form.submissionDate} onChange={e => setForm({...form, submissionDate: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', color: '#374151' }} />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Teachers</h4>
                  <button 
                    onClick={() => setForm({...form, teachers: [...form.teachers, { name: '', designation: '' }]})}
                    style={{ fontSize: '0.75rem', fontWeight: 500, color: '#4f46e5', background: '#e0e7ff', padding: '0.25rem 0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                  >
                    + Add Teacher
                  </button>
                </div>
                
                {form.teachers.map((teacher, i) => (
                  <div key={i} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1rem', position: 'relative' }}>
                    {form.teachers.length > 1 && (
                      <button 
                        onClick={() => {
                          const newTeachers = [...form.teachers];
                          newTeachers.splice(i, 1);
                          setForm({...form, teachers: newTeachers});
                        }}
                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
                        title="Remove teacher"
                      >
                        &times;
                      </button>
                    )}
                    {dbTeachers.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Select Teacher Profile</label>
                        <select
                          onChange={(e) => {
                            const matched = dbTeachers.find(t => t.id === e.target.value);
                            if (matched) {
                              const newTeachers = [...form.teachers];
                              newTeachers[i] = { name: matched.full_name, designation: matched.designation };
                              setForm({...form, teachers: newTeachers});
                            }
                            e.target.value = '';
                          }}
                          defaultValue=""
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', background: '#fff', color: '#374151' }}
                        >
                          <option value="" disabled>Choose existing teacher...</option>
                          {dbTeachers.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name} ({t.designation})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Teacher Name</label>
                      <input type="text" value={teacher.name} onChange={e => {
                        const newTeachers = [...form.teachers];
                        newTeachers[i].name = e.target.value;
                        setForm({...form, teachers: newTeachers});
                      }} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }} placeholder="Teacher Name" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Teacher Designation</label>
                      <input type="text" value={teacher.designation} onChange={e => {
                        const newTeachers = [...form.teachers];
                        newTeachers[i].designation = e.target.value;
                        setForm({...form, teachers: newTeachers});
                      }} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }} placeholder="e.g. Lecturer, Dept. of CSE" />
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid #f3f4f6', background: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button
                className={`btn btn-pdf${loading.pdf ? " loading" : ""}`}
                onClick={handleDownloadPDF}
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '8px'
                }}
              >
                <span className="btn-icon">📕</span>
                {loading.pdf ? "Generating..." : "Download PDF"}
              </button>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}
