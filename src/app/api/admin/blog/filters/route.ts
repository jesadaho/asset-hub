import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const [locations, developers] = await Promise.all([
      BlogPost.distinct("location").then((arr) =>
        (arr as string[]).filter((v) => v != null && String(v).trim() !== "").sort()
      ),
      BlogPost.distinct("developer").then((arr) =>
        (arr as string[]).filter((v) => v != null && String(v).trim() !== "").sort()
      ),
    ]);
    return NextResponse.json({ locations, developers });
  } catch (err) {
    console.error("[GET /api/admin/blog/filters]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load filters" },
      { status: 500 }
    );
  }
}
