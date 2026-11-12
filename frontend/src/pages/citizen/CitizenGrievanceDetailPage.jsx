import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  FileCheck2,
  Printer,
  RefreshCw,
  Star
} from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/client.js';
import { AiAssistantCard } from '../../components/AiAssistantCard.jsx';
import { AttachmentList } from '../../components/AttachmentList.jsx';
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge.jsx';
import { StatusStepper } from '../../components/StatusStepper.jsx';
import { Timeline } from '../../components/Timeline.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { formatDate } from '../../utils/formatters.js';

export function CitizenGrievanceDetailPage() {
  const { tr, tDistrict, tCategory } = usePreferences();
  const { id } = useParams();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const [rating, setRating] = useState(5);
  const [isSatisfied, setIsSatisfied] = useState(true);
  const [comment, setComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadDetail() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/grievances/${id}`);
      setGrievance(res.data.grievance);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [id]);

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setActionMsg('');
    setError('');
    try {
      await api.post(`/grievances/${id}/feedback`, { rating, isSatisfied, comment });
      setActionMsg('Your feedback has been recorded. Thank you!');
      await loadDetail();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReopen(e) {
    e.preventDefault();
    setBusy(true);
    setActionMsg('');
    setError('');
    try {
      await api.post(`/grievances/${id}/reopen`, { reason: reopenReason });
      setReopenReason('');
      setActionMsg('Grievance reopened and routed back to the CMO.');
      await loadDetail();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Loading grievance details...
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error || 'Grievance not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeft className="w-4 h-4" />{' '}
          {tr('Back to Citizen Dashboard', 'പൗര ഡാഷ്ബോർഡിലേക്ക് മടങ്ങുക')}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
        >
          <Printer className="w-3.5 h-3.5" /> {tr('Print Record', 'പ്രിന്റ് എടുക്കുക')}
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
          {actionMsg}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold text-indigo-600">{grievance.referenceId}</p>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{grievance.subject}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={grievance.status} />
            <PriorityBadge priority={grievance.priority} />
            {grievance.isEscalated && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                <AlertTriangle className="w-3 h-3" /> {tr('Escalated', 'അടിയന്തിരമാക്കി')}
              </span>
            )}
          </div>
        </div>

        <StatusStepper status={grievance.status} />

        <div className="grid sm:grid-cols-4 gap-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div>
            <span className="text-slate-500 block">{tr('District', 'ജില്ല')}</span>
            <strong className="text-slate-800">{tDistrict(grievance.district)}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">{tr('Category', 'വിഭാഗം')}</span>
            <strong className="text-slate-800">{tCategory(grievance.category)}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">{tr('Assigned Department', 'വകുപ്പ്')}</span>
            <strong className="text-slate-800">
              {grievance.assignedDepartmentId?.name ||
                tr('Pending CMO Assignment', 'CMO നിയമനം കാത്തിരിക്കുന്നു')}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">{tr('Target SLA Due', 'ലക്ഷ്യ SLA തീയതി')}</span>
            <strong className={grievance.isOverdue ? 'text-rose-700' : 'text-slate-800'}>
              {formatDate(grievance.dueDate)}{' '}
              {grievance.isOverdue ? `(${tr('Overdue', 'കാലാവധി കഴിഞ്ഞു')})` : ''}
            </strong>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            {tr('Complaint Description', 'പരാതി വിവരണം')}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {grievance.description}
          </p>
        </div>

        {grievance.actionTakenReport && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4" />{' '}
              {tr('Official Action-Taken Report', 'ഔദ്യോഗിക നടപടി റിപ്പോർട്ട് (ATR)')}
            </p>
            <p className="text-sm text-emerald-950">{grievance.actionTakenReport}</p>
          </div>
        )}

        <AttachmentList attachments={grievance.attachments} />
      </div>

      {grievance.aiAnalysis?.summary && <AiAssistantCard analysis={grievance.aiAnalysis} />}

      {/* Citizen Post-Resolution Feedback & Reopen */}
      {grievance.status === 'Resolved' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {grievance.feedback
                ? tr('Your Resolution Feedback', 'നിങ്ങളുടെ അഭിപ്രായം')
                : tr('Submit Resolution Feedback', 'അഭിപ്രായം രേഖപ്പെടുത്തുക')}
            </h2>
            {grievance.feedback ? (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{tr('Rating:', 'റേറ്റിംഗ്:')}</strong> {grievance.feedback.rating} / 5 (
                  {grievance.feedback.isSatisfied
                    ? tr('Satisfied', 'തൃപ്തികരം')
                    : tr('Dissatisfied', 'അതൃപ്തി')}
                  )
                </p>
                {grievance.feedback.comment && (
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {grievance.feedback.comment}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {tr('Rating (1–5)', 'റേറ്റിംഗ് (1–5)')}
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} {tr('Stars', 'നക്ഷത്രം')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {tr('Outcome', 'അനുഭവം')}
                    </label>
                    <select
                      value={isSatisfied ? 'yes' : 'no'}
                      onChange={(e) => setIsSatisfied(e.target.value === 'yes')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="yes">{tr('Satisfied', 'തൃപ്തികരം')}</option>
                      <option value="no">{tr('Not Satisfied', 'തൃപ്തികരമല്ല')}</option>
                    </select>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={tr('Share feedback about resolution quality...', 'പരിഹാരത്തെക്കുറിച്ച് അഭിപ്രായം എഴുതുക...')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  {tr('Submit Feedback', 'അഭിപ്രായം സമർപ്പിക്കുക')}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-rose-600" />
              {tr('Issue Not Resolved? Reopen Grievance', 'പരിഹാരമായില്ലേ? പരാതി വീണ്ടും തുറക്കുക')}
            </h2>
            <p className="text-xs text-slate-600 mb-3">
              {tr(
                'If the action taken did not resolve the grievance on ground, reopen it to notify the CMO for re-evaluation.',
                'പ്രശ്നം പരിഹരിക്കപ്പെട്ടിട്ടില്ലെങ്കിൽ പുനഃപരിശോധനയ്ക്കായി CMO-യെ അറിയിക്കാൻ പരാതി വീണ്ടും തുറക്കാം.'
              )}
            </p>
            <form onSubmit={handleReopen} className="space-y-3">
              <textarea
                required
                minLength={5}
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder={tr('Explain why the grievance needs reopening...', 'വീണ്ടും തുറക്കുന്നതിനുള്ള കാരണം വ്യക്തമാക്കുക...')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold"
              >
                {tr('Reopen Grievance', 'പരാതി വീണ്ടും തുറക്കുക')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Full Public History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {tr('CMO & Department Updates Timeline', 'CMO & വകുപ്പ് നടപടി ചരിത്രം')}
        </h2>
        <Timeline history={grievance.history} />
      </div>
    </div>
  );
}
