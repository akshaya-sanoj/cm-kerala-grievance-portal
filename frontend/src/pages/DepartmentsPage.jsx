import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Mail, Search } from 'lucide-react';
import { api } from '../api/client.js';
import { DepartmentBadge } from '../components/DepartmentBadge.jsx';
import { KeralaDistrictExplorer } from '../components/KeralaDistrictExplorer.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function DepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [slaFilter, setSlaFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/departments')
      .then((res) => setDepartments(res.data?.departments || []))
      .catch(() => setError('Unable to load departments right now. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = departments.filter((dept) => {
    const matchesSearch =
      !search.trim() ||
      `${dept.name} ${dept.code} ${dept.description} ${(dept.categories || []).join(' ')}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());

    const matchesSla =
      slaFilter === 'all' ||
      (slaFilter === 'fast' && dept.slaDays <= 3) ||
      (slaFilter === 'standard' && dept.slaDays > 3);

    return matchesSearch && matchesSla;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="civic-gradient rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Nodal Agencies Directory
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Government Departments</h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Filter participating Kerala departments, compare target SLA timelines, and launch a
            pre-filled grievance submission directly.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl px-4 py-3 text-xs">
          <span className="text-amber-300 font-bold block">{departments.length} Active Wings</span>
          <span className="text-slate-200">Connected to CMO Routing</span>
        </div>
      </div>

      {/* Interactive Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All Departments' },
            { id: 'fast', label: 'Rapid SLA (≤ 3 days)' },
            { id: 'standard', label: 'Standard SLA (5–10 days)' }
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSlaFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                slaFilter === opt.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department, code, or issue..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
          />
        </div>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((dept) => {
            const primaryCat = dept.categories?.[0] || 'Other';
            const targetHref =
              user?.role === 'citizen'
                ? `/citizen/submit?category=${encodeURIComponent(primaryCat)}`
                : '/login';

            return (
              <div
                key={dept._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-300 hover:shadow-lg hover-lift"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <DepartmentBadge code={dept.code} />
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        dept.slaDays <= 3
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      SLA: {dept.slaDays} days
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2">{dept.name}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{dept.description}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
                  <p>
                    <strong className="text-slate-700">Nodal Head:</strong> {dept.headDesignation}
                  </p>
                  {dept.categories?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {dept.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                  {dept.contactEmail && (
                    <p className="flex items-center gap-1.5 text-slate-500 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      {dept.contactEmail}
                    </p>
                  )}
                  <div className="pt-1">
                    <Link
                      to={targetHref}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                    >
                      Submit grievance for {dept.code} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
              No departments matched &ldquo;{search}&rdquo;.
            </div>
          )}
        </div>
      )}

      <KeralaDistrictExplorer />
    </div>
  );
}
