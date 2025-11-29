'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ListChecks, Filter } from 'lucide-react';

export function SiteNavigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },

    { href: '/screening', label: 'Screening', icon: Filter },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="text-sm text-slate-400">
            Read-Only View
          </div>
        </div>
      </div>
    </nav>
  );
}
