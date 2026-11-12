import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const FAQS = [
  {
    topic: 'Submission',
    q: 'How do I submit a grievance on this portal?',
    a: 'Register for a Citizen account (or sign in using the demo citizen credentials), open Submit Grievance, choose your Kerala district and category, enter your complaint details, optionally upload a supporting photo or PDF, and submit. You will immediately receive a unique Reference ID.'
  },
  {
    topic: 'Tracking & SLA',
    q: 'How do I track my grievance without logging in?',
    a: 'Visit the Track Grievance page from the top menu and enter your Reference ID (for example, KL-CMO-2026-100101). You can view the current status, assigned department, action-taken summary, and public status history timeline.'
  },
  {
    topic: 'AI Assistant',
    q: 'How does the AI Grievance Assistant work?',
    a: 'When you write a complaint description, the AI Grievance Assistant uses the Google Gemini model API (with a clearly labelled heuristic fallback if the API is unavailable) to suggest the relevant department, category, priority (Low/Medium/High), a short summary for the CMO, and potential duplicate matches. All AI suggestions are strictly advisory and require human review.'
  },
  {
    topic: 'Tracking & SLA',
    q: 'What do the five grievance statuses mean?',
    a: 'Submitted: Received by CMO cell. Under Review: CMO has opened or forwarded the grievance to a department. In Progress: Assigned department officer is investigating or has submitted an Action-Taken Report for CMO check. Resolved: CMO verified and closed the grievance. Reopened: Citizen reopened a resolved grievance due to incomplete resolution.'
  },
  {
    topic: 'Submission',
    q: 'What file formats are supported for attachments?',
    a: 'You can attach JPG, PNG, WEBP, PDF, DOC, DOCX, or TXT files up to 5 MB both when submitting a grievance and when department officers upload action-taken reports.'
  },
  {
    topic: 'Tracking & SLA',
    q: 'Can I reopen a grievance if I am not satisfied with the resolution?',
    a: 'Yes. On your Citizen Dashboard, open any grievance marked as Resolved and use either the Feedback form (1–5 star rating) or the Reopen Grievance option with a reason to route it back to the CMO.'
  }
];

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);
  const [topic, setTopic] = useState('All');
  const [search, setSearch] = useState('');

  const filteredFaqs = FAQS.filter((item) => {
    const matchesTopic = topic === 'All' || item.topic === topic;
    const matchesSearch =
      !search.trim() ||
      `${item.q} ${item.a}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Help &amp; Answers</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-600 text-base">
          Guidance on submitting, tracking, AI-assisted classification, and escalating grievances.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Submission', 'AI Assistant', 'Tracking & SLA'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTopic(t);
                setOpenIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                topic === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
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
                    {item.topic}
                  </span>
                  <span className="font-bold text-slate-900 text-sm sm:text-base">{item.q}</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
        {filteredFaqs.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            No matching questions found.
          </div>
        )}
      </div>
    </div>
  );
}
