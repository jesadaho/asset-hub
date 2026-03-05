"use client";

import { Header } from "@/components/Header";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { NewToMarketSection } from "@/components/NewToMarketSection";

const LINE_PORJAI_URL = "https://line.me/ti/p/~@porjai_asset";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero + Search: gradient ตาม reference (ฟ้าอ่อนบน → มิ้นท์ล่าง) + ดาวมุมขวาล่าง */}
      <section
        className="relative flex min-h-[320px] flex-col items-center overflow-hidden px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
        style={{
          background: "linear-gradient(180deg, #f0f9f8 0%, #e0f2ef 40%, #ccece6 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute bottom-4 right-4 sm:bottom-6 sm:right-6 opacity-30"
          aria-hidden
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" fill="currentColor" className="text-slate-400" />
          </svg>
        </div>
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <h1 className="text-left text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl" style={{ color: "#252a32" }}>
              ค้นหาบ้านและคอนโดรวมครบ ง่ายๆในที่เดียว
            </h1>
            <a
              href={LINE_PORJAI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 self-start overflow-hidden rounded-2xl transition hover:opacity-95 sm:self-center"
              aria-label="เพิ่มเพื่อนกับพอใจ บน LINE"
            >
              <img
                src="/images/line-porjai-banner.png"
                alt="เพิ่มเพื่อนกับพอใจ – LINE OA ผู้ช่วยอัจฉริยะ ดูแลสินทรัพย์ของคุณ"
                className="h-12 w-auto max-w-[200px] object-contain sm:h-14 sm:max-w-[240px]"
              />
            </a>
          </div>
          <div className="mt-6 sm:mt-8">
            <SearchFilterBar embeddedInHero />
          </div>
        </div>
      </section>

      {/* แถบข้อความสีเขียว (gradient) – ชิดซ้ายแนวเดียวกับ CTA */}
      <div
        className="py-3"
        style={{
          background: "linear-gradient(90deg, #003d35 0%, #05a18c 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-left text-sm font-medium sm:text-base" style={{ color: "#08f0cd" }}>
            ↓ เริ่มค้นหาบ้านและคอนโดที่เหมาะกับคุณ ↓
          </p>
        </div>
      </div>

      <NewToMarketSection />
    </div>
  );
}
