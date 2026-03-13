"use client";

import { Suspense } from "react";
import { Header } from "@/components/Header";
import { RecommendedAssetsSection } from "@/components/RecommendedAssetsSection";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { NewToMarketSection } from "@/components/NewToMarketSection";

function HomePageContent() {
  return (
    <>
      <Header />

      {/* Hero + Search: อยู่ layer เหนือแถบสีเขียว (รวม dropdown) */}
      <section
        className="relative z-10 flex min-h-[320px] flex-col items-center overflow-visible px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
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
          <h1 className="text-left text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl" style={{ color: "#252a32" }}>
            ค้นหาบ้านและคอนโดรวมครบ ง่ายๆในที่เดียว
          </h1>
          <div className="mt-6 sm:mt-8">
            <SearchFilterBar embeddedInHero />
          </div>
        </div>
      </section>

      {/* แถบข้อความสีเขียว (gradient) – อยู่ใต้ search box */}
      <div
        className="relative z-0 py-3"
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

      <RecommendedAssetsSection />
      <NewToMarketSection />
    </>
  );
}

function HomePageFallback() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section
        className="relative flex min-h-[320px] flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
        style={{
          background: "linear-gradient(180deg, #f0f9f8 0%, #e0f2ef 40%, #ccece6 100%)",
        }}
      >
        <p className="text-slate-500">กำลังโหลด...</p>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<HomePageFallback />}>
        <HomePageContent />
      </Suspense>
    </div>
  );
}
