import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { ActiveTab } from '../types';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  savedCount: number;
  applicationsCount: number;
}

const NAV_ITEMS: { id: Exclude<ActiveTab, 'employer'>; label: string }[] = [
  { id: 'explore', label: 'Explore Jobs' },
  { id: 'calendar', label: 'Upcoming Calendar' },
  { id: 'saved', label: 'Saved & Alerts' },
  { id: 'applications', label: 'My Applications' },
];

export function TopBar({
  activeTab,
  onSelectTab,
  savedCount,
  applicationsCount,
}: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab: ActiveTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const getLabelWithCount = (item: { id: Exclude<ActiveTab, 'employer'>; label: string }) => {
    if (item.id === 'saved' && savedCount > 0) {
      return `${item.label} (${savedCount})`;
    }
    if (item.id === 'applications' && applicationsCount > 0) {
      return `${item.label} (${applicationsCount})`;
    }
    return item.label;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <button
          type="button"
          onClick={() => handleNav('explore')}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 rounded"
        >
          HorizonJobs
        </button>

        {/* Zone 2: 4 clean single-line text nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 rounded ${
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getLabelWithCount(item)}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-blue-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA button + mobile menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('employer')}
            aria-current={activeTab === 'employer' ? 'page' : undefined}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              activeTab === 'employer'
                ? 'bg-slate-900 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Employer Studio
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {getLabelWithCount(item)}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
