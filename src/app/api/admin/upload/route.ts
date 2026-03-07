import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { uploadToS3, getPresignedGetUrl } from "@/lib/s3";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) {
    return NextResponse.json(
      { message: "S3 bucket not configured" },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") ?? formData.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { message: "Missing file (use field 'file' or 'image')" },
      { status: 400 }
    );
  }

  const ext = file.name.replace(/^.*\./, "") || "jpg";
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 80);
  const key = `blog/draft/${randomUUID()}/${safeName}`;

  const bytes = await file.arrayBuffer();
  const contentType = file.type || "image/jpeg";
  const ok = await uploadToS3(key, new Uint8Array(bytes), contentType);
  if (!ok) {
    return NextResponse.json(
      { message: "Upload failed" },
      { status: 500 }
    );
  }
  const url = await getPresignedGetUrl(key);
  return NextResponse.json({ key, url: url ?? undefined });
}
