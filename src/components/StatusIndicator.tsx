import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import type { ChecklistStatus, PriorityLevel } from '../types/audit';

interface StatusLabelProps {
  status: ChecklistStatus;
}

export const StatusLabel: React.FC<StatusLabelProps> = ({ status }) => {
  switch (status) {
    case 'pass':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Pass</span>
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Warning</span>
        </span>
      );
    case 'fail':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap shrink-0">
          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>Fail</span>
        </span>
      );
    case 'could_not_verify':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Could not verify</span>
        </span>
      );
  }
};

interface PriorityLabelProps {
  priority: PriorityLevel;
}

export const PriorityLabel: React.FC<PriorityLabelProps> = ({ priority }) => {
  const styles: Record<PriorityLevel, string> = {
    high: 'text-red-700 bg-red-50 border-red-200',
    medium: 'text-amber-700 bg-amber-50 border-amber-200',
    low: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  const label: Record<PriorityLevel, string> = {
    high: 'High priority',
    medium: 'Medium priority',
    low: 'Low priority',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${styles[priority]}`}
    >
      {label[priority]}
    </span>
  );
};

export function getScoreTone(score: number): {
  text: string;
  bar: string;
  label: string;
} {
  if (score >= 80) {
    return { text: 'text-emerald-700', bar: 'bg-emerald-600', label: 'Strong' };
  }
  if (score >= 60) {
    return { text: 'text-amber-700', bar: 'bg-amber-500', label: 'Needs work' };
  }
  return { text: 'text-red-700', bar: 'bg-red-600', label: 'Critical' };
}
