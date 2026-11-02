import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { ServiceWorker } from "@/components/app/ServiceWorker";
import "./globals.css";

// Fraunces: a wide, warm variable serif. Optical size follows the font size; SOFT is set in globals.css.
const serif = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz", "SOFT"], variable: "--font-fraunces", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "NeverShort", template: "%s | NeverShort" },
  description: "A calm money forecast for a small online store: get paid, stay safe, never come up short.",
  applicationName: "NeverShort",
  // Opens full-screen from the iPhone home screen; the deep green demo banner sits under the status bar.
  appleWebApp: { capable: true, title: "NeverShort", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e3b2c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
