import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug?.trim()) {
    return NextResponse.json({ message: "Slug required" }, { status: 400 });
  }

  try {
    await connectDB();
    // ใช้ collection.updateOne เพื่อไม่ให้ Mongoose ปัด updatedAt (timestamps)
    const result = await BlogPost.collection.updateOne(
      {
        slug: slug.trim(),
        type: "project_review",
        status: "published",
      },
      { $inc: { viewCount: 1 } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[POST /api/insights/[slug]/view]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to record view" },
      { status: 500 }
    );
  }
}
