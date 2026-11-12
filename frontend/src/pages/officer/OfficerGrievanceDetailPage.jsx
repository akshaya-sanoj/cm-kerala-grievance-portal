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
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { formatDate } from '../../utils/formatters.js';

export function OfficerGrievanceDetailPage() {
  const { tr, tDistrict, tCategory, tStage } = usePreferences();
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
          <ArrowLeft className="w-4 h-4" />{' '}
          {tr('Back to Officer Queue', 'ഉദ്യോഗസ്ഥ ഡാഷ്ബോർഡിലേക്ക് മടങ്ങുക')}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
        >
          <Printer className="w-3.5 h-3.5" /> {tr('Print Record', 'പ്രിന്റ് എടുക്കുക')}
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
              {tr('Citizen:', 'പൗരൻ:')} {grievance.citizenId?.name} •{' '}
              {tDistrict(grievance.district)} • {tCategory(grievance.category)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={grievance.status} />
            <PriorityBadge priority={grievance.priority} />
            {grievance.isEscalated && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                <AlertTriangle className="w-3 h-3" /> {tr('Escalated', 'അടിയന്തിരം')}
              </span>
            )}
          </div>
        </div>

        <StatusStepper status={grievance.status} />

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs flex flex-wrap justify-between gap-2">
          <span>
            <strong>{tr('Workflow Stage:', 'നിലവിലെ ഘട്ടം:')}</strong>{' '}
            {tStage(grievance.workflowStage)}
          </span>
          <span className={grievance.isOverdue ? 'text-rose-700 font-bold' : 'text-slate-700'}>
            <strong>{tr('Target SLA Due:', 'ലക്ഷ്യ SLA തീയതി:')}</strong> {formatDate(grievance.dueDate)}{' '}
            {grievance.isOverdue ? `(${tr('Overdue', 'കാലാവധി കഴിഞ്ഞു')})` : ''}
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
              {tr(
                'Update Progress & Investigation Remarks',
                'അന്വേഷണ പുരോഗതിയും കുറിപ്പുകളും ചേർക്കുക'
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {tr(
                'Marks status as In Progress and logs field inspection remarks.',
                'പരാതി "നടപടി പുരോഗതിയിൽ" എന്നാക്കുകയും ഫീൽഡ് പരിശോധനാ വിവരങ്ങൾ രേഖപ്പെടുത്തുകയും ചെയ്യുന്നു.'
              )}
            </p>
            <textarea
              required
              minLength={5}
              rows={4}
              value={investigationNote}
              onChange={(e) => setInvestigationNote(e.target.value)}
              placeholder={tr(
                'Enter field visit findings, verification status, or scheduled repair date...',
                'ഫീൽഡ് പരിശോധനയിൽ കണ്ടെത്തിയ കാര്യങ്ങൾ എഴുതുക...'
              )}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold"
            >
              {tr('Mark In Progress & Save Remarks', 'പുരോഗതി രേഖപ്പെടുത്തി സേവ് ചെയ്യുക')}
            </button>
          </form>

          <form
            onSubmit={handleAtrSubmit}
            className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-700" />
              {tr('Submit Action-Taken Report (ATR) to CMO', 'CMO-യ്ക്ക് Action-Taken റിപ്പോർട്ട് (ATR) അയയ്ക്കുക')}
            </h2>
            <p className="text-xs text-slate-500">
              {tr(
                'Enter final action details and optional completion proof to submit back to the CMO for closure review.',
                'സ്വീകരിച്ച അന്തിമ നടപടികളും തെളിവുകളും CMO-യുടെ പരിശോധനയ്ക്കായി സമർപ്പിക്കുക.'
              )}
            </p>
            <textarea
              required
              minLength={10}
              rows={4}
              value={atrText}
              onChange={(e) => setAtrText(e.target.value)}
              placeholder={tr(
                'Describe corrective action completed, work order numbers, and verification notes...',
                'പൂർത്തിയാക്കിയ നടപടികളുടെ വിശദാംശങ്ങൾ നൽകുക...'
              )}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr('Upload ATR Document / Photo (Optional)', 'ATR രേഖ / ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക')}
              </label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 cursor-pointer text-xs text-slate-600 bg-slate-50">
                <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">
                  {atrFile ? atrFile.name : tr('Choose PDF, DOC, JPG, or PNG...', 'ഫയൽ തിരഞ്ഞെടുക്കുക...')}
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
              <Send className="w-3.5 h-3.5" /> {tr('Submit ATR to CMO', 'CMO-യ്ക്ക് ATR സമർപ്പിക്കുക')}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {tr('Grievance Audit Timeline', 'പരാതി ഓഡിറ്റ് ചരിത്രം')}
        </h2>
        <Timeline history={grievance.history} />
      </div>
    </div>
  );
}
