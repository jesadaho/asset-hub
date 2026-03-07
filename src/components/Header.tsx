"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { LanguageSwitcher } from "./LanguageSwitcher";

const PRIMARY = "#068e7b";

type SessionUser = {
  id: string;
  name: string | null;
  image: string | null;
  provider: string;
} | null;

export function Header() {
  const [user, setUser] = useState<SessionUser>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { user?: SessionUser }) => {
        setUser(data.user ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setSessionLoading(false));
  }, []);

  const handleSignOut = async () => {
    if (user?.provider === "line") {
      await fetch("/api/auth/signout-line", { method: "POST", credentials: "include" });
      window.location.href = "/";
    } else {
      await signOut({ callbackUrl: "/" });
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold text-slate-900"
        >
          <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          Asset Hub
        </Link>
        <nav className="hidden items-center gap-6 sm:flex" aria-label="หลัก">
          <Link
            href="/listings?listingType=sale"
            className="text-base font-medium text-slate-600 hover:text-slate-900"
          >
            ขาย
          </Link>
          <Link
            href="/listings?listingType=rent"
            className="text-base font-medium text-slate-600 hover:text-slate-900"
          >
            เช่า
          </Link>
          <Link
            href="/review"
            className="text-base font-medium text-slate-600 hover:text-slate-900"
          >
            รีวิวฉบับนักลงทุน
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <a
            href="https://assethub.in.th"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            ลงประกาศ
          </a>
          {!sessionLoading &&
            (user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden items-center rounded-lg border-2 px-4 py-2 text-sm font-medium transition hover:opacity-90 sm:inline-flex"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-block"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="hidden items-center rounded-lg border-2 px-4 py-2 text-sm font-medium transition hover:opacity-90 sm:inline-flex"
                style={{ borderColor: PRIMARY, color: PRIMARY }}
              >
                Sign in
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
