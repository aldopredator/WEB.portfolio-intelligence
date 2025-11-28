
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stock Insights Dashboard | Stocks, Funds & ETF Analysis",
  description: "Comprehensive stock analysis dashboard for stocks and ETFs with real-time data, analyst recommendations, and social sentiment.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: "Stock Insights Dashboard | Stocks, Funds & ETF Analysis",
    description: "Comprehensive stock analysis dashboard for stocks and ETFs with real-time data, analyst recommendations, and social sentiment.",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
