import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ContentModule, SearchIntent } from '../types/audit';
import { FindingsList } from './FindingsList';
import { getScoreTone } from './StatusIndicator';

interface ContentTabProps {
  content: ContentModule;
}

export const ContentTab: React.FC<ContentTabProps> = ({ content }) => {
  const [intentFilter, setIntentFilter] = useState<'all' | SearchIntent>('all');
  const [expandedTopicIdx, setExpandedTopicIdx] = useState<number | null>(0);
  const tone = getScoreTone(content.score);

  const filteredTopics = content.suggestedTopics.filter((topic) =>
    intentFilter === 'all' ? true : topic.searchIntent === intentFilter,
  );

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Content Recommendations
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            {content.summary}
          </p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <div className="text-xs font-medium text-slate-500">Module Score</div>
          <div className={`font-display text-3xl font-extrabold tabular-nums ${tone.text}`}>
            {content.score}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </div>
        </div>
      </section>

      {/* Competitor Content Gaps */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Content Gaps vs. Competitors
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Topics and formats where competing sites capture search demand today
          </p>
        </div>
        <div className="divide-y divide-slate-200">
          {content.competitorGaps.map((gap, idx) => (
            <div key={idx} className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">
                  Topic Gap
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {gap.topic}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">
                  Competitor Advantage
                </div>
                <p className="text-sm text-slate-700">{gap.competitorAdvantage}</p>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">
                  Your Opportunity
                </div>
                <p className="text-sm text-slate-900">{gap.opportunity}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10 Suggested Topics */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              10 Suggested Content Topics & H2 Outlines
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritized pages and articles with search intent, target keywords, and structure
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                'all',
                'informational',
                'commercial',
                'transactional',
                'navigational',
              ] as const
            ).map((intent) => (
              <button
                key={intent}
                type="button"
                onClick={() => setIntentFilter(intent)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 capitalize ${
                  intentFilter === intent
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {intent}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredTopics.map((topic, idx) => {
            const isExpanded = expandedTopicIdx === idx;
            return (
              <div key={idx} className="p-5">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedTopicIdx(isExpanded ? null : idx)
                  }
                  className="w-full text-left flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-mono font-semibold text-blue-700 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700">
                        {topic.format}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{topic.searchIntent} intent</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Target:{' '}
                        <strong className="font-medium text-slate-800">
                          {topic.targetKeyword}
                        </strong>
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900">
                      {topic.title}
                    </h4>
                  </div>
                  <span className="mt-1 text-slate-400 shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-600 mb-2">
                      Suggested H2 Outline
                    </div>
                    <ol className="space-y-1.5 text-sm text-slate-700 list-decimal list-inside">
                      {topic.suggestedOutline.map((h2, hIdx) => (
                        <li key={hIdx}>{h2}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Topic Clusters + Refresh Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Topic Clusters & Pillar Pages
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Hub-and-spoke architectures to build topical authority
          </p>
          <div className="space-y-5">
            {content.topicClusters.map((cluster, idx) => (
              <div
                key={idx}
                className="pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="text-sm font-semibold text-slate-900">
                  Pillar: {cluster.pillarTitle}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Audience: {cluster.targetAudience}
                </div>
                <ul className="mt-2 space-y-1 text-xs text-slate-700 list-disc list-inside">
                  {cluster.clusterTopics.map((sub, sIdx) => (
                    <li key={sIdx}>{sub}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Content Refresh Opportunities
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Existing sections or pages to expand, update, or consolidate
          </p>
          <div className="space-y-4">
            {content.refreshOpportunities.map((op, idx) => (
              <div
                key={idx}
                className="pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {op.pageOrSection}
                </div>
                <div className="text-xs text-slate-600 mt-1">{op.reason}</div>
                <div className="text-xs text-slate-900 mt-1.5">
                  <span className="font-semibold">Update: </span>
                  {op.recommendedUpdate}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Internal Linking Suggestions */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Internal Linking Suggestions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Source Context</th>
                <th className="py-3 px-4">Suggested Anchor Text</th>
                <th className="py-3 px-4">Target Page</th>
                <th className="py-3 px-4">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {content.internalLinkingSuggestions.map((link, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-800">{link.sourceContext}</td>
                  <td className="py-3 px-4 font-mono text-xs text-blue-700 font-medium">
                    {link.anchorText}
                  </td>
                  <td className="py-3 px-4 text-slate-900 font-medium">
                    {link.targetPage}
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs">
                    {link.rationale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FindingsList
        findings={content.findings}
        title="Content Audit Findings"
      />
    </div>
  );
};
