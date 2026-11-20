import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Every crawler may read the page; the form endpoint is not a page (docs/DECISIONS.md, L29).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
