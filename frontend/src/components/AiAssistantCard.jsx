import { AlertTriangle, CheckCircle2, Cpu, Sparkles } from 'lucide-react';
import { PriorityBadge, StatusBadge } from './StatusBadge.jsx';

export function AiAssistantCard({
  analysis,
  onApplySuggestions,
  showApplyButton = false,
  applied = false
}) {
  if (!analysis || !analysis.summary) return null;

  const isFallback = Boolean(analysis.isFallback);

  return (
    <div
      className={`rounded-xl border p-4 ${
        isFallback
          ? 'bg-amber-50/70 border-amber-300'
          : 'bg-emerald-50/70 border-emerald-300'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isFallback ? (
            <Cpu className="w-5 h-5 text-amber-700" />
          ) : (
            <Sparkles className="w-5 h-5 text-emerald-700" />
          )}
          <h4 className="font-bold text-sm text-slate-900">
            AI Grievance Assistant (Advisory Only)
          </h4>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isFallback
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
          }`}
        >
          {isFallback
            ? `Labelled Fallback (${analysis.model || 'heuristic-fallback'})`
            : `Live Gemini AI (${analysis.model || 'gemini'})`}
        </span>
      </div>

      {isFallback && analysis.fallbackReason && (
        <div className="mb-3 flex items-start gap-2 text-xs text-amber-900 bg-amber-100/80 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Fallback Mode Active:</strong> {analysis.fallbackReason} Suggestions are
            rule-assisted heuristics and require human confirmation.
          </span>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3 mb-3 text-sm">
        <div className="bg-white rounded-lg p-2.5 border border-slate-200">
          <p className="text-xs text-slate-500">Suggested Department</p>
          <p className="font-semibold text-slate-900">
            {analysis.suggestedDepartmentName || analysis.suggestedDepartmentCode || '—'}
          </p>
        </div>
        <div className="bg-white rounded-lg p-2.5 border border-slate-200">
          <p className="text-xs text-slate-500">Suggested Category</p>
          <p className="font-semibold text-slate-900">{analysis.suggestedCategory || '—'}</p>
        </div>
        <div className="bg-white rounded-lg p-2.5 border border-slate-200">
          <p className="text-xs text-slate-500">Recommended Priority</p>
          <div className="mt-1">
            <PriorityBadge priority={analysis.recommendedPriority || 'Medium'} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Short CMO Summary
        </p>
        <p className="text-slate-800">{analysis.summary}</p>
        {analysis.reasoning && (
          <p className="text-xs text-slate-500 mt-1.5">
            <strong>Rationale:</strong> {analysis.reasoning}
          </p>
        )}
      </div>

      {Array.isArray(analysis.potentialDuplicates) && analysis.potentialDuplicates.length > 0 && (
        <div className="bg-white rounded-lg p-3 border border-amber-300 mb-3">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Potential Duplicate Grievances Flagged for Human Review
          </p>
          <ul className="space-y-1.5">
            {analysis.potentialDuplicates.map((dup) => (
              <li
                key={dup.referenceId}
                className="flex flex-wrap items-center justify-between gap-2 text-xs bg-amber-50/60 px-2.5 py-1.5 rounded border border-amber-200"
              >
                <div>
                  <span className="font-mono font-semibold text-slate-800">{dup.referenceId}</span>{' '}
                  — <span className="text-slate-700">{dup.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={dup.status} />
                  <span className="font-semibold text-amber-900">
                    {Math.round((dup.similarityScore || 0) * 100)}% match
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-600">
          Human-in-the-loop safeguard: AI never makes official routing or closure decisions.
        </p>
        {showApplyButton && onApplySuggestions && (
          <button
            type="button"
            onClick={onApplySuggestions}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              applied
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {applied
              ? `Applied (${analysis.suggestedCategory} • ${analysis.recommendedPriority})`
              : 'Apply Suggested Category & Priority'}
          </button>
        )}
      </div>
    </div>
  );
}
