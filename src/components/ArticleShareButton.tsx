"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Share2, ChevronDown, Copy } from "lucide-react";

const PRIMARY = "#068e7b";

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconLine({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#06C755"
        d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .36.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.039 1.085l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
      />
    </svg>
  );
}

type ArticleShareButtonProps = {
  url?: string;
  title?: string;
  className?: string;
};

export function ArticleShareButton({ url: urlProp, title, className = "" }: ArticleShareButtonProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mountedUrl, setMountedUrl] = useState("");
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const url = urlProp || mountedUrl;

  useEffect(() => {
    if (typeof window !== "undefined" && !urlProp) setMountedUrl(window.location.href);
  }, [urlProp]);

  useLayoutEffect(() => {
    if (!shareOpen) {
      setDropdownRect(null);
      return;
    }
    const el = containerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 4, left: rect.left });
    }
  }, [shareOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setShareOpen(false);
    }
    function handleScroll() {
      setShareOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  useEffect(() => {
    if (!shareOpen) return;
    const onResize = () => setShareOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [shareOpen]);

  function handleFacebook() {
    if (!url) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "facebook-share",
      "width=600,height=400"
    );
  }

  function handleLine() {
    if (!url) return;
    const text = title ? `${title} ${url}` : url;
    window.open(
      `https://line.me/R/msg/text/?${encodeURIComponent(text)}`,
      "line-share",
      "width=600,height=400"
    );
  }

  function handleCopyLink() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setShareOpen(false);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setShareOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        style={{ borderColor: PRIMARY, color: PRIMARY }}
        aria-expanded={shareOpen}
        aria-haspopup="true"
      >
        <Share2 className="h-4 w-4 shrink-0" />
        <span>{copied ? "คัดลอกแล้ว" : "แชร์บทความ"}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${shareOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {shareOpen &&
        dropdownRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            role="menu"
            className="min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            style={{
              position: "fixed",
              zIndex: 99999,
              top: dropdownRect.top,
              left: dropdownRect.left,
            }}
          >
            <button
              type="button"
              onClick={handleFacebook}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              role="menuitem"
            >
              <IconFacebook className="h-5 w-5 shrink-0 text-[#1877F2]" />
              แชร์ไปที่ Facebook
            </button>
            <button
              type="button"
              onClick={handleLine}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              role="menuitem"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                <IconLine className="h-5 w-5" />
              </span>
              แชร์ไปที่ Line
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              role="menuitem"
            >
              <Copy className="h-5 w-5 shrink-0 text-slate-500" />
              คัดลอกลิงก์
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
