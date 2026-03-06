"use client";

import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "./LanguageSwitcher";

const PRIMARY = "#068e7b";

export function Header() {
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
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ขาย
          </Link>
          <Link
            href="/listings?listingType=rent"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            เช่า
          </Link>
          <a
            href="https://assethub.in.th"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            สำหรับเจ้าของ
          </a>
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
          <a
            href="https://assethub.in.th"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center rounded-lg border-2 px-4 py-2 text-sm font-medium transition hover:opacity-90 sm:inline-flex"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
          >
            Sign in
          </a>
        </div>
      </div>
    </header>
  );
}
