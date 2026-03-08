"use client";

import { useEffect, useRef, useState } from "react";
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
  isAdmin?: boolean;
} | null;

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Header() {
  const [user, setUser] = useState<SessionUser>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(menuRef, () => setMenuOpen(false));
  useOnClickOutside(mobileNavRef, () => setMobileNavOpen(false));

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
    setMenuOpen(false);
    if (user?.provider === "line") {
      await fetch("/api/auth/signout-line", { method: "POST", credentials: "include" });
      window.location.href = "/";
    } else {
      await signOut({ callbackUrl: "/" });
    }
  };

  return (
    <header className="relative sticky top-0 z-50 border-b border-slate-200 bg-white" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold text-slate-900"
        >
          <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          AssetHub
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
            href="/insight"
            className="text-base font-medium text-slate-600 hover:text-slate-900"
          >
            รีวิวโครงการ
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3" ref={mobileNavRef}>
          <button
            type="button"
            onClick={() => setMobileNavOpen((o) => !o)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 sm:hidden"
            aria-expanded={mobileNavOpen}
            aria-label="เปิดเมนู"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              {mobileNavOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
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
              <div className="relative hidden sm:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 transition hover:border-slate-300"
                  style={{ borderColor: menuOpen ? PRIMARY : undefined }}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-sm font-medium text-slate-600"
                      style={{ color: PRIMARY }}
                    >
                      {getInitials(user.name)}
                    </span>
                  )}
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-full z-[100] mt-2 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                    role="menu"
                  >
                    {user.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                        role="menuitem"
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                    >
                      โปรไฟล์
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                      role="menuitem"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
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
      {mobileNavOpen && (
        <div
          className="absolute left-0 right-0 top-full z-40 border-b border-slate-200 bg-white shadow-lg sm:hidden"
          role="navigation"
          aria-label="เมนูหลัก"
        >
          <nav className="flex flex-col px-4 py-3">
            <Link
              href="/listings?listingType=sale"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              ขาย
            </Link>
            <Link
              href="/listings?listingType=rent"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              เช่า
            </Link>
            <Link
              href="/insight"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              รีวิวโครงการ
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
