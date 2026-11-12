import { Lock, ShieldCheck } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { formatDateTime, getRoleLabel } from '../utils/formatters.js';
import { StatusBadge } from './StatusBadge.jsx';

export function Timeline({ history = [] }) {
  const { tr, tStage, tRole } = usePreferences();

  if (!history.length) {
    return (
      <p className="text-sm text-slate-500">
        {tr('No workflow history recorded yet.', 'നടപടി ചരിത്രം ഇതുവരെ രേഖപ്പെടുത്തിയിട്ടില്ല.')}
      </p>
    );
  }

  return (
    <ol className="relative border-l-2 border-indigo-200 ml-3 space-y-5">
      {history.map((item) => (
        <li key={item._id} className="ml-6">
          <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 ring-4 ring-white">
            <ShieldCheck className="w-3 h-3 text-white" />
          </span>
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.newStatus} />
                <span className="text-xs font-semibold text-slate-700">
                  {tStage(item.workflowStage)}
                </span>
                {item.isInternal && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                    <Lock className="w-3 h-3" /> {tr('Internal CMO Note', 'ആഭ്യന്തര CMO കുറിപ്പ്')}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{item.remarks}</p>
            <p className="mt-1.5 text-xs text-slate-500">
              {tr('Updated by', 'പുതുക്കിയത്')}{' '}
              <span className="font-medium text-slate-700">
                {item.changedByName || getRoleLabel(item.changedByRole)}
              </span>{' '}
              ({tRole(item.changedByRole) || getRoleLabel(item.changedByRole)})
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
