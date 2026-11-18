import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpDown, Info, Search, Zap } from 'lucide-react';
import type { KeywordGroup, KeywordModule, SearchIntent } from '../types/audit';
import { FindingsList } from './FindingsList';
import { getScoreTone } from './StatusIndicator';

interface KeywordsTabProps {
  keywordsModule: KeywordModule;
}

type SortKey = 'relevance' | 'difficulty' | 'keyword';

export const KeywordsTab: React.FC<KeywordsTabProps> = ({ keywordsModule }) => {
  const [groupFilter, setGroupFilter] = useState<'all' | KeywordGroup>('all');
  const [intentFilter, setIntentFilter] = useState<'all' | SearchIntent>('all');
  const [quickWinsOnly, setQuickWinsOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('relevance');
  const [sortAsc, setSortAsc] = useState(false);

  const tone = getScoreTone(keywordsModule.score);

  const filteredKeywords = useMemo(() => {
    const q = query.trim().toLowerCase();
    const diffRank: Record<string, number> = { Low: 1, Medium: 2, High: 3 };

    const list = keywordsModule.keywords.filter((kw) => {
      if (groupFilter !== 'all' && kw.group !== groupFilter) return false;
      if (intentFilter !== 'all' && kw.searchIntent !== intentFilter) return false;
      if (quickWinsOnly && !kw.quickWin) return false;
      if (
        q &&
        !kw.keyword.toLowerCase().includes(q) &&
        !kw.contentTypeToTarget.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'relevance') {
        cmp = a.estimatedRelevance - b.estimatedRelevance;
      } else if (sortBy === 'difficulty') {
        cmp =
          (diffRank[a.estimatedDifficulty] ?? 2) -
          (diffRank[b.estimatedDifficulty] ?? 2);
      } else {
        cmp = a.keyword.localeCompare(b.keyword);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [
    keywordsModule.keywords,
    groupFilter,
    intentFilter,
    quickWinsOnly,
    query,
    sortBy,
    sortAsc,
  ]);

  const groupCounts = useMemo(() => {
    const groups: KeywordGroup[] = [
      'primary',
      'secondary',
      'long-tail',
      'question-based',
    ];
    return groups.map((g) => ({
      name: g.charAt(0).toUpperCase() + g.slice(1),
      count: keywordsModule.keywords.filter((k) => k.group === g).length,
      quickWins: keywordsModule.keywords.filter((k) => k.group === g && k.quickWin)
        .length,
    }));
  }, [keywordsModule.keywords]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortBy(key);
      setSortAsc(key === 'keyword' || key === 'difficulty');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Strategy */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Keyword Suggestions & Strategy
            </h2>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              {keywordsModule.summary}
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <div className="text-xs font-medium text-slate-500">Module Score</div>
            <div className={`font-display text-3xl font-extrabold tabular-nums ${tone.text}`}>
              {keywordsModule.score}
              <span className="text-sm font-medium text-slate-400">/100</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <h3 className="text-xs font-semibold text-slate-500 mb-1.5">
              Keyword Strategy
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed">
              {keywordsModule.keywordStrategy}
            </p>
          </div>
          <div className="lg:col-span-5 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={groupCounts}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Total" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="quickWins" name="Quick Wins" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* AI Estimates Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 text-xs sm:text-sm text-amber-900">
        <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold">AI Estimates Notice: </span>
          Search volume bands, difficulty levels, and relevance scores below are{' '}
          <strong>AI estimates</strong> derived from page context and search grounding—not live tool-verified clickstream or Google Keyword Planner data.
        </div>
      </div>

      {/* Keyword Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'all', label: `All (${keywordsModule.keywords.length})` },
                { id: 'primary', label: 'Primary' },
                { id: 'secondary', label: 'Secondary' },
                { id: 'long-tail', label: 'Long-tail' },
                { id: 'question-based', label: 'Question-based' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGroupFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  groupFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search keywords..."
                aria-label="Search keywords"
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <select
              value={intentFilter}
              onChange={(e) =>
                setIntentFilter(e.target.value as 'all' | SearchIntent)
              }
              aria-label="Filter by search intent"
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">All intents</option>
              <option value="informational">Informational</option>
              <option value="commercial">Commercial</option>
              <option value="transactional">Transactional</option>
              <option value="navigational">Navigational</option>
            </select>

            <button
              type="button"
              onClick={() => setQuickWinsOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                quickWinsOnly
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quick wins</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('keyword')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>Keyword</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">Group</th>
                <th className="py-3 px-3">Search Intent</th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('difficulty')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>Est. Difficulty</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">Est. Volume</th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('relevance')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto"
                  >
                    <span>Relevance</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Target Content Type</th>
                <th className="py-3 px-3 text-center">Quick Win</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredKeywords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                    No keywords match your current filters.
                  </td>
                </tr>
              ) : (
                filteredKeywords.map((kw, idx) => (
                  <tr key={`${kw.keyword}-${idx}`} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {kw.keyword}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-600 capitalize whitespace-nowrap">
                      {kw.group}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-600 capitalize whitespace-nowrap">
                      {kw.searchIntent}
                    </td>
                    <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          kw.estimatedDifficulty === 'Low'
                            ? 'text-emerald-700'
                            : kw.estimatedDifficulty === 'Medium'
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }`}
                      >
                        {kw.estimatedDifficulty}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-600 font-mono whitespace-nowrap">
                      {kw.estimatedVolumeBand}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {kw.estimatedRelevance}/10
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-700">
                      {kw.contentTypeToTarget}
                    </td>
                    <td className="py-2.5 px-3 text-center text-xs whitespace-nowrap">
                      {kw.quickWin ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <FindingsList
        findings={keywordsModule.findings}
        title="Keyword Audit Findings"
      />
    </div>
  );
};
