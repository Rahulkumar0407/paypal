import type { MetadataRoute } from "next";

/** Installs tmrw to a phone's home screen: opens on Today, full-screen, in the brand's deep green. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "tmrw",
    short_name: "tmrw",
    description: "See the short day before it arrives. Your shop's month, on one page, inside PayPal.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    background_color: "#0e3b2c",
    theme_color: "#0e3b2c",
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
