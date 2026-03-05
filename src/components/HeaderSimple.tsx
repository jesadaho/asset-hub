"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function HeaderSimple() {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          <span className="font-medium">กลับ</span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
