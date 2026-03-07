import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getPresignedGetUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const keysParam = searchParams.get("keys");
  if (!keysParam?.trim()) {
    return NextResponse.json(
      { message: "Missing keys (comma-separated)" },
      { status: 400 }
    );
  }
  const keys = keysParam.split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    return NextResponse.json({ urls: [] });
  }
  const urls = await Promise.all(keys.map((key) => getPresignedGetUrl(key)));
  return NextResponse.json({
    urls: urls.map((u) => u ?? null),
  });
}
