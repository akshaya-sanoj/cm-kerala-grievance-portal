import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FolderOpen,
  Mail,
  Search,
  Zap
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api, getApiErrorMessage } from '../../api/client.js';
import { LiveSyncBar } from '../../components/LiveSyncBar.jsx';
import { SlaCountdownBadge } from '../../components/SlaCountdownBadge.jsx';
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/formatters.js';

const STATUS_COLORS = {
  Submitted: '#64748b',
  'Under Review': '#d97706',
  'In Progress': '#0284c7',
  Resolved: '#059669',
  Reopened: '#e11d48'
};

function escapeCsvCell(value) {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

export function CmoDashboardPage() {
  const { tr, tStatus, tPriority, tDistrict, tCategory } = usePreferences();
  const [activeTab, setActiveTab] = useState('grievances');
  const [stats, setStats] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [metadata, setMetadata] = useState({
    districts: [],
    categories: [],
    statuses: [],
    priorities: []
  });
  const [departments, setDepartments] = useState([]);

  const [filters, setFilters] = useState({
    district: 'All',
    category: 'All',
    priority: 'All',
    status: 'All',
    departmentId: 'All',
    overdueOnly: false,
    atrPendingOnly: false,
    search: ''
  });

  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchDeptId, setBatchDeptId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function loadInitialData() {
    try {
      const [metaRes, deptRes, statsRes] = await Promise.all([
        api.get('/metadata'),
        api.get('/departments'),
        api.get('/cmo/stats')
      ]);
      setMetadata(metaRes.data.metadata || {});
      setDepartments(deptRes.data.departments || []);
      setStats(statsRes.data.stats || null);
      setLastSyncedAt(new Date());
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function loadGrievances(currentFilters = filters, silent = false) {
    if (!silent) setLoading(true);
    setSyncing(true);
    setError('');
    try {
      const res = await api.get('/cmo/grievances', {
        params: {
          district: currentFilters.district,
          category: currentFilters.category,
          priority: currentFilters.priority,
          status: currentFilters.status,
          departmentId: currentFilters.departmentId,
          overdueOnly: currentFilters.overdueOnly ? 'true' : undefined,
          atrPendingOnly: currentFilters.atrPendingOnly ? 'true' : undefined,
          search: currentFilters.search
        }
      });
      setGrievances(res.data.grievances || []);
      setLastSyncedAt(new Date());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  const handleLiveRefresh = useCallback(
    (silent = false) => {
      loadInitialData();
      loadGrievances(filters, silent);
    },
    [filters]
  );

  async function loadEnquiries() {
    try {
      const res = await api.get('/cmo/enquiries');
      setEnquiries(res.data.enquiries || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  useEffect(() => {
    loadInitialData();
    loadGrievances(filters);
  }, []);

  useEffect(() => {
    if (activeTab === 'enquiries') {
      loadEnquiries();
    }
  }, [activeTab]);

  function updateFilter(key, value) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    loadGrievances(next);
  }

  async function handleEnquiryStatus(id, status) {
    try {
      await api.patch(`/cmo/enquiries/${id}`, { status });
      await loadEnquiries();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleAutoEscalateOverdue() {
    setActionBusy(true);
    setNotice('');
    setError('');
    try {
      const res = await api.post('/cmo/escalate-overdue');
      setNotice(res.data.message);
      addToast(res.data.message);
      await Promise.all([loadInitialData(), loadGrievances(filters)]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  }

  function toggleSelectRow(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (!grievances.length) return;
    if (selectedIds.length === grievances.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(grievances.map((g) => g._id));
    }
  }

  async function handleBatchEscalate() {
    const targets = grievances.filter(
      (g) => selectedIds.includes(g._id) && g.status !== 'Resolved'
    );
    if (!targets.length) {
      setError('No active (non-resolved) grievances selected to escalate.');
      return;
    }
    setActionBusy(true);
    setNotice('');
    setError('');
    try {
      const results = await Promise.allSettled(
        targets.map((g) =>
          api.post(`/cmo/grievances/${g._id}/escalate`, {
            reason: 'Batch priority escalation by CMO Dashboard',
            bumpPriorityToHigh: true
          })
        )
      );
      const okCount = results.filter((r) => r.status === 'fulfilled').length;
      const msg = `Batch escalated ${okCount} of ${targets.length} selected grievance(s).`;
      setNotice(msg);
      addToast(msg);
      setSelectedIds([]);
      await Promise.all([loadInitialData(), loadGrievances(filters)]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleBatchAssign() {
    if (!batchDeptId) {
      setError('Choose a target department for batch assignment.');
      return;
    }
    const targets = grievances.filter((g) => selectedIds.includes(g._id));
    if (!targets.length) return;
    setActionBusy(true);
    setNotice('');
    setError('');
    try {
      const results = await Promise.allSettled(
        targets.map((g) =>
          api.post(`/cmo/grievances/${g._id}/assign`, {
            departmentId: batchDeptId,
            instructions: 'Routed via CMO Batch Action Queue'
          })
        )
      );
      const okCount = results.filter((r) => r.status === 'fulfilled').length;
      const msg = `Assigned ${okCount} of ${targets.length} selected grievance(s) to department.`;
      setNotice(msg);
      addToast(msg);
      setSelectedIds([]);
      await Promise.all([loadInitialData(), loadGrievances(filters)]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  }

  function handleExportCsv() {
    if (!grievances.length) return;
    const headers = [
      'Reference ID',
      'Subject',
      'Citizen',
      'District',
      'Category',
      'Department',
      'Priority',
      'Status',
      'Overdue',
      'Escalated',
      'Submitted Date',
      'SLA Due Date'
    ];
    const rows = grievances.map((g) => [
      g.referenceId,
      g.subject,
      g.citizenId?.name || '',
      g.district,
      g.category,
      g.assignedDepartmentId?.code || 'Unassigned',
      g.priority,
      g.status,
      g.isOverdue ? 'Yes' : 'No',
      g.isEscalated ? 'Yes' : 'No',
      formatDate(g.createdAt),
      formatDate(g.dueDate)
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cm-kerala-grievances.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    addToast(`Exported ${grievances.length} grievance(s) to CSV.`);
  }

  const overview = stats?.overview || {
    total: 0,
    pending: 0,
    resolved: 0,
    overdue: 0,
    escalated: 0,
    atrPendingReview: 0,
    contactEnquiries: 0,
    resolutionRate: 0,
    avgResolutionDays: 0
  };

  const statusChartData = Object.entries(stats?.byStatus || {}).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="civic-gradient rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            {tr('Central Administrative Command', 'കേന്ദ്ര ഭരണ സംവിധാനം')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            {tr("Chief Minister's Office (CMO) Dashboard", 'മുഖ്യമന്ത്രിയുടെ ഓഫീസ് (CMO) ഡാഷ്ബോർഡ്')}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {tr(
              'Review citizen grievances, verify AI insights, assign departments, escalate delays, and approve action-taken reports.',
              'പരാതികൾ പരിശോധിക്കുക, AI നിർദ്ദേശങ്ങൾ വിലയിരുത്തുക, വകുപ്പുകൾക്ക് കൈമാറുക, ATR അംഗീകരിക്കുക.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <TabBtn
            active={activeTab === 'grievances'}
            onClick={() => setActiveTab('grievances')}
            label={tr('Grievances Queue', 'പരാതി പട്ടിക')}
          />
          <TabBtn
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            label={tr('District & Dept Analytics', 'ജില്ലാ-വകുപ്പ് അനലിറ്റിക്സ്')}
            icon={<BarChart3 className="w-4 h-4" />}
          />
          <TabBtn
            active={activeTab === 'enquiries'}
            onClick={() => setActiveTab('enquiries')}
            label={`${tr('Enquiries', 'അന്വേഷണങ്ങൾ')} (${overview.contactEnquiries})`}
            icon={<Mail className="w-4 h-4" />}
          />
        </div>
      </div>

      <LiveSyncBar
        autoSync={autoSync}
        onToggleAutoSync={() => setAutoSync((prev) => !prev)}
        onRefresh={handleLiveRefresh}
        lastSyncedAt={lastSyncedAt}
        syncing={syncing}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label={tr('Total Grievances', 'ആകെ പരാതികൾ')}
          value={overview.total}
          sub={`${overview.atrPendingReview} ${tr('ATR ready for review', 'ATR പരിശോധനയ്ക്ക് തയ്യാർ')}`}
          icon={<FolderOpen className="w-4 h-4 text-indigo-600" />}
        />
        <KpiCard
          label={tr('Pending Action', 'നടപടിയിലുള്ളവ')}
          value={overview.pending}
          sub={`${overview.escalated} ${tr('escalated cases', 'അടിയന്തിര പരാതികൾ')}`}
          valueClass="text-amber-700"
          icon={<Clock className="w-4 h-4 text-amber-600" />}
        />
        <KpiCard
          label={tr('Resolved', 'പരിഹരിച്ചവ')}
          value={overview.resolved}
          sub={`${overview.resolutionRate}% ${tr('closure', 'പരിഹാര നിരക്ക്')} • ${overview.avgResolutionDays}d ${tr('avg', 'ശരാശരി')}`}
          valueClass="text-emerald-700"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <KpiCard
          label={tr('Overdue (SLA)', 'കാലാവധി കഴിഞ്ഞവ')}
          value={overview.overdue}
          sub={tr('Past target priority SLA', 'SLA സമയപരിധി കഴിഞ്ഞവ')}
          valueClass="text-rose-700"
          icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
        />
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* TAB 1: GRIEVANCES QUEUE */}
      {activeTab === 'grievances' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <select
                value={filters.district}
                onChange={(e) => updateFilter('district', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="All">{tr('All Districts', 'എല്ലാ ജില്ലകളും')}</option>
                {metadata.districts?.map((d) => (
                  <option key={d} value={d}>
                    {tDistrict(d)}
                  </option>
                ))}
              </select>

              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="All">{tr('All Categories', 'എല്ലാ വിഭാഗങ്ങളും')}</option>
                {metadata.categories?.map((c) => (
                  <option key={c} value={c}>
                    {tCategory(c)}
                  </option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => updateFilter('priority', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="All">{tr('All Priorities', 'എല്ലാ മുൻഗണനകളും')}</option>
                {metadata.priorities?.map((p) => (
                  <option key={p} value={p}>
                    {tPriority(p)}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="All">{tr('All Statuses', 'എല്ലാ അവസ്ഥകളും')}</option>
                {metadata.statuses?.map((s) => (
                  <option key={s} value={s}>
                    {tStatus(s)}
                  </option>
                ))}
              </select>

              <select
                value={filters.departmentId}
                onChange={(e) => updateFilter('departmentId', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="All">{tr('All Departments', 'എല്ലാ വകുപ്പുകളും')}</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.overdueOnly}
                    onChange={(e) => updateFilter('overdueOnly', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  {tr('Overdue Only', 'കാലാവധി കഴിഞ്ഞവ മാത്രം')}
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.atrPendingOnly}
                    onChange={(e) => updateFilter('atrPendingOnly', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  {tr('ATR Pending CMO Review', 'ATR പരിശോധന കാത്തിരിക്കുന്നവ')}
                </label>

                <button
                  type="button"
                  disabled={actionBusy || overview.overdue === 0}
                  onClick={handleAutoEscalateOverdue}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-800 border border-rose-200 font-semibold transition"
                >
                  <Zap className="w-3.5 h-3.5" /> {tr('Auto-Escalate Overdue', 'വൈകിയവ അടിയന്തിരമാക്കുക')}
                </button>

                <button
                  type="button"
                  disabled={grievances.length === 0}
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 border border-slate-200 font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" /> {tr('Export CSV', 'CSV ഡൗൺലോഡ്')}
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadGrievances(filters);
                }}
                className="flex gap-2 w-full sm:w-auto"
              >
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder={tr('Search reference ID or subject...', 'റഫറൻസ് ID അല്ലെങ്കിൽ വിഷയം തിരയുക...')}
                  className="flex-1 sm:w-64 px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" /> {tr('Filter', 'തിരയുക')}
                </button>
              </form>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="animate-slide-down bg-slate-900 text-white border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-amber-300">
                {selectedIds.length} {tr('grievance(s) selected', 'പരാതികൾ തിരഞ്ഞെടുത്തു')}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={batchDeptId}
                  onChange={(e) => setBatchDeptId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                >
                  <option value="">{tr('Choose Department...', 'വകുപ്പ് തിരഞ്ഞെടുക്കുക...')}</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={actionBusy || !batchDeptId}
                  onClick={handleBatchAssign}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition"
                >
                  {tr('Batch Assign', 'ഒന്നിച്ച് കൈമാറുക')}
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={handleBatchEscalate}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold transition"
                >
                  {tr('Batch Escalate', 'ഒന്നിച്ച് അടിയന്തിരമാക്കുക')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  {tr('Clear', 'മായ്ക്കുക')}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {tr('Loading grievances...', 'പരാതികൾ ലോഡ് ചെയ്യുന്നു...')}
              </div>
            ) : grievances.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {tr('No grievances match the selected filters.', 'തിരഞ്ഞെടുത്ത ഫിൽട്ടറുകളിൽ പരാതികളില്ല.')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-3 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={grievances.length > 0 && selectedIds.length === grievances.length}
                          onChange={toggleSelectAll}
                          aria-label="Select all grievances"
                          className="rounded border-slate-300 text-indigo-600"
                        />
                      </th>
                      <th className="py-3 px-4">{tr('Ref ID', 'റഫറൻസ് ID')}</th>
                      <th className="py-3 px-4">{tr('Citizen & Subject', 'പൗരനും വിഷയവും')}</th>
                      <th className="py-3 px-4">{tr('District / Category', 'ജില്ല / വിഭാഗം')}</th>
                      <th className="py-3 px-4">{tr('Assigned Dept', 'വകുപ്പ്')}</th>
                      <th className="py-3 px-4">{tr('Priority', 'മുൻഗണന')}</th>
                      <th className="py-3 px-4">{tr('Status', 'അവസ്ഥ')}</th>
                      <th className="py-3 px-4">{tr('SLA Due', 'SLA തീയതി')}</th>
                      <th className="py-3 px-4 text-right">{tr('Manage', 'നിയന്ത്രിക്കുക')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grievances.map((g) => (
                      <tr key={g._id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(g._id)}
                            onChange={() => toggleSelectRow(g._id)}
                            aria-label={`Select ${g.referenceId}`}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-indigo-700 block">
                            {g.referenceId}
                          </span>
                          {g.isEscalated && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700">
                              <AlertTriangle className="w-3 h-3" /> {tr('Escalated', 'അടിയന്തിരം')}
                            </span>
                          )}
                          {g.atrSubmitted && g.status !== 'Resolved' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-700 block">
                              {tr('ATR Ready', 'ATR തയ്യാർ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate">{g.subject}</p>
                          <p className="text-xs text-slate-500">
                            {tr('By', 'നൽകിയത്:')} {g.citizenId?.name || tr('Citizen', 'പൗരൻ')}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">
                          <p className="font-medium">{tDistrict(g.district)}</p>
                          <p className="text-slate-500">{tCategory(g.category)}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">
                          {g.assignedDepartmentId ? (
                            <span className="font-semibold">{g.assignedDepartmentId.code}</span>
                          ) : (
                            <span className="text-amber-700 font-medium">
                              {tr('Unassigned', 'നിയമിച്ചിട്ടില്ല')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={g.priority} />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={g.status} />
                        </td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap space-y-1">
                          <span
                            className={
                              g.isOverdue ? 'text-rose-700 font-bold block' : 'text-slate-600 block'
                            }
                          >
                            {formatDate(g.dueDate)}
                          </span>
                          <SlaCountdownBadge dueDate={g.dueDate} status={g.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/cmo/grievances/${g._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" /> {tr('Open', 'തുറക്കുക')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DISTRICT & DEPARTMENT ANALYTICS */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3">
                {tr('Status Distribution', 'അവസ്ഥ തിരിച്ചുള്ള വിതരണം')}
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {statusChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3">
                {tr('District-wise Grievances (Pending vs Resolved)', 'ജില്ല തിരിച്ചുള്ള പരാതികൾ')}
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byDistrict}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pending" name="Pending" fill="#d97706" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3">
                {tr('Department-wise Workload', 'വകുപ്പ് തിരിച്ചുള്ള പരാതികൾ')}
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byDepartment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pending" name="Pending" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#047857" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overdue" name="Overdue" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                {tr('Priority & SLA Snapshot', 'മുൻഗണന & SLA സംഗ്രഹം')}
              </h2>
              <div className="space-y-3 text-sm">
                {['High', 'Medium', 'Low'].map((p) => {
                  const count = stats.byPriority?.[p] || 0;
                  const pct = overview.total ? Math.round((count / overview.total) * 100) : 0;
                  return (
                    <div key={p}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>
                          {tPriority(p)} {tr('Priority', 'മുൻഗണന')}
                        </span>
                        <span>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p === 'High'
                              ? 'bg-rose-600'
                              : p === 'Medium'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p>
                  <strong>{tr('Closure Rate:', 'പരിഹാര നിരക്ക്:')}</strong> {overview.resolutionRate}%
                </p>
                <p>
                  <strong>{tr('Avg Time to Resolve:', 'ശരാശരി പരിഹാര സമയം:')}</strong>{' '}
                  {overview.avgResolutionDays} {tr('days', 'ദിവസം')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                {tr('District Summary Table', 'ജില്ലാ സംഗ്രഹ പട്ടിക')}
              </h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <tr>
                    <th className="py-2 px-3">{tr('District', 'ജില്ല')}</th>
                    <th className="py-2 px-3">{tr('Total', 'ആകെ')}</th>
                    <th className="py-2 px-3">{tr('Pending', 'ബാക്കി')}</th>
                    <th className="py-2 px-3">{tr('Resolved', 'പരിഹരിച്ചത്')}</th>
                    <th className="py-2 px-3">{tr('Overdue', 'വൈകിയത്')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.byDistrict.map((row) => (
                    <tr
                      key={row.district}
                      onClick={() => {
                        setActiveTab('grievances');
                        updateFilter('district', row.district);
                      }}
                      title="Click to filter queue by this district"
                      className="cursor-pointer hover:bg-indigo-50/70 transition"
                    >
                      <td className="py-2 px-3 font-semibold text-indigo-800">
                        {tDistrict(row.district)}
                      </td>
                      <td className="py-2 px-3">{row.total}</td>
                      <td className="py-2 px-3 text-amber-700 font-medium">{row.pending}</td>
                      <td className="py-2 px-3 text-emerald-700 font-medium">{row.resolved}</td>
                      <td className="py-2 px-3 text-rose-700 font-medium">{row.overdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                {tr('Department Summary Table', 'വകുപ്പ് സംഗ്രഹ പട്ടിക')}
              </h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <tr>
                    <th className="py-2 px-3">{tr('Department', 'വകുപ്പ്')}</th>
                    <th className="py-2 px-3">{tr('Total', 'ആകെ')}</th>
                    <th className="py-2 px-3">{tr('Pending', 'ബാക്കി')}</th>
                    <th className="py-2 px-3">{tr('Resolved', 'പരിഹരിച്ചത്')}</th>
                    <th className="py-2 px-3">{tr('Overdue', 'വൈകിയത്')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.byDepartment.map((row) => (
                    <tr
                      key={row.code}
                      onClick={() => {
                        setActiveTab('grievances');
                        updateFilter('departmentId', row.departmentId);
                      }}
                      title="Click to filter queue by this department"
                      className="cursor-pointer hover:bg-indigo-50/70 transition"
                    >
                      <td className="py-2 px-3 font-semibold text-indigo-800">
                        {row.code} — {row.name}
                      </td>
                      <td className="py-2 px-3">{row.total}</td>
                      <td className="py-2 px-3 text-amber-700 font-medium">{row.pending}</td>
                      <td className="py-2 px-3 text-emerald-700 font-medium">{row.resolved}</td>
                      <td className="py-2 px-3 text-rose-700 font-medium">{row.overdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PUBLIC CONTACT ENQUIRIES */}
      {activeTab === 'enquiries' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              {tr('Public Contact Enquiries', 'പൊതു അന്വേഷണങ്ങൾ')}
            </h2>
            <p className="text-xs text-slate-500">
              {tr(
                'Submitted via the public Contact Us page and persisted in MongoDB.',
                'ബന്ധപ്പെടുക പേജ് വഴി ലഭിച്ച സന്ദേശങ്ങൾ.'
              )}
            </p>
          </div>
          {enquiries.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {tr('No contact enquiries yet.', 'അന്വേഷണങ്ങളൊന്നും ഇതുവരെ ഇല്ല.')}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {enquiries.map((item) => (
                <div key={item._id} className="p-5 flex flex-wrap justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.subject}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      From: <strong>{item.name}</strong> ({item.email}) •{' '}
                      {formatDate(item.createdAt)}
                    </p>
                    <p className="text-sm text-slate-700 pt-1">{item.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleEnquiryStatus(item._id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      <option value="New">New</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Responded">Responded</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, label, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
        active
          ? 'bg-amber-400 text-slate-950 border-amber-400 shadow'
          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function KpiCard({ label, value, sub, icon, valueClass = 'text-slate-900' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
        <span>{label}</span>
        {icon}
      </div>
      <p className={`text-2xl sm:text-3xl font-extrabold ${valueClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
