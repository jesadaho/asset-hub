"use client";

import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Smartphone,
  ExternalLink,
} from "lucide-react";

const PRIMARY = "#068e7b";
const FACEBOOK_URL = "https://www.facebook.com/people/Asset-Hub/61586247177169/";

const footerLinkClass =
  "text-sm text-slate-600 hover:text-slate-900 hover:underline block py-0.5";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      {/* Main footer content */}
      <div className="border-t border-slate-200 bg-slate-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {/* ดาวน์โหลดแอป */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                ดาวน์โหลดแอป AssetHub
              </h3>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href="https://assethub.in.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Smartphone className="h-4 w-4" aria-hidden />
                  เปิดใน LINE
                </a>
                <p className="text-xs text-slate-500">
                  ใช้ผ่าน LINE OA &quot;พอใจ&quot;
                </p>
              </div>
            </div>

            {/* ทรัพยากร */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                ทรัพยากร
              </h3>
              <nav className="mt-3 flex flex-col" aria-label="ทรัพยากร">
                <Link href="/listings?listingType=sale" className={footerLinkClass}>
                  คู่มือซื้อบ้าน-คอนโด
                </Link>
                <Link href="/listings?listingType=rent" className={footerLinkClass}>
                  คู่มือเช่าบ้าน
                </Link>
                <a href="https://assethub.in.th" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                  คู่มือเจ้าของทรัพย์
                </a>
                <a href="https://assethub.in.th" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                  ข่าวอสังหาริมทรัพย์
                </a>
                <a href="https://assethub.in.th" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                  เคล็ดลับการลงทุน
                </a>
              </nav>
            </div>

            {/* ค้นหา */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                ค้นหา
              </h3>
              <nav className="mt-3 flex flex-col" aria-label="ค้นหา">
                <Link href="/listings?listingType=sale" className={footerLinkClass}>
                  บ้าน-คอนโดขาย
                </Link>
                <Link href="/listings?listingType=rent" className={footerLinkClass}>
                  บ้าน-คอนโดเช่า
                </Link>
                <Link href="/listings" className={footerLinkClass}>
                  ดูทุกประกาศ
                </Link>
                <Link href="/" className={footerLinkClass}>
                  หน้าหลัก
                </Link>
              </nav>
            </div>

            {/* ทำเล */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                ทำเล
              </h3>
              <p className="mt-1 text-xs text-slate-500">เมืองและพื้นที่ยอดนิยม</p>
              <nav className="mt-3 flex flex-col" aria-label="ทำเล">
                <Link href="/listings?location=กรุงเทพ" className={footerLinkClass}>
                  กรุงเทพฯ
                </Link>
                <Link href="/listings?location=เชียงใหม่" className={footerLinkClass}>
                  เชียงใหม่
                </Link>
                <Link href="/listings?location=ภูเก็ต" className={footerLinkClass}>
                  ภูเก็ต
                </Link>
                <Link href="/listings?location=ชลบุรี" className={footerLinkClass}>
                  ชลบุรี
                </Link>
                <Link href="/listings?location=นนทบุรี" className={footerLinkClass}>
                  นนทบุรี
                </Link>
                <Link href="/listings?location=สมุทรปราการ" className={footerLinkClass}>
                  สมุทรปราการ
                </Link>
              </nav>
            </div>

            {/* AssetHub */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                AssetHub
              </h3>
              <nav className="mt-3 flex flex-col" aria-label="AssetHub">
                <a href="https://assethub.in.th" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                  เกี่ยวกับเรา
                </a>
                <a href="https://assethub.in.th" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                  ติดต่อเรา
                </a>
                <a href="https://assethub.in.th" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                  เข้าสู่ระบบ / สร้างบัญชี
                </a>
                <a href="mailto:porjai.assethub@gmail.com" className={footerLinkClass}>
                  อีเมล
                </a>
              </nav>
            </div>

            {/* สำหรับมืออาชีพ */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                สำหรับมืออาชีพ
              </h3>
              <Link
                href="/post"
                className="mt-3 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: PRIMARY }}
              >
                AssetHub สำหรับเจ้าของ
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
              <nav className="mt-4 flex flex-col" aria-label="มืออาชีพ">
                <Link href="/post" className={footerLinkClass}>
                  ลงประกาศกับเรา
                </Link>
                <a href="https://assethub.in.th" target="_blank" rel="noopener noreferrer" className={footerLinkClass}>
                  สำหรับเอเจนต์
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 bg-slate-200/80 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600" aria-label="กฎหมายและความช่วยเหลือ">
            <Link href="/listings" className="hover:text-slate-900 hover:underline">
              แผนผังเว็บ
            </Link>
            <span className="text-slate-400" aria-hidden>|</span>
            <a href="https://assethub.in.th" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 hover:underline">
              ความช่วยเหลือ
            </a>
            <span className="text-slate-400" aria-hidden>|</span>
            <span className="cursor-default">คุกกี้</span>
            <span className="text-slate-400" aria-hidden>|</span>
            <span className="cursor-default">ความปลอดภัย</span>
            <span className="text-slate-400" aria-hidden>|</span>
            <span className="cursor-default">ข้อกำหนดการใช้งาน</span>
            <span className="text-slate-400" aria-hidden>|</span>
            <span className="cursor-default">นโยบายความเป็นส่วนตัว</span>
          </nav>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-xs text-slate-600">
              © 2000–{currentYear} AssetHub. สงวนลิขสิทธิ์.
            </p>
            <div className="flex items-center gap-3" aria-label="โซเชียลมีเดีย">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-900"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" aria-hidden />
              </a>
              <a
                href="#"
                className="text-slate-600 hover:text-slate-900"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" aria-hidden />
              </a>
              <a
                href="#"
                className="text-slate-600 hover:text-slate-900"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" aria-hidden />
              </a>
              <a
                href="#"
                className="text-slate-600 hover:text-slate-900"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
