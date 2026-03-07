import { NextResponse } from "next/server";
import { LINE_SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LINE_SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
