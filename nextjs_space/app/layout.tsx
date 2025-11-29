
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
          {/* Top Header Bar - Always visible */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white leading-tight">Portfolio Intelligence</h1>
                  <p className="text-base text-blue-400 font-medium">Solutions</p>
                </div>
              </div>
            </div>
          </header>
          
          <SidebarNavigation />
          <div className="lg:pl-0 pt-28">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
