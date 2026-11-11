import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I submit a grievance on this portal?',
    a: 'Register for a Citizen account (or sign in using the demo citizen credentials), open Submit Grievance, choose your Kerala district and category, enter your complaint details, optionally upload a supporting photo or PDF, and submit. You will immediately receive a unique Reference ID.'
  },
  {
    q: 'How do I track my grievance without logging in?',
    a: 'Visit the Track Grievance page from the top menu and enter your Reference ID (for example, KL-CMO-2026-100101). You can view the current status, assigned department, action-taken summary, and public status history timeline.'
  },
  {
    q: 'How does the AI Grievance Assistant work?',
    a: 'When you write a complaint description, the AI Grievance Assistant uses the Google Gemini model API (with a clearly labelled heuristic fallback if the API is unavailable) to suggest the relevant department, category, priority (Low/Medium/High), a short summary for the CMO, and potential duplicate matches. All AI suggestions are strictly advisory and require human review.'
  },
  {
    q: 'What do the five grievance statuses mean?',
    a: 'Submitted: Received by CMO cell. Under Review: CMO has opened or forwarded the grievance to a department. In Progress: Assigned department officer is investigating or has submitted an Action-Taken Report for CMO check. Resolved: CMO verified and closed the grievance. Reopened: Citizen reopened a resolved grievance due to incomplete resolution.'
  },
  {
    q: 'What file formats are supported for attachments?',
    a: 'You can attach JPG, PNG, WEBP, PDF, DOC, DOCX, or TXT files up to 5 MB both when submitting a grievance and when department officers upload action-taken reports.'
  },
  {
    q: 'Can I reopen a grievance if I am not satisfied with the resolution?',
    a: 'Yes. On your Citizen Dashboard, open any grievance marked as Resolved and use either the Feedback form (1–5 star rating) or the Reopen Grievance option with a reason to route it back to the CMO.'
  }
];

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-civic-700">Help & Answers</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-600 text-base">
          Guidance on submitting, tracking, AI-assisted classification, and escalating grievances.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.q}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <span className="font-bold text-slate-900 text-sm sm:text-base">{item.q}</span>
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
      </div>
    </div>
  );
}
