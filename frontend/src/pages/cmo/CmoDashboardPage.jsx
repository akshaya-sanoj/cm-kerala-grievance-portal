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
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge.jsx';
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
            Central Administrative Command
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Chief Minister&apos;s Office (CMO) Dashboard
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Review citizen grievances, verify AI insights, assign departments, escalate delays, and
            approve action-taken reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <TabBtn
            active={activeTab === 'grievances'}
            onClick={() => setActiveTab('grievances')}
            label="Grievances Queue"
          />
          <TabBtn
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            label="District & Dept Analytics"
            icon={<BarChart3 className="w-4 h-4" />}
          />
          <TabBtn
            active={activeTab === 'enquiries'}
            onClick={() => setActiveTab('enquiries')}
            label={`Enquiries (${overview.contactEnquiries})`}
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
          label="Total Grievances"
          value={overview.total}
          sub={`${overview.atrPendingReview} ATR ready for review`}
          icon={<FolderOpen className="w-4 h-4 text-indigo-600" />}
        />
        <KpiCard
          label="Pending Action"
          value={overview.pending}
          sub={`${overview.escalated} escalated cases`}
          valueClass="text-amber-700"
          icon={<Clock className="w-4 h-4 text-amber-600" />}
        />
        <KpiCard
          label="Resolved"
          value={overview.resolved}
          sub={`${overview.resolutionRate}% closure • ${overview.avgResolutionDays}d avg`}
          valueClass="text-emerald-700"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <KpiCard
          label="Overdue (SLA)"
          value={overview.overdue}
          sub="Past target priority SLA"
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
                <option value="All">All Districts</option>
                {metadata.districts?.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="All">All Categories</option>
                {metadata.categories?.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => updateFilter('priority', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="All">All Priorities</option>
                {metadata.priorities?.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="All">All Statuses</option>
                {metadata.statuses?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={filters.departmentId}
                onChange={(e) => updateFilter('departmentId', e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="All">All Departments</option>
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
                  Overdue Only
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.atrPendingOnly}
                    onChange={(e) => updateFilter('atrPendingOnly', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  ATR Pending CMO Review
                </label>

                <button
                  type="button"
                  disabled={actionBusy || overview.overdue === 0}
                  onClick={handleAutoEscalateOverdue}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-800 border border-rose-200 font-semibold transition"
                >
                  <Zap className="w-3.5 h-3.5" /> Auto-Escalate Overdue
                </button>

                <button
                  type="button"
                  disabled={grievances.length === 0}
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 border border-slate-200 font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
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
                  placeholder="Search reference ID or subject..."
                  className="flex-1 sm:w-64 px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" /> Filter
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading grievances...</div>
            ) : grievances.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No grievances match the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-3 px-4">Ref ID</th>
                      <th className="py-3 px-4">Citizen &amp; Subject</th>
                      <th className="py-3 px-4">District / Category</th>
                      <th className="py-3 px-4">Assigned Dept</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">SLA Due</th>
                      <th className="py-3 px-4 text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grievances.map((g) => (
                      <tr key={g._id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-indigo-700 block">
                            {g.referenceId}
                          </span>
                          {g.isEscalated && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700">
                              <AlertTriangle className="w-3 h-3" /> Escalated
                            </span>
                          )}
                          {g.atrSubmitted && g.status !== 'Resolved' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-700 block">
                              ATR Ready
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate">{g.subject}</p>
                          <p className="text-xs text-slate-500">
                            By {g.citizenId?.name || 'Citizen'}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">
                          <p className="font-medium">{g.district}</p>
                          <p className="text-slate-500">{g.category}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">
                          {g.assignedDepartmentId ? (
                            <span className="font-semibold">{g.assignedDepartmentId.code}</span>
                          ) : (
                            <span className="text-amber-700 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={g.priority} />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={g.status} />
                        </td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <span className={g.isOverdue ? 'text-rose-700 font-bold' : 'text-slate-600'}>
                            {formatDate(g.dueDate)}
                            {g.isOverdue ? ' (Overdue)' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/cmo/grievances/${g._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" /> Open
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
              <h2 className="text-base font-bold text-slate-900 mb-3">Status Distribution</h2>
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
                District-wise Grievances (Pending vs Resolved)
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
                Department-wise Workload
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
              <h2 className="text-base font-bold text-slate-900">Priority &amp; SLA Snapshot</h2>
              <div className="space-y-3 text-sm">
                {['High', 'Medium', 'Low'].map((p) => {
                  const count = stats.byPriority?.[p] || 0;
                  const pct = overview.total ? Math.round((count / overview.total) * 100) : 0;
                  return (
                    <div key={p}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>{p} Priority</span>
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
                  <strong>Closure Rate:</strong> {overview.resolutionRate}%
                </p>
                <p>
                  <strong>Avg Time to Resolve:</strong> {overview.avgResolutionDays} days
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
              <h3 className="text-sm font-bold text-slate-900 mb-3">District Summary Table</h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <tr>
                    <th className="py-2 px-3">District</th>
                    <th className="py-2 px-3">Total</th>
                    <th className="py-2 px-3">Pending</th>
                    <th className="py-2 px-3">Resolved</th>
                    <th className="py-2 px-3">Overdue</th>
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
                      <td className="py-2 px-3 font-semibold text-indigo-800">{row.district}</td>
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
              <h3 className="text-sm font-bold text-slate-900 mb-3">Department Summary Table</h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <tr>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3">Total</th>
                    <th className="py-2 px-3">Pending</th>
                    <th className="py-2 px-3">Resolved</th>
                    <th className="py-2 px-3">Overdue</th>
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
            <h2 className="text-base font-bold text-slate-900">Public Contact Enquiries</h2>
            <p className="text-xs text-slate-500">
              Submitted via the public Contact Us page and persisted in MongoDB.
            </p>
          </div>
          {enquiries.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No contact enquiries yet.</div>
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
