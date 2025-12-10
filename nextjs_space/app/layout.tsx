
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutContent } from "@/components/layout-content";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portfolio Intelligence | Professional Stock Analysis & Insights",
  description: "Advanced stock analysis platform with real-time data, comprehensive metrics, analyst recommendations, and market sentiment analysis for informed investment decisions.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: "Portfolio Intelligence | Professional Stock Analysis & Insights",
    description: "Advanced stock analysis platform with real-time data, comprehensive metrics, analyst recommendations, and market sentiment analysis.",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <Toaster position="top-right" />
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
