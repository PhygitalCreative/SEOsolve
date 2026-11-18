import { useEffect, useRef, useState } from 'react';
import { AuditProgressView } from './components/AuditProgressView';
import { DashboardView } from './components/DashboardView';
import { Header, type DashboardTab } from './components/Header';
import { LandingView } from './components/LandingView';
import type {
  AuditHistoryEntry,
  AuditProgressEvent,
  AuditReport,
  AuditRequest,
  AuditStepId,
} from './types/audit';
import {
  deleteAuditFromHistory,
  loadAuditHistory,
  saveAuditToHistory,
  updateChecklistStateInHistory,
} from './utils/storage';

type ViewMode = 'landing' | 'loading' | 'dashboard';

export default function App() {
  const [mode, setMode] = useState<ViewMode>('landing');
  const [history, setHistory] = useState<AuditHistoryEntry[]>(() =>
    loadAuditHistory(),
  );
  const [activeReport, setActiveReport] = useState<AuditReport | null>(null);
  const [checkedChecklistIds, setCheckedChecklistIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const [pendingUrl, setPendingUrl] = useState('');
  const [currentStep, setCurrentStep] = useState<AuditStepId>('reading_page');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const historySectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleRunAudit = async (request: AuditRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setErrorBanner(null);
    setPendingUrl(request.url);
    setCurrentStep('reading_page');
    setMode('loading');

    try {
      const response = await fetch('/api/audit/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = `Audit request failed (${response.status}).`;
        try {
          const errBody = await response.json();
          if (errBody?.error) message = errBody.error;
        } catch {
          // ignore JSON parse failure
        }
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error('Streaming response body is unavailable.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completedReport: AuditReport | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const rawEvent of events) {
          const lines = rawEvent.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const jsonText = line.slice(5).trim();
            if (!jsonText) continue;

            const parsed = JSON.parse(jsonText) as AuditProgressEvent;
            if (parsed.type === 'progress' && parsed.step) {
              setCurrentStep(parsed.step);
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error || 'Audit failed on the server.');
            } else if (parsed.type === 'complete' && parsed.report) {
              completedReport = parsed.report;
            }
          }
        }
      }

      if (!completedReport) {
        throw new Error('Audit stream ended without returning a report.');
      }

      const updatedHistory = saveAuditToHistory(completedReport);
      setHistory(updatedHistory);
      setActiveReport(completedReport);
      setCheckedChecklistIds([]);
      setActiveTab('overview');
      setMode('dashboard');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMode('landing');
        return;
      }
      setErrorBanner(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during the audit.',
      );
      setMode('landing');
    }
  };

  const handleCancelAudit = () => {
    abortRef.current?.abort();
    setMode('landing');
  };

  const handleReopenAudit = (entry: AuditHistoryEntry) => {
    setErrorBanner(null);
    setActiveReport(entry.report);
    setCheckedChecklistIds(entry.checkedChecklistIds ?? []);
    setActiveTab('overview');
    setMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAudit = (auditId: string) => {
    const updated = deleteAuditFromHistory(auditId);
    setHistory(updated);
    if (activeReport?.id === auditId) {
      setActiveReport(null);
      setMode('landing');
    }
  };

  const handleToggleChecklistItem = (itemId: string) => {
    if (!activeReport) return;
    setCheckedChecklistIds((prev) => {
      const exists = prev.includes(itemId);
      const next = exists
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      const updated = updateChecklistStateInHistory(activeReport.id, next);
      setHistory(updated);
      return next;
    });
  };

  const handleGoHome = () => {
    if (mode === 'loading') {
      abortRef.current?.abort();
    }
    setMode('landing');
  };

  const handleScrollToHistory = () => {
    historySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        mode={mode}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNewAudit={handleGoHome}
        onGoHome={handleGoHome}
        historyCount={history.length}
        onScrollToHistory={handleScrollToHistory}
      />

      {mode === 'landing' && (
        <LandingView
          onSubmitAudit={handleRunAudit}
          history={history}
          onReopenAudit={handleReopenAudit}
          onDeleteAudit={handleDeleteAudit}
          errorBanner={errorBanner}
          historySectionRef={historySectionRef}
        />
      )}

      {mode === 'loading' && (
        <AuditProgressView
          targetUrl={pendingUrl}
          currentStep={currentStep}
          onCancel={handleCancelAudit}
        />
      )}

      {mode === 'dashboard' && activeReport && (
        <DashboardView
          report={activeReport}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          checkedChecklistIds={checkedChecklistIds}
          onToggleChecklistItem={handleToggleChecklistItem}
        />
      )}
    </div>
  );
}
