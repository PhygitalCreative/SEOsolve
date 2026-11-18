import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Finding, FindingStatus, PriorityLevel } from '../types/audit';
import { PriorityLabel, StatusLabel } from './StatusIndicator';

interface FindingsListProps {
  findings: Finding[];
  title?: string;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  title = 'Prioritized Findings',
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | FindingStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return findings.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.impact.toLowerCase().includes(q) &&
        !item.fix.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [findings, statusFilter, priorityFilter, query]);

  const counts = useMemo(() => {
    return {
      all: findings.length,
      fail: findings.filter((f) => f.status === 'fail').length,
      warning: findings.filter((f) => f.status === 'warning').length,
      pass: findings.filter((f) => f.status === 'pass').length,
    };
  }, [findings]);

  return (
    <section className="bg-white border border-slate-200 rounded-xl">
      <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 tabular-nums">
            <span>{counts.all} total</span>
            <span aria-hidden="true">·</span>
            <span className="text-red-700 font-medium">{counts.fail} fail</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-medium">{counts.warning} warning</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">{counts.pass} pass</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter findings..."
              aria-label="Filter findings"
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'fail', 'warning', 'pass'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all'
                  ? 'All'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | PriorityLevel)}
            aria-label="Filter by priority"
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          >
            <option value="all">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          No findings match your current filters.
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {filtered.map((finding) => (
            <div key={finding.id} className="p-5 hover:bg-slate-50/70 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusLabel status={finding.status} />
                  <h4 className="text-sm font-semibold text-slate-900">
                    {finding.title}
                  </h4>
                </div>
                <PriorityLabel priority={finding.priority} />
              </div>

              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Impact
                  </div>
                  <p className="text-slate-700 leading-relaxed">{finding.impact}</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Recommended Fix
                  </div>
                  <p className="text-slate-900 leading-relaxed">{finding.fix}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
