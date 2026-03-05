"use client";

const LOCALE_KEY = "asset-hub-locale";
export type Locale = "th" | "en";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "th";
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === "en" || stored === "th") return stored;
  return "th";
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_KEY, locale);
}
