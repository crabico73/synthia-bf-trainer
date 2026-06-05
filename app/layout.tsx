
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Synthia — Your Flirty Philosopher",
  description:
    "Meet Synthia: an emotionally intelligent AI who delivers unfiltered insights on relationships, life philosophy, business, and the physics of human behavior. Voice-enabled, brutally honest, and unapologetically herself.",
  keywords: [
    "Synthia",
    "AI girlfriend",
    "AI relationship coach",
    "philosophy AI",
    "voice chat AI",
    "Eliza alternative",
  ],
  openGraph: {
    title: "Synthia — Your Flirty Philosopher",
    description:
      "Unfiltered insights on love, business, and the physics of people. Talk to Synthia.",
    type: "website",
    siteName: "Synthia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Synthia — Your Flirty Philosopher",
    description: "Unfiltered insights on love, business, and the physics of people.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0612",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
