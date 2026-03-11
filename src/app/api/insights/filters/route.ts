import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { BlogPost } from "@/lib/db/models/blog";
import { DISTRICTS } from "@/lib/districts";
import { get, set } from "@/lib/cache/redis";

const INSIGHTS_FILTERS_CACHE_KEY = "insights:filters";
const INSIGHTS_FILTERS_TTL = 300;

const PUBLISHED_FILTER = { type: "project_review" as const, status: "published" as const };

export async function GET() {
  const cached = await get(INSIGHTS_FILTERS_CACHE_KEY);
  if (cached) {
    try {
      return NextResponse.json(JSON.parse(cached) as { districts: string[]; developers: string[] });
    } catch {
      // invalid cache, fall through
    }
  }

  try {
    await connectDB();
    const districtsFromLocation = await BlogPost.aggregate<{ districts: string[] }>([
      { $match: { ...PUBLISHED_FILTER, location: { $exists: true, $ne: null, $type: "string" } } },
      { $project: { parts: { $split: ["$location", ", "] } } },
      { $unwind: "$parts" },
      { $project: { part: { $trim: { input: "$parts" } } } },
      { $match: { part: { $in: [...DISTRICTS] } } },
      { $group: { _id: null, districts: { $addToSet: "$part" } } },
    ]).exec();
    const locationDistricts = districtsFromLocation[0]?.districts ?? [];

    const [distinctDistricts, developers] = await Promise.all([
      BlogPost.distinct("district", PUBLISHED_FILTER).then((arr) =>
        (arr as string[]).filter((v) => v != null && String(v).trim() !== "")
      ),
      BlogPost.distinct("developer", PUBLISHED_FILTER).then((arr) =>
        (arr as string[]).filter((v) => v != null && String(v).trim() !== "").sort()
      ),
    ]);
    const districtSet = new Set([...distinctDistricts, ...locationDistricts]);
    const districts = DISTRICTS.filter((d) => districtSet.has(d));
    const body = { districts, developers };
    await set(INSIGHTS_FILTERS_CACHE_KEY, JSON.stringify(body), INSIGHTS_FILTERS_TTL);
    return NextResponse.json(body);
  } catch (err) {
    console.error("[GET /api/insights/filters]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load filters" },
      { status: 500 }
    );
  }
}
