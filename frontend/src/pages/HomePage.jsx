import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FilePlus2,
  Search,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refInput, setRefInput] = useState('');
  const [stats, setStats] = useState({
    totalGrievances: 8,
    resolvedGrievances: 2,
    inProgressGrievances: 5,
    activeDepartments: 8,
    averageRating: 4.8
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api
      .get('/public/stats')
      .then((res) => {
        if (res.data?.stats) setStats(res.data.stats);
      })
      .catch(() => {});

    api
      .get('/departments')
      .then((res) => {
        if (Array.isArray(res.data?.departments)) {
          setDepartments(res.data.departments.slice(0, 6));
        }
      })
      .catch(() => {});
  }, []);

  function handleQuickTrack(e) {
    e.preventDefault();
    const cleaned = refInput.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/track?ref=${encodeURIComponent(cleaned)}`);
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="civic-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-100 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              AI-Assisted Grievance Triage • Transparent Redressal Workflow
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              CM Kerala Public Grievance Redressal Portal
            </h1>
            <p className="text-base sm:text-lg text-emerald-100 max-w-2xl leading-relaxed">
              A direct digital bridge between citizens and the Chief Minister&apos;s Office (CMO) to
              submit complaints, track real-time department actions, and verify transparent
              resolution across all 14 districts of Kerala.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={user?.role === 'citizen' ? '/citizen/submit' : '/register'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-lg transition"
              >
                <FilePlus2 className="w-4 h-4" />
                Submit Grievance
              </Link>
              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold text-sm transition"
              >
                <Search className="w-4 h-4" />
                Track Grievance
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 font-semibold text-sm transition"
              >
                CMO / Officer Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Track Card */}
          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl border border-emerald-900/10">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Instant Grievance Tracker</h2>
              <p className="text-xs text-slate-500 mb-4">
                Enter your unique Reference ID to view live CMO and department progress.
              </p>
              <form onSubmit={handleQuickTrack} className="space-y-3">
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  placeholder="e.g., KL-CMO-2026-100101"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-civic-600 focus:border-civic-600 outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-civic-700 hover:bg-civic-800 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Check Live Status
                </button>
              </form>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Sample Reference IDs (Demo Data):</p>
                <div className="flex flex-wrap gap-1.5">
                  {['KL-CMO-2026-100101', 'KL-CMO-2026-100103', 'KL-CMO-2026-100105'].map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => navigate(`/track?ref=${id}`)}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 hover:bg-civic-50 text-slate-700 hover:text-civic-800 border border-slate-200 transition"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-civic-700" />}
            label="Total Grievances Logged"
            value={stats.totalGrievances}
            sub="Sample & live portal entries"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            label="Resolved Grievances"
            value={stats.resolvedGrievances}
            sub="Verified by CMO review"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            label="Active / In Progress"
            value={stats.inProgressGrievances + (stats.submittedGrievances || 0)}
            sub="Under CMO or department action"
          />
          <StatCard
            icon={<Building2 className="w-5 h-5 text-sky-700" />}
            label="Connected Departments"
            value={stats.activeDepartments}
            sub={`Avg rating ${stats.averageRating}/5`}
          />
        </div>
      </section>

      {/* Workflow Overview Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-civic-700">
              End-to-End Accountability
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              How Redressal Works
            </h2>
          </div>
          <Link
            to="/how-it-works"
            className="text-sm font-semibold text-civic-700 hover:text-civic-900 inline-flex items-center gap-1"
          >
            View detailed workflow <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'Citizen Submits',
              desc: 'Enter grievance details with optional Gemini AI suggestions & supporting files.'
            },
            {
              step: '02',
              title: 'Unique Reference ID',
              desc: 'System issues an instant tracking code (e.g., KL-CMO-2026-XXXXXX).'
            },
            {
              step: '03',
              title: 'CMO Reviews & Routes',
              desc: 'CMO administrator validates AI insights and forwards to the right department.'
            },
            {
              step: '04',
              title: 'Officer Action Report',
              desc: 'Department officer investigates on ground and submits an Action-Taken Report.'
            },
            {
              step: '05',
              title: 'Resolve or Reopen',
              desc: 'CMO approves closure; citizen receives updates, rates service, or reopens.'
            }
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-civic-300 transition"
            >
              <span className="inline-block font-mono text-xs font-bold px-2.5 py-1 rounded bg-civic-50 text-civic-800 border border-civic-200 mb-3">
                STEP {item.step}
              </span>
              <h3 className="font-bold text-slate-900 mb-1.5">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Departments */}
      <section className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-civic-700">
                Participating Nodal Wings
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Featured Government Departments
              </h2>
            </div>
            <Link
              to="/departments"
              className="text-sm font-semibold text-civic-700 hover:text-civic-900 inline-flex items-center gap-1"
            >
              Browse all departments <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((dept) => (
              <div
                key={dept._id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 hover:bg-white hover:shadow-md transition"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-civic-100 text-civic-900">
                    {dept.code}
                  </span>
                  <span className="text-xs text-slate-500">Target SLA: {dept.slaDays} days</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{dept.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{dept.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}
