import { AlertTriangle, CheckCircle2, Cpu, Sparkles } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { PriorityBadge, StatusBadge } from './StatusBadge.jsx';

export function AiAssistantCard({
  analysis,
  onApplySuggestions,
  showApplyButton = false,
  applied = false
}) {
  const { tr, tCategory, tPriority, tDeptName } = usePreferences();

  if (!analysis || !analysis.summary) return null;

  const isFallback = Boolean(analysis.isFallback);

  return (
    <div
      className={`animate-scale-in rounded-xl border p-4 ${
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
            {tr('AI Grievance Assistant (Advisory Only)', 'AI പരാതി സഹായി (നിർദ്ദേശം മാത്രം)')}
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
            ? `${tr('Labelled Fallback', 'ഫോൾബാക്ക് മോഡ്')} (${analysis.model || 'heuristic-fallback'})`
            : `${tr('Live Gemini AI', 'തത്സമയ Gemini AI')} (${analysis.model || 'gemini'})`}
        </span>
      </div>

      {isFallback && analysis.fallbackReason && (
        <div className="mb-3 flex items-start gap-2 text-xs text-amber-900 bg-amber-100/80 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>{tr('Fallback Mode Active:', 'ഫോൾബാക്ക് മോഡ് സജീവം:')}</strong>{' '}
            {analysis.fallbackReason}{' '}
            {tr(
              'Suggestions are rule-assisted heuristics and require human confirmation.',
              'നിർദ്ദേശങ്ങൾ ഉദ്യോഗസ്ഥ പരിശോധനയ്ക്ക് വിധേയമാണ്.'
            )}
          </span>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3 mb-3 text-sm">
        <div className="bg-white rounded-lg p-2.5 border border-slate-200">
          <p className="text-xs text-slate-500">{tr('Suggested Department', 'നിർദ്ദേശിച്ച വകുപ്പ്')}</p>
          <p className="font-semibold text-slate-900">
            {tDeptName(analysis.suggestedDepartmentName, analysis.suggestedDepartmentCode) ||
              analysis.suggestedDepartmentCode ||
              '—'}
          </p>
        </div>
        <div className="bg-white rounded-lg p-2.5 border border-slate-200">
          <p className="text-xs text-slate-500">{tr('Suggested Category', 'നിർദ്ദേശിച്ച വിഭാഗം')}</p>
          <p className="font-semibold text-slate-900">
            {analysis.suggestedCategory ? tCategory(analysis.suggestedCategory) : '—'}
          </p>
        </div>
        <div className="bg-white rounded-lg p-2.5 border border-slate-200">
          <p className="text-xs text-slate-500">{tr('Recommended Priority', 'മുൻഗണനാ നില')}</p>
          <div className="mt-1">
            <PriorityBadge priority={analysis.recommendedPriority || 'Medium'} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          {tr('Short CMO Summary', 'ചുരുക്ക സംഗ്രഹം (CMO)')}
        </p>
        <p className="text-slate-800">{analysis.summary}</p>
        {analysis.reasoning && (
          <p className="text-xs text-slate-500 mt-1.5">
            <strong>{tr('Rationale:', 'കാരണം:')}</strong> {analysis.reasoning}
          </p>
        )}
      </div>

      {Array.isArray(analysis.potentialDuplicates) && analysis.potentialDuplicates.length > 0 && (
        <div className="bg-white rounded-lg p-3 border border-amber-300 mb-3">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {tr(
              'Potential Duplicate Grievances Flagged for Human Review',
              'സമാനമായ പരാതികൾ (പരിശോധനയ്ക്ക്)'
            )}
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
                    {Math.round((dup.similarityScore || 0) * 100)}% {tr('match', 'സാമ്യം')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-600">
          {tr(
            'Human-in-the-loop safeguard: AI never makes official routing or closure decisions.',
            'ഉദ്യോഗസ്ഥ നിയന്ത്രണം: AI അന്തിമ തീരുമാനങ്ങൾ എടുക്കില്ല.'
          )}
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
              ? `${tr('Applied', 'ബാധകമാക്കി')} (${tCategory(analysis.suggestedCategory)} • ${tPriority(
                  analysis.recommendedPriority
                )})`
              : tr('Apply Suggested Category & Priority', 'നിർദ്ദേശിച്ച വിഭാഗവും മുൻഗണനയും ചേർക്കുക')}
          </button>
        )}
      </div>
    </div>
  );
}
