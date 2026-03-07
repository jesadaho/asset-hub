"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isAuthRelated =
    error.message?.includes("NEXTAUTH") ||
    error.message?.includes("secret") ||
    error.message?.includes("Session");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">เกิดข้อผิดพลาด</h1>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
        {isAuthRelated && (
          <p className="mt-3 text-xs text-slate-500">
            ตรวจสอบ .env.local: NEXTAUTH_URL ต้องตรงกับที่เปิด (เช่น http://localhost:3001)
            และ NEXTAUTH_SECRET ต้องมีค่า
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: "#068e7b" }}
          >
            ลองอีกครั้ง
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
