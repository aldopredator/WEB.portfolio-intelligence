'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import CriteriaForm from '../criteria/CriteriaForm';

interface ScreeningClientProps {
  children: React.ReactNode;
}

export default function ScreeningClient({ children }: ScreeningClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex min-h-screen">
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-[540px]' : 'mr-0'}`}>
        {children}
      </div>

      {/* Right Sidebar - Criteria Form */}
      <div
        className={`fixed top-0 right-0 h-screen bg-slate-950 border-l border-slate-800 transition-all duration-300 overflow-y-auto ${
          sidebarOpen ? 'w-[540px]' : 'w-0'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -left-10 top-20 z-50 w-10 h-16 bg-slate-900 hover:bg-slate-800 border-l border-t border-b border-slate-700 rounded-l-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {/* Criteria Form Content */}
        <div className={`transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Screening Criteria</h2>
                <p className="text-slate-400 text-sm mt-1">Adjust filters and apply to see results</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm font-medium">Collapse</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <CriteriaForm />
          </div>
        </div>
      </div>
    </div>
  );
}
