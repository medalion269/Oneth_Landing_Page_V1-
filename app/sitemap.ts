import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// One page for now. Add a line here for each new page (docs/DECISIONS.md, L29). A new page must also set its own
// `alternates.canonical` and `openGraph.url`: the root layout's "/" would otherwise name the home page as its canonical.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, lastModified: new Date() }];
}
