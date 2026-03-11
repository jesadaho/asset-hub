"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getFirebaseAnalytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

export function FirebaseAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    getFirebaseAnalytics();
  }, []);

  useEffect(() => {
    const analytics = getFirebaseAnalytics();
    if (!analytics || !pathname) return;
    logEvent(analytics, "page_view", { page_path: pathname });
  }, [pathname]);

  return null;
}
