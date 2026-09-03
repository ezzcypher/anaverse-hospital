import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Anaverse — Hospital & Surgical Centre",
    template: "%s · Anaverse",
  },
  description:
    "A private hospital built around calm. Emergency and critical care, cardiology, imaging, surgery and maternity — delivered by specialists with decades on the ward, in rooms designed to lower the pulse.",
  openGraph: {
    title: "Anaverse — Hospital & Surgical Centre",
    description:
      "Emergency, cardiology, imaging, surgery and maternity care — specialists with decades on the ward, transparent pricing, 24/7 emergency.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
