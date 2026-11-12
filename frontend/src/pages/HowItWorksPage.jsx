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
import { usePreferences } from '../context/PreferencesContext.jsx';

const STEPS = [
  {
    icon: FileText,
    status: 'Submitted',
    title: '1. Citizen Submits Grievance',
    titleMl: '1. പൗരൻ പരാതി സമർപ്പിക്കുന്നു',
    description:
      'Registered citizens select their Kerala district, grievance category, subject, description, and optional supporting image or PDF/DOC evidence.',
    descriptionMl:
      'രജിസ്റ്റർ ചെയ്ത പൗരന്മാർ ജില്ല, വിഭാഗം, വിഷയം, വിവരണം, അനുബന്ധ രേഖകൾ എന്നിവ നൽകി പരാതി സമർപ്പിക്കുന്നു.'
  },
  {
    icon: Sparkles,
    status: 'AI Advisory',
    statusMl: 'AI നിർദ്ദേശം',
    title: '2. AI Grievance Assistant Reviews Text',
    titleMl: '2. Gemini AI പരാതി വിശകലനം ചെയ്യുന്നു',
    description:
      'Gemini AI analyzes the complaint to suggest department, category, priority (Low/Medium/High), a short CMO summary, and potential duplicate matches. The citizen can accept or override suggestions.',
    descriptionMl:
      'അനുയോജ്യമായ വകുപ്പ്, വിഭാഗം, മുൻഗണന, സംഗ്രഹം, സമാന പരാതികൾ എന്നിവ Gemini AI നിർദ്ദേശിക്കുന്നു.'
  },
  {
    icon: ClipboardCheck,
    status: 'Submitted',
    title: '3. Unique Reference ID Issued',
    titleMl: '3. തനതായ Reference ID നൽകുന്നു',
    description:
      'Upon submission, the system generates an immutable Reference ID (KL-CMO-YYYY-XXXXXX) and records the initial timestamped entry in GrievanceHistory.',
    descriptionMl:
      'സമർപ്പിച്ച ഉടൻ KL-CMO-YYYY-XXXXXX എന്ന തനതായ Reference ID-യും ചരിത്ര രേഖയും സൃഷ്ടിക്കപ്പെടുന്നു.'
  },
  {
    icon: FileSearch,
    status: 'Under Review',
    title: '4. CMO Reviews & Forwards to Department',
    titleMl: '4. CMO പരിശോധിച്ച് വകുപ്പിന് കൈമാറുന്നു',
    description:
      'The Chief Minister’s Office administrator inspects the record, reviews AI insights, adds internal or public remarks, and forwards the grievance to the responsible government department/officer.',
    descriptionMl:
      'മുഖ്യമന്ത്രിയുടെ ഓഫീസ് പരാതിയും AI വിവരങ്ങളും പരിശോധിച്ച് ബന്ധപ്പെട്ട സർക്കാർ വകുപ്പിന് കൈമാറുന്നു.'
  },
  {
    icon: Send,
    status: 'In Progress',
    title: '5. Department Officer Investigates & Submits ATR',
    titleMl: '5. വകുപ്പ് ഉദ്യോഗസ്ഥൻ അന്വേഷിച്ച് ATR സമർപ്പിക്കുന്നു',
    description:
      'The assigned officer logs investigation progress, performs field verification, and submits an Action-Taken Report (ATR) with optional supporting proof back to the CMO.',
    descriptionMl:
      'ഉദ്യോഗസ്ഥൻ ഫീൽഡ് പരിശോധന നടത്തി Action-Taken Report (ATR) CMO-യ്ക്ക് സമർപ്പിക്കുന്നു.'
  },
  {
    icon: UserCheck,
    status: 'Resolved',
    title: '6. CMO Verification & Citizen Notification',
    titleMl: '6. CMO പരിശോധനയും തീർപ്പാക്കലും',
    description:
      'The CMO reviews the department ATR and either approves closure (Resolved) or returns it for further work. Citizens view updates on their dashboard and public tracker.',
    descriptionMl:
      'CMO റിപ്പോർട്ട് പരിശോധിച്ച് പരാതി തീർപ്പാക്കുകയോ തുടർനടപടിക്കായി തിരികെ അയയ്ക്കുകയോ ചെയ്യുന്നു.'
  },
  {
    icon: RefreshCw,
    status: 'Reopened',
    title: '7. Post-Resolution Feedback or Reopening',
    titleMl: '7. അഭിപ്രായം രേഖപ്പെടുത്തൽ / വീണ്ടും തുറക്കൽ',
    description:
      'Once Resolved, the citizen can submit a satisfaction rating and feedback—or reopen the grievance with a reason if the issue remains unresolved on the ground.',
    descriptionMl:
      'പരിഹാരത്തിൽ പൗരന് 1-5 റേറ്റിംഗ് നൽകാം; തൃപ്തികരമല്ലെങ്കിൽ കാരണം വ്യക്തമാക്കി പരാതി വീണ്ടും തുറക്കാം.'
  }
];

export function HowItWorksPage() {
  const { tr, tStatus } = usePreferences();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          {tr('Mandatory Grievance Lifecycle', 'പരാതി പരിഹാര നടപടിക്രമം')}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          {tr('How It Works', 'പ്രവർത്തന രീതി')}
        </h1>
        <p className="text-slate-600 text-base">
          {tr(
            'Every grievance follows a strictly audited, role-enforced lifecycle with five official statuses:',
            'ഓരോ പരാതിയും അഞ്ച് ഔദ്യോഗിക ഘട്ടങ്ങളിലൂടെ സുതാര്യമായി കടന്നുപോകുന്നു:'
          )}{' '}
          <strong>{tStatus('Submitted')}</strong>, <strong>{tStatus('Under Review')}</strong>,{' '}
          <strong>{tStatus('In Progress')}</strong>, <strong>{tStatus('Resolved')}</strong>,{' '}
          <strong>{tStatus('Reopened')}</strong>.
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
                  <h2 className="text-lg font-bold text-slate-900">{tr(step.title, step.titleMl)}</h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {step.statusMl ? tr(step.status, step.statusMl) : tStatus(step.status)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tr(step.description, step.descriptionMl)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="civic-gradient text-white rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase">
            <CheckCircle2 className="w-4 h-4" />
            {tr('Ready to test the workflow?', 'നടപടിക്രമം പരീക്ഷിച്ചു നോക്കാം')}
          </div>
          <h3 className="text-xl font-bold">
            {tr('Try Citizen Submission or CMO Review', 'പൗര സമർപ്പണമോ CMO പരിശോധനയോ പരീക്ഷിക്കുക')}
          </h3>
          <p className="text-sm text-slate-300">
            {tr(
              'Use the quick demo accounts on the Sign In page to walk through all three roles.',
              'മൂന്ന് റോളുകളും പരിശോധിക്കാൻ ലോഗിൻ പേജിലെ ഡെമോ അക്കൗണ്ടുകൾ ഉപയോഗിക്കുക.'
            )}
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition"
        >
          {tr('Open Demo Login', 'ഡെമോ ലോഗിൻ തുറക്കുക')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
