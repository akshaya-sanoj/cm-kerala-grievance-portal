import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileText,
  RefreshCw,
  Send,
  Sparkles,
  UserCheck
} from 'lucide-react';

const STEPS = [
  {
    icon: FileText,
    status: 'Submitted',
    title: '1. Citizen Submits Grievance',
    description:
      'Registered citizens select their Kerala district, grievance category, subject, description, and optional supporting image or PDF/DOC evidence.'
  },
  {
    icon: Sparkles,
    status: 'AI Advisory',
    title: '2. AI Grievance Assistant Reviews Text',
    description:
      'Gemini AI analyzes the complaint to suggest department, category, priority (Low/Medium/High), a short CMO summary, and potential duplicate matches. The citizen can accept or override suggestions.'
  },
  {
    icon: ClipboardCheck,
    status: 'Submitted',
    title: '3. Unique Reference ID Issued',
    description:
      'Upon submission, the system generates an immutable Reference ID (KL-CMO-YYYY-XXXXXX) and records the initial timestamped entry in GrievanceHistory.'
  },
  {
    icon: FileSearch,
    status: 'Under Review',
    title: '4. CMO Reviews & Forwards to Department',
    description:
      'The Chief Minister’s Office administrator inspects the record, reviews AI insights, adds internal or public remarks, and forwards the grievance to the responsible government department/officer.'
  },
  {
    icon: Send,
    status: 'In Progress',
    title: '5. Department Officer Investigates & Submits ATR',
    description:
      'The assigned officer logs investigation progress, performs field verification, and submits an Action-Taken Report (ATR) with optional supporting proof back to the CMO.'
  },
  {
    icon: UserCheck,
    status: 'Resolved',
    title: '6. CMO Verification & Citizen Notification',
    description:
      'The CMO reviews the department ATR and either approves closure (Resolved) or returns it for further work. Citizens view updates on their dashboard and public tracker.'
  },
  {
    icon: RefreshCw,
    status: 'Reopened',
    title: '7. Post-Resolution Feedback or Reopening',
    description:
      'Once Resolved, the citizen can submit a satisfaction rating and feedback—or reopen the grievance with a reason if the issue remains unresolved on the ground.'
  }
];

export function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          Mandatory Grievance Lifecycle
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">How It Works</h1>
        <p className="text-slate-600 text-base">
          Every grievance follows a strictly audited, role-enforced lifecycle with five official
          statuses: <strong>Submitted</strong>, <strong>Under Review</strong>,{' '}
          <strong>In Progress</strong>, <strong>Resolved</strong>, and <strong>Reopened</strong>.
        </p>
      </div>

      <div className="space-y-4">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-start"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-900">{step.title}</h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {step.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="civic-gradient text-white rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase">
            <CheckCircle2 className="w-4 h-4" />
            Ready to test the workflow?
          </div>
          <h3 className="text-xl font-bold">Try Citizen Submission or CMO Review</h3>
          <p className="text-sm text-slate-300">
            Use the quick demo accounts on the Sign In page to walk through all three roles.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition"
        >
          Open Demo Login <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
