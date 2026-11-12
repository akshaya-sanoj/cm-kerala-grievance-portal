import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext.jsx';

const FAQS = [
  {
    topic: 'Submission',
    topicMl: 'സമർപ്പണം',
    q: 'How do I submit a grievance on this portal?',
    qMl: 'ഈ പോർട്ടലിൽ എങ്ങനെയാണ് പരാതി സമർപ്പിക്കേണ്ടത്?',
    a: 'Register for a Citizen account (or sign in using the demo citizen credentials), open Submit Grievance, choose your Kerala district and category, enter your complaint details, optionally upload a supporting photo or PDF, and submit. You will immediately receive a unique Reference ID.',
    aMl: 'പൗര അക്കൗണ്ട് രജിസ്റ്റർ ചെയ്യുക (അല്ലെങ്കിൽ ഡെമോ ലോഗിൻ ഉപയോഗിക്കുക), "പരാതി സമർപ്പിക്കുക" തുറന്ന് ജില്ലയും വിഭാഗവും വിവരങ്ങളും രേഖപ്പെടുത്തുക. ഉടൻ തന്നെ Reference ID ലഭിക്കും.'
  },
  {
    topic: 'Tracking & SLA',
    topicMl: 'ട്രാക്കിംഗ് & SLA',
    q: 'How do I track my grievance without logging in?',
    qMl: 'ലോഗിൻ ചെയ്യാതെ തന്നെ പരാതിയുടെ നിലവിലെ അവസ്ഥ എങ്ങനെ പരിശോധിക്കാം?',
    a: 'Visit the Track Grievance page from the top menu and enter your Reference ID (for example, KL-CMO-2026-100101). You can view the current status, assigned department, action-taken summary, and public status history timeline.',
    aMl: 'മുകളിലെ മെനുവിലുള്ള "പരാതി ട്രാക്ക്" പേജിൽ Reference ID (ഉദാ: KL-CMO-2026-100101) നൽകിയാൽ വകുപ്പ്, നടപടി, ടൈംലൈൻ എന്നിവ കാണാം.'
  },
  {
    topic: 'AI Assistant',
    topicMl: 'AI സഹായി',
    q: 'How does the AI Grievance Assistant work?',
    qMl: 'AI പരാതി സഹായി എങ്ങനെയാണ് പ്രവർത്തിക്കുന്നത്?',
    a: 'When you write a complaint description, the AI Grievance Assistant uses the Google Gemini model API (with a clearly labelled heuristic fallback if the API is unavailable) to suggest the relevant department, category, priority (Low/Medium/High), a short summary for the CMO, and potential duplicate matches. All AI suggestions are strictly advisory and require human review.',
    aMl: 'നിങ്ങൾ നൽകുന്ന പരാതി വിവരണം Gemini AI വിശകലനം ചെയ്ത് അനുയോജ്യമായ വകുപ്പ്, വിഭാഗം, മുൻഗണന, സംഗ്രഹം, സമാന പരാതികൾ എന്നിവ നിർദ്ദേശിക്കുന്നു. അന്തിമ തീരുമാനം ഉദ്യോഗസ്ഥരുടേതാണ്.'
  },
  {
    topic: 'Tracking & SLA',
    topicMl: 'ട്രാക്കിംഗ് & SLA',
    q: 'What do the five grievance statuses mean?',
    qMl: 'അഞ്ച് പരാതി ഘട്ടങ്ങൾ എന്തൊക്കെയാണ്?',
    a: 'Submitted: Received by CMO cell. Under Review: CMO has opened or forwarded the grievance to a department. In Progress: Assigned department officer is investigating or has submitted an Action-Taken Report for CMO check. Resolved: CMO verified and closed the grievance. Reopened: Citizen reopened a resolved grievance due to incomplete resolution.',
    aMl: 'സമർപ്പിച്ചു: CMO സെല്ലിൽ ലഭിച്ചു. പരിശോധനയിൽ: CMO വകുപ്പിലേക്ക് കൈമാറി. നടപടി പുരോഗതിയിൽ: ഉദ്യോഗസ്ഥൻ അന്വേഷണം നടത്തുന്നു. പരിഹരിച്ചു: CMO പരിശോധിച്ച് തീർപ്പാക്കി. വീണ്ടും തുറന്നു: പൗരൻ പുനഃപരിശോധന ആവശ്യപ്പെട്ടു.'
  },
  {
    topic: 'Submission',
    topicMl: 'സമർപ്പണം',
    q: 'What file formats are supported for attachments?',
    qMl: 'ഏതൊക്കെ ഫയൽ ഫോർമാറ്റുകളാണ് അനുബന്ധമായി അപ്‌ലോഡ് ചെയ്യാൻ കഴിയുക?',
    a: 'You can attach JPG, PNG, WEBP, PDF, DOC, DOCX, or TXT files up to 5 MB both when submitting a grievance and when department officers upload action-taken reports.',
    aMl: '5 MB വരെയുള്ള JPG, PNG, WEBP, PDF, DOC, DOCX, TXT ഫയലുകൾ അപ്‌ലോഡ് ചെയ്യാവുന്നതാണ്.'
  },
  {
    topic: 'Tracking & SLA',
    topicMl: 'ട്രാക്കിംഗ് & SLA',
    q: 'Can I reopen a grievance if I am not satisfied with the resolution?',
    qMl: 'പരിഹാരത്തിൽ തൃപ്തിയില്ലെങ്കിൽ പരാതി വീണ്ടും തുറക്കാൻ കഴിയുമോ?',
    a: 'Yes. On your Citizen Dashboard, open any grievance marked as Resolved and use either the Feedback form (1–5 star rating) or the Reopen Grievance option with a reason to route it back to the CMO.',
    aMl: 'അതെ. "പരിഹരിച്ചു" എന്ന് രേഖപ്പെടുത്തിയ പരാതിയിൽ റേറ്റിംഗ് നൽകാനോ കാരണം വ്യക്തമാക്കി CMO-യിലേക്ക് വീണ്ടും അയയ്ക്കാനോ കഴിയും.'
  }
];

const TOPIC_MAP = {
  All: 'എല്ലാം',
  Submission: 'സമർപ്പണം',
  'AI Assistant': 'AI സഹായി',
  'Tracking & SLA': 'ട്രാക്കിംഗ് & SLA'
};

export function FaqPage() {
  const { tr } = usePreferences();
  const [openIndex, setOpenIndex] = useState(0);
  const [topic, setTopic] = useState('All');
  const [search, setSearch] = useState('');

  const filteredFaqs = FAQS.filter((item) => {
    const matchesTopic = topic === 'All' || item.topic === topic;
    const matchesSearch =
      !search.trim() ||
      `${item.q} ${item.qMl} ${item.a} ${item.aMl}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          {tr('Help & Answers', 'സഹായവും ഉത്തരങ്ങളും')}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          {tr('Frequently Asked Questions', 'പതിവായി ചോദിക്കുന്ന ചോദ്യങ്ങൾ')}
        </h1>
        <p className="text-slate-600 text-base">
          {tr(
            'Guidance on submitting, tracking, AI-assisted classification, and escalating grievances.',
            'പരാതി സമർപ്പണം, ട്രാക്കിംഗ്, AI തരംതിരിക്കൽ, SLA എന്നിവയെക്കുറിച്ചുള്ള മാർഗ്ഗനിർദ്ദേശങ്ങൾ.'
          )}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Submission', 'AI Assistant', 'Tracking & SLA'].map((tKey) => (
            <button
              key={tKey}
              type="button"
              onClick={() => {
                setTopic(tKey);
                setOpenIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                topic === tKey
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              {tr(tKey, TOPIC_MAP[tKey])}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr('Search questions...', 'ചോദ്യങ്ങൾ തിരയുക...')}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredFaqs.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.q}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-200 transition"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                    {tr(item.topic, item.topicMl)}
                  </span>
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {tr(item.q, item.qMl)}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {tr(item.a, item.aMl)}
                </div>
              )}
            </div>
          );
        })}
        {filteredFaqs.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            {tr('No matching questions found.', 'യോജിച്ച ചോദ്യങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല.')}
          </div>
        )}
      </div>
    </div>
  );
}
