import type { AuditHistoryEntry, AuditReport } from '../types/audit';

const STORAGE_KEY = 'seosolve_audit_history_v1';
const MAX_HISTORY_ITEMS = 10;

export function loadAuditHistory(): AuditHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

function persistHistory(entries: AuditHistoryEntry[]): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_HISTORY_ITEMS)),
    );
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function saveAuditToHistory(report: AuditReport): AuditHistoryEntry[] {
  const existing = loadAuditHistory().filter((item) => item.report.id !== report.id);
  const newEntry: AuditHistoryEntry = {
    report,
    checkedChecklistIds: [],
  };
  const updated = [newEntry, ...existing].slice(0, MAX_HISTORY_ITEMS);
  persistHistory(updated);
  return updated;
}

export function updateChecklistStateInHistory(
  auditId: string,
  checkedIds: string[],
): AuditHistoryEntry[] {
  const existing = loadAuditHistory();
  const updated = existing.map((entry) =>
    entry.report.id === auditId
      ? { ...entry, checkedChecklistIds: checkedIds }
      : entry,
  );
  persistHistory(updated);
  return updated;
}

export function deleteAuditFromHistory(auditId: string): AuditHistoryEntry[] {
  const updated = loadAuditHistory().filter((item) => item.report.id !== auditId);
  persistHistory(updated);
  return updated;
}
