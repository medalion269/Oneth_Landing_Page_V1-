import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

const description =
  "oneth handles repetitive bookkeeping work for accounting and bookkeeping firms in the UAE. Your team reviews and approves every entry. Apply for a free pilot.";

export const metadata: Metadata = {
  metadataBase: new URL("https://oneth.ai"),
  title: "oneth · Take on more clients. Not more accountants.",
  description,
  openGraph: {
    title: "oneth · Take on more clients. Not more accountants.",
    description,
    url: "https://oneth.ai",
    siteName: "oneth",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#F8F7F4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
