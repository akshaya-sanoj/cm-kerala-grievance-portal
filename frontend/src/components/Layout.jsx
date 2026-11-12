import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  ChevronDown,
  Languages,
  LogOut,
  Menu,
  Moon,
  Search,
  Shield,
  Sun,
  UserCheck,
  X
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { formatDateTime, getDashboardPathForRole, getRoleLabel } from '../utils/formatters.js';
import { CommandPalette } from './CommandPalette.jsx';
import { StatusBadge } from './StatusBadge.jsx';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, lang, toggleLang, t, tr, tRole } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activity, setActivity] = useState([]);
  const [health, setHealth] = useState({ checked: false, ok: false, db: false });

  useEffect(() => {
    const checkHealth = () => {
      api
        .get('/health')
        .then((res) =>
          setHealth({
            checked: true,
            ok: Boolean(res.data?.success),
            db: Boolean(res.data?.databaseConnected)
          })
        )
        .catch(() => setHealth({ checked: true, ok: false, db: false }));
    };
    checkHealth();
    const timer = setInterval(checkHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleShortcut(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const primaryLinks = [
    { to: '/', label: t.navHome },
    { to: '/departments', label: t.navDepartments },
    { to: '/how-it-works', label: t.navHow },
    { to: '/track', label: t.navTrack }
  ];

  const infoLinks = [
    {
      to: '/about',
      label: tr('About Us', 'ഞങ്ങളെക്കുറിച്ച്'),
      desc: tr('Mission, vision & prototype notice', 'ലക്ഷ്യം, കാഴ്ചപ്പാട് & പ്രോട്ടോടൈപ്പ് വിവരങ്ങൾ')
    },
    {
      to: '/contact',
      label: tr('Contact Us', 'ബന്ധപ്പെടുക'),
      desc: tr('Send an enquiry to helpdesk', 'ഹെൽപ്പ്ഡെസ്കിലേക്ക് സന്ദേശം അയയ്ക്കുക')
    },
    {
      to: '/faq',
      label: tr('FAQ', 'ചോദ്യോത്തരങ്ങൾ'),
      desc: tr('Common questions & SLA rules', 'പൊതുവായ സംശയങ്ങളും SLA നിയമങ്ങളും')
    }
  ];

  useEffect(() => {
    if (!user) {
      setActivity([]);
      setBellOpen(false);
      return undefined;
    }
    const fetchActivity = () => {
      api
        .get('/auth/activity')
        .then((res) => setActivity(res.data?.activity || []))
        .catch(() => {});
    };
    fetchActivity();
    const timer = setInterval(fetchActivity, 20000);
    return () => clearInterval(timer);
  }, [user]);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    setBellOpen(false);
    navigate('/');
  }

  function getDetailRoute(grievanceId) {
    if (!user) return '/track';
    if (user.role === 'cmo_admin') return `/cmo/grievances/${grievanceId}`;
    if (user.role === 'department_officer') return `/officer/grievances/${grievanceId}`;
    return `/citizen/grievances/${grievanceId}`;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7fb] overflow-x-hidden">
      {/* Slim Prototype Compliance Strip */}
      <div className="no-print bg-slate-950 text-slate-300 text-[11px] py-1.5 px-4 text-center border-b border-slate-800">
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {tr('Recruitment Prototype', 'റിക്രൂട്ട്മെന്റ് പ്രോട്ടോടൈപ്പ്')}
          </span>
          <span className="text-slate-600">•</span>
          <span>
            {tr(
              'WhiteMatrix Assessment Demo — Not an official Government of Kerala / CMO website. Fictional sample data only.',
              'WhiteMatrix സാങ്കേതിക പരീക്ഷണ ഡെമോ — ഇത് ഔദ്യോഗിക കേരള സർക്കാർ / CMO വെബ്സൈറ്റ് അല്ല. സാങ്കൽപ്പിക വിവരങ്ങൾ മാത്രം.'
            )}
          </span>
        </span>
      </div>

      {/* Spacious Standard Header */}
      <header className="no-print bg-white/95 backdrop-blur border-b border-slate-200/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <Link to="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
              <div className="w-9 h-9 rounded-xl civic-gradient flex items-center justify-center text-amber-300 shadow-sm shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight whitespace-nowrap">
                    {t.portalTitle}
                  </p>
                  <span className="hidden 2xl:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Prototype
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 whitespace-nowrap hidden sm:block">
                  {t.portalSub}
                </p>
              </div>
            </Link>

            {/* Uncluttered Desktop Nav (switches cleanly to drawer below xl) */}
            <nav className="hidden xl:flex items-center gap-1">
              {primaryLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {/* Info Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setInfoOpen(true)}
                onMouseLeave={() => setInfoOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setInfoOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap transition"
                >
                  {t.navInfo}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {infoOpen && (
                  <div className="animate-slide-down absolute left-0 top-full pt-1 w-64 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1">
                      {infoLinks.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setInfoOpen(false)}
                          className="block px-3 py-2 rounded-xl hover:bg-indigo-50 transition"
                        >
                          <p className="text-xs font-bold text-slate-900">{item.label}</p>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Auth & Preferences Controls */}
            <div className="hidden xl:flex items-center gap-2 relative shrink-0">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-xs font-medium text-slate-600 hover:text-indigo-800 transition"
                title="Quick Jump & Track (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden 2xl:inline">{t.quickJump}</span>
                <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                  Ctrl+K
                </kbd>
              </button>
              <button
                type="button"
                onClick={toggleLang}
                title="Switch English / Malayalam"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-xs font-bold text-slate-700 transition"
              >
                <Languages className="w-3.5 h-3.5 text-indigo-600" />
                {lang === 'en' ? 'ML' : 'EN'}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle color theme"
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-slate-700 transition"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>
              {user ? (
                <>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setBellOpen((prev) => !prev)}
                      title="Recent Grievance Activity"
                      className="relative p-2 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-slate-100 transition"
                    >
                      <Bell className="w-4 h-4" />
                      {activity.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </button>

                    {bellOpen && (
                      <div className="animate-slide-down absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {tr('Recent Workflow Activity', 'സമീപകാല നടപടികൾ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setBellOpen(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                          {activity.length === 0 ? (
                            <p className="p-4 text-xs text-slate-500 text-center">
                              {tr('No recent activity yet.', 'സമീപകാല പ്രവർത്തനങ്ങൾ ഒന്നും ഇല്ല.')}
                            </p>
                          ) : (
                            activity.slice(0, 6).map((item) => (
                              <Link
                                key={item._id}
                                to={getDetailRoute(item.grievanceId)}
                                onClick={() => setBellOpen(false)}
                                className="block px-4 py-2.5 hover:bg-slate-50 transition"
                              >
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <span className="font-mono text-[11px] font-bold text-indigo-700">
                                    {item.referenceId}
                                  </span>
                                  <StatusBadge status={item.newStatus} />
                                </div>
                                <p className="text-xs text-slate-700 line-clamp-1">
                                  {item.remarks}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {formatDateTime(item.createdAt)}
                                </p>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to={getDashboardPathForRole(user.role)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm whitespace-nowrap transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{t.dashboard}</span>
                  </Link>
                  <div className="text-right pl-1 hidden 2xl:block">
                    <p className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {tRole(user.role) || getRoleLabel(user.role)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap transition"
                  >
                    {t.signIn}
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold whitespace-nowrap shadow-sm transition"
                  >
                    {t.register}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile & Tablet menu toggle (up to xl) */}
            <div className="xl:hidden flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={toggleLang}
                className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                aria-label="Toggle language"
              >
                {lang === 'en' ? 'ML' : 'EN'}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Quick search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Drawer */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {[...primaryLinks, ...infoLinks].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to={getDashboardPathForRole(user.role)}
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
                  >
                    {tr(
                      `Go to ${getRoleLabel(user.role)} Dashboard`,
                      `${tRole(user.role) || getRoleLabel(user.role)} ഡാഷ്ബോർഡ്`
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-center px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-sm font-semibold"
                  >
                    {tr('Logout', 'ലോഗൗട്ട്')} ({user.name})
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-center px-4 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm font-semibold"
                  >
                    {t.signIn}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="text-center px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
                  >
                    {t.register}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div key={location.pathname} className="animate-page-enter">
          {children}
        </div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Clean Standard Footer */}
      <footer className="no-print bg-slate-950 text-slate-300 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 text-white font-bold text-base mb-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              {tr('CM Kerala Public Grievance Portal', 'സി.എം. കേരള പൊതുജന പരാതി പോർട്ടൽ')}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {tr(
                'A full-stack recruitment prototype demonstrating transparent citizen grievance submission, CMO routing, department action tracking, and Gemini AI-assisted triage.',
                'സുതാര്യമായ പരാതി സമർപ്പണം, CMO കൈമാറ്റം, വകുപ്പുതല നടപടി നിരീക്ഷണം, Gemini AI വിശകലനം എന്നിവ കാണിക്കുന്ന ഫുൾ-സ്റ്റാക്ക് പ്രോട്ടോടൈപ്പ്.'
              )}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              {tr('Portal Pages', 'പോർട്ടൽ പേജുകൾ')}
            </h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <li>
                <Link to="/citizen/submit" className="hover:text-amber-300">
                  {t.ctaSubmit}
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-amber-300">
                  {t.navTrack}
                </Link>
              </li>
              <li>
                <Link to="/departments" className="hover:text-amber-300">
                  {t.navDepartments}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-amber-300">
                  {t.navHow}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-300">
                  {tr('About Us', 'ഞങ്ങളെക്കുറിച്ച്')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-300">
                  {tr('Contact Us', 'ബന്ധപ്പെടുക')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-amber-300">
                  {tr('FAQ', 'ചോദ്യോത്തരങ്ങൾ')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-300">
                  {tr('Demo Login', 'ഡെമോ ലോഗിൻ')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              {tr('Prototype Compliance', 'പ്രോട്ടോടൈപ്പ് അറിയിപ്പ്')}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {tr(
                "Built exclusively for WhiteMatrix Software Solutions technical assessment. Not affiliated with or endorsed by the Government of Kerala or the Chief Minister's Office. All records and credentials are fictional.",
                'WhiteMatrix Software Solutions സാങ്കേതിക വിലയിരുത്തലിനായി നിർമ്മിച്ചത്. കേരള സർക്കാരുമായോ മുഖ്യമന്ത്രിയുടെ ഓഫീസുമായോ ഔദ്യോഗിക ബന്ധമില്ല. എല്ലാ വിവരങ്ങളും സാങ്കൽപ്പികമാണ്.'
              )}
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            {tr(
              'CM Kerala Public Grievance Redressal Portal (Recruitment Prototype)',
              'സി.എം. കേരള പൊതുജന പരാതി പരിഹാര പോർട്ടൽ (റിക്രൂട്ട്മെന്റ് പ്രോട്ടോടൈപ്പ്)'
            )}
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
            <span className="relative flex h-2 w-2">
              {health.ok && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  !health.checked
                    ? 'bg-slate-500'
                    : health.ok && health.db
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
            </span>
            {!health.checked
              ? tr('Checking System Status...', 'സിസ്റ്റം നില പരിശോധിക്കുന്നു...')
              : health.ok && health.db
              ? tr('API Live • MongoDB Atlas Connected', 'API സജീവം • MongoDB ബന്ധിപ്പിച്ചു')
              : health.ok
              ? tr('API Live • Reconnecting DB', 'API സജീവം • DB പുനഃസ്ഥാപിക്കുന്നു')
              : tr('API Offline', 'API ഓഫ്‌ലൈൻ')}
          </span>
        </div>
      </footer>
    </div>
  );
}
