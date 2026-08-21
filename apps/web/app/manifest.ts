import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AllStars Hub",
    short_name: "AllStars",
    description: "Comprehensive Sports Academy Management Platform",
    start_url: "/",
    scope: "/",
    id: "/?source=pwa",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "portrait-primary",
    prefer_related_applications: false,
    categories: ["sports", "education", "productivity"],
    icons: [
      // Regular (any) icons — no safe-zone padding required
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/logo-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Maskable icons — content within 80% safe zone (required for Android adaptive icons)
      {
        src: "/icons/maskable-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/icons/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "AllStars Hub – Mobile",
      },
      {
        src: "/icons/screenshot-desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "AllStars Hub – Desktop",
      },
    ],
  };
}
