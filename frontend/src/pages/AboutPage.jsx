import { CheckCircle2, Eye, ShieldAlert, Target } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext.jsx';

export function AboutPage() {
  const { tr } = usePreferences();

  const objectives = [
    tr(
      'Single-window grievance submission with unique reference IDs',
      'തനതായ Reference ID-യോടുകൂടിയ ഏകജാലക പരാതി സമർപ്പണം'
    ),
    tr(
      'Full lifecycle audit trail across Submitted, Under Review, In Progress, Resolved, and Reopened states',
      'സമർപ്പണം മുതൽ പരിഹാരം വരെയുള്ള പൂർണ്ണ നടപടിക്രമ ഓഡിറ്റ് രേഖ'
    ),
    tr(
      'Central CMO oversight with district/department analytics and SLA escalation',
      'ജില്ലാ-വകുപ്പ് അനലിറ്റിക്സും SLA നിരീക്ഷണവുമുള്ള CMO മേൽനോട്ടം'
    ),
    tr(
      'Direct department officer action-taken reports (ATR) reviewed before closure',
      'തീർപ്പാക്കുന്നതിന് മുൻപ് വകുപ്പ് ഉദ്യോഗസ്ഥരുടെ നടപടി റിപ്പോർട്ട് (ATR) പരിശോധന'
    ),
    tr(
      'Advisory Gemini AI triage with human-in-the-loop oversight and duplicate flagging',
      'ഉദ്യോഗസ്ഥ നിയന്ത്രണത്തോടെയുള്ള Gemini AI തരംതിരിക്കലും ഡ്യൂപ്ലിക്കേറ്റ് കണ്ടെത്തലും'
    ),
    tr(
      'Post-resolution citizen feedback and guaranteed right to reopen unresolved matters',
      'പരിഹാരത്തിന് ശേഷമുള്ള പൗര അഭിപ്രായം രേഖപ്പെടുത്തലും വീണ്ടും തുറക്കാനുള്ള അവകാശവും'
    )
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          {tr('About the Initiative', 'സംരംഭത്തെക്കുറിച്ച്')}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          {tr(
            'Transparent Citizen-First Governance Prototype',
            'സുതാര്യമായ പൗരകേന്ദ്രീകൃത ഭരണ പ്രോട്ടോടൈപ്പ്'
          )}
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          {tr(
            "The CM Kerala Public Grievance Redressal Portal is designed as a unified digital channel enabling residents across Kerala's 14 districts to submit civic, healthcare, infrastructure, education, and utility grievances directly to the Chief Minister's Office (CMO) for accountable routing and monitored resolution.",
            'കേരളത്തിലെ 14 ജില്ലകളിലെയും പൗരന്മാർക്ക് പൊതുജന പരാതികൾ മുഖ്യമന്ത്രിയുടെ ഓഫീസിലേക്ക് (CMO) നേരിട്ട് സമർപ്പിക്കാനും സമയബന്ധിതമായി പരിഹാരം നേടാനും സഹായിക്കുന്ന ഏകീകൃത ഡിജിറ്റൽ സംവിധാനമാണിത്.'
          )}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Eye className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{tr('Vision', 'കാഴ്ചപ്പാട്')}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {tr(
              "Every citizen's concern is heard, accurately routed, time-bound, and verifiably resolved without bureaucratic opacity or lost paper trails.",
              'ഓരോ പൗരന്റെയും പരാതികൾ കൃത്യമായി കേൾക്കുകയും സമയബന്ധിതമായും സുതാര്യമായും പരിഹരിക്കപ്പെടുകയും ചെയ്യുക.'
            )}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{tr('Mission', 'ലക്ഷ്യം')}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {tr(
              'Combine structured administrative workflows, SLA monitoring, role-based department accountability, and responsible AI assistance to accelerate public service redressal.',
              'കൃത്യമായ ഭരണസംവിധാനം, SLA നിരീക്ഷണം, വകുപ്പുതല ഉത്തരവാദിത്തം, AI സഹായം എന്നിവ സംയോജിപ്പിച്ച് പൊതുസേവന പരിഹാരം വേഗത്തിലാക്കുക.'
            )}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {tr('Core Objectives', 'പ്രധാന ലക്ഷ്യങ്ങൾ')}
        </h2>
        <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-700">
          {objectives.map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-950">
          <p className="font-bold mb-1">
            {tr('Recruitment Prototype Disclosure', 'റിക്രൂട്ട്മെന്റ് പ്രോട്ടോടൈപ്പ് അറിയിപ്പ്')}
          </p>
          <p>
            {tr(
              "This application was developed solely as a technical machine test prototype for WhiteMatrix Software Solutions. It does not imply affiliation with, authorization by, or endorsement from the Government of Kerala or the Chief Minister's Office. Do not submit sensitive personal data or real citizen complaints.",
              'ഈ ആപ്ലിക്കേഷൻ WhiteMatrix Software Solutions സാങ്കേതിക പരീക്ഷണത്തിനായി മാത്രം നിർമ്മിച്ചതാണ്. കേരള സർക്കാരുമായോ മുഖ്യമന്ത്രിയുടെ ഓഫീസുമായോ ഇതിന് ഔദ്യോഗിക ബന്ധമില്ല.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
