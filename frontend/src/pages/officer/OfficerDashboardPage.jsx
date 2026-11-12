import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, CheckCircle2, Clock, Eye, FileCheck2, Search } from 'lucide-react';
import { api, getApiErrorMessage } from '../../api/client.js';
import { LiveSyncBar } from '../../components/LiveSyncBar.jsx';
import { SlaCountdownBadge } from '../../components/SlaCountdownBadge.jsx';
import { PriorityBadge, StatusBadge } from '../../components/StatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { formatDate } from '../../utils/formatters.js';

export function OfficerDashboardPage() {
  const { user } = useAuth();
  const { tr, tStatus, tDistrict, tCategory, tDeptName } = usePreferences();
  const [grievances, setGrievances] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    underReview: 0,
    inProgress: 0,
    atrSubmitted: 0,
    resolved: 0,
    overdue: 0
  });
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [error, setError] = useState('');

  const loadQueue = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setSyncing(true);
      setError('');
      try {
        const res = await api.get('/officer/grievances', {
          params: { status: statusFilter, search }
        });
        setGrievances(res.data.grievances || []);
        setSummary(res.data.summary || summary);
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
    loadQueue(false);
  }, [statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="civic-gradient rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            {tDeptName(user?.department) ||
              tr('Department Officer Portal', 'വകുപ്പ് ഉദ്യോഗസ്ഥ പോർട്ടൽ')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            {tr('Department Officer Dashboard', 'വകുപ്പ് ഉദ്യോഗസ്ഥ ഡാഷ്ബോർഡ്')}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {tr(
              'Review grievances forwarded by the CMO, log investigation remarks, and submit Action-Taken Reports.',
              'CMO കൈമാറിയ പരാതികൾ പരിശോധിക്കുക, അന്വേഷണ വിവരങ്ങളും Action-Taken റിപ്പോർട്ടും സമർപ്പിക്കുക.'
            )}
          </p>
        </div>
      </div>

      <LiveSyncBar
        autoSync={autoSync}
        onToggleAutoSync={() => setAutoSync((prev) => !prev)}
        onRefresh={loadQueue}
        lastSyncedAt={lastSyncedAt}
        syncing={syncing}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Stat label={tr('Assigned Total', 'ആകെ ലഭിച്ചവ')} value={summary.total} />
        <Stat
          label={tr('Awaiting Investigation', 'അന്വേഷണം കാത്തിരിക്കുന്നത്')}
          value={summary.underReview}
          cls="text-amber-700"
        />
        <Stat label={tr('In Progress', 'നടപടിയിലുള്ളവ')} value={summary.inProgress} cls="text-sky-700" />
        <Stat
          label={tr('ATR Submitted', 'ATR സമർപ്പിച്ചത്')}
          value={summary.atrSubmitted}
          cls="text-indigo-600"
        />
        <Stat label={tr('Overdue', 'കാലാവധി കഴിഞ്ഞവ')} value={summary.overdue} cls="text-rose-700" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Under Review', 'In Progress', 'Resolved', 'Reopened'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? tr('All', 'എല്ലാം') : tStatus(st)}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadQueue();
          }}
          className="flex gap-2 w-full sm:w-auto"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr('Search Ref ID or subject...', 'Ref ID അല്ലെങ്കിൽ വിഷയം തിരയുക...')}
            className="flex-1 sm:w-64 px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1"
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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {tr('Loading forwarded grievances...', 'പരാതികൾ ലോഡ് ചെയ്യുന്നു...')}
          </div>
        ) : grievances.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {tr(
              'No grievances assigned to your department for this filter.',
              'ഈ വിഭാഗത്തിൽ വകുപ്പിന് പരാതികളൊന്നും ഇല്ല.'
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4">{tr('Reference ID', 'റഫറൻസ് ID')}</th>
                  <th className="py-3 px-4">{tr('Subject & District', 'വിഷയവും ജില്ലയും')}</th>
                  <th className="py-3 px-4">{tr('Priority', 'മുൻഗണന')}</th>
                  <th className="py-3 px-4">{tr('Status', 'അവസ്ഥ')}</th>
                  <th className="py-3 px-4">{tr('ATR Status', 'ATR നില')}</th>
                  <th className="py-3 px-4">{tr('SLA Due', 'SLA തീയതി')}</th>
                  <th className="py-3 px-4 text-right">{tr('Action', 'നടപടി')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grievances.map((g) => (
                  <tr key={g._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-700 whitespace-nowrap">
                      {g.referenceId}
                      {g.isEscalated && (
                        <span className="block text-[10px] font-sans text-rose-700">
                          <AlertTriangle className="w-3 h-3 inline mr-0.5" /> {tr('Escalated', 'അടിയന്തിരം')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{g.subject}</p>
                      <p className="text-xs text-slate-500">
                        {tDistrict(g.district)} • {tCategory(g.category)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={g.priority} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {g.atrSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <FileCheck2 className="w-3.5 h-3.5" /> {tr('Submitted', 'സമർപ്പിച്ചു')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5" /> {tr('Pending', 'തീർപ്പാക്കാനുണ്ട്')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap space-y-1">
                      <span className={g.isOverdue ? 'text-rose-700 font-bold block' : 'text-slate-600 block'}>
                        {formatDate(g.dueDate)}
                      </span>
                      <SlaCountdownBadge dueDate={g.dueDate} status={g.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/officer/grievances/${g._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> {tr('Action', 'നടപടി')}
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

function Stat({ label, value, cls = 'text-slate-900' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${cls}`}>{value}</p>
    </div>
  );
}
