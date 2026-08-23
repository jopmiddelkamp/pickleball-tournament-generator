import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { cssVariables } from "../lib/theme";
import "./globals.css";

// Downloaded at build time and served from this origin: nothing about a roster
// reaches a font CDN.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mixed doubles night",
  description: "Build and run a rotating-partner mixed doubles evening, court-side.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#173A2B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const rootStyle = Object.entries(cssVariables)
  .map(([name, value]) => `${name}: ${value};`)
  .join("");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <style>{`:root{${rootStyle}}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
