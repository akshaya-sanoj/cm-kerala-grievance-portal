import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext.jsx';

function formatRemaining(dueDate, status, nowMs, tr) {
  if (status === 'Resolved') {
    return {
      label: tr('SLA Closed', 'SLA പൂർത്തിയാക്കി'),
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: 'done',
      pulse: false
    };
  }
  if (!dueDate) {
    return {
      label: tr('SLA Pending', 'SLA തീയതി കാത്തിരിക്കുന്നു'),
      tone: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: 'clock',
      pulse: false
    };
  }

  const diffMs = new Date(dueDate).getTime() - nowMs;
  if (Number.isNaN(diffMs)) {
    return {
      label: tr('SLA Tracked', 'SLA നിരീക്ഷണത്തിൽ'),
      tone: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: 'clock',
      pulse: false
    };
  }

  const absHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
  const days = Math.floor(absHours / 24);
  const hours = absHours % 24;

  if (diffMs < 0) {
    const text =
      days > 0
        ? tr(`Overdue ${days}d ${hours}h`, `${days}ദി ${hours}മ. വൈകി`)
        : tr(`Overdue ${Math.max(1, hours)}h`, `${Math.max(1, hours)}മ. വൈകി`);
    return {
      label: text,
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: 'alert',
      pulse: true
    };
  }

  if (absHours <= 24) {
    return {
      label: tr(`Due in ${Math.max(1, hours)}h`, `${Math.max(1, hours)}മ. ശേഷിക്കുന്നു`),
      tone: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: 'clock',
      pulse: true
    };
  }

  return {
    label: tr(`${days}d ${hours}h left`, `${days}ദി ${hours}മ. ബാക്കി`),
    tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: 'clock',
    pulse: false
  };
}

export function SlaCountdownBadge({ dueDate, status }) {
  const { tr } = usePreferences();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const info = formatRemaining(dueDate, status, nowMs, tr);

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
