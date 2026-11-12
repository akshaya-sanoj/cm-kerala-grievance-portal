import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  FilePlus2,
  MapPin,
  Pause,
  Play,
  Radio,
  Search,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';
import { AnimatedNumber } from '../components/AnimatedNumber.jsx';
import { DepartmentBadge } from '../components/DepartmentBadge.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';

const WORKFLOW_STEPS = [
  {
    step: '01',
    short: 'Submit',
    shortMl: 'സമർപ്പണം',
    title: 'Citizen Submits Grievance',
    titleMl: 'പൗരൻ പരാതി സമർപ്പിക്കുന്നു',
    desc: 'Select Kerala district, category, upload supporting photo/PDF, and preview Gemini AI triage suggestions.',
    descMl: 'ജില്ല, വിഭാഗം, ഫോട്ടോ/PDF രേഖകൾ എന്നിവ നൽകി Gemini AI നിർദ്ദേശങ്ങൾ പരിശോധിക്കുക.'
  },
  {
    step: '02',
    short: 'Ref ID & AI',
    shortMl: 'Ref ID & AI',
    title: 'Unique Reference ID & AI Triage',
    titleMl: 'തനതായ Reference ID & AI സഹായം',
    desc: 'System issues an instant tracking code (e.g., KL-CMO-2026-100101), runs Gemini triage, and computes SLA dates.',
    descMl: 'ഉടൻ തന്നെ ട്രാക്കിംഗ് കോഡും (KL-CMO-2026-100101) SLA സമയപരിധിയും ലഭിക്കുന്നു.'
  },
  {
    step: '03',
    short: 'CMO Route',
    shortMl: 'CMO കൈമാറ്റം',
    title: 'CMO Reviews & Forwards',
    titleMl: 'CMO പരിശോധിച്ച് കൈമാറുന്നു',
    desc: 'CMO verifies AI summary & potential duplicate flags, adds remarks, and routes to the relevant department.',
    descMl: 'CMO കുറിപ്പുകൾ ചേർത്ത് ബന്ധപ്പെട്ട സർക്കാർ വകുപ്പിലേക്ക് പരാതി അയയ്ക്കുന്നു.'
  },
  {
    step: '04',
    short: 'Field ATR',
    shortMl: 'വകുപ്പ് ATR',
    title: 'Department Investigates & Submits ATR',
    titleMl: 'വകുപ്പ് അന്വേഷിച്ച് ATR നൽകുന്നു',
    desc: 'Assigned officer logs field updates and uploads an Action-Taken Report (ATR) back to the CMO.',
    descMl: 'ഉദ്യോഗസ്ഥൻ ഫീൽഡ് പരിശോധന നടത്തി Action-Taken Report (ATR) സമർപ്പിക്കുന്നു.'
  },
  {
    step: '05',
    short: 'Verified',
    shortMl: 'തീർപ്പാക്കൽ',
    title: 'Verify, Rate or Reopen',
    titleMl: 'പരിശോധന, റേറ്റിംഗ് / വീണ്ടും തുറക്കൽ',
    desc: 'CMO approves closure; citizen rates service or reopens the grievance if unresolved on ground.',
    descMl: 'CMO തീർപ്പാക്കിയാൽ പൗരന് സേവനം വിലയിരുത്താനോ ആവശ്യമെങ്കിൽ വീണ്ടും തുറക്കാനോ സാധിക്കും.'
  }
];

const AI_PRESETS = [
  {
    id: 'road',
    label: 'Road Cave-in',
    labelMl: 'റോഡ് തകർച്ച',
    district: 'Ernakulam',
    text: 'Severe culvert collapse and deep potholes near Kakkanad Infopark junction causing commuter accidents for two weeks.'
  },
  {
    id: 'power',
    label: 'Transformer Sparking',
    labelMl: 'ട്രാൻസ്‌ഫോമർ തകരാർ',
    district: 'Thrissur',
    text: 'Leaning 11kV electric pole and sparking fuse box right beside Ollur school bus stop creating electrocution danger.'
  },
  {
    id: 'water',
    label: 'Tap Water Contamination',
    labelMl: 'കുടിവെള്ള മലിനീകരണം',
    district: 'Thiruvananthapuram',
    text: 'Muddy tap water with foul odor in Kazhakkoottam Ward 4 after nearby road excavation ruptured a pipe.'
  }
];

const PLACEHOLDER_REFS = [
  'e.g., KL-CMO-2026-100101',
  'e.g., KL-CMO-2026-100103',
  'e.g., KL-CMO-2026-100105'
];

export function HomePage() {
  const { user } = useAuth();
  const { t, tr, tDistrict, tCategory, tStatus } = usePreferences();
  const navigate = useNavigate();
  const [refInput, setRefInput] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [heroStage, setHeroStage] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlaySteps, setAutoPlaySteps] = useState(true);

  // Live public AI playground state
  const [aiText, setAiText] = useState(AI_PRESETS[0].text);
  const [aiDistrict, setAiDistrict] = useState(AI_PRESETS[0].district);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiError, setAiError] = useState('');

  // Live stats, ticker feed, metadata & SLA estimator state
  const [stats, setStats] = useState({
    totalGrievances: 8,
    resolvedGrievances: 2,
    inProgressGrievances: 5,
    activeDepartments: 8,
    averageRating: 4.8
  });
  const [recentFeed, setRecentFeed] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [metadata, setMetadata] = useState({ districts: [], categories: [] });
  const [estDistrict, setEstDistrict] = useState('Thiruvananthapuram');
  const [estCategory, setEstCategory] = useState('Public Infrastructure');

  // Auto-cycle Hero live pipeline indicator & placeholder every 2s
  useEffect(() => {
    const heroTimer = setInterval(() => {
      setHeroStage((prev) => (prev + 1) % WORKFLOW_STEPS.length);
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDER_REFS.length);
    }, 2200);
    return () => clearInterval(heroTimer);
  }, []);

  // Auto-play interactive 5-step lifecycle walkthrough
  useEffect(() => {
    if (!autoPlaySteps) return undefined;
    const stepTimer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 3600);
    return () => clearInterval(stepTimer);
  }, [autoPlaySteps]);

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

    Promise.all([api.get('/departments'), api.get('/metadata')])
      .then(([deptRes, metaRes]) => {
        const deptList = deptRes.data?.departments || [];
        const meta = metaRes.data?.metadata || {};
        setDepartments(deptList);
        setMetadata({
          districts: meta.districts || [],
          categories: meta.categories || []
        });
        if (meta.districts?.length) setEstDistrict(meta.districts[0]);
        if (meta.categories?.length) setEstCategory(meta.categories[0]);
      })
      .catch(() => {});

    return () => clearInterval(timer);
  }, []);

  const matchedDepartment = useMemo(() => {
    if (!departments.length) return null;
    return (
      departments.find((d) => (d.categories || []).includes(estCategory)) ||
      departments.find((d) => d.code === 'GRV') ||
      departments[0]
    );
  }, [departments, estCategory]);

  const estimatedDueText = useMemo(() => {
    const days = matchedDepartment?.slaDays || 7;
    const dt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return dt.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [matchedDepartment]);

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

  const tickerItems =
    recentFeed.length > 0
      ? [...recentFeed, ...recentFeed]
      : [
          {
            referenceId: 'KL-CMO-2026-100101',
            district: 'Thiruvananthapuram',
            subject: 'Damaged approach road near Technopark',
            status: 'In Progress'
          },
          {
            referenceId: 'KL-CMO-2026-100103',
            district: 'Ernakulam',
            subject: 'Drinking water supply disruption in Ward 12',
            status: 'Resolved'
          },
          {
            referenceId: 'KL-CMO-2026-100105',
            district: 'Kozhikode',
            subject: 'Primary Health Centre medical supplies delay',
            status: 'Under Review'
          },
          {
            referenceId: 'KL-CMO-2026-100101',
            district: 'Thiruvananthapuram',
            subject: 'Damaged approach road near Technopark',
            status: 'In Progress'
          },
          {
            referenceId: 'KL-CMO-2026-100103',
            district: 'Ernakulam',
            subject: 'Drinking water supply disruption in Ward 12',
            status: 'Resolved'
          },
          {
            referenceId: 'KL-CMO-2026-100105',
            district: 'Kozhikode',
            subject: 'Primary Health Centre medical supplies delay',
            status: 'Under Review'
          }
        ];

  return (
    <div>
      {/* 1. Airy Animated Executive Hero */}
      <section className="civic-gradient text-white relative overflow-hidden">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="animate-float-slow absolute -top-20 -right-16 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="animate-float-slow absolute -bottom-24 -left-16 w-[28rem] h-[28rem] rounded-full bg-indigo-400/25 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          <div className="lg:col-span-7 min-w-0 space-y-5 sm:space-y-6 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-amber-200 text-xs font-semibold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              {t.heroBadge}
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">
              {t.heroHeadlineStart}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">
                {t.heroHeadlineAccent}
              </span>{' '}
              {t.heroHeadlineEnd}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              {t.heroDesc}
            </p>
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                to={user?.role === 'citizen' ? '/citizen/submit' : '/register'}
                className="btn-shimmer group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition"
              >
                <FilePlus2 className="w-4 h-4" />
                {t.ctaSubmit}
              </Link>
              <Link
                to="/track"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/20 text-white font-semibold text-sm backdrop-blur transition"
              >
                <Search className="w-4 h-4" />
                {t.ctaTrack}
              </Link>
              <Link
                to="/login"
                className="group inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-amber-300 hover:text-amber-200 transition"
              >
                {t.ctaDemo}{' '}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Live Auto-Cycling Pipeline Preview Strip */}
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                {tr('Real-Time Redressal Pipeline', 'തത്സമയ പരാതി പരിഹാര ഘട്ടങ്ങൾ')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {WORKFLOW_STEPS.map((st, idx) => {
                  const active = heroStage === idx;
                  return (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() => {
                        setHeroStage(idx);
                        setActiveStep(idx);
                      }}
                      className={`text-left rounded-xl px-2.5 py-2 border transition-all duration-500 ${
                        active
                          ? 'bg-amber-400/20 border-amber-300 text-white shadow-md scale-[1.03]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <span
                        className={`font-mono text-[10px] font-bold block ${
                          active ? 'text-amber-300' : 'text-slate-500'
                        }`}
                      >
                        {st.step}
                      </span>
                      <span className="text-[11px] font-semibold truncate block">
                        {tr(st.short, st.shortMl)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Single Clean Quick-Track Card */}
          <div className="lg:col-span-5 min-w-0 relative animate-fade-up-delayed">
            <div className="animate-float-slow absolute -inset-2 bg-gradient-to-tr from-indigo-500/35 via-amber-400/25 to-sky-400/30 rounded-[28px] blur-xl pointer-events-none" />
            <div className="relative bg-white text-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/20">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-lg font-bold text-slate-900">{t.quickTrackTitle}</h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  {tr('Live Lookup', 'തത്സമയ പരിശോധന')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5">{t.quickTrackSub}</p>
              <form onSubmit={handleQuickTrack} className="space-y-3">
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  placeholder={PLACEHOLDER_REFS[placeholderIdx]}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
                />
                <button
                  type="submit"
                  className="btn-shimmer w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  {t.quickTrackBtn}
                </button>
              </form>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">
                  {tr('Sample Demo Reference IDs:', 'സാമ്പിൾ ഡെമോ Reference ID-കൾ:')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['KL-CMO-2026-100101', 'KL-CMO-2026-100103', 'KL-CMO-2026-100105'].map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => navigate(`/track?ref=${id}`)}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 transition hover:-translate-y-0.5"
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
            label={tr('Total Grievances', 'ആകെ പരാതികൾ')}
            value={stats.totalGrievances}
            sub={tr('Synced live from MongoDB', 'തത്സമയ ഡാറ്റാബേസ് കണക്ക്')}
            barColor="bg-indigo-600"
            barPct={100}
            delayMs={0}
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            label={tr('Resolved', 'പരിഹരിച്ചവ')}
            value={stats.resolvedGrievances}
            sub={`${resolutionRate}% ${tr('closure rate', 'പരിഹാര നിരക്ക്')}`}
            barColor="bg-emerald-500"
            barPct={Math.max(18, resolutionRate)}
            delayMs={90}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            label={tr('Active / In Progress', 'നടപടിയിലുള്ളവ')}
            value={stats.inProgressGrievances + (stats.submittedGrievances || 0)}
            sub={tr('Monitored under SLA', 'SLA നിരീക്ഷണത്തിൽ')}
            barColor="bg-amber-500"
            barPct={68}
            delayMs={180}
          />
          <StatCard
            icon={<Building2 className="w-5 h-5 text-sky-600" />}
            label={tr('Departments', 'സർക്കാർ വകുപ്പുകൾ')}
            value={stats.activeDepartments}
            sub={`${tr('Avg rating', 'ശരാശരി റേറ്റിംഗ്')} ${stats.averageRating}/5`}
            barColor="bg-sky-500"
            barPct={92}
            delayMs={270}
          />
        </div>
      </section>

      {/* Continuous Live Scrolling Ticker Ribbon */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="marquee-wrapper w-full min-w-0 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md overflow-hidden flex items-center">
          <div className="shrink-0 bg-amber-400 text-slate-950 px-3 sm:px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900" />
            </span>
            {tr('Live Ticker', 'ലൈവ് അപ്ഡേറ്റുകൾ')}
          </div>
          <div className="overflow-hidden flex-1 min-w-0 py-2">
            <div className="animate-marquee flex items-center gap-6 px-4">
              {tickerItems.map((item, idx) => (
                <Link
                  key={`${item.referenceId}-${idx}`}
                  to={`/track?ref=${encodeURIComponent(item.referenceId)}`}
                  className="inline-flex items-center gap-2.5 text-xs text-slate-200 hover:text-amber-300 whitespace-nowrap transition"
                >
                  <span className="font-mono font-bold text-amber-300">{item.referenceId}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-semibold text-white">{tDistrict(item.district)}</span>
                  <span className="text-slate-400 max-w-[220px] truncate">{item.subject}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10">
                    {tStatus(item.status)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Spacious 2-Column Interactive Workflow & Live Gemini AI Playground */}
      <Reveal>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left: Clean Interactive 5-Step Lifecycle with Auto-Play */}
            <div className="lg:col-span-6 min-w-0 space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    {t.howBadge}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                    {t.howTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoPlaySteps((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-indigo-50 text-xs font-semibold text-slate-700 shadow-xs transition"
                >
                  {autoPlaySteps ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-indigo-600" /> {tr('Auto-Playing', 'ഓട്ടോ-പ്ലേ')}
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-indigo-600" />{' '}
                      {tr('Resume Auto-Play', 'വീണ്ടും പ്ലേ ചെയ്യുക')}
                    </>
                  )}
                </button>
              </div>

              {/* Animated Step Progress Meter */}
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  style={{ width: `${((activeStep + 1) / WORKFLOW_STEPS.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-amber-400 transition-all duration-500 ease-out"
                />
              </div>

              <div className="space-y-2.5">
                {WORKFLOW_STEPS.map((item, idx) => {
                  const isActive = activeStep === idx;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => {
                        setActiveStep(idx);
                        setAutoPlaySteps(false);
                      }}
                      className={`w-full text-left rounded-2xl px-5 py-4 border transition-all duration-300 ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.01]'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-mono text-xs font-bold px-2 py-0.5 rounded transition-colors ${
                              isActive
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {item.step}
                          </span>
                          <span className="font-bold text-sm">{tr(item.title, item.titleMl)}</span>
                        </div>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </div>
                      {isActive && (
                        <p className="animate-slide-down text-xs text-slate-300 mt-2 pl-10 leading-relaxed">
                          {tr(item.desc, item.descMl)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Gemini AI Interactive Sandbox */}
            <div className="lg:col-span-6 min-w-0 bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 animate-pulse" /> {t.aiBadge}
                  </p>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">{t.aiTitle}</h3>
                </div>
                {aiPreview && (
                  <span
                    className={`animate-pop-in text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      aiPreview.isFallback
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {aiPreview.isFallback
                      ? `${tr('Fallback', 'ഫോൾബാക്ക്')} (${aiPreview.model})`
                      : `${tr('Live Gemini', 'ലൈവ് Gemini')} (${aiPreview.model})`}
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
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border-slate-200 transition active:scale-[0.97]"
                  >
                    {tr(p.label, p.labelMl)}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder={tr(
                  'Type any Kerala civic complaint to test live Gemini AI classification...',
                  'Gemini AI പരിശോധനയ്ക്കായി ഏതെങ്കിലും പരാതി വിവരണം ഇവിടെ ടൈപ്പ് ചെയ്യുക...'
                )}
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
                  {tr('District:', 'ജില്ല:')} <strong>{tDistrict(aiDistrict)}</strong>
                </span>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleLiveAiPreview()}
                  className="btn-shimmer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 text-amber-300 text-xs font-bold transition"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  {aiLoading
                    ? tr('Analyzing with Gemini...', 'Gemini AI വിശകലനം ചെയ്യുന്നു...')
                    : tr('Run Live AI Preview', 'തത്സമയ AI പരിശോധന നടത്തുക')}
                </button>
              </div>

              {aiPreview && (
                <div className="animate-pop-in space-y-3 pt-2 border-t border-slate-100">
                  <div className="grid sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
                      <span className="text-[10px] font-bold uppercase text-indigo-700 block">
                        {tr('Department', 'വകുപ്പ്')}
                      </span>
                      <span className="font-bold text-slate-900">
                        {aiPreview.suggestedDepartmentName}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        {tr('Category', 'വിഭാഗം')}
                      </span>
                      <span className="font-bold text-slate-900">
                        {tCategory(aiPreview.suggestedCategory)}
                      </span>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                      <span className="text-[10px] font-bold uppercase text-amber-800 block">
                        {tr('Priority', 'മുൻഗണന')}
                      </span>
                      <div className="mt-1">
                        <PriorityBadge priority={aiPreview.recommendedPriority} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-200">
                    <strong>{tr('CMO Summary:', 'CMO സംഗ്രഹം:')}</strong> {aiPreview.summary}
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
                      {tr('Submit this grievance in portal', 'ഈ പരാതി പോർട്ടലിൽ സമർപ്പിക്കുക')}{' '}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive SLA & Routing Estimator */}
          <div className="civic-gradient rounded-3xl p-5 sm:p-8 text-white shadow-xl">
            <div className="grid lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 min-w-0 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />{' '}
                  {tr('Instant Routing & SLA Estimator', 'വകുപ്പും SLA സമയപരിധിയും കണക്കാക്കാം')}
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold">
                  {tr(
                    'Check Target Resolution Time Before Submitting',
                    'സമർപ്പിക്കുന്നതിന് മുൻപ് പരിഹാര സമയപരിധി അറിയുക'
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  {tr(
                    'Pick your Kerala district and issue category to preview the responsible nodal department and committed SLA window.',
                    'ജില്ലയും പരാതി വിഭാഗവും തിരഞ്ഞെടുത്താൽ ഉത്തരവാദപ്പെട്ട വകുപ്പും പ്രതീക്ഷിത പരിഹാര തീയതിയും അറിയാം.'
                  )}
                </p>
              </div>
              <div className="lg:col-span-7 min-w-0 bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                      {tr('Kerala District', 'ജില്ല')}
                    </label>
                    <select
                      value={estDistrict}
                      onChange={(e) => setEstDistrict(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      {(metadata.districts.length
                        ? metadata.districts
                        : ['Thiruvananthapuram', 'Ernakulam', 'Kozhikode']
                      ).map((d) => (
                        <option key={d} value={d}>
                          {tDistrict(d)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                      {tr('Issue Category', 'പരാതി വിഭാഗം')}
                    </label>
                    <select
                      value={estCategory}
                      onChange={(e) => setEstCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      {(metadata.categories.length
                        ? metadata.categories
                        : ['Public Infrastructure', 'Healthcare', 'Electricity & Power']
                      ).map((c) => (
                        <option key={c} value={c}>
                          {tCategory(c)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {matchedDepartment && (
                  <div
                    key={`${estDistrict}-${estCategory}`}
                    className="animate-pop-in flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DepartmentBadge code={matchedDepartment.code} />
                        <span className="text-xs font-bold text-slate-900">
                          {matchedDepartment.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        SLA: <strong>{matchedDepartment.slaDays} {tr('days', 'ദിവസം')}</strong> •{' '}
                        {tr('Target Completion:', 'ലക്ഷ്യ തീയതി:')}{' '}
                        <strong className="text-indigo-700">{estimatedDueText}</strong>
                      </p>
                    </div>
                    <Link
                      to={
                        user?.role === 'citizen'
                          ? `/citizen/submit?district=${encodeURIComponent(
                              estDistrict
                            )}&category=${encodeURIComponent(estCategory)}`
                          : '/login'
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                    >
                      {tr('Start Submission', 'സമർപ്പിക്കുക')} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
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
                    {tr('Live Public Grievance Activity', 'തത്സമയ പൊതുജന പരാതി വിവരങ്ങൾ')}
                  </h3>
                </div>
                <Link to="/track" className="text-xs font-semibold text-indigo-700 hover:underline">
                  {tr('Track any ID →', 'ഏത് ID-യും പരിശോധിക്കുക →')}
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {recentFeed.map((item, idx) => (
                  <Reveal key={item.referenceId} delayMs={idx * 70}>
                    <Link
                      to={`/track?ref=${encodeURIComponent(item.referenceId)}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 hover-lift p-3.5 transition block h-full"
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
                      <p className="text-[11px] text-slate-500 mt-1">{tDistrict(item.district)}</p>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </section>
      </Reveal>

      {/* 4. Spacious Featured Departments */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                {t.featuredBadge}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {t.featuredTitle}
              </h2>
            </div>
            <Link
              to="/departments"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
            >
              {tr('View all departments & 14 districts', 'എല്ലാ വകുപ്പുകളും 14 ജില്ലകളും കാണുക')}{' '}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.slice(0, 6).map((dept, idx) => {
              const speedPct = Math.max(25, Math.min(100, Math.round((12 - dept.slaDays) * 10)));
              return (
                <Reveal key={dept._id} delayMs={idx * 80}>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:bg-white hover:border-indigo-300 hover-lift h-full flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <DepartmentBadge code={dept.code} />
                        <span className="text-xs text-slate-500 font-semibold">
                          SLA: {dept.slaDays} {tr('days', 'ദിവസം')}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2">{dept.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{dept.description}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span>{tr('SLA Response Speed', 'SLA പ്രതികരണ വേഗത')}</span>
                        <span className="text-indigo-700">
                          {dept.slaDays <= 3 ? tr('Rapid', 'അതിവേഗം') : tr('Standard', 'സാധാരണം')}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          style={{ width: `${speedPct}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-amber-400 animate-progress-fill"
                        />
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, sub, barColor, barPct, delayMs = 0 }) {
  return (
    <Reveal delayMs={delayMs}>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md hover-lift h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">{label}</span>
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <p className="text-3xl font-extrabold text-slate-900">
          <AnimatedNumber value={value} />
        </p>
        <p className="text-xs text-slate-500 mt-1 mb-3">{sub}</p>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            style={{ width: `${barPct}%` }}
            className={`h-full rounded-full ${barColor} animate-progress-fill`}
          />
        </div>
      </div>
    </Reveal>
  );
}
