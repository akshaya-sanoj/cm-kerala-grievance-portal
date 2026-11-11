import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Building2, Calendar, FileCheck2, MapPin, Search, Star } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge.jsx';
import { Timeline } from '../components/Timeline.jsx';
import { formatDate } from '../utils/formatters.js';

export function TrackGrievancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const [refId, setRefId] = useState(initialRef);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [grievance, setGrievance] = useState(null);

  async function lookupGrievance(targetRef) {
    const cleaned = targetRef.trim().toUpperCase();
    if (!cleaned) return;
    setLoading(true);
    setError('');
    setGrievance(null);
    try {
      const res = await api.get(`/grievances/track/${encodeURIComponent(cleaned)}`);
      setGrievance(res.data.grievance);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Grievance not found.'));
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-civic-700">
          Public Status Verification
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900">Track Grievance Status</h1>
        <p className="text-sm text-slate-600">
          Search by your unique Reference ID to view real-time status, assigned department, and
          public workflow history.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            placeholder="Enter Reference ID (e.g., KL-CMO-2026-100101)"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-civic-600 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-civic-700 hover:bg-civic-800 disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : 'Track Status'}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Demo Reference IDs:</span>
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
              className="font-mono px-2.5 py-1 rounded bg-slate-100 hover:bg-civic-50 text-slate-700 hover:text-civic-800 border border-slate-200"
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
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-bold text-civic-700">
                  {grievance.referenceId}
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{grievance.subject}</h2>
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

            <div className="grid sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>
                  <strong>District:</strong> {grievance.district}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>
                  <strong>Department:</strong>{' '}
                  {grievance.assignedDepartment?.name || 'Pending CMO Assignment'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  <strong>Submitted:</strong> {formatDate(grievance.createdAt)}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Current Stage:</strong> {grievance.workflowStage}
              </span>
              <span>
                <strong>Target SLA Date:</strong> {formatDate(grievance.dueDate)}{' '}
                {grievance.isOverdue && (
                  <span className="text-rose-700 font-bold">(Overdue)</span>
                )}
              </span>
            </div>

            {grievance.actionTakenReport && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4" /> Official Action-Taken Report
                </p>
                <p className="text-sm text-emerald-950">{grievance.actionTakenReport}</p>
              </div>
            )}

            {grievance.feedback && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>
                  Citizen rated resolution <strong>{grievance.feedback.rating}/5</strong> (
                  {grievance.feedback.isSatisfied ? 'Satisfied' : 'Dissatisfied'})
                </span>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Public Status History</h3>
            <Timeline history={grievance.history} />
          </div>
        </div>
      )}
    </div>
  );
}
