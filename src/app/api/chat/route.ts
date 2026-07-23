import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      return NextResponse.json(
        {
          error: "Groq API key not configured. Please add your free API key to .env.local",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Check for Authorization header (useful for Native WebViews with restricted cookie policies)
    const authHeader = request.headers.get("Authorization");
    let token: string | undefined = undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Verify session using token if available, otherwise falling back to cookies
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile details
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const { level, term, section, full_name: studentName } = profile;

    // Load courses matching the student's level, term, and section
    const { data: courses } = await supabase
      .from("courses")
      .select("*")
      .eq("level", level)
      .eq("term", term)
      .eq("section", section);

    // Load teachers with allocated courses
    const { data: teachers } = await supabase
      .from("teachers")
      .select("id, full_name, designation, phone_number, email, avatar_url, courses(id, name, code, level, term, section)")
      .order("full_name", { ascending: true });

    // Filter teachers in-memory to only include those relevant to the student's batch/section
    const activeTeachers = (teachers || []).filter((t: any) => {
      const coursesArray = Array.isArray(t.courses) ? t.courses : (t.courses ? [t.courses] : []);
      if (coursesArray.length === 0) return true; // Include general / sessional teachers
      return coursesArray.some((c: any) => c.level === level && c.term === term && c.section === section);
    });

    const courseNames = courses?.map((c) => c.name) || [];

    // Load documents matching those courses (Strictly matching current Level & Term)
    let documents: any[] = [];
    if (courseNames.length > 0) {
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .select("*")
        .in("course_name", courseNames)
        .order("upload_date", { ascending: false });
      
      if (!docError && docData) {
        documents = docData;
      }
    }

    // Load deadlines for the batch
    const { data: deadlines } = await supabase
      .from("deadlines")
      .select("*")
      .eq("level", level)
      .eq("term", term)
      .eq("section", section)
      .order("due_date", { ascending: true });

    // Load notices for the batch
    const { data: notices } = await supabase
      .from("notices")
      .select("*")
      .eq("level", level)
      .eq("term", term)
      .eq("section", section)
      .order("created_at", { ascending: false });

    // Load readymade generator templates (limit 10)
    const { data: generatorTemplates } = await supabase
      .from("generator_templates")
      .select("id, title, no, created_at, courses!inner(id, name, code, level, term, section)")
      .eq("type", "lab_report")
      .eq("courses.level", level)
      .eq("courses.term", term)
      .eq("courses.section", section)
      .order("created_at", { ascending: false });

    const body = await request.json();
    const { messages, message } = body;

    const groq = new Groq({ apiKey });

    // Build the database context string
    const contextInfo = {
      student: { name: studentName, level, term, section },
      courses: courses || [],
      teachers: activeTeachers || [],
      documents: documents || [],
      deadlines: deadlines || [],
      notices: notices || [],
      generatorTemplates: generatorTemplates || [],
    };

    const systemPrompt = `You are a helpful, highly intelligent, and friendly AI Academic Assistant for the BAUST Smart Learning Gateway (BAUST SLG).
Your purpose is to answer student questions regarding deadlines, notices, document files, class courses, and teachers.

Here is the database snapshot of the student's batch:
- Level: ${level}
- Term: ${term}
- Section: ${section}

=== ALLOCATED COURSE TEACHERS DIRECTORY ===
${JSON.stringify(contextInfo.teachers, null, 2)}

=== ACTIVE COURSES ===
${JSON.stringify(contextInfo.courses, null, 2)}

=== READYMADE LAB REPORT COVER PAGES ===
${JSON.stringify(contextInfo.generatorTemplates, null, 2)}

=== DOCUMENTS & FILES IN VAULT ===
${JSON.stringify(contextInfo.documents, null, 2)}

=== ACTIVE DEADLINES ===
${JSON.stringify(contextInfo.deadlines, null, 2)}

=== NOTICES ===
${JSON.stringify(contextInfo.notices, null, 2)}

=== INSTRUCTIONS & RULES ===
1. LANGUAGE SUPPORT: You must support Bangla (বাংলা), English, and Banglish (e.g. "amader next assignment deadline kobe?"). Always respond in the same language or blend of languages (Banglish/Bangla/English) that the student used to ask the question.
2. ANSWERING RULES:
   - Provide highly accurate answers based on the database snapshot above.
   - DOCUMENTS/NOTES SEARCH INSTRUCTIONS:
     - Search and match documents fluently by evaluating course names (e.g. "Software Engineering"), course codes, file names, file formats, and common synonyms (e.g. "slide", "slides", "notes", "lecture notes", "handout", "manual", "book").
     - Resolve course acronyms intelligently (e.g., matching "SE" or "se" to "Software Engineering", "DBMS" to "Database Management System", "SP" to "Structured Programming", "OS" to "Operating System").
     - When files are found, present them in a clean Markdown table with the following columns: **Course**, **File Name**, **Upload Date**, and **Download/Preview Link** formatted exactly as: "[Open / Download](document.file_path)".
     - If a user asks for a specific topic/note that isn't present in the vault but other files exist for that course, do not say "Not found". Instead, display the other files available for that course with a friendly note: "I couldn't find a note specifically named 'X', but I found these other resources for Course Y in the vault:".
   - If they ask about deadlines, list the deadline title, course name, category, and date clearly. Highlight if it's very close or urgent.
   - If they ask about class routines or teachers, look up the teacher's contact details (phone, email) or course name and return it.
   - If they ask for the latest labreport cover page, or a coverpage PDF, or download a readymade cover page:
     - Look up the latest template in the "READYMADE LAB REPORT COVER PAGES" snapshot above.
     - Respond by providing the title of the latest template and formatting the link exactly like: "[Download PDF Coverpage](/generators/lab-report?templateId=[TEMPLATE_ID]&autoDownload=true)".
3. DATA SAFEGUARDS:
   - If a file, notice, or deadline does not exist in the snapshot and no related fallback resources can be recommended, politely state that you could not find it in the portal records. Never hallucinate or make up fake document links or dates.
4. FORMATTING: Use Markdown (bold text, lists, and tables) for readability. Keep responses clean and concise.`;

    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.role === "model" ? "assistant" : m.role,
      content: m.content,
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedMessages,
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("AI assistant endpoint error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
