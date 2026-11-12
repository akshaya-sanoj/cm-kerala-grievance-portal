import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

function formatRemaining(dueDate, status, nowMs) {
  if (status === 'Resolved') {
    return {
      label: 'SLA Closed',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: 'done',
      pulse: false
    };
  }
  if (!dueDate) {
    return {
      label: 'SLA Pending',
      tone: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: 'clock',
      pulse: false
    };
  }

  const diffMs = new Date(dueDate).getTime() - nowMs;
  if (Number.isNaN(diffMs)) {
    return {
      label: 'SLA Tracked',
      tone: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: 'clock',
      pulse: false
    };
  }

  const absHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
  const days = Math.floor(absHours / 24);
  const hours = absHours % 24;

  if (diffMs < 0) {
    const text = days > 0 ? `Overdue ${days}d ${hours}h` : `Overdue ${Math.max(1, hours)}h`;
    return {
      label: text,
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: 'alert',
      pulse: true
    };
  }

  if (absHours <= 24) {
    return {
      label: `Due in ${Math.max(1, hours)}h`,
      tone: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: 'clock',
      pulse: true
    };
  }

  return {
    label: `${days}d ${hours}h left`,
    tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: 'clock',
    pulse: false
  };
}

export function SlaCountdownBadge({ dueDate, status }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const info = formatRemaining(dueDate, status, nowMs);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${info.tone}`}
    >
      {info.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {!info.pulse && info.icon === 'done' && <CheckCircle2 className="w-3 h-3" />}
      {!info.pulse && info.icon === 'alert' && <AlertTriangle className="w-3 h-3" />}
      {!info.pulse && info.icon === 'clock' && <Clock className="w-3 h-3" />}
      {info.label}
    </span>
  );
}
