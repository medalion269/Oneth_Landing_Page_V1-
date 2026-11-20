import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import Clarity from "@/components/Clarity";
import { DESCRIPTION, FEATURES, SEARCH_TITLE, SHARE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
// The oneth app's font, used only inside the product mockups (its two weights, DESIGN.md).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "600"], display: "swap" });

// The share picture is app/opengraph-image.png (with its .alt.txt); Next adds og:image and twitter:image from it.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SEARCH_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SHARE_TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "oneth",
    locale: "en_AE",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: SHARE_TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#F8F7F4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Structured data (schema.org) so search engines and AI answers know who oneth is and what it does. Facts already on
// the page only: no prices, ratings, address or social profiles (docs/DECISIONS.md, L29).
const ORG_ID = `${SITE_URL}/#organization`;
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: "oneth",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/apple-icon.png`, width: 180, height: 180 },
      description: "Operations software for accounting and bookkeeping firms in the UAE.",
      areaServed: { "@type": "Country", name: "United Arab Emirates" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "oneth",
      url: SITE_URL,
      inLanguage: "en",
      publisher: { "@id": ORG_ID },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "oneth",
      url: SITE_URL,
      description:
        "oneth prepares the bookkeeping for accounting and bookkeeping firms in the UAE: invoices and receipts, bank reconciliation and UAE VAT, for clients on Zoho Books, Xero or TallyPrime. The firm's team reviews and approves every entry.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      featureList: FEATURES,
      audience: { "@type": "BusinessAudience", audienceType: "Accounting and bookkeeping firms in the UAE" },
      publisher: { "@id": ORG_ID },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
      <Clarity />
    </html>
  );
}
