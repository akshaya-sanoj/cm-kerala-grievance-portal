import { Check, RefreshCw } from 'lucide-react';

const PRIMARY_STEPS = [
  { key: 'Submitted', label: 'Submitted', sub: 'Logged & Ref ID Issued' },
  { key: 'Under Review', label: 'Under Review', sub: 'CMO Screening / Routed' },
  { key: 'In Progress', label: 'In Progress', sub: 'Officer Investigating / ATR' },
  { key: 'Resolved', label: 'Resolved', sub: 'CMO Verified Closure' }
];

export function StatusStepper({ status }) {
  const isReopened = status === 'Reopened';
  const activeIndex = isReopened
    ? 1
    : Math.max(
        0,
        PRIMARY_STEPS.findIndex((s) => s.key === status)
      );
  const progressPct = isReopened ? 35 : Math.round(((activeIndex + 1) / PRIMARY_STEPS.length) * 100);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Grievance Lifecycle Progress
        </span>
        {isReopened ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <RefreshCw className="w-3 h-3" /> Reopened by Citizen — Back Under Review
          </span>
        ) : (
          <span className="text-[11px] font-bold text-indigo-700">{progressPct}% Complete</span>
        )}
      </div>

      {/* Animated Progress Track */}
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          key={status}
          style={{ width: `${progressPct}%` }}
          className={`h-full rounded-full animate-progress-fill ${
            isReopened
              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
              : progressPct === 100
              ? 'bg-gradient-to-r from-indigo-600 to-emerald-500'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-400'
          }`}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PRIMARY_STEPS.map((step, idx) => {
          const completed = !isReopened && idx < activeIndex;
          const active = !isReopened && idx === activeIndex;

          return (
            <div
              key={step.key}
              className={`rounded-lg p-3 border transition-all duration-300 ${
                active
                  ? 'bg-white border-indigo-600 ring-2 ring-indigo-100 shadow-sm scale-[1.02]'
                  : completed
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-white/60 border-slate-200 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                    completed
                      ? 'bg-emerald-600 text-white'
                      : active
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {completed ? <Check className="w-3 h-3" /> : idx + 1}
                </span>
                <span className="text-xs font-bold text-slate-900">{step.label}</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-7">{step.sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
