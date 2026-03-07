import { NextRequest, NextResponse } from "next/server";
import { verifyLiffToken } from "@/lib/auth/liff";
import {
  createLineSessionToken,
  LINE_SESSION_COOKIE_NAME,
  LINE_SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/session";

const REDIRECT_AFTER_LOGIN =
  process.env.NEXTAUTH_REDIRECT_AFTER_SIGNIN ?? "/";

export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ message: "token required" }, { status: 400 });
  }

  const profile = await verifyLiffToken(token);
  if (!profile) {
    console.error("[liff-session] LINE profile API rejected token or returned non-ok");
    return NextResponse.json(
      {
        message:
          "Invalid LINE token. ตรวจสอบว่า LIFF Endpoint URL ใน LINE Developers ตรงกับ URL ของหน้านี้ และ NEXTAUTH_SECRET ตั้งค่าแล้ว",
      },
      { status: 401 }
    );
  }

  try {
    const sessionToken = createLineSessionToken({
      userId: profile.userId,
      name: profile.displayName ?? null,
      picture: profile.pictureUrl ?? null,
    });

    const res = NextResponse.json({ ok: true, redirectUrl: REDIRECT_AFTER_LOGIN });
    res.cookies.set(LINE_SESSION_COOKIE_NAME, sessionToken, LINE_SESSION_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    console.error("[liff-session] Failed to create session:", err);
    return NextResponse.json(
      {
        message:
          "Failed to create session. ตรวจสอบว่า NEXTAUTH_SECRET ตั้งค่าใน environment แล้ว",
      },
      { status: 500 }
    );
  }
}
