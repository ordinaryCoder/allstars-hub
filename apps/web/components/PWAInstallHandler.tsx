"use client";

import { useEffect } from "react";

/**
 * PWAInstallHandler
 *
 * Captures the `beforeinstallprompt` event so the browser knows the app
 * has handled it. Without this, Android Chrome may fall back to the generic
 * "Add to Home Screen / Create Shortcut" option instead of the rich install
 * dialog. The captured event is stored on `window` for optional custom UI use.
 */
export default function PWAInstallHandler() {
  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-info bar from appearing automatically on mobile
      e.preventDefault();
      // Store the event so it can be triggered later from custom UI if desired
      (window as typeof window & { deferredPWAPrompt?: Event }).deferredPWAPrompt = e;
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return null;
}
