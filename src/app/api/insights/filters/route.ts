import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";

const PUBLISHED_FILTER = { type: "project_review" as const, status: "published" as const };

export async function GET() {
  try {
    await connectDB();
    const [locations, developers] = await Promise.all([
      BlogPost.distinct("location", PUBLISHED_FILTER).then((arr) =>
        (arr as string[]).filter((v) => v != null && String(v).trim() !== "").sort()
      ),
      BlogPost.distinct("developer", PUBLISHED_FILTER).then((arr) =>
        (arr as string[]).filter((v) => v != null && String(v).trim() !== "").sort()
      ),
    ]);
    return NextResponse.json({ locations, developers });
  } catch (err) {
    console.error("[GET /api/insights/filters]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load filters" },
      { status: 500 }
    );
  }
}
