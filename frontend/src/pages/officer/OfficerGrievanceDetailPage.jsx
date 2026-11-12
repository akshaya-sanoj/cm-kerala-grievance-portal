import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardEdit,
  FileCheck2,
  Paperclip,
  Printer,
  Send
} from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/client.js';
import { AttachmentList } from '../../components/AttachmentList.jsx';
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge.jsx';
import { StatusStepper } from '../../components/StatusStepper.jsx';
import { Timeline } from '../../components/Timeline.jsx';
import { formatDate } from '../../utils/formatters.js';

export function OfficerGrievanceDetailPage() {
  const { id } = useParams();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [investigationNote, setInvestigationNote] = useState('');
  const [atrText, setAtrText] = useState('');
  const [atrFile, setAtrFile] = useState(null);

  async function loadDetail() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/officer/grievances/${id}`);
      setGrievance(res.data.grievance);
      if (res.data.grievance?.actionTakenReport) {
        setAtrText(res.data.grievance.actionTakenReport);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [id]);

  async function handleInvestigationUpdate(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const res = await api.patch(`/officer/grievances/${id}/investigate`, {
        remarks: investigationNote
      });
      setInvestigationNote('');
      setMessage(res.data.message);
      await loadDetail();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAtrSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('actionTakenReport', atrText);
      if (atrFile) {
        formData.append('attachment', atrFile);
      }
      const res = await api.post(`/officer/grievances/${id}/atr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAtrFile(null);
      setMessage(res.data.message);
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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error || 'Grievance not found.'}
        </div>
      </div>
    );
  }

  const isResolved = grievance.status === 'Resolved';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/officer/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Officer Queue
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
        >
          <Printer className="w-3.5 h-3.5" /> Print Record
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
          {message}
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
            <p className="text-xs text-slate-500 mt-1">
              Citizen: {grievance.citizenId?.name} • {grievance.district} • {grievance.category}
            </p>
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

        <StatusStepper status={grievance.status} />

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs flex flex-wrap justify-between gap-2">
          <span>
            <strong>Workflow Stage:</strong> {grievance.workflowStage}
          </span>
          <span className={grievance.isOverdue ? 'text-rose-700 font-bold' : 'text-slate-700'}>
            <strong>Target SLA Due:</strong> {formatDate(grievance.dueDate)}{' '}
            {grievance.isOverdue ? '(Overdue)' : ''}
          </span>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {grievance.description}
        </p>

        <AttachmentList attachments={grievance.attachments} />
      </div>

      {/* Officer Actions */}
      {!isResolved && (
        <div className="grid md:grid-cols-2 gap-6">
          <form
            onSubmit={handleInvestigationUpdate}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardEdit className="w-4 h-4 text-sky-700" />
              Update Progress & Investigation Remarks
            </h2>
            <p className="text-xs text-slate-500">
              Marks status as <strong>In Progress</strong> and logs field inspection remarks.
            </p>
            <textarea
              required
              minLength={5}
              rows={4}
              value={investigationNote}
              onChange={(e) => setInvestigationNote(e.target.value)}
              placeholder="Enter field visit findings, verification status, or scheduled repair date..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold"
            >
              Mark In Progress & Save Remarks
            </button>
          </form>

          <form
            onSubmit={handleAtrSubmit}
            className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-700" />
              Submit Action-Taken Report (ATR) to CMO
            </h2>
            <p className="text-xs text-slate-500">
              Enter final action details and optional completion proof to submit back to the CMO
              for closure review.
            </p>
            <textarea
              required
              minLength={10}
              rows={4}
              value={atrText}
              onChange={(e) => setAtrText(e.target.value)}
              placeholder="Describe corrective action completed, work order numbers, and verification notes..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload ATR Document / Photo (Optional)
              </label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 cursor-pointer text-xs text-slate-600 bg-slate-50">
                <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">
                  {atrFile ? atrFile.name : 'Choose PDF, DOC, JPG, or PNG...'}
                </span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                  onChange={(e) => setAtrFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" /> Submit ATR to CMO
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Grievance Audit Timeline</h2>
        <Timeline history={grievance.history} />
      </div>
    </div>
  );
}
