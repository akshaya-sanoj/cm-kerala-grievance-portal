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
import { api, getApiErrorMessage } from '../api/client.js';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Citizen Submits Grievance',
    desc: 'Select Kerala district, category, upload supporting photo/PDF, and preview Gemini AI triage suggestions.'
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
    label: 'Road Cave-in',
    district: 'Ernakulam',
    text: 'Severe culvert collapse and deep potholes near Kakkanad Infopark junction causing commuter accidents for two weeks.'
  },
  {
    id: 'power',
    label: 'Transformer Sparking',
    district: 'Thrissur',
    text: 'Leaning 11kV electric pole and sparking fuse box right beside Ollur school bus stop creating electrocution danger.'
  },
  {
    id: 'water',
    label: 'Tap Water Contamination',
    district: 'Thiruvananthapuram',
    text: 'Muddy tap water with foul odor in Kazhakkoottam Ward 4 after nearby road excavation ruptured a pipe.'
  }
];

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refInput, setRefInput] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  // Live public AI playground state
  const [aiText, setAiText] = useState(AI_PRESETS[0].text);
  const [aiDistrict, setAiDistrict] = useState(AI_PRESETS[0].district);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiError, setAiError] = useState('');

  // Live stats & recent activity feed
  const [stats, setStats] = useState({
    totalGrievances: 8,
    resolvedGrievances: 2,
    inProgressGrievances: 5,
    activeDepartments: 8,
    averageRating: 4.8
  });
  const [recentFeed, setRecentFeed] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadStats = () => {
      api
        .get('/public/stats')
        .then((res) => {
          if (res.data?.stats) setStats(res.data.stats);
          if (Array.isArray(res.data?.recentPublicFeed)) {
            setRecentFeed(res.data.recentPublicFeed);
          }
        })
        .catch(() => {});
    };

    loadStats();
    const timer = setInterval(loadStats, 20000);

    api
      .get('/departments')
      .then((res) => {
        if (Array.isArray(res.data?.departments)) {
          setDepartments(res.data.departments.slice(0, 6));
        }
      })
      .catch(() => {});

    return () => clearInterval(timer);
  }, []);

  function handleQuickTrack(e) {
    e.preventDefault();
    const cleaned = refInput.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/track?ref=${encodeURIComponent(cleaned)}`);
  }

  async function handleLiveAiPreview(customText = aiText, customDistrict = aiDistrict) {
    if (customText.trim().length < 15) {
      setAiError('Please enter at least 15 characters to run live AI triage.');
      return;
    }
    setAiError('');
    setAiLoading(true);
    try {
      const res = await api.post('/public/ai-preview', {
        description: customText,
        district: customDistrict
      });
      setAiPreview(res.data.preview);
    } catch (err) {
      setAiError(getApiErrorMessage(err, 'Unable to run AI preview right now.'));
    } finally {
      setAiLoading(false);
    }
  }

  const resolutionRate =
    stats.totalGrievances > 0
      ? Math.round((stats.resolvedGrievances / stats.totalGrievances) * 100)
      : 0;

  return (
    <div>
      {/* 1. Airy Executive Hero */}
      <section className="civic-gradient text-white relative overflow-hidden">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-amber-200 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Live State Portal • 14 Kerala Districts • Gemini AI Triage
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
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Lookup
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
            sub="Synced live from MongoDB"
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

      {/* 3. Spacious 2-Column Interactive Workflow & Live Gemini AI Playground */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
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

          {/* Right: Live Gemini AI Interactive Sandbox */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Interactive Gemini AI Sandbox
                </p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Test Live AI Triage Now
                </h3>
              </div>
              {aiPreview && (
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    aiPreview.isFallback
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {aiPreview.isFallback
                    ? `Fallback (${aiPreview.model})`
                    : `Live Gemini (${aiPreview.model})`}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {AI_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setAiText(p.text);
                    setAiDistrict(p.district);
                    handleLiveAiPreview(p.text, p.district);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border-slate-200 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="Type any Kerala civic complaint to test live Gemini AI classification..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
            />

            {aiError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {aiError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                District: <strong>{aiDistrict}</strong>
              </span>
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => handleLiveAiPreview()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-amber-300 text-xs font-bold transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aiLoading ? 'Analyzing with Gemini...' : 'Run Live AI Preview'}
              </button>
            </div>

            {aiPreview && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="grid sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
                    <span className="text-[10px] font-bold uppercase text-indigo-700 block">
                      Department
                    </span>
                    <span className="font-bold text-slate-900">
                      {aiPreview.suggestedDepartmentName}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Category
                    </span>
                    <span className="font-bold text-slate-900">{aiPreview.suggestedCategory}</span>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                    <span className="text-[10px] font-bold uppercase text-amber-800 block">
                      Priority
                    </span>
                    <div className="mt-1">
                      <PriorityBadge priority={aiPreview.recommendedPriority} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <strong>CMO Summary:</strong> {aiPreview.summary}
                </p>
                <div className="flex justify-end">
                  <Link
                    to={
                      user?.role === 'citizen'
                        ? `/citizen/submit?district=${encodeURIComponent(
                            aiDistrict
                          )}&category=${encodeURIComponent(aiPreview.suggestedCategory)}`
                        : '/login'
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                  >
                    Submit this grievance in portal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Public Redressal Feed */}
        {recentFeed.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Live Public Grievance Activity
                </h3>
              </div>
              <Link to="/track" className="text-xs font-semibold text-indigo-700 hover:underline">
                Track any ID →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {recentFeed.map((item) => (
                <Link
                  key={item.referenceId}
                  to={`/track?ref=${encodeURIComponent(item.referenceId)}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 p-3.5 transition block"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-indigo-700 truncate">
                      {item.referenceId}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                    {item.subject}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{item.district}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
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
              View all departments &amp; 14 districts <ArrowRight className="w-4 h-4" />
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
