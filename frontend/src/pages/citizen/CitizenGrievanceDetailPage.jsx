import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileCheck2,
  Paperclip,
  RefreshCw,
  Star
} from 'lucide-react';
import { api, downloadAttachmentFile, getApiErrorMessage } from '../../api/client.js';
import { AiAssistantCard } from '../../components/AiAssistantCard.jsx';
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge.jsx';
import { Timeline } from '../../components/Timeline.jsx';
import { formatDate, formatFileSize } from '../../utils/formatters.js';

export function CitizenGrievanceDetailPage() {
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
      <Link
        to="/citizen/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-civic-700 hover:text-civic-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Citizen Dashboard
      </Link>

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
            <p className="font-mono text-xs font-bold text-civic-700">{grievance.referenceId}</p>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{grievance.subject}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={grievance.status} />
            <PriorityBadge priority={grievance.priority} />
            {grievance.isEscalated && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                <AlertTriangle className="w-3 h-3" /> Escalated
              </span>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div>
            <span className="text-slate-500 block">District</span>
            <strong className="text-slate-800">{grievance.district}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Category</span>
            <strong className="text-slate-800">{grievance.category}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Assigned Department</span>
            <strong className="text-slate-800">
              {grievance.assignedDepartmentId?.name || 'Pending CMO Assignment'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Target SLA Due</span>
            <strong className={grievance.isOverdue ? 'text-rose-700' : 'text-slate-800'}>
              {formatDate(grievance.dueDate)} {grievance.isOverdue ? '(Overdue)' : ''}
            </strong>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
            Complaint Description
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {grievance.description}
          </p>
        </div>

        {grievance.actionTakenReport && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4" /> Official Action-Taken Report
            </p>
            <p className="text-sm text-emerald-950">{grievance.actionTakenReport}</p>
          </div>
        )}

        {grievance.attachments?.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              Attachments ({grievance.attachments.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {grievance.attachments.map((att) => (
                <button
                  key={att._id}
                  type="button"
                  onClick={() => downloadAttachmentFile(att._id, att.originalName)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-civic-400 bg-slate-50 text-xs font-medium text-slate-800"
                >
                  <Paperclip className="w-3.5 h-3.5 text-civic-700" />
                  <span>{att.originalName}</span>
                  <span className="text-slate-400">({formatFileSize(att.sizeBytes)})</span>
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {grievance.aiAnalysis?.summary && <AiAssistantCard analysis={grievance.aiAnalysis} />}

      {/* Citizen Post-Resolution Feedback & Reopen */}
      {grievance.status === 'Resolved' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {grievance.feedback ? 'Your Resolution Feedback' : 'Submit Resolution Feedback'}
            </h2>
            {grievance.feedback ? (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Rating:</strong> {grievance.feedback.rating} / 5 stars (
                  {grievance.feedback.isSatisfied ? 'Satisfied' : 'Dissatisfied'})
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
                      Rating (1–5)
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} Star{n > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Outcome
                    </label>
                    <select
                      value={isSatisfied ? 'yes' : 'no'}
                      onChange={(e) => setIsSatisfied(e.target.value === 'yes')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="yes">Satisfied</option>
                      <option value="no">Not Satisfied</option>
                    </select>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share feedback about resolution quality..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-civic-700 hover:bg-civic-800 text-white text-xs font-semibold"
                >
                  Submit Feedback
                </button>
              </form>
            )}
          </div>

          <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-rose-600" />
              Issue Not Resolved? Reopen Grievance
            </h2>
            <p className="text-xs text-slate-600 mb-3">
              If the action taken did not resolve the grievance on ground, reopen it to notify the
              CMO for re-evaluation.
            </p>
            <form onSubmit={handleReopen} className="space-y-3">
              <textarea
                required
                minLength={5}
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Explain why the grievance needs reopening..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold"
              >
                Reopen Grievance
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Full Public History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">CMO & Department Updates Timeline</h2>
        <Timeline history={grievance.history} />
      </div>
    </div>
  );
}
