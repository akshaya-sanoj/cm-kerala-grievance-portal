const STATUS_STYLES = {
  Submitted: 'bg-slate-100 text-slate-700 border-slate-300',
  'Under Review': 'bg-amber-50 text-amber-800 border-amber-300',
  'In Progress': 'bg-blue-50 text-blue-800 border-blue-300',
  Resolved: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  Reopened: 'bg-rose-50 text-rose-800 border-rose-300'
};

const PRIORITY_STYLES = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  High: 'bg-red-50 text-red-700 border-red-300'
};

export function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const cls = PRIORITY_STYLES[priority] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${cls}`}
    >
      {priority}
    </span>
  );
}
