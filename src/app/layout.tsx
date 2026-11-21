import type { Metadata } from "next";
import { Fraunces, Inter, Oswald } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const oswald = Oswald({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Arxiono — Mobile apps, built with founders",
  description:
    "Arxiono is a mobile app studio. Bring us an idea and we design, build and ship it with you — sometimes for equity, always with craft.",
  metadataBase: new URL("https://arxiono.com"),
  openGraph: {
    title: "Arxiono — Mobile apps, built with founders",
    description:
      "Arxiono is a mobile app studio. Bring us an idea and we design, build and ship it with you — sometimes for equity, always with craft.",
    siteName: "Arxiono",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arxiono — Mobile apps, built with founders",
    description:
      "Arxiono is a mobile app studio. Bring us an idea and we design, build and ship it with you — sometimes for equity, always with craft.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-paper">
        {children}
      </body>
    </html>
  );
}
