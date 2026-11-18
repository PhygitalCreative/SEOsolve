import React from 'react';

export type DashboardTab =
  | 'overview'
  | 'seo'
  | 'technical'
  | 'content'
  | 'keywords'
  | 'geo';

interface HeaderProps {
  mode: 'landing' | 'loading' | 'dashboard';
  activeTab?: DashboardTab;
  onSelectTab?: (tab: DashboardTab) => void;
  onNewAudit: () => void;
  onGoHome: () => void;
  historyCount: number;
  onScrollToHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  activeTab,
  onSelectTab,
  onNewAudit,
  onGoHome,
  historyCount,
  onScrollToHistory,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand wordmark */}
        <button
          type="button"
          onClick={onGoHome}
          className="font-display text-lg font-extrabold tracking-tight text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          SEOsolve
        </button>

        {/* Zone 2: 4-5 concise single-line nav links */}
        {mode === 'dashboard' && onSelectTab ? (
          <nav
            aria-label="Audit sections"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto"
          >
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'seo', label: 'On-Page SEO' },
                { id: 'technical', label: 'Technical' },
                { id: 'content', label: 'Content' },
                { id: 'keywords', label: 'Keywords' },
                { id: 'geo', label: 'AI Search' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === item.id
                    ? 'border-blue-600 text-slate-900 font-semibold'
                    : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : (
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#audit-form"
              className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Run Audit
            </a>
            <a
              href="#modules-included"
              className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Modules
            </a>
            {historyCount > 0 && onScrollToHistory && (
              <button
                type="button"
                onClick={onScrollToHistory}
                className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
              >
                Saved Audits
              </button>
            )}
          </nav>
        )}

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          {mode === 'dashboard' ? (
            <button
              type="button"
              onClick={onNewAudit}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              New Audit
            </button>
          ) : (
            <button
              type="button"
              onClick={onNewAudit}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Start Audit
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
