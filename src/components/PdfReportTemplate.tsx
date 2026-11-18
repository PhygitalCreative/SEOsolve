import React from 'react';
import type { AuditReport } from '../types/audit';

interface PdfReportTemplateProps {
  report: AuditReport;
  checkedChecklistIds: string[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const statusColors: Record<string, { text: string; bg: string }> = {
  pass: { text: '#15803d', bg: '#f0fdf4' },
  warning: { text: '#b45309', bg: '#fffbeb' },
  fail: { text: '#b91c1c', bg: '#fef2f2' },
  could_not_verify: { text: '#475569', bg: '#f1f5f9' },
};

export const PdfReportTemplate: React.FC<PdfReportTemplateProps> = ({
  report,
  checkedChecklistIds,
  containerRef,
}) => {
  const checkedSet = new Set(checkedChecklistIds);
  const formattedDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      style={{
        position: 'fixed',
        left: '-10000px',
        top: 0,
        width: '960px',
        pointerEvents: 'none',
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      <div
        id="seosolve-pdf-root"
        ref={containerRef}
        style={{
          width: '960px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
          padding: '32px',
          boxSizing: 'border-box',
          lineHeight: 1.5,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '24px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              SEOsolve Audit Report
            </div>
            <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
              {report.input.url}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {formattedDate} · {report.input.targetCountry || 'Global'} ·{' '}
              {report.input.primaryLanguage || 'English'}
              {report.input.businessType ? ` · ${report.input.businessType}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              OVERALL SCORE
            </div>
            <div
              style={{
                fontSize: '38px',
                fontWeight: 800,
                color: '#1d4ed8',
                lineHeight: 1.1,
              }}
            >
              {report.overallScore}
              <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>
                /100
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
            Executive Summary
          </div>
          <div style={{ fontSize: '13px', color: '#334155' }}>
            {report.executiveSummary}
          </div>
        </div>

        {/* Module Scores Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          {[
            { label: 'On-Page SEO', score: report.seoAudit.score },
            { label: 'Technical SEO', score: report.technicalChecklist.score },
            { label: 'Content', score: report.contentRecommendations.score },
            { label: 'Keywords', score: report.keywordSuggestions.score },
            { label: 'AI-Search GEO', score: report.aiSearchGeo.score },
          ].map((mod) => (
            <div
              key={mod.label}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: '#ffffff',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                {mod.label}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginTop: '4px',
                }}
              >
                {mod.score}
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>/100</span>
              </div>
            </div>
          ))}
        </div>

        {/* Top Priorities */}
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '6px',
              marginBottom: '12px',
            }}
          >
            Top Priority Action Plan
          </h2>
          {report.topPriorities.map((item, idx) => (
            <div
              key={idx}
              style={{
                borderBottom: '1px solid #f1f5f9',
                padding: '8px 0',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                {idx + 1}. {item.title}{' '}
                <span style={{ fontWeight: 500, color: '#64748b' }}>
                  ({item.module} · {item.priority} priority)
                </span>
              </div>
              <div style={{ color: '#334155', marginTop: '2px' }}>{item.action}</div>
            </div>
          ))}
        </div>

        {/* On-Page SEO Findings */}
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '6px',
              marginBottom: '12px',
            }}
          >
            On-Page SEO Findings ({report.seoAudit.score}/100)
          </h2>
          <p style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
            {report.seoAudit.summary}
          </p>
          {report.seoAudit.findings.map((f) => {
            const palette = statusColors[f.status] ?? statusColors.warning;
            return (
              <div
                key={f.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{f.title}</span>
                  <span
                    style={{
                      color: palette.text,
                      backgroundColor: palette.bg,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {f.status} · {f.priority}
                  </span>
                </div>
                <div style={{ color: '#475569', marginBottom: '3px' }}>{f.impact}</div>
                <div style={{ color: '#0f172a' }}>
                  <strong>Fix:</strong> {f.fix}
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Checklist Summary */}
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '6px',
              marginBottom: '12px',
            }}
          >
            Technical SEO Checklist ({report.technicalChecklist.score}/100) —{' '}
            {checkedChecklistIds.length}/{report.technicalChecklist.items.length} Resolved
          </h2>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Done</th>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Category</th>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Check Item</th>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Status</th>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Fix</th>
              </tr>
            </thead>
            <tbody>
              {report.technicalChecklist.items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    {checkedSet.has(item.id) ? '[x]' : '[ ]'}
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #e2e8f0', color: '#475569' }}>
                    {item.group}
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                    {item.title}
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>
                    {item.status.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '6px', border: '1px solid #e2e8f0', color: '#334155' }}>
                    {item.fix}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Content Recommendations */}
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '6px',
              marginBottom: '12px',
            }}
          >
            Suggested Content Topics ({report.contentRecommendations.score}/100)
          </h2>
          {report.contentRecommendations.suggestedTopics.map((topic, i) => (
            <div
              key={i}
              style={{
                borderBottom: '1px solid #f1f5f9',
                padding: '8px 0',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {i + 1}. {topic.title}
              </div>
              <div style={{ color: '#475569', fontSize: '11px' }}>
                {topic.format} · {topic.searchIntent} · Target: {topic.targetKeyword}
              </div>
            </div>
          ))}
        </div>

        {/* Keyword Suggestions */}
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '6px',
              marginBottom: '8px',
            }}
          >
            Keyword Suggestions ({report.keywordSuggestions.score}/100)
          </h2>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
            Note: Volume and difficulty figures below are AI estimates, not tool-verified data.
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Keyword</th>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Group</th>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Intent</th>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Difficulty (Est.)</th>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Relevance</th>
                <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>Quick Win</th>
              </tr>
            </thead>
            <tbody>
              {report.keywordSuggestions.keywords.map((kw, i) => (
                <tr key={i}>
                  <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                    {kw.keyword}
                  </td>
                  <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0' }}>{kw.group}</td>
                  <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0' }}>
                    {kw.searchIntent}
                  </td>
                  <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0' }}>
                    {kw.estimatedDifficulty}
                  </td>
                  <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0' }}>
                    {kw.estimatedRelevance}/10
                  </td>
                  <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0' }}>
                    {kw.quickWin ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI-Search GEO */}
        <div>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '6px',
              marginBottom: '12px',
            }}
          >
            AI-Search Optimization / GEO ({report.aiSearchGeo.score}/100)
          </h2>
          <p style={{ fontSize: '12px', color: '#334155', marginBottom: '10px' }}>
            {report.aiSearchGeo.summary}
          </p>
          {report.aiSearchGeo.findings.map((f) => (
            <div
              key={f.id}
              style={{
                borderBottom: '1px solid #f1f5f9',
                padding: '6px 0',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {f.title} ({f.status} · {f.priority})
              </div>
              <div style={{ color: '#334155' }}>{f.fix}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
