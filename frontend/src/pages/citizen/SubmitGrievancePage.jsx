import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, FilePlus2, Paperclip, Printer, RotateCcw, Sparkles } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/client.js';
import { AiAssistantCard } from '../../components/AiAssistantCard.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';

const DRAFT_STORAGE_KEY = 'cm_kerala_grievance_draft';

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
  const { tr, tDistrict, tCategory, tPriority } = usePreferences();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetCategory = searchParams.get('category') || '';
  const presetDistrict = searchParams.get('district') || '';
  const initialCategory = FALLBACK_METADATA.categories.includes(presetCategory)
    ? presetCategory
    : '';
  const initialDistrict = FALLBACK_METADATA.districts.includes(presetDistrict)
    ? presetDistrict
    : '';
  const [metadata, setMetadata] = useState(FALLBACK_METADATA);
  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        return {
          district: initialDistrict || saved.district || '',
          category: initialCategory || saved.category || '',
          subject: saved.subject || '',
          description: saved.description || '',
          priority: saved.priority || 'Medium'
        };
      }
    } catch {
      // ignore invalid stored draft
    }
    return {
      district: initialDistrict,
      category: initialCategory,
      subject: '',
      description: '',
      priority: 'Medium'
    };
  });
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [file, setFile] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [citizenAcceptedAi, setCitizenAcceptedAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedResult, setSubmittedResult] = useState(null);

  useEffect(() => {
    const hasContent = Boolean(form.subject || form.description || form.district || form.category);
    if (!hasContent || submittedResult) return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
      setDraftSavedAt(new Date());
    } catch {
      // ignore storage quota errors
    }
  }, [form, submittedResult]);

  const qualityInfo = useMemo(() => {
    let score = 0;
    if (form.district) score += 20;
    if (form.category) score += 20;
    if (form.subject.trim().length >= 8) score += 20;
    if (form.description.trim().length >= 30) score += 20;
    if (form.description.trim().length >= 90) score += 20;
    const label =
      score >= 80 ? 'Detailed & Ready for Gemini AI' : score >= 40 ? 'Good Progress' : 'Needs Details';
    const barClass =
      score >= 80 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-slate-400';
    return { score, label, barClass };
  }, [form]);

  function handleClearDraft() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setForm({
      district: '',
      category: '',
      subject: '',
      description: '',
      priority: 'Medium'
    });
    setAiAnalysis(null);
    setCitizenAcceptedAi(false);
    setDraftSavedAt(null);
  }

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

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
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
            {tr('Grievance Submitted Successfully', 'പരാതി വിജയകരമായി സമർപ്പിച്ചു')}
          </h1>
          <p className="text-sm text-slate-600">
            {tr(
              "Your grievance has been logged with the Chief Minister's Office portal. Save your unique Reference ID below to track status updates.",
              'നിങ്ങളുടെ പരാതി മുഖ്യമന്ത്രിയുടെ ഓഫീസ് പോർട്ടലിൽ രേഖപ്പെടുത്തിയിട്ടുണ്ട്. പുരോഗതി അറിയാൻ Reference ID സൂക്ഷിക്കുക.'
            )}
          </p>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 inline-flex items-center gap-3">
            <span className="font-mono text-xl font-extrabold text-indigo-900">
              {submittedResult.referenceId}
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(submittedResult.referenceId)}
              className="p-2 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-700"
              title="Copy Reference ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="no-print pt-4 flex flex-wrap justify-center gap-3">
            <Link
              to={`/citizen/grievances/${submittedResult.grievance._id}`}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
            >
              {tr('View Grievance Record', 'പരാതി രേഖ കാണുക')}
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold"
            >
              <Printer className="w-4 h-4" /> {tr('Print Receipt', 'രസീത് പ്രിന്റ് ചെയ്യുക')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/citizen/dashboard')}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold"
            >
              {tr('Back to Citizen Dashboard', 'ഡാഷ്ബോർഡിലേക്ക് മടങ്ങുക')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          {tr('Citizen Grievance Intake', 'പൗര പരാതി സമർപ്പണം')}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              {tr('Submit a New Grievance', 'പുതിയ പരാതി സമർപ്പിക്കുക')}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {tr(
                'Describe your issue clearly and use the optional AI Grievance Assistant to review suggested department, category, urgency priority, and potential duplicates.',
                'പ്രശ്നം വ്യക്തമായി വിവരിക്കുക; വകുപ്പും മുൻഗണനയും പരിശോധിക്കാൻ AI സഹായി ഉപയോഗിക്കാം.'
              )}
            </p>
          </div>
          {draftSavedAt && (
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                {tr('Draft auto-saved', 'ഡ്രാഫ്റ്റ് തനിയെ സേവ് ചെയ്തു')}
              </span>
              <button
                type="button"
                onClick={handleClearDraft}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold"
              >
                <RotateCcw className="w-3 h-3" /> {tr('Clear', 'മായ്ക്കുക')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Complaint Completeness Meter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            {tr('Complaint Detail Completeness', 'പരാതി വിവരങ്ങളുടെ പൂർണ്ണത')}
          </span>
          <span className="font-semibold text-indigo-700">
            {qualityInfo.score >= 80
              ? tr('Detailed & Ready for Gemini AI', 'Gemini AI-ക്ക് അനുയോജ്യം')
              : qualityInfo.score >= 40
              ? tr('Good Progress', 'നല്ല പുരോഗതി')
              : tr('Needs Details', 'കൂടുതൽ വിവരങ്ങൾ നൽകുക')}{' '}
            ({qualityInfo.score}%)
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            style={{ width: `${qualityInfo.score}%` }}
            className={`h-full rounded-full transition-all duration-300 ${qualityInfo.barClass}`}
          />
        </div>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr('District *', 'ജില്ല *')}
            </label>
            <select
              required
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              <option value="">{tr('Select Kerala District', 'ജില്ല തിരഞ്ഞെടുക്കുക')}</option>
              {metadata.districts.map((d) => (
                <option key={d} value={d}>
                  {tDistrict(d)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr('Category *', 'വിഭാഗം *')}{' '}
              {citizenAcceptedAi && (
                <span className="ml-1 text-[11px] font-semibold text-emerald-700">
                  ({tr('Synced from AI', 'AI-ൽ നിന്ന് എടുത്തു')})
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              <option value="">{tr('Select Category', 'വിഭാഗം തിരഞ്ഞെടുക്കുക')}</option>
              {metadata.categories.map((c) => (
                <option key={c} value={c}>
                  {tCategory(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {tr('Subject *', 'വിഷയം *')}
          </label>
          <input
            type="text"
            required
            minLength={5}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder={tr(
              'Concise summary of the issue (e.g., Broken culvert on NH approach road)',
              'പരാതിയുടെ ചുരുക്ക തലക്കെട്ട് നൽകുക'
            )}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              {tr('Detailed Description *', 'വിശദമായ വിവരണം *')}
            </label>
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-amber-300 text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {aiLoading
                ? tr('Analyzing with AI...', 'AI പരിശോധിക്കുന്നു...')
                : tr('Analyze with AI Assistant', 'AI സഹായി ഉപയോഗിച്ച് പരിശോധിക്കുക')}
            </button>
          </div>
          <textarea
            required
            minLength={15}
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={tr(
              'Describe exact location, duration of the issue, impact on citizens, and requested action...',
              'സ്ഥലം, പ്രശ്നം എത്ര നാളായി നിലനിൽക്കുന്നു, പൊതുജനങ്ങൾക്കുണ്ടാകുന്ന ബുദ്ധിമുട്ട് എന്നിവ എഴുതുക...'
            )}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
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
              {tr('Citizen-Selected Priority', 'പൗരൻ തിരഞ്ഞെടുത്ത മുൻഗണന')}{' '}
              {citizenAcceptedAi && (
                <span className="ml-1 text-[11px] font-semibold text-emerald-700">
                  ({tr('Synced from AI', 'AI-ൽ നിന്ന് എടുത്തു')})
                </span>
              )}
            </label>
            <select
              value={form.priority}
              onChange={(e) => {
                setForm({ ...form, priority: e.target.value });
                setCitizenAcceptedAi(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              {metadata.priorities.map((p) => (
                <option key={p} value={p}>
                  {tPriority(p)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr('Supporting Image / Document (Optional, max 5 MB)', 'അനുബന്ധ ഫോട്ടോ / രേഖ (പരമാവധി 5 MB)')}
            </label>
            <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 cursor-pointer text-xs text-slate-600 bg-slate-50">
              <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate">
                {file ? file.name : tr('Choose JPG, PNG, PDF, DOC...', 'ഫയൽ തിരഞ്ഞെടുക്കുക...')}
              </span>
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
            {tr(
              'Prototype notice: Submit fictional test issues only.',
              'പ്രോട്ടോടൈപ്പ് അറിയിപ്പ്: സാങ്കൽപ്പിക പരാതികൾ മാത്രം സമർപ്പിക്കുക.'
            )}
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm shadow transition"
          >
            <FilePlus2 className="w-4 h-4" />
            {submitting ? tr('Submitting...', 'സമർപ്പിക്കുന്നു...') : tr('Submit Grievance', 'പരാതി സമർപ്പിക്കുക')}
          </button>
        </div>
      </form>
    </div>
  );
}
