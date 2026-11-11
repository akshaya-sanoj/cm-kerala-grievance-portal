import { CheckCircle2, Eye, ShieldAlert, Target } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-civic-700">About the Initiative</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Transparent Citizen-First Governance Prototype
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          The CM Kerala Public Grievance Redressal Portal is designed as a unified digital channel
          enabling residents across Kerala&apos;s 14 districts to submit civic, healthcare,
          infrastructure, education, and utility grievances directly to the Chief Minister&apos;s
          Office (CMO) for accountable routing and monitored resolution.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-civic-50 text-civic-700 flex items-center justify-center mb-4">
            <Eye className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Vision</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every citizen&apos;s concern is heard, accurately routed, time-bound, and verifiably
            resolved without bureaucratic opacity or lost paper trails.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Mission</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Combine structured administrative workflows, SLA monitoring, role-based department
            accountability, and responsible AI assistance to accelerate public service redressal.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Core Objectives</h2>
        <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-700">
          {[
            'Single-window grievance submission with unique reference IDs',
            'Full lifecycle audit trail across Submitted, Under Review, In Progress, Resolved, and Reopened states',
            'Central CMO oversight with district/department analytics and SLA escalation',
            'Direct department officer action-taken reports (ATR) reviewed before closure',
            'Advisory Gemini AI triage with human-in-the-loop oversight and duplicate flagging',
            'Post-resolution citizen feedback and guaranteed right to reopen unresolved matters'
          ].map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-civic-700 shrink-0 mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-950">
          <p className="font-bold mb-1">Recruitment Prototype Disclosure</p>
          <p>
            This application was developed solely as a technical machine test prototype for
            WhiteMatrix Software Solutions. It does not imply affiliation with, authorization by, or
            endorsement from the Government of Kerala or the Chief Minister&apos;s Office. Do not
            submit sensitive personal data or real citizen complaints.
          </p>
        </div>
      </div>
    </div>
  );
}
