import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  FilePlus2,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { api } from '../api/client.js';
import { KeralaDistrictExplorer } from '../components/KeralaDistrictExplorer.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const QUICK_CATEGORIES = [
  'Public Infrastructure',
  'Healthcare',
  'Education',
  'Electricity & Power',
  'Water Supply & Drainage',
  'Civic Services & Sanitation',
  'Revenue & Land Records',
  'Transport & Road Safety'
];

const AI_SIMULATOR_PRESETS = [
  {
    id: 'road',
    label: 'Road Cave-in',
    text: 'Severe culvert collapse and potholes near Kakkanad Infopark causing commuter accidents for 2 weeks.',
    dept: 'Public Works Department (PWD)',
    category: 'Public Infrastructure',
    priority: 'High',
    sla: '3 Days SLA'
  },
  {
    id: 'power',
    label: 'Sparking Transformer',
    text: 'Leaning 11kV electric pole and sparking fuse box right outside Ollur Govt School bus stop.',
    dept: 'Kerala State Electricity Board (KSEB)',
    category: 'Electricity & Power',
    priority: 'High',
    sla: '3 Days SLA'
  },
  {
    id: 'bus',
    label: 'KSRTC Feeder Request',
    text: 'Request to reinstate the 7:30 PM evening feeder bus trip from Vythiri to Kalpetta for students.',
    dept: 'Transport & Motor Vehicles Dept',
    category: 'Transport & Road Safety',
    priority: 'Low',
    sla: '14 Days SLA'
  }
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    actor: 'Citizen',
    status: 'Submitted',
    title: 'Citizen Submits Grievance',
    desc: 'Selects district, category, uploads supporting image/PDF, and optionally previews Gemini AI suggestions before confirming.'
  },
  {
    step: '02',
    actor: 'System',
    status: 'KL-CMO-YYYY',
    title: 'Unique Reference ID Issued',
    desc: 'Generates an immutable tracking code (e.g., KL-CMO-2026-100101), computes priority SLA due date, and opens the audit trail.'
  },
  {
    step: '03',
    actor: 'CMO Admin',
    status: 'Under Review',
    title: 'CMO Reviews & Forwards',
    desc: 'CMO reviews AI summary & duplicate flags, adds internal/public notes, and forwards to the responsible government department.'
  },
  {
    step: '04',
    actor: 'Dept Officer',
    status: 'In Progress',
    title: 'Officer Investigates & Submits ATR',
    desc: 'Assigned department officer logs field verification progress and submits an Action-Taken Report (ATR) with proof back to CMO.'
  },
  {
    step: '05',
    actor: 'CMO & Citizen',
    status: 'Resolved / Reopened',
    title: 'Verify, Rate or Reopen',
    desc: 'CMO verifies the ATR and closes the case; citizen rates resolution (1–5 stars) or reopens if the ground issue persists.'
  }
];

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [heroTab, setHeroTab] = useState('track');
  const [refInput, setRefInput] = useState('');
  const [simIndex, setSimIndex] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

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

  const resolutionRate =
    stats.totalGrievances > 0
      ? Math.round((stats.resolvedGrievances / stats.totalGrievances) * 100)
      : 0;

  const currentSim = AI_SIMULATOR_PRESETS[simIndex];

  return (
    <div>
      {/* Executive Midnight Hero */}
      <section className="civic-gradient text-white relative overflow-hidden">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-amber-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              State Grievance Command • Gemini AI Triage &amp; SLA Tracking
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">
              CM Kerala Public Grievance{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                Redressal Portal
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              A direct digital bridge connecting citizens across all 14 districts of Kerala with the
              Chief Minister&apos;s Office (CMO) and government departments for time-bound,
              transparent resolution.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to={user?.role === 'citizen' ? '/citizen/submit' : '/register'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition"
              >
                <FilePlus2 className="w-4 h-4" />
                Submit Grievance
              </Link>
              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur transition"
              >
                <Search className="w-4 h-4" />
                Track Status
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-400/40 text-white font-semibold text-sm transition"
              >
                Demo Role Login
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Interactive Dual-Mode Hero Card */}
          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10">
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => setHeroTab('track')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    heroTab === 'track'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-indigo-600" /> Track by Ref ID
                </button>
                <button
                  type="button"
                  onClick={() => setHeroTab('ai')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    heroTab === 'ai'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-amber-600" /> AI Triage Preview
                </button>
              </div>

              {heroTab === 'track' ? (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="text-lg font-bold text-slate-900">Instant Grievance Tracker</h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Live Lookup
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Enter your unique Reference ID to view live CMO and department progress.
                  </p>
                  <form onSubmit={handleQuickTrack} className="space-y-3">
                    <input
                      type="text"
                      value={refInput}
                      onChange={(e) => setRefInput(e.target.value)}
                      placeholder="e.g., KL-CMO-2026-100101"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Search className="w-4 h-4" />
                      Check Live Status
                    </button>
                  </form>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Sample Reference IDs (Click to open):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['KL-CMO-2026-100101', 'KL-CMO-2026-100103', 'KL-CMO-2026-100105'].map(
                        (id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => navigate(`/track?ref=${id}`)}
                            className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 transition"
                          >
                            {id}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Interactive AI Triage Simulator
                    </h2>
                    <p className="text-xs text-slate-500">
                      Click a sample Kerala grievance to preview how Gemini AI classifies routing:
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_SIMULATOR_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSimIndex(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                          simIndex === idx
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 italic">
                    &ldquo;{currentSim.text}&rdquo;
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase block">
                        Suggested Dept
                      </span>
                      <span className="font-bold text-slate-900">{currentSim.dept}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">
                        Priority &amp; Target
                      </span>
                      <span className="font-bold text-slate-900">
                        {currentSim.priority} • {currentSim.sla}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={user?.role === 'citizen' ? '/citizen/submit' : '/login'}
                    className="block w-full text-center py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                  >
                    Try Live AI Assistant with Your Own Text →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Portal Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            accent="border-t-indigo-600"
            label="Total Grievances Logged"
            value={stats.totalGrievances}
            sub="Across 14 Kerala districts"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            accent="border-t-emerald-600"
            label="Resolved Grievances"
            value={stats.resolvedGrievances}
            sub={`${resolutionRate}% closure rate`}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            accent="border-t-amber-500"
            label="Active / In Progress"
            value={stats.inProgressGrievances + (stats.submittedGrievances || 0)}
            sub="Monitored under SLA"
          />
          <StatCard
            icon={<Building2 className="w-5 h-5 text-sky-600" />}
            accent="border-t-sky-600"
            label="Connected Departments"
            value={stats.activeDepartments}
            sub={`Avg citizen rating ${stats.averageRating}/5`}
          />
        </div>
      </section>

      {/* Quick Category Launchpad */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Quick Issue Categories</h2>
              <p className="text-xs text-slate-500">
                Choose an issue category to start a pre-filled submission directly.
              </p>
            </div>
            <Link
              to="/departments"
              className="text-xs font-semibold text-indigo-700 hover:underline inline-flex items-center gap-1"
            >
              View SLA &amp; Departments <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={
                  user?.role === 'citizen'
                    ? `/citizen/submit?category=${encodeURIComponent(cat)}`
                    : '/login'
                }
                className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-indigo-600 border border-slate-200 hover:border-indigo-600 text-xs font-semibold text-slate-700 hover:text-white transition"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive 14-District Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <KeralaDistrictExplorer />
      </section>

      {/* Interactive Workflow Stepper */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Interactive Lifecycle Explorer
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              How Redressal Works
            </h2>
          </div>
          <Link
            to="/how-it-works"
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
          >
            View detailed workflow <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {WORKFLOW_STEPS.map((item, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`text-left rounded-2xl p-5 border transition ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-1 rounded ${
                      isActive
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    STEP {item.step}
                  </span>
                  <span className={`text-[11px] font-semibold ${isActive ? 'text-amber-300' : 'text-slate-400'}`}>
                    {item.actor}
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                <p className={`text-xs leading-relaxed ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Core Governance Pillars */}
      <section className="civic-gradient text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 hover-lift">
            <Sparkles className="w-6 h-6 text-amber-400 mb-3" />
            <h3 className="font-bold text-base mb-1.5">Human-Reviewed AI Assistant</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gemini AI suggests category, department, priority, and potential duplicates while
              requiring explicit citizen and CMO confirmation.
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 hover-lift">
            <ShieldCheck className="w-6 h-6 text-indigo-300 mb-3" />
            <h3 className="font-bold text-base mb-1.5">Immutable Audit History</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every assignment, internal remark, escalation, ATR submission, and citizen reopen is
              logged with timestamps and role identity.
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 hover-lift">
            <Clock className="w-6 h-6 text-emerald-300 mb-3" />
            <h3 className="font-bold text-base mb-1.5">SLA &amp; Overdue Escalation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Priority-driven target dates automatically highlight overdue grievances so the CMO
              can escalate delayed cases immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Departments */}
      <section className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Participating Nodal Wings
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Featured Government Departments
              </h2>
            </div>
            <Link
              to="/departments"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
            >
              Browse all departments <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((dept) => (
              <div
                key={dept._id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 hover:bg-white hover:shadow-lg hover:border-indigo-300 hover-lift"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {dept.code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Target SLA: {dept.slaDays} days
                  </span>
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

function StatCard({ icon, label, value, sub, accent = 'border-t-indigo-600' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-t-4 ${accent} p-5 shadow-md hover-lift`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}
