import React, { useMemo, useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type {
  ChecklistStatus,
  TechnicalChecklistModule,
  TechnicalGroup,
} from '../types/audit';
import { FindingsList } from './FindingsList';
import { PriorityLabel, StatusLabel, getScoreTone } from './StatusIndicator';

const GROUPS_ORDER: TechnicalGroup[] = [
  'Crawlability and Indexing',
  'Performance',
  'Mobile and UX',
  'Security',
  'Structured Data',
  'International',
];

interface TechnicalChecklistTabProps {
  technical: TechnicalChecklistModule;
  checkedIds: string[];
  onToggleItem: (itemId: string) => void;
}

export const TechnicalChecklistTab: React.FC<TechnicalChecklistTabProps> = ({
  technical,
  checkedIds,
  onToggleItem,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<'all' | TechnicalGroup>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ChecklistStatus>('all');
  const [hideChecked, setHideChecked] = useState(false);

  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds]);
  const tone = getScoreTone(technical.score);

  const filteredItems = useMemo(() => {
    return technical.items.filter((item) => {
      if (selectedGroup !== 'all' && item.group !== selectedGroup) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (hideChecked && checkedSet.has(item.id)) return false;
      return true;
    });
  }, [technical.items, selectedGroup, statusFilter, hideChecked, checkedSet]);

  const groupedItems = useMemo(() => {
    return GROUPS_ORDER.map((group) => ({
      group,
      items: filteredItems.filter((item) => item.group === group),
    })).filter((g) => g.items.length > 0);
  }, [filteredItems]);

  const totalItems = technical.items.length;
  const completedCount = technical.items.filter((i) => checkedSet.has(i.id)).length;
  const completionPct =
    totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Progress */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Technical SEO Checklist
            </h2>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              {technical.summary}
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <div className="text-xs font-medium text-slate-500">Module Score</div>
            <div className={`font-display text-3xl font-extrabold tabular-nums ${tone.text}`}>
              {technical.score}
              <span className="text-sm font-medium text-slate-400">/100</span>
            </div>
          </div>
        </div>

        {/* Interactive Checklist Progress */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
              <span>Checklist Resolution Progress</span>
              <span className="font-mono tabular-nums">
                {completedCount}/{totalItems} ({completionPct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-700 rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Check off items as you verify or resolve them. Progress saves automatically in your browser.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs font-semibold text-slate-700 mb-1">
                Schema.org Types Detected
              </div>
              <div className="text-xs text-slate-600 font-mono">
                {technical.schemaTypesPresent.length > 0
                  ? technical.schemaTypesPresent.join(' · ')
                  : 'None explicitly detected'}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs font-semibold text-slate-700 mb-1">
                Schema.org Types Recommended
              </div>
              <div className="text-xs text-amber-800 font-mono">
                {technical.schemaTypesMissing.length > 0
                  ? technical.schemaTypesMissing.join(' · ')
                  : 'Core types covered'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Toolbar */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value as 'all' | TechnicalGroup)}
            aria-label="Filter by checklist group"
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="all">All 6 groups ({totalItems})</option>
            {GROUPS_ORDER.map((group) => (
              <option key={group} value={group}>
                {group} ({technical.items.filter((i) => i.group === group).length})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'fail', label: 'Fail' },
                { id: 'warning', label: 'Warning' },
                { id: 'pass', label: 'Pass' },
                { id: 'could_not_verify', label: 'Unverified' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === s.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideChecked}
            onChange={(e) => setHideChecked(e.target.checked)}
            className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
          />
          <span>Hide checked-off items</span>
        </label>
      </section>

      {/* Grouped Checklist Items */}
      {groupedItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          No checklist items match your current filters.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map(({ group, items }) => (
            <section
              key={group}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{group}</h3>
                <span className="text-xs text-slate-500 tabular-nums">
                  {items.filter((i) => checkedSet.has(i.id)).length}/{items.length} resolved
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {items.map((item) => {
                  const isChecked = checkedSet.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 transition-colors ${
                        isChecked ? 'bg-slate-50/60' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <button
                          type="button"
                          onClick={() => onToggleItem(item.id)}
                          aria-pressed={isChecked}
                          aria-label={`Mark "${item.title}" as ${isChecked ? 'incomplete' : 'complete'}`}
                          className="mt-0.5 text-slate-400 hover:text-blue-700 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-blue-700" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <span
                                className={`text-sm font-semibold ${
                                  isChecked
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-900'
                                }`}
                              >
                                {item.title}
                              </span>
                              <StatusLabel status={item.status} />
                            </div>
                            <PriorityLabel priority={item.priority} />
                          </div>

                          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {item.details}
                          </p>
                          <p className="mt-1.5 text-xs sm:text-sm text-slate-900 leading-relaxed">
                            <span className="font-semibold text-slate-700">Fix: </span>
                            {item.fix}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <FindingsList
        findings={technical.findings}
        title="Key Technical Findings Summary"
      />
    </div>
  );
};
