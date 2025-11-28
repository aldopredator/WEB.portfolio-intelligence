
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarNavigation } from "@/components/sidebar-navigation";

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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <SidebarNavigation />
          <div className="lg:pl-0 pt-16 lg:pt-0">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
