'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  ListChecks,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Menu,
  X,
  Briefcase,
  Package,
  Grid3x3,
  Globe
} from 'lucide-react';
import { usePortfolio } from '@/lib/portfolio-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SidebarNavigation() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { selectedPortfolio, portfolios, selectPortfolio } = usePortfolio();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: selectedPortfolio ? `/?portfolio=${selectedPortfolio.id}` : '/', 
      icon: BarChart3, 
      description: 'Stock insights & analytics' 
    },
    { name: 'Portfolios', href: '/portfolios', icon: Briefcase, description: 'Manage your portfolios' },
    { name: 'Screening', href: '/screening', icon: Filter, description: 'Stock screening results' },
    { name: 'Sectors', href: '/sectors', icon: Grid3x3, description: 'Sector matrix visualization' },
    { name: 'Countries', href: '/countries', icon: Globe, description: 'Country matrix visualization' },
  ];

  const SidebarContent = () => (
    <>

      
      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${
                isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'
              } transition-colors`} />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 truncate">{item.description}</p>
                </div>
              )}
              {isActive && !collapsed && (
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
              )}
            </Link>
          );
        })}
        
        {/* Desktop Collapse Toggle - moved to top */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-full px-4 py-3 mt-2 rounded-xl border border-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-2 text-sm">Collapse</span>
            </>
          )}
        </button>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Toggle - positioned in top-right of header */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors backdrop-blur-sm bg-slate-900/80 border border-slate-700"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          lg:hidden fixed top-28 left-0 bottom-0 z-40 w-72 bg-slate-950 border-r border-slate-800/50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex fixed top-28 left-0 bottom-0 z-40 bg-slate-950 border-r border-slate-800/50 flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-72'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Spacer for main content */}
      <div className={`hidden lg:block transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`} />
    </>
  );
}
