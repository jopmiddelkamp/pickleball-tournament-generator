import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { headers } from "next/headers";
import { HtmlLang } from "../components/HtmlLang";
import { cssVariables } from "../lib/theme";
import "./globals.css";

// Downloaded at build time and served from this origin: nothing about a roster
// reaches a font CDN. Vietnamese needs its own subset for the stacked
// diacritics; Chinese, Japanese and Korean fall through to the system font.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Public_Sans({
  subsets: ["latin", "latin-ext", "vietnamese"],
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

/**
 * Reading the nonce is what opts these pages out of static prerendering, which
 * is the only way Next can stamp a per-request nonce onto its own scripts. See
 * proxy.ts. `lang` is English here and corrected in the browser by HtmlLang.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <style nonce={nonce}>{`:root{${rootStyle}}`}</style>
      </head>
      <body>
        <HtmlLang />
        {children}
      </body>
    </html>
  );
}
