import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  FilePlus2,
  MapPin,
  Search,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Citizen Submits Grievance',
    desc: 'Select Kerala district, category, upload supporting photo/PDF, and optionally preview Gemini AI triage suggestions.'
  },
  {
    step: '02',
    title: 'Unique Reference ID Issued',
    desc: 'System issues an instant tracking code (e.g., KL-CMO-2026-100101) and computes SLA target dates.'
  },
  {
    step: '03',
    title: 'CMO Reviews & Forwards',
    desc: 'CMO verifies AI summary & potential duplicate flags, adds remarks, and routes to the relevant department.'
  },
  {
    step: '04',
    title: 'Department Investigates & Submits ATR',
    desc: 'Assigned officer logs field updates and uploads an Action-Taken Report (ATR) back to the CMO.'
  },
  {
    step: '05',
    title: 'Verify, Rate or Reopen',
    desc: 'CMO approves closure; citizen rates service or reopens the grievance if unresolved on ground.'
  }
];

const AI_PRESETS = [
  {
    id: 'road',
    label: 'Road Cave-in (Ernakulam)',
    district: 'Ernakulam',
    category: 'Public Infrastructure',
    dept: 'Public Works Department (PWD)',
    priority: 'High',
    sla: '3 Days SLA',
    text: 'Severe culvert collapse and deep potholes near Kakkanad Infopark junction causing commuter accidents.'
  },
  {
    id: 'power',
    label: 'Transformer Sparking (Thrissur)',
    district: 'Thrissur',
    category: 'Electricity & Power',
    dept: 'Kerala State Electricity Board (KSEB)',
    priority: 'High',
    sla: '3 Days SLA',
    text: 'Leaning 11kV electric pole and sparking fuse box right beside Ollur school bus stop.'
  },
  {
    id: 'water',
    label: 'Pipe Contamination (TVM)',
    district: 'Thiruvananthapuram',
    category: 'Water Supply & Drainage',
    dept: 'Kerala Water Authority (KWA)',
    priority: 'High',
    sla: '3 Days SLA',
    text: 'Muddy tap water with foul odor in Kazhakkoottam Ward 4 after nearby road excavation.'
  }
];

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refInput, setRefInput] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [presetIdx, setPresetIdx] = useState(0);

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

  const currentPreset = AI_PRESETS[presetIdx];

  return (
    <div>
      {/* 1. Airy Executive Hero */}
      <section className="civic-gradient text-white relative overflow-hidden">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-amber-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              14 Kerala Districts • Gemini AI Triage • Full SLA Traceability
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">
              Direct, Transparent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                Public Redressal
              </span>{' '}
              for Kerala
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              Submit grievances directly to the Chief Minister&apos;s Office (CMO), follow every
              department action in real time, and verify outcomes transparently.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
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
                Track Grievance
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-amber-300 hover:text-amber-200 transition"
              >
                CMO / Officer Demo Login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Single Clean Quick-Track Card */}
          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-3xl p-7 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-lg font-bold text-slate-900">Track Grievance Status</h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Public Lookup
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Enter your unique Reference ID to inspect department status and timeline.
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
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Sample Demo Reference IDs:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['KL-CMO-2026-100101', 'KL-CMO-2026-100103', 'KL-CMO-2026-100105'].map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => navigate(`/track?ref=${id}`)}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 transition"
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

      {/* 2. Clean 4-Metric Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            label="Total Grievances"
            value={stats.totalGrievances}
            sub="Across 14 Kerala districts"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            label="Resolved"
            value={stats.resolvedGrievances}
            sub={`${resolutionRate}% closure rate`}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            label="Active / In Progress"
            value={stats.inProgressGrievances + (stats.submittedGrievances || 0)}
            sub="Monitored under SLA"
          />
          <StatCard
            icon={<Building2 className="w-5 h-5 text-sky-600" />}
            label="Departments"
            value={stats.activeDepartments}
            sub={`Avg rating ${stats.averageRating}/5`}
          />
        </div>
      </section>

      {/* 3. Spacious 2-Column Interactive Workflow & AI Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Left: Clean Interactive 5-Step Lifecycle */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Mandatory Lifecycle
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                How Redressal Works
              </h2>
            </div>

            <div className="space-y-2.5">
              {WORKFLOW_STEPS.map((item, idx) => {
                const isActive = activeStep === idx;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left rounded-2xl px-5 py-4 border transition ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          isActive
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {item.step}
                      </span>
                      <span className="font-bold text-sm">{item.title}</span>
                    </div>
                    {isActive && (
                      <p className="text-xs text-slate-300 mt-2 pl-10 leading-relaxed">
                        {item.desc}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Interactive AI Triage & District Pre-fill Preview */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Interactive AI Preview
                </p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  See Gemini AI Routing in Action
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {AI_PRESETS.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    presetIdx === idx
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed">
              &ldquo;{currentPreset.text}&rdquo;
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5">
                <span className="text-[10px] font-bold uppercase text-indigo-700 block mb-0.5">
                  Suggested Department
                </span>
                <span className="font-bold text-slate-900 text-sm">{currentPreset.dept}</span>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                <span className="text-[10px] font-bold uppercase text-amber-800 block mb-0.5">
                  Recommended Priority
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {currentPreset.priority} • {currentPreset.sla}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                District: <strong>{currentPreset.district}</strong>
              </span>
              <Link
                to={
                  user?.role === 'citizen'
                    ? `/citizen/submit?district=${encodeURIComponent(
                        currentPreset.district
                      )}&category=${encodeURIComponent(currentPreset.category)}`
                    : '/login'
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                Try Live in Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Spacious Featured Departments */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Nodal Wings
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Featured Government Departments
              </h2>
            </div>
            <Link
              to="/departments"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
            >
              View all departments &amp; SLAs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div
                key={dept._id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:bg-white hover:shadow-lg hover:border-indigo-300 hover-lift"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {dept.code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    SLA: {dept.slaDays} days
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{dept.name}</h3>
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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md hover-lift">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}
