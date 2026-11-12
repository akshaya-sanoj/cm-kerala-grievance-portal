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

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Grievance Lifecycle Progress
        </span>
        {isReopened && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <RefreshCw className="w-3 h-3" /> Reopened by Citizen — Back Under Review
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PRIMARY_STEPS.map((step, idx) => {
          const completed = !isReopened && idx < activeIndex;
          const active = !isReopened && idx === activeIndex;

          return (
            <div
              key={step.key}
              className={`rounded-lg p-3 border transition ${
                active
                  ? 'bg-white border-civic-600 ring-2 ring-civic-100 shadow-sm'
                  : completed
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-white/60 border-slate-200 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    completed
                      ? 'bg-emerald-600 text-white'
                      : active
                      ? 'bg-civic-700 text-white'
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
