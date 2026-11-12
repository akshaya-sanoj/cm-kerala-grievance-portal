import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  MessageSquarePlus,
  Printer,
  Send,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/client.js';
import { AiAssistantCard } from '../../components/AiAssistantCard.jsx';
import { AttachmentList } from '../../components/AttachmentList.jsx';
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge.jsx';
import { StatusStepper } from '../../components/StatusStepper.jsx';
import { Timeline } from '../../components/Timeline.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { formatDate } from '../../utils/formatters.js';

export function CmoGrievanceDetailPage() {
  const { tr, tDistrict, tCategory, tPriority, tDeptName } = usePreferences();
  const { id } = useParams();
  const [grievance, setGrievance] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [assignForm, setAssignForm] = useState({
    departmentId: '',
    officerId: '',
    priority: 'Medium',
    instructions: ''
  });
  const [remarkForm, setRemarkForm] = useState({ remarks: '', isInternal: true });
  const [escalateReason, setEscalateReason] = useState('');
  const [reviewForm, setReviewForm] = useState({ decision: 'approve', remarks: '' });

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [detailRes, deptRes, officerRes] = await Promise.all([
        api.get(`/cmo/grievances/${id}`),
        api.get('/departments'),
        api.get('/cmo/officers')
      ]);
      const g = detailRes.data.grievance;
      setGrievance(g);
      setDepartments(deptRes.data.departments || []);
      setOfficers(officerRes.data.officers || []);

      const suggestedDept = (deptRes.data.departments || []).find(
        (d) => d.code === g.aiAnalysis?.suggestedDepartmentCode
      );
      setAssignForm({
        departmentId: g.assignedDepartmentId?._id || suggestedDept?._id || '',
        officerId: g.assignedOfficerId?._id || '',
        priority: g.priority || 'Medium',
        instructions: ''
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [id]);

  async function handleRunAi() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await api.post(`/cmo/grievances/${id}/ai-review`);
      setMessage('AI analysis refreshed for CMO review.');
      await loadAll();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/cmo/grievances/${id}/assign`, {
        departmentId: assignForm.departmentId,
        officerId: assignForm.officerId || null,
        priority: assignForm.priority,
        instructions: assignForm.instructions
      });
      setMessage(res.data.message);
      await loadAll();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddRemark(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/cmo/grievances/${id}/remarks`, remarkForm);
      setRemarkForm({ remarks: '', isInternal: remarkForm.isInternal });
      setMessage(res.data.message);
      await loadAll();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleEscalate(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/cmo/grievances/${id}/escalate`, {
        reason: escalateReason,
        bumpPriorityToHigh: true
      });
      setEscalateReason('');
      setMessage(res.data.message);
      await loadAll();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReviewResolution(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/cmo/grievances/${id}/review-resolution`, reviewForm);
      setReviewForm({ decision: 'approve', remarks: '' });
      setMessage(res.data.message);
      await loadAll();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Loading grievance record...
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

  const filteredOfficers = officers.filter(
    (o) => !assignForm.departmentId || o.departmentId?._id === assignForm.departmentId
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/cmo/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeft className="w-4 h-4" /> {tr('Back to CMO Dashboard', 'CMO ഡാഷ്ബോർഡിലേക്ക് മടങ്ങുക')}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
        >
          <Printer className="w-3.5 h-3.5" /> {tr('Print Case File', 'കേസ് ഫയൽ പ്രിന്റ്')}
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

      {/* Main Grievance Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold text-indigo-600">{grievance.referenceId}</p>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{grievance.subject}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {tr('Citizen:', 'പൗരൻ:')} <strong>{grievance.citizenId?.name}</strong> (
              {grievance.citizenId?.email} • {grievance.citizenId?.mobileNumber})
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

        <div className="grid sm:grid-cols-4 gap-3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div>
            <span className="text-slate-500 block">{tr('District & Category', 'ജില്ലയും വിഭാഗവും')}</span>
            <strong className="text-slate-800">
              {tDistrict(grievance.district)} • {tCategory(grievance.category)}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">{tr('Assigned Department', 'വകുപ്പ്')}</span>
            <strong className="text-slate-800">
              {tDeptName(grievance.assignedDepartmentId) || tr('Unassigned', 'നിയമിച്ചിട്ടില്ല')}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">{tr('Assigned Officer', 'ഉദ്യോഗസ്ഥൻ')}</span>
            <strong className="text-slate-800">
              {grievance.assignedOfficerId?.name || tr('Department Pool', 'വകുപ്പ് പൂൾ')}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">{tr('SLA Due Date', 'SLA തീയതി')}</span>
            <strong className={grievance.isOverdue ? 'text-rose-700' : 'text-slate-800'}>
              {formatDate(grievance.dueDate)}{' '}
              {grievance.isOverdue ? `(${tr('Overdue', 'കാലാവധി കഴിഞ്ഞു')})` : ''}
            </strong>
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {grievance.description}
        </p>

        <AttachmentList attachments={grievance.attachments} />
      </div>

      {/* AI Assistant Insights + Refresh */}
      <div className="space-y-2">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleRunAi}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />{' '}
            {tr('Re-run AI Triage & Duplicate Check', 'AI പരിശോധന വീണ്ടും നടത്തുക')}
          </button>
        </div>
        <AiAssistantCard analysis={grievance.aiAnalysis} />
      </div>

      {/* CMO Administrative Action Panels */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Forward / Assign to Department */}
        <form
          onSubmit={handleAssign}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            {tr('Assign / Forward to Department & Officer', 'വകുപ്പിലേക്കും ഉദ്യോഗസ്ഥനിലേക്കും കൈമാറുക')}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr('Target Department *', 'വകുപ്പ് *')}
              </label>
              <select
                required
                value={assignForm.departmentId}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, departmentId: e.target.value, officerId: '' })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">{tr('Select Department', 'വകുപ്പ് തിരഞ്ഞെടുക്കുക')}</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} — {tDeptName(d)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr('Officer (Optional)', 'ഉദ്യോഗസ്ഥൻ (ഐച്ഛികം)')}
                </label>
                <select
                  value={assignForm.officerId}
                  onChange={(e) => setAssignForm({ ...assignForm, officerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="">{tr('Auto-assign Nodal Officer', 'നോഡൽ ഉദ്യോഗസ്ഥനെ നിയമിക്കുക')}</option>
                  {filteredOfficers.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr('Official Priority', 'ഔദ്യോഗിക മുൻഗണന')}
                </label>
                <select
                  value={assignForm.priority}
                  onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="Low">{tPriority('Low')}</option>
                  <option value="Medium">{tPriority('Medium')}</option>
                  <option value="High">{tPriority('High')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr('CMO Instructions', 'CMO നിർദ്ദേശങ്ങൾ')}
              </label>
              <textarea
                rows={2}
                value={assignForm.instructions}
                onChange={(e) => setAssignForm({ ...assignForm, instructions: e.target.value })}
                placeholder={tr('Instructions for department investigation...', 'അന്വേഷണ നിർദ്ദേശങ്ങൾ എഴുതുക...')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
          >
            <Send className="w-3.5 h-3.5" /> {tr('Forward to Department', 'വകുപ്പിലേക്ക് അയയ്ക്കുക')}
          </button>
        </form>

        {/* Review Action-Taken Report OR Resolve */}
        <form
          onSubmit={handleReviewResolution}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-700" />
            {tr('Review Department ATR & Resolution', 'വകുപ്പ് ATR പരിശോധനയും തീർപ്പാക്കലും')}
          </h2>

          {grievance.actionTakenReport ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950">
              <p className="font-bold uppercase mb-1">
                {tr('Latest Action-Taken Report:', 'ഏറ്റവും പുതിയ ATR റിപ്പോർട്ട്:')}
              </p>
              <p>{grievance.actionTakenReport}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
              {tr(
                'No department Action-Taken Report submitted yet. CMO can still directly close or update once verified.',
                'വകുപ്പ് ATR ഇതുവരെ സമർപ്പിച്ചിട്ടില്ല. പരിശോധിച്ച ശേഷം CMO-യ്ക്ക് തീർപ്പാക്കാം.'
              )}
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr('CMO Decision', 'CMO തീരുമാനം')}
            </label>
            <select
              value={reviewForm.decision}
              onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="approve">
                {tr('Approve Resolution & Mark as Resolved', 'പരിഹാരം അംഗീകരിച്ച് തീർപ്പാക്കുക')}
              </option>
              <option value="return">
                {tr('Return to Department for Further Action', 'തുടർനടപടിക്കായി വകുപ്പിലേക്ക് തിരിച്ചയയ്ക്കുക')}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr('Official Review Remarks *', 'ഔദ്യോഗിക പരിശോധനാ കുറിപ്പ് *')}
            </label>
            <textarea
              required
              minLength={3}
              rows={2}
              value={reviewForm.remarks}
              onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
              placeholder={tr('Summarize CMO verification decision for citizen & audit log...', 'CMO തീരുമാനം രേഖപ്പെടുത്തുക...')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> {tr('Submit CMO Decision', 'CMO തീരുമാനം സമർപ്പിക്കുക')}
          </button>
        </form>

        {/* Add Internal / Public Remark */}
        <form
          onSubmit={handleAddRemark}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3"
        >
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquarePlus className="w-4 h-4 text-sky-700" />
            {tr('Add Administrative Remark', 'ഭരണപരമായ കുറിപ്പ് ചേർക്കുക')}
          </h2>
          <textarea
            required
            minLength={3}
            rows={3}
            value={remarkForm.remarks}
            onChange={(e) => setRemarkForm({ ...remarkForm, remarks: e.target.value })}
            placeholder={tr('Record CMO observation or public update...', 'നിരീക്ഷണമോ പൊതു അറിയിപ്പോ എഴുതുക...')}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={remarkForm.isInternal}
              onChange={(e) => setRemarkForm({ ...remarkForm, isInternal: e.target.checked })}
            />
            {tr(
              'Internal administrative note (hidden from citizen & public tracker)',
              'ആഭ്യന്തര കുറിപ്പ് (പൗരന്മാർക്ക് ദൃശ്യമാകില്ല)'
            )}
          </label>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
          >
            {tr('Save Remark', 'കുറിപ്പ് സേവ് ചെയ്യുക')}
          </button>
        </form>

        {/* Escalate Delayed Grievance */}
        <form
          onSubmit={handleEscalate}
          className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm space-y-3"
        >
          <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            {tr('Escalate Delayed Grievance', 'വൈകിയ പരാതി അടിയന്തിരമാക്കുക')}
          </h2>
          <p className="text-xs text-slate-600">
            {tr(
              'Flags the grievance for urgent CMO monitoring and elevates priority to High.',
              'പരാതി അടിയന്തിര നിരീക്ഷണത്തിലേക്ക് മാറ്റുകയും മുൻഗണന ഉയർത്തുകയും ചെയ്യുന്നു.'
            )}
          </p>
          <textarea
            required
            minLength={5}
            rows={3}
            value={escalateReason}
            onChange={(e) => setEscalateReason(e.target.value)}
            placeholder={tr('Reason for escalation (e.g., SLA breached, urgent public safety impact)...', 'അടിയന്തിരമാക്കുന്നതിനുള്ള കാരണം നൽകുക...')}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <button
            type="submit"
            disabled={busy || grievance.status === 'Resolved'}
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold"
          >
            {tr('Escalate Grievance', 'അടിയന്തിരമായി ഉയർത്തുക')}
          </button>
        </form>
      </div>

      {/* Full Audit History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {tr('Complete Audit History (Including Internal Notes)', 'പൂർണ്ണ ഓഡിറ്റ് ചരിത്രം')}
        </h2>
        <Timeline history={grievance.history} />
      </div>
    </div>
  );
}
