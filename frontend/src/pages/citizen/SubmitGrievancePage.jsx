import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, FilePlus2, Paperclip, Printer, Sparkles } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/client.js';
import { AiAssistantCard } from '../../components/AiAssistantCard.jsx';

const FALLBACK_METADATA = {
  districts: [
    'Thiruvananthapuram',
    'Kollam',
    'Pathanamthitta',
    'Alappuzha',
    'Kottayam',
    'Idukki',
    'Ernakulam',
    'Thrissur',
    'Palakkad',
    'Malappuram',
    'Kozhikode',
    'Wayanad',
    'Kannur',
    'Kasaragod'
  ],
  categories: [
    'Public Infrastructure',
    'Healthcare',
    'Education',
    'Electricity & Power',
    'Water Supply & Drainage',
    'Civic Services & Sanitation',
    'Revenue & Land Records',
    'Transport & Road Safety',
    'Public Welfare & Ration',
    'Other'
  ],
  priorities: ['Low', 'Medium', 'High']
};

export function SubmitGrievancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetCategory = searchParams.get('category') || '';
  const initialCategory = FALLBACK_METADATA.categories.includes(presetCategory)
    ? presetCategory
    : '';
  const [metadata, setMetadata] = useState(FALLBACK_METADATA);
  const [form, setForm] = useState({
    district: '',
    category: initialCategory,
    subject: '',
    description: '',
    priority: 'Medium'
  });
  const [file, setFile] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [citizenAcceptedAi, setCitizenAcceptedAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedResult, setSubmittedResult] = useState(null);

  useEffect(() => {
    api
      .get('/metadata')
      .then((res) => {
        if (res.data?.metadata) setMetadata(res.data.metadata);
      })
      .catch(() => {});
  }, []);

  async function handleRunAiAnalysis() {
    if (form.description.trim().length < 10) {
      setError('Please enter at least 10 characters in the description before running AI analysis.');
      return;
    }
    setError('');
    setAiLoading(true);
    try {
      const res = await api.post('/ai/analyze', {
        subject: form.subject,
        description: form.description,
        district: form.district,
        category: form.category
      });
      setAiAnalysis(res.data.analysis);
      setCitizenAcceptedAi(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'AI analysis failed.'));
    } finally {
      setAiLoading(false);
    }
  }

  function handleApplyAiSuggestions() {
    if (!aiAnalysis) return;
    const rawCategory = String(aiAnalysis.suggestedCategory || '').trim().toLowerCase();
    const matchedCategory = metadata.categories.find((c) => c.toLowerCase() === rawCategory);

    const rawPriority = String(aiAnalysis.recommendedPriority || '').trim().toLowerCase();
    const matchedPriority = metadata.priorities.find((p) => p.toLowerCase() === rawPriority);

    setForm((prev) => ({
      ...prev,
      category: matchedCategory || aiAnalysis.suggestedCategory || prev.category,
      priority: matchedPriority || aiAnalysis.recommendedPriority || prev.priority
    }));
    setCitizenAcceptedAi(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('district', form.district);
      payload.append('category', form.category);
      payload.append('subject', form.subject);
      payload.append('description', form.description);
      payload.append('priority', form.priority);
      if (aiAnalysis) {
        payload.append(
          'aiAnalysis',
          JSON.stringify({ ...aiAnalysis, citizenAccepted: citizenAcceptedAi })
        );
      }
      if (file) {
        payload.append('attachment', file);
      }

      const res = await api.post('/grievances', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmittedResult(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 shadow-md text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Grievance Submitted Successfully
          </h1>
          <p className="text-sm text-slate-600">
            Your grievance has been logged with the Chief Minister&apos;s Office portal. Save your
            unique Reference ID below to track status updates.
          </p>

          <div className="bg-civic-50 border border-civic-200 rounded-xl p-4 inline-flex items-center gap-3">
            <span className="font-mono text-xl font-extrabold text-civic-900">
              {submittedResult.referenceId}
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(submittedResult.referenceId)}
              className="p-2 rounded-lg bg-white border border-civic-200 hover:bg-civic-100 text-civic-800"
              title="Copy Reference ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="no-print pt-4 flex flex-wrap justify-center gap-3">
            <Link
              to={`/citizen/grievances/${submittedResult.grievance._id}`}
              className="px-5 py-2.5 rounded-xl bg-civic-700 hover:bg-civic-800 text-white text-sm font-semibold"
            >
              View Grievance Record
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button
              type="button"
              onClick={() => navigate('/citizen/dashboard')}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold"
            >
              Back to Citizen Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-civic-700">
          Citizen Grievance Intake
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Submit a New Grievance</h1>
        <p className="text-sm text-slate-600 mt-1">
          Describe your issue clearly and use the optional AI Grievance Assistant to review
          suggested department, category, urgency priority, and potential duplicates.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">District *</label>
            <select
              required
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-civic-600 outline-none"
            >
              <option value="">Select Kerala District</option>
              {metadata.districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *{' '}
              {citizenAcceptedAi && (
                <span className="ml-1 text-[11px] font-semibold text-emerald-700">
                  (Synced from AI)
                </span>
              )}
            </label>
            <select
              required
              value={form.category}
              onChange={(e) => {
                setForm({ ...form, category: e.target.value });
                setCitizenAcceptedAi(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-civic-600 outline-none"
            >
              <option value="">Select Category</option>
              {metadata.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
          <input
            type="text"
            required
            minLength={5}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Concise summary of the issue (e.g., Broken culvert on NH approach road)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-civic-600 outline-none"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Detailed Description *
            </label>
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {aiLoading ? 'Analyzing with AI...' : 'Analyze with AI Assistant'}
            </button>
          </div>
          <textarea
            required
            minLength={15}
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe exact location, duration of the issue, impact on citizens, and requested action..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-civic-600 outline-none"
          />
        </div>

        {aiAnalysis && (
          <AiAssistantCard
            analysis={aiAnalysis}
            showApplyButton
            applied={citizenAcceptedAi}
            onApplySuggestions={handleApplyAiSuggestions}
          />
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Citizen-Selected Priority{' '}
              {citizenAcceptedAi && (
                <span className="ml-1 text-[11px] font-semibold text-emerald-700">
                  (Synced from AI)
                </span>
              )}
            </label>
            <select
              value={form.priority}
              onChange={(e) => {
                setForm({ ...form, priority: e.target.value });
                setCitizenAcceptedAi(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-civic-600 outline-none"
            >
              {metadata.priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supporting Image / Document (Optional, max 5 MB)
            </label>
            <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-civic-500 cursor-pointer text-xs text-slate-600 bg-slate-50">
              <Paperclip className="w-4 h-4 text-civic-700 shrink-0" />
              <span className="truncate">{file ? file.name : 'Choose JPG, PNG, PDF, DOC...'}</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Prototype notice: Submit fictional test issues only.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-civic-700 hover:bg-civic-800 disabled:opacity-60 text-white font-semibold text-sm shadow transition"
          >
            <FilePlus2 className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Grievance'}
          </button>
        </div>
      </form>
    </div>
  );
}
