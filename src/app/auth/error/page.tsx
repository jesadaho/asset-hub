"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const PRIMARY = "#068e7b";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = (searchParams.get("error") ?? "").trim();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  const isWrongPort =
    error.includes("3000") ||
    callbackUrl.includes("localhost:3000") ||
    error === "Callback" ||
    error === "Configuration";

  const isGenericOrUndefined = !error || error === "undefined";

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">เกิดข้อผิดพลาดในการลงชื่อเข้าใช้</h1>
      <p className="mt-2 text-sm text-slate-600">
        {error && error !== "undefined" && (
          <>
            <span className="font-medium">Error:</span> {error}
            {callbackUrl && ` · Callback: ${callbackUrl}`}
          </>
        )}
        {isGenericOrUndefined && (
          <>มักเกิดจาก NEXTAUTH_URL หรือ Callback URL ใน LINE Developers ไม่ตรงกับพอร์ตที่เปิดแอป</>
        )}
      </p>
      {(isWrongPort || isGenericOrUndefined) && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">แก้ไข: ตั้งค่า NEXTAUTH_URL ให้ตรงกับพอร์ตที่เปิดแอป</p>
          <p className="mt-1 text-amber-800">
            แอปนี้รันบนพอร์ต <strong>3001</strong> → ในไฟล์ <code className="rounded bg-amber-100 px-1">.env.local</code> ตั้งค่า
          </p>
          <pre className="mt-2 overflow-x-auto rounded bg-slate-800 p-2 text-xs text-slate-100">
            NEXTAUTH_URL=http://localhost:3001
          </pre>
          <p className="mt-2 text-amber-800">
            สำหรับ LINE (LIFF): LINE บังคับ HTTPS → ใช้ tunnel เช่น ngrok (
            <code className="rounded bg-amber-100 px-1">ngrok http 3001</code>
            ) แล้วตั้ง Endpoint URL เป็น https://xxx.ngrok-free.app/sign-in/line
          </p>
        </div>
      )}
      <div className="mt-6 flex gap-3">
        <Link
          href="/sign-in"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          style={{ backgroundColor: PRIMARY }}
        >
          กลับไปลงชื่อเข้าใช้
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          หน้าหลัก
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12"
      style={{
        background: "linear-gradient(180deg, #f0f9f8 0%, #e0f2ef 50%, #ccece6 100%)",
      }}
    >
      <Suspense fallback={<p className="text-slate-500">กำลังโหลด...</p>}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
