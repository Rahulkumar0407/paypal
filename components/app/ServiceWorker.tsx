"use client";

import { useEffect } from "react";

/** Registers the offline-page service worker (public/sw.js). Production only, so it never gets in the way of local development. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Without it the app still works; only the offline page is missing.
    });
  }, []);
  return null;
}
