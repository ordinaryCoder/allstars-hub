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
      // SVG — scales perfectly at any resolution
      {
        src: "/icons/allstars-favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      // Maskable — content within 80% safe zone for Android adaptive icon shapes
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
        sizes: "720x1468",
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
