"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

type SessionUser = {
  id: string;
  name: string | null;
  image: string | null;
  provider: string;
} | null;

export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { user?: SessionUser }) => {
        setUser(data.user ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-[40vh] items-center justify-center">
          <p className="text-slate-500">กำลังโหลด...</p>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
          <p className="text-slate-600">กรุณาลงชื่อเข้าใช้เพื่อดูโปรไฟล์</p>
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "#068e7b" }}
          >
            ลงชื่อเข้าใช้
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main
        className="flex min-h-[60vh] flex-col items-center px-4 py-12"
        style={{
          background: "linear-gradient(180deg, #f0f9f8 0%, #e0f2ef 50%, #ccece6 100%)",
        }}
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-center text-xl font-bold text-slate-900">โปรไฟล์</h1>
          <div className="mt-6 flex flex-col items-center gap-4">
            {user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
            <p className="text-slate-700">
              <span className="font-medium">ชื่อ:</span> {user.name ?? "-"}
            </p>
            <p className="text-sm text-slate-500">
              เข้าสู่ระบบด้วย {user.provider === "line" ? "LINE" : "Google"}
            </p>
          </div>
          <Link
            href="/"
            className="mt-6 block text-center text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    </>
  );
}
