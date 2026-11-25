import type { MetadataRoute } from "next";
import { DESCRIPTION } from "@/lib/site";

// The web app manifest (docs/DECISIONS.md, L31): the name and icons a phone uses when the page is added to its home
// screen, and the icons Chrome and Android pick for large spots. The site is a website, not an app, so it opens in
// the browser ("browser"), not in a window of its own. The PNGs come from app/icon.svg (scripts/make-icons.mjs).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "oneth",
    short_name: "oneth",
    description: DESCRIPTION,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: "#F8F7F4",
    theme_color: "#F8F7F4",
    lang: "en",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
