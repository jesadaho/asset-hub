"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import type { Locale } from "@/lib/locale";

const PRIMARY = "#068e7b";
const options: { value: Locale; label: string }[] = [
  { value: "th", label: "TH" },
  { value: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const current = options.find((o) => o.value === locale) ?? options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="เลือกภาษา"
      >
        <span>{current.label}</span>
        <ChevronDown
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 min-w-[80px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={locale === opt.value}>
              <button
                type="button"
                onClick={() => {
                  setLocale(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 ${
                  locale === opt.value ? "font-medium" : ""
                }`}
                style={locale === opt.value ? { color: PRIMARY } : undefined}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
