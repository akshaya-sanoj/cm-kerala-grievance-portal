import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  FileCheck2,
  Link2,
  MapPin,
  Printer,
  QrCode,
  Search,
  Star
} from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';
import { LiveSyncBar } from '../components/LiveSyncBar.jsx';
import { SlaCountdownBadge } from '../components/SlaCountdownBadge.jsx';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge.jsx';
import { StatusStepper } from '../components/StatusStepper.jsx';
import { Timeline } from '../components/Timeline.jsx';
import { VerificationSealModal } from '../components/VerificationSealModal.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { formatDate } from '../utils/formatters.js';

export function TrackGrievancePage() {
  const { tr, tDistrict, tStage, tDeptName } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const [refId, setRefId] = useState(initialRef);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [error, setError] = useState('');
  const [grievance, setGrievance] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sealOpen, setSealOpen] = useState(false);

  const lookupGrievance = useCallback(async (targetRef, silent = false) => {
    const cleaned = String(targetRef || '').trim().toUpperCase();
    if (!cleaned) return;
    if (!silent) {
      setLoading(true);
      setGrievance(null);
    }
    setSyncing(true);
    setError('');
    try {
      const res = await api.get(`/grievances/track/${encodeURIComponent(cleaned)}`);
      setGrievance(res.data.grievance);
      setLastSyncedAt(new Date());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Grievance not found.'));
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (initialRef) {
      setRefId(initialRef);
      lookupGrievance(initialRef);
    }
  }, [initialRef]);

  function handleSubmit(e) {
    e.preventDefault();
    const cleaned = refId.trim().toUpperCase();
    if (!cleaned) return;
    setSearchParams({ ref: cleaned });
    lookupGrievance(cleaned);
  }

  function handleCopyLink() {
    if (!grievance?.referenceId) return;
    const shareUrl = `${window.location.origin}/track?ref=${encodeURIComponent(
      grievance.referenceId
    )}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          {tr('Public Status Verification', 'പൊതു തൽസ്ഥിതി പരിശോധന')}
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900">
          {tr('Track Grievance Status', 'പരാതി തൽസ്ഥിതി പരിശോധിക്കുക')}
        </h1>
        <p className="text-sm text-slate-600">
          {tr(
            'Search by your unique Reference ID to view real-time status, assigned department, and public workflow history.',
            'Reference ID നൽകിയാൽ തത്സമയ അവസ്ഥ, ബന്ധപ്പെട്ട വകുപ്പ്, നടപടി ചരിത്രം എന്നിവ കാണാം.'
          )}
        </p>
      </div>

      <div className="no-print bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            placeholder={tr('Enter Reference ID (e.g., KL-CMO-2026-100101)', 'Reference ID നൽകുക (ഉദാ: KL-CMO-2026-100101)')}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition"
          >
            <Search className="w-4 h-4" />
            {loading ? tr('Searching...', 'തിരയുന്നു...') : tr('Track Status', 'പരിശോധിക്കുക')}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{tr('Demo Reference IDs:', 'ഡെമോ Reference ID-കൾ:')}</span>
          {[
            'KL-CMO-2026-100101',
            'KL-CMO-2026-100102',
            'KL-CMO-2026-100103',
            'KL-CMO-2026-100105',
            'KL-CMO-2026-100106'
          ].map((sampleId) => (
            <button
              key={sampleId}
              type="button"
              onClick={() => {
                setRefId(sampleId);
                setSearchParams({ ref: sampleId });
                lookupGrievance(sampleId);
              }}
              className="font-mono px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200"
            >
              {sampleId}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {grievance && (
        <div className="space-y-6 animate-pop-in">
          <LiveSyncBar
            autoSync={autoSync}
            onToggleAutoSync={() => setAutoSync((prev) => !prev)}
            onRefresh={(silent) => lookupGrievance(grievance.referenceId, silent)}
            lastSyncedAt={lastSyncedAt}
            syncing={syncing}
          />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-bold text-indigo-600">
                  {grievance.referenceId}
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{grievance.subject}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={grievance.status} />
                <PriorityBadge priority={grievance.priority} />
                <SlaCountdownBadge dueDate={grievance.dueDate} status={grievance.status} />
                {grievance.isEscalated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertTriangle className="w-3 h-3" /> {tr('Escalated', 'അടിയന്തിരമാക്കി')}
                  </span>
                )}
              </div>
            </div>

            <StatusStepper status={grievance.status} />

            <div className="grid sm:grid-cols-3 gap-4 pt-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>
                  <strong>{tr('District:', 'ജില്ല:')}</strong> {tDistrict(grievance.district)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>
                  <strong>{tr('Department:', 'വകുപ്പ്:')}</strong>{' '}
                  {tDeptName(grievance.assignedDepartment) ||
                    tr('Pending CMO Assignment', 'CMO നിയമനം കാത്തിരിക്കുന്നു')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  <strong>{tr('Submitted:', 'സമർപ്പിച്ചത്:')}</strong> {formatDate(grievance.createdAt)}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>{tr('Current Stage:', 'നിലവിലെ ഘട്ടം:')}</strong>{' '}
                {tStage(grievance.workflowStage)}
              </span>
              <span>
                <strong>{tr('Target SLA Date:', 'ലക്ഷ്യ SLA തീയതി:')}</strong> {formatDate(grievance.dueDate)}{' '}
                {grievance.isOverdue && (
                  <span className="text-rose-700 font-bold">({tr('Overdue', 'കാലാവധി കഴിഞ്ഞു')})</span>
                )}
              </span>
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

            {grievance.feedback && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>
                  {tr('Citizen rated resolution', 'പൗരന്റെ റേറ്റിംഗ്:')}{' '}
                  <strong>{grievance.feedback.rating}/5</strong> (
                  {grievance.feedback.isSatisfied
                    ? tr('Satisfied', 'തൃപ്തികരം')
                    : tr('Dissatisfied', 'അതൃപ്തി')}
                  )
                </span>
              </div>
            )}

            <div className="no-print flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />{' '}
                    {tr('Tracking Link Copied', 'ട്രാക്കിംഗ് ലിങ്ക് പകർത്തി')}
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />{' '}
                    {tr('Copy Tracking Link', 'ട്രാക്കിംഗ് ലിങ്ക് പകർത്തുക')}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />{' '}
                {tr('Print Status Summary', 'തൽസ്ഥിതി പ്രിന്റ് ചെയ്യുക')}
              </button>
              <button
                type="button"
                onClick={() => setSealOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-semibold transition"
              >
                <QrCode className="w-3.5 h-3.5" />{' '}
                {tr('Official Receipt & QR Card', 'ഔദ്യോഗിക രസീത് & QR കാർഡ്')}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {tr('Public Status History', 'പൊതു നടപടി ചരിത്രം')}
            </h3>
            <Timeline history={grievance.history} />
          </div>

          <VerificationSealModal
            grievance={sealOpen ? grievance : null}
            onClose={() => setSealOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
