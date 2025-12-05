
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarNavigation } from "@/components/sidebar-navigation";
import { GlobalHeader } from "@/components/global-header";
import { PortfolioProvider } from "@/lib/portfolio-context";
import { Toaster } from "react-hot-toast";

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
        <PortfolioProvider>
          <Toaster position="top-right" />
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Top Header Bar with Tickers - Fixed, Always visible */}
            <GlobalHeader />
            
            <SidebarNavigation />
            <div className="lg:pl-0 pt-44 pb-32">
              {children}
            </div>
          
          {/* Bottom Disclaimer Bar - Always visible */}
          <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-900/30 to-red-900/30 backdrop-blur-sm border-t border-orange-800/30">
            <div className="max-w-full mx-auto px-6 py-2">
              <div className="flex gap-3 items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <p className="text-orange-400 text-xs">
                    <span className="font-semibold">Investment Disclaimer:</span> This information is for educational and informational purposes only and should not be considered as financial advice, investment recommendations, or an offer to buy or sell securities. Past performance does not guarantee future results. Always conduct thorough due diligence and consult with a qualified financial advisor before making any investment decisions.
                  </p>
                </div>
              </div>
            </div>
          </footer>
          </div>
        </PortfolioProvider>
      </body>
    </html>
  );
}
