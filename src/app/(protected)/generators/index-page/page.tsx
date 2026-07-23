"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import type { IndexFormData, ExperimentEntry, TeacherEntry } from "./download";
import { createClient } from "@/lib/supabase/client";

const TEACHER_PRESETS = [
  { name: "Md Atiq Shariar", designation: "Lecturer, EEE (Baust)" },
  { name: "Roman Raihan", designation: "Lecturer, Dept. of CSE, BAUST" },
  { name: "Shifa Tasmiah Tisha", designation: "Lecturer, Dept. of CSE, BAUST" },
  { name: "AKZ Rasel Rahman", designation: "Lecturer, Dept. of CSE, BAUST" },
  { name: "Md. Osama", designation: "Lecturer, Dept. of CSE, BAUST" },
  { name: "S. M Golam Rifat", designation: "Lecturer, Dept. of CSE, BAUST" },
];

const INITIAL_FORM: IndexFormData = {
  studentName: "",
  studentId: "",
  level: "",
  term: "",
  section: "",
  dateOfSubmission: "",
  teachers: [],
  experiments: [
    { no: "", name: "", experimentDate: "", submissionDate: "", mark: "" },
    { no: "", name: "", experimentDate: "", submissionDate: "", mark: "" },
    { no: "", name: "", experimentDate: "", submissionDate: "", mark: "" },
    { no: "", name: "", experimentDate: "", submissionDate: "", mark: "" },
    { no: "", name: "", experimentDate: "", submissionDate: "", mark: "" },
  ],
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export default function IndexGeneratorPage() {
  const [form, setForm] = useState<IndexFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState({ pdf: false, png: false, docx: false });
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-fill from student profile
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("student_profiles")
        .select("full_name, student_id, section, level, term")
        .eq("id", user.id)
        .single();
      if (data) {
        setForm((prev) => ({
          ...prev,
          studentName: data.full_name || prev.studentName,
          studentId: data.student_id || prev.studentId,
          section: data.section || prev.section,
          level: data.level || prev.level,
          term: data.term || prev.term,
        }));
      }
    }
    loadProfile();
  }, []);

  const update = useCallback(
    (field: keyof Omit<IndexFormData, "experiments" | "teachers">, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateTeacher = useCallback(
    (index: number, field: keyof TeacherEntry, value: string) => {
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

  const updateExperiment = useCallback(
    (index: number, field: keyof ExperimentEntry, value: string) => {
      setForm((prev) => {
        const experiments = [...prev.experiments];
        experiments[index] = { ...experiments[index], [field]: value };
        return { ...prev, experiments };
      });
    },
    []
  );

  const addExperiment = useCallback(() => {
    setForm((prev) => {
      const nextNo = String(prev.experiments.length + 1).padStart(2, "0");
      return {
        ...prev,
        experiments: [
          ...prev.experiments,
          { no: nextNo, name: "", experimentDate: "", submissionDate: "", mark: "" },
        ],
      };
    });
  }, []);

  const removeExperiment = useCallback((index: number) => {
    setForm((prev) => {
      const experiments = prev.experiments
        .filter((_, i) => i !== index)
        .map((exp, i) => ({
          ...exp,
          no: String(i + 1).padStart(2, "0"),
        }));
      return { ...prev, experiments };
    });
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

  return (
    <>
      <main style={{ display: 'flex', gap: '2rem', padding: '2rem', alignItems: 'flex-start' }}>
        <section className="preview-panel" style={{ padding: 0 }}>
          <div className="preview-wrapper" style={{ padding: 0 }}>
            <div className="a4-page index-page" id="reportPreview" ref={previewRef}>
              
              <div className="index-watermark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/baust-logo.png" alt="Watermark" />
              </div>

              {/* Logo */}
              <div className="logo-section flex justify-center" style={{ marginBottom: '5px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/baust-logo.png"
                  alt="BAUST Logo"
                  width={80}
                  height={80}
                  className="university-logo"
                />
              </div>
              
              {/* University Name */}
              <div className="report-header" style={{ marginBottom: '10px' }}>
                <h1 className="university-name" style={{ fontSize: '20px', fontWeight: 'normal', fontFamily: 'Times New Roman' }}>
                  Bangladesh Army University of Science<br/>and Technology (baust), Saidpur
                </h1>
              </div>

              {/* Lab Report Index Title */}
              <div className="report-title-section" style={{ marginBottom: '10px' }}>
                <h2 className="report-type" style={{ fontSize: '16px', fontWeight: 'normal' }}>Lab Report Index</h2>
              </div>

              {/* Index Table */}
              <div className="index-table-container">
                <table className="index-table">
                  <thead>
                    <tr>
                      <th style={{ width: '12%' }}>Experiment<br/>no.</th>
                      <th style={{ width: '43%' }}>Experiment name</th>
                      <th style={{ width: '15%' }}>Experiment<br/>date</th>
                      <th style={{ width: '15%' }}>Submission<br/>date</th>
                      <th style={{ width: '15%' }}>Mark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.experiments.map((exp, i) => (
                      <tr key={i}>
                        <td style={{ textAlign: 'center' }}>{exp.no}</td>
                        <td style={{ textAlign: 'center' }}>{exp.name}</td>
                        <td style={{ textAlign: 'center' }}>{formatDate(exp.experimentDate)}</td>
                        <td style={{ textAlign: 'center' }}>{formatDate(exp.submissionDate)}</td>
                        <td>{exp.mark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Submitted By / Submitted To */}
              <div className="report-submission index-submission">
                <div className="submission-label-row">
                  <span className="submission-label" style={{ textAlign: 'left', paddingLeft: '50px' }}>
                    <span style={{ fontSize: '18px' }}>Submitted By:</span>
                  </span>
                  <span className="submission-label" style={{ textAlign: 'left', paddingLeft: '50px' }}>
                    <span style={{ fontSize: '18px' }}>Submitted To:</span>
                  </span>
                </div>
                <div className="submission-boxes">
                  {/* Submitted By Box */}
                  <div className="submission-box">
                    <p>
                      <b>Name:</b> {form.studentName}
                    </p>
                    <p>
                      <b>Roll:</b> {form.studentId}
                    </p>
                    <p>
                      <b>Level:</b> {form.level}, <b>Term:</b> {form.term}, <b>Section:</b> {form.section}
                    </p>
                    <p>
                      <b>Date of Submission:</b> {formatDate(form.dateOfSubmission)}
                    </p>
                  </div>

                  {/* Submitted To Box */}
                  <div className="submission-box submitted-to-box">
                    <div className="teachers-container">
                      {form.teachers.map((teacher, i) => (
                        <div key={i} className="teacher-preview-entry">
                          <p>
                            <b>Name of Teacher:</b><br/>
                            <span style={{ display: 'inline-block', marginLeft: '15px' }}>• {teacher.name}</span>
                          </p>
                          <p>
                            <b>Designation:</b><br/>
                            <span style={{ display: 'inline-block', marginLeft: '15px' }}>• {teacher.designation}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="signature-line" style={{ marginTop: '10px', fontWeight: 'bold' }}>
                      Signature:...............................................
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>Index Settings</h3>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Date of Submission</label>
                <input type="date" value={form.dateOfSubmission} onChange={e => setForm({...form, dateOfSubmission: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', color: '#374151' }} />
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

              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Experiments</h4>
                {form.experiments.map((exp, i) => (
                  <div key={i} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>No.</label>
                        <input type="text" value={exp.no} onChange={e => {
                          const newExps = [...form.experiments];
                          newExps[i].no = e.target.value;
                          setForm({...form, experiments: newExps});
                        }} style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.75rem' }} />
                      </div>
                      <div style={{ flex: 3 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Name</label>
                        <input type="text" value={exp.name} onChange={e => {
                          const newExps = [...form.experiments];
                          newExps[i].name = e.target.value;
                          setForm({...form, experiments: newExps});
                        }} style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.75rem' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Date</label>
                        <input type="date" value={exp.experimentDate} onChange={e => {
                          const newExps = [...form.experiments];
                          newExps[i].experimentDate = e.target.value;
                          setForm({...form, experiments: newExps});
                        }} style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.75rem', color: '#374151' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem', color: '#374151' }}>Submission</label>
                        <input type="date" value={exp.submissionDate} onChange={e => {
                          const newExps = [...form.experiments];
                          newExps[i].submissionDate = e.target.value;
                          setForm({...form, experiments: newExps});
                        }} style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.75rem', color: '#374151' }} />
                      </div>
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
