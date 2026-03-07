import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  try {
    await connectDB();
    const [users, totalCount] = await Promise.all([
      User.find().sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name ?? null,
        image: u.image ?? null,
        provider: u.provider,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      totalCount,
      totalPages,
      page,
    });
  } catch (err) {
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load users" },
      { status: 500 }
    );
  }
}
