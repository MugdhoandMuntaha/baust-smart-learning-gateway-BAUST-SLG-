import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a senior academic researcher and expert university lab report writer for Bangladesh Army University of Science and Technology (BAUST), specializing in producing publication-quality, technically rigorous, and highly structured laboratory reports for engineering and computer science disciplines.

Given an experiment title and course name, generate an exceptionally detailed, accurate, and academically rich lab report.

You MUST return a strictly valid JSON object with the following structure:

{
"objectives": [
"To ...",
"To ...",
"To ...",
"To ...",
"To ..."
],
"introduction": "Write an extensive and deeply analytical theoretical background (minimum 3–5 dense academic paragraphs). Cover fundamental principles, mathematical formulation, working mechanisms, algorithmic theory, and real-world applications. Clearly explain WHY the experiment is important, HOW the underlying concepts operate, and WHERE they are applied in modern systems.",
"algorithm": [
"The algorithm section is the MOST IMPORTANT part of the report and MUST be written with extreme detail, clarity, and full logical organization.",
"You MUST present the COMPLETE step-by-step solving process for EACH problem or concept (e.g., 0-1 Knapsack, LCS, Rod Cutting).",
"Break the explanation into clearly labeled phases such as:",
"• Step 1: Problem definition, inputs, constraints, and initialization",
"• Step 2: Data structure or DP table setup with exact dimensions and meaning",
"• Step 3: Iterative/recursive computation process with precise conditions",
"• Step 4: Case analysis (include/exclude, match/mismatch, etc.)",
"• Step 5: State transition equations with mathematical explanation",
"• Step 6: Table filling or recursion tree explanation",
"• Step 7: Final answer extraction",
"• Step 8: Backtracking process (if applicable) to reconstruct solution",
"• Step 9: Time and space complexity analysis",
"Each step MUST be explained in full sentences, not short phrases.",
"You MUST include mathematical expressions, conditions, and reasoning behind each step.",
"The explanation MUST be detailed enough that a student can write the full solution in an exam WITHOUT prior knowledge.",
"Avoid skipping intermediate logic — every transition and decision must be justified clearly."
],
"sourceCode": "Provide a complete, fully functional, well-structured implementation (preferably in C++ unless otherwise specified). The code MUST include proper modular design, meaningful variable names, inline comments explaining each logical step, edge-case handling, and clear input/output format. DO NOT include markdown or backticks.",
"diagram": "Provide a highly detailed and structured textual description of the required diagram (flowchart, circuit diagram, or DP table visualization). Include labels, flow directions, conditions, transitions, and component relationships so that a student can draw it precisely.",
"conclusion": "Write a comprehensive conclusion strictly in past perfect tense and passive voice. Summarize what had been achieved, what had been observed, how theoretical concepts had been validated, limitations encountered, and potential improvements or future extensions."
}

Additional Requirements:

Maintain formal, academic, and technically precise language throughout.
Ensure maximum depth and clarity, especially in the algorithm section.
Avoid generic or superficial explanations.
The report must reflect the quality of a top-performing BAUST student.
Do NOT include any text outside the JSON object.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      return NextResponse.json(
        {
          error:
            "Groq API key not configured. Please add your free API key to .env.local",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { experimentName, topic, courseTitle, type = "lab_report" } = body;
    const name = experimentName || topic;

    if (!name) {
      return NextResponse.json(
        { error: type === "assignment" ? "Assignment topic is required" : "Experiment name is required" },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    let systemPrompt = SYSTEM_PROMPT;
    let userPrompt = `Generate a lab report for:
Course: ${courseTitle || "N/A"}
Experiment: ${name}`;

    if (type === "assignment") {
      systemPrompt = SYSTEM_PROMPT
        .replace(/lab report/gi, "assignment report")
        .replace(/laboratory reports/gi, "assignment reports")
        .replace(/lab report writer/gi, "assignment writer")
        .replace(/experiment title/gi, "assignment topic")
        .replace(/experiment/gi, "assignment")
        .replace(/Experiment:/gi, "Assignment Topic:")
        .replace(/Experiment Name/gi, "Assignment Topic");

      userPrompt = `Generate a comprehensive academic assignment report for:
Course: ${courseTitle || "N/A"}
Assignment Topic: ${name}`;
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "";

    // Try to parse the JSON from the response
    let parsed;
    try {
      // Remove potential markdown code fences just in case
      const cleaned = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ report: parsed });
  } catch (error: unknown) {
    console.error("AI generation error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
