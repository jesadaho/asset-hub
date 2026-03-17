"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
const LINE_OFFICIAL_ID = process.env.NEXT_PUBLIC_LINE_OFFICIAL_ID?.trim();

function getAddFriendUrl(): string | null {
  if (!LINE_OFFICIAL_ID) return null;
  return `https://line.me/R/ti/p/${LINE_OFFICIAL_ID}`;
}

function getPostLiffUrl(): string | null {
  if (!LIFF_ID) return null;
  const path = encodeURIComponent("/owner/properties/add");
  return `https://liff.line.me/${LIFF_ID}/add-friend-required?path=${path}`;
}

function LineIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 3.25C6.89 3.25 2.75 6.67 2.75 10.88c0 3.77 3.27 6.92 7.68 7.52l-.42 2.5a.5.5 0 0 0 .73.52l2.85-1.5c.13-.07.28-.1.42-.1 4.66 0 8.99-3.33 8.99-7.94 0-4.21-4.14-8.63-10-8.63Z"
        fill="currentColor"
      />
      <path
        d="M8.2 13.9h1.76a.6.6 0 1 0 0-1.2H8.8V9.87a.6.6 0 0 0-1.2 0v3.43c0 .33.27.6.6.6Zm6.18 0a.6.6 0 0 0 .6-.6v-.87h1.19a.6.6 0 1 0 0-1.2h-1.2v-.76h1.2a.6.6 0 1 0 0-1.2h-1.8a.6.6 0 0 0-.6.6v3.43c0 .33.27.6.6.6Zm-2.74-4.63a.6.6 0 0 0-.6.6v1.77l-1.36-2.1a.6.6 0 0 0-1.1.32v3.44a.6.6 0 0 0 1.2 0v-1.77l1.36 2.09a.6.6 0 0 0 1.1-.32V9.87a.6.6 0 0 0-.6-.6Z"
        fill="currentColor"
      />
      <path
        d="M12.12 9.27a.6.6 0 0 0-.6.6v3.43a.6.6 0 1 0 1.2 0V9.87a.6.6 0 0 0-.6-.6Z"
        fill="currentColor"
      />
      <path
        d="M18.03 10.47a.6.6 0 1 0 0-1.2h-1.8a.6.6 0 0 0-.6.6v3.43c0 .33.27.6.6.6h1.8a.6.6 0 1 0 0-1.2h-1.2v-.76h1.2a.6.6 0 1 0 0-1.2h-1.2v-.27h1.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function PostLandingPage() {
  const addFriendUrl = getAddFriendUrl();
  const postUrl = getPostLiffUrl();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section
          className="relative flex flex-col items-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
          style={{
            background:
              "linear-gradient(180deg, #f0f9f8 0%, #e0f2ef 40%, #ccece6 100%)",
          }}
        >
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                ลงประกาศแนะนำฟรี
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                ลงประกาศห้องของคุณฟรี
                <br />
                เพียงเพิ่มเพื่อน LINE OA ของเรา
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                สำหรับเจ้าของห้องที่อยากขายหรือปล่อยเช่า
                เราช่วยแนะนำประกาศของคุณให้คนที่กำลังมองหาจริง ๆ
                โดยใช้ LINE เป็นช่องทางหลักในการติดต่อ สะดวก โปร่งใส และไม่มีค่าใช้จ่ายในการลงประกาศแนะนำ
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-900">
                    ลงประกาศแนะนำฟรี
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    ไม่มีค่าใช้จ่ายในการลงประกาศแนะนำ
                    ช่วยให้ห้องของคุณถูกมองเห็นมากขึ้น
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-900">
                    คุยผ่าน LINE ได้ทันที
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    ผู้สนใจสามารถทักแชทหาคุณผ่าน LINE
                    ทั้งจาก Asset Ace และ Asset Hub
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-900">
                    จัดการทรัพย์ได้ในที่เดียว
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    ใช้ Asset Ace จัดการสถานะห้อง การเช่า
                    และการติดต่อเอเจนต์แบบเป็นระบบ
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                {addFriendUrl ? (
                  <a
                    href={addFriendUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                    style={{ backgroundColor: "#06C755" }}
                  >
                    <LineIcon className="h-5 w-5 shrink-0" />
                    เพิ่มเพื่อนใน LINE เพื่อเริ่มใช้งาน
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-slate-300 px-5 py-3 text-sm font-semibold text-white"
                  >
                    กรุณาตั้งค่า NEXT_PUBLIC_LINE_OFFICIAL_ID
                  </button>
                )}

                {postUrl ? (
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                  >
                    ฉันเพิ่มเพื่อนแล้ว เริ่มลงประกาศเลย
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500"
                  >
                    กรุณาตั้งค่า NEXT_PUBLIC_LIFF_ID
                  </button>
                )}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                การลงประกาศแนะนำฟรีในช่วง MVP
                อาจมีการจำกัดจำนวนห้องหรือเงื่อนไขเพิ่มเติมในอนาคต
              </p>
            </div>

            <div className="mt-6 w-full max-w-md rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200 lg:mt-0">
              <h2 className="text-sm font-semibold text-slate-900">
                ขั้นตอนลงประกาศแนะนำฟรี
              </h2>
              <ol className="mt-3 space-y-2 text-sm text-slate-700">
                <li>1. เพิ่มเพื่อน LINE OA ของเรา</li>
                <li>2. เข้าเมนูลงประกาศ หรือกดปุ่ม \"เริ่มลงประกาศ\" จากหน้านี้</li>
                <li>3. กรอกข้อมูลห้อง รูปภาพ และรายละเอียดให้ครบถ้วน</li>
                <li>4. ส่งประกาศให้ทีมงานตรวจสอบ และเริ่มเผยแพร่</li>
              </ol>
              <p className="mt-3 text-xs text-slate-500">
                ระบบการจัดการประกาศและข้อมูลห้อง
                จะทำงานผ่าน Asset Ace ซึ่งเชื่อมกับ LINE OA ของเราโดยตรง
              </p>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  สแกนเพื่อเพิ่มเพื่อน LINE
                </h3>
                <div className="mt-3 flex flex-col items-center">
                  <img
                    src="/line-add-friend-qr.png"
                    alt="QR code สำหรับเพิ่มเพื่อน LINE OA"
                    width={180}
                    height={180}
                    className="h-[180px] w-[180px] rounded-lg border border-slate-200 bg-white object-contain"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    สแกนด้วย LINE หรือกล้องมือถือ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

