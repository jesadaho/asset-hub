"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID?.trim();

export default function SignInLinePage() {
  const [status, setStatus] = useState<"init" | "logging-in" | "creating-session" | "done" | "error">("init");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!LIFF_ID) {
      setStatus("error");
      setErrorMessage("NEXT_PUBLIC_LIFF_ID is not set.");
      return;
    }

    let cancelled = false;

    async function run() {
      setStatus("init");
      const liff = (await import("@line/liff")).default;
      await liff.init({ liffId: LIFF_ID! });

      if (cancelled) return;

      if (!liff.isLoggedIn()) {
        setStatus("logging-in");
        liff.login();
        return;
      }

      setStatus("creating-session");
      const token = liff.getAccessToken();
      if (!token) {
        setStatus("error");
        setErrorMessage("Could not get LINE access token.");
        return;
      }

      const res = await fetch("/api/auth/liff-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "include",
      });

      if (cancelled) return;

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(data.message ?? "Failed to create session.");
        return;
      }

      const data = (await res.json()) as { redirectUrl?: string };
      setStatus("done");
      window.location.href = data.redirectUrl ?? "/";
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Header />
      <main
        className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4 py-12"
        style={{
          background: "linear-gradient(180deg, #f0f9f8 0%, #e0f2ef 50%, #ccece6 100%)",
        }}
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          {status === "init" && (
            <p className="text-center text-slate-600">กำลังเตรียม LINE Login...</p>
          )}
          {status === "logging-in" && (
            <p className="text-center text-slate-600">กำลังเปิด LINE เพื่อลงชื่อเข้าใช้...</p>
          )}
          {status === "creating-session" && (
            <p className="text-center text-slate-600">กำลังสร้าง session...</p>
          )}
          {status === "done" && (
            <p className="text-center text-slate-600">กำลังนำคุณไปยังแดชบอร์ด...</p>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <p className="text-center text-red-600">{errorMessage}</p>
              <Link
                href="/sign-in"
                className="block text-center text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                กลับไปลงชื่อเข้าใช้
              </Link>
            </div>
          )}
        </div>
        <Link href="/" className="mt-6 text-sm font-medium text-slate-600 hover:text-slate-900">
          กลับหน้าหลัก
        </Link>
      </main>
    </>
  );
}
