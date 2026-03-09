import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";
import { requireAdmin } from "@/lib/auth/require-admin";
import { DISTRICTS } from "@/lib/districts";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const districtsFromLocation = await BlogPost.aggregate<{ districts: string[] }>([
      { $match: { location: { $exists: true, $ne: null, $type: "string" } } },
      { $project: { parts: { $split: ["$location", ", "] } } },
      { $unwind: "$parts" },
      { $project: { part: { $trim: { input: "$parts" } } } },
      { $match: { part: { $in: [...DISTRICTS] } } },
      { $group: { _id: null, districts: { $addToSet: "$part" } } },
    ]).exec();
    const locationDistricts = districtsFromLocation[0]?.districts ?? [];

    const [distinctDistricts, developers] = await Promise.all([
      BlogPost.distinct("district").then((arr) =>
        (arr as string[]).filter((v) => v != null && String(v).trim() !== "")
      ),
      BlogPost.distinct("developer").then((arr) =>
        (arr as string[]).filter((v) => v != null && String(v).trim() !== "").sort()
      ),
    ]);
    const districtSet = new Set([...distinctDistricts, ...locationDistricts]);
    const districts = DISTRICTS.filter((d) => districtSet.has(d));
    return NextResponse.json({ districts, developers });
  } catch (err) {
    console.error("[GET /api/admin/blog/filters]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load filters" },
      { status: 500 }
    );
  }
}
