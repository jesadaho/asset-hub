import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAdmin } from "@/lib/auth/require-admin";

const GEMINI_SYSTEM_PROMPT = `Role: You are an expert Real Estate Data Analyst in Thailand specializing in Property Technology (PropTech). Your task is to extract and analyze data for a specific property project to support investment decisions.

Task: Given a "Project Name", research and provide a structured JSON response containing accurate, data-driven insights. Use the latest market data available up to 2026.

Data Requirements:
Accuracy: Use real market averages for Yield and Capital Gain in that specific neighborhood.
Tone: Professional, objective, and investor-focused.
Format: Output MUST be a strictly valid JSON object. Do not wrap in markdown code blocks. Output only the raw JSON.

JSON Schema:
{
  "project_basics": {
    "developer": "string",
    "completion_year": "number",
    "distance_to_transit": "string (e.g., '350m from BTS On Nut')",
    "total_units": "number"
  },
  "financial_insights": {
    "avg_rental_yield_pct": "number (e.g., 5.2)",
    "capital_gain_3yr_pct": "number",
    "avg_rent_per_sqm": "number",
    "market_price_per_sqm": "number"
  },
  "liquidity_score": {
    "occupancy_rate_pct": "number",
    "demand_level": "string (High/Medium/Low)",
    "avg_days_on_market": "number"
  },
  "operational_data": {
    "common_fee_per_sqm": "number",
    "parking_ratio_pct": "number",
    "management_sentiment": "string (1-5 scale summary)"
  },
  "summary_pros_cons": {
    "pros": ["string"],
    "cons": ["string"]
  }
}`;

function stripMarkdownJsonBlock(text: string): string {
  let s = text.trim();
  const codeBlockMatch = s.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (codeBlockMatch) s = codeBlockMatch[1].trim();
  return s;
}

function hasRequiredShape(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.project_basics === "object" &&
    typeof o.financial_insights === "object" &&
    typeof o.liquidity_score === "object" &&
    typeof o.operational_data === "object" &&
    typeof o.summary_pros_cons === "object"
  );
}

/** Parse retry delay (seconds) from 429 error message. Returns ms for setTimeout, or default 33s. */
function parseRetryAfterMs(message: string): number {
  const match =
    message.match(/retry in ([\d.]+)s/i) ||
    message.match(/retryDelay["\s:]+(\d+)s/i);
  if (match) {
    const sec = parseFloat(match[1]);
    if (Number.isFinite(sec) && sec > 0) {
      return Math.min(Math.ceil(sec) * 1000, 120_000);
    }
  }
  return 33_000;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { message: "GEMINI_API_KEY not configured" },
      { status: 503 }
    );
  }

  let body: { projectName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const projectName = typeof body.projectName === "string" ? body.projectName.trim() : "";
  if (!projectName) {
    return NextResponse.json(
      { message: "projectName is required" },
      { status: 400 }
    );
  }

  const genAI = new GoogleGenerativeAI(key);
  const modelId = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const model = genAI.getGenerativeModel({ model: modelId });

  const runGemini = async () =>
    model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `Project Name: ${projectName}` }],
        },
      ],
      systemInstruction: GEMINI_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

  let result: Awaited<ReturnType<typeof runGemini>>;
  try {
    result = await runGemini();
  } catch (firstErr) {
    const msg = firstErr instanceof Error ? firstErr.message : "";
    const isRateLimit =
      msg.includes("429") ||
      msg.includes("Too Many Requests") ||
      msg.includes("quota");
    if (isRateLimit) {
      const delayMs = parseRetryAfterMs(msg);
      await new Promise((r) => setTimeout(r, delayMs));
      try {
        result = await runGemini();
      } catch (retryErr) {
        console.error("[POST /api/admin/ai/project-data] retry failed", retryErr);
        return NextResponse.json(
          {
            message:
              "โควต้า Gemini เต็มหรือเกินกำหนด กรุณารอสักครู่ (ประมาณ 30 วินาที) แล้วลองใหม่ หรือตรวจสอบแผนและ billing ที่ Google AI Studio",
          },
          { status: 429 }
        );
      }
    } else {
      throw firstErr;
    }
  }

  try {
    const response = result.response;
    if (!response || !response.text) {
      return NextResponse.json(
        { message: "No response from Gemini" },
        { status: 502 }
      );
    }

    let raw = response.text().trim();
    raw = stripMarkdownJsonBlock(raw);

    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON from Gemini" },
        { status: 502 }
      );
    }

    if (!hasRequiredShape(data)) {
      return NextResponse.json(
        { message: "Response missing required schema keys" },
        { status: 502 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[POST /api/admin/ai/project-data]", err);
    const msg = err instanceof Error ? err.message : "";
    const isRateLimit =
      msg.includes("429") ||
      msg.includes("Too Many Requests") ||
      msg.includes("quota");
    if (isRateLimit) {
      return NextResponse.json(
        {
          message:
            "โควต้า Gemini เต็มหรือเกินกำหนด กรุณารอสักครู่แล้วลองใหม่ หรือตรวจสอบแผนและ billing ที่ Google AI Studio",
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { message: msg || "AI request failed" },
      { status: 502 }
    );
  }
}
