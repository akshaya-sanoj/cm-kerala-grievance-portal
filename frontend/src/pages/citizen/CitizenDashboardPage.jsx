import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FilePlus2,
  FolderOpen,
  Search
} from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/client.js';
import { LiveSyncBar } from '../../components/LiveSyncBar.jsx';
import { SlaCountdownBadge } from '../../components/SlaCountdownBadge.jsx';
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { formatDate } from '../../utils/formatters.js';

export function CitizenDashboardPage() {
  const { user } = useAuth();
  const { tr, tStatus, tDistrict, tCategory } = usePreferences();
  const [grievances, setGrievances] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, resolved: 0 });
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [error, setError] = useState('');

  const fetchGrievances = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setSyncing(true);
      setError('');
      try {
        const res = await api.get('/grievances/my', {
          params: { status: statusFilter, search }
        });
        setGrievances(res.data.grievances || []);
        setSummary(res.data.summary || { total: 0, pending: 0, resolved: 0 });
        setLastSyncedAt(new Date());
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [statusFilter, search]
  );

  useEffect(() => {
    fetchGrievances(false);
  }, [statusFilter]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchGrievances();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="civic-gradient rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            {tr('Citizen Command Portal', 'പൗര സേവന പോർട്ടൽ')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            {tr('Welcome,', 'സ്വാഗതം,')} {user?.name}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {tr(
              'Track submitted complaints, inspect department remarks, and submit post-resolution feedback.',
              'സമർപ്പിച്ച പരാതികൾ പരിശോധിക്കുക, വകുപ്പ് കുറിപ്പുകൾ കാണുക, പരിഹാരത്തിന് ശേഷം അഭിപ്രായം അറിയിക്കുക.'
            )}
          </p>
        </div>
        <Link
          to="/citizen/submit"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-lg transition"
        >
          <FilePlus2 className="w-4 h-4" />
          {tr('Submit New Grievance', 'പുതിയ പരാതി സമർപ്പിക്കുക')}
        </Link>
      </div>

      <LiveSyncBar
        autoSync={autoSync}
        onToggleAutoSync={() => setAutoSync((prev) => !prev)}
        onRefresh={fetchGrievances}
        lastSyncedAt={lastSyncedAt}
        syncing={syncing}
      />

      {/* Summary Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>{tr('Total Submitted', 'ആകെ സമർപ്പിച്ചത്')}</span>
            <FolderOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{summary.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>{tr('Pending / Active', 'നടപടിയിലുള്ളവ')}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-700">{summary.pending}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>{tr('Resolved', 'പരിഹരിച്ചവ')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-700">{summary.resolved}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Reopened'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? tr('All', 'എല്ലാം') : tStatus(st)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr('Search ID or subject...', 'ID അല്ലെങ്കിൽ വിഷയം തിരയുക...')}
            className="flex-1 sm:w-64 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold inline-flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" /> {tr('Search', 'തിരയുക')}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Grievances List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {tr('Loading your grievances...', 'പരാതികൾ ലോഡ് ചെയ്യുന്നു...')}
          </div>
        ) : grievances.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-slate-600 text-sm">
              {tr('No grievances found for this filter.', 'ഈ വിഭാഗത്തിൽ പരാതികളൊന്നും ഇല്ല.')}
            </p>
            <Link
              to="/citizen/submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
            >
              <FilePlus2 className="w-4 h-4" />{' '}
              {tr('Submit Your First Grievance', 'ആദ്യ പരാതി സമർപ്പിക്കുക')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="py-3.5 px-4">{tr('Reference ID', 'റഫറൻസ് ID')}</th>
                  <th className="py-3.5 px-4">{tr('Subject & District', 'വിഷയവും ജില്ലയും')}</th>
                  <th className="py-3.5 px-4">{tr('Department', 'വകുപ്പ്')}</th>
                  <th className="py-3.5 px-4">{tr('Priority', 'മുൻഗണന')}</th>
                  <th className="py-3.5 px-4">{tr('Status', 'അവസ്ഥ')}</th>
                  <th className="py-3.5 px-4">{tr('Submitted', 'സമർപ്പിച്ചത്')}</th>
                  <th className="py-3.5 px-4 text-right">{tr('Action', 'നടപടി')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grievances.map((g) => (
                  <tr key={g._id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-700 whitespace-nowrap">
                      {g.referenceId}
                      {g.isEscalated && (
                        <span className="ml-1.5 inline-flex items-center text-[10px] text-rose-700 font-sans">
                          <AlertTriangle className="w-3 h-3 mr-0.5" /> {tr('Escalated', 'അടിയന്തിരം')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{g.subject}</p>
                      <p className="text-xs text-slate-500">
                        {tDistrict(g.district)} • {tCategory(g.category)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {g.assignedDepartmentId?.name ||
                        tr('Awaiting CMO Assignment', 'CMO നിയമനം കാത്തിരിക്കുന്നു')}
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={g.priority} />
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <StatusBadge status={g.status} />
                      <div>
                        <SlaCountdownBadge dueDate={g.dueDate} status={g.status} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(g.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/citizen/grievances/${g._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> {tr('Details', 'വിവരങ്ങൾ')}
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
  );
}
