import {
  Building2,
  Bus,
  Construction,
  Droplets,
  FileSpreadsheet,
  GraduationCap,
  HeartPulse,
  Zap
} from 'lucide-react';

const DEPT_META = {
  PWD: { icon: Construction, style: 'bg-amber-50 text-amber-700 border-amber-200' },
  HEALTH: { icon: HeartPulse, style: 'bg-rose-50 text-rose-700 border-rose-200' },
  EDU: { icon: GraduationCap, style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  KSEB: { icon: Zap, style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  KWA: { icon: Droplets, style: 'bg-sky-50 text-sky-700 border-sky-200' },
  LSGD: { icon: Building2, style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REVENUE: { icon: FileSpreadsheet, style: 'bg-purple-50 text-purple-700 border-purple-200' },
  TRANSPORT: { icon: Bus, style: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
};

export function DepartmentBadge({ code }) {
  const meta = DEPT_META[code] || {
    icon: Building2,
    style: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${meta.style}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {code}
    </span>
  );
}
