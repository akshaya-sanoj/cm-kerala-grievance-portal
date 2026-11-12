import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Building2, ChevronDown, LogOut, Menu, Shield, UserCheck, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime, getDashboardPathForRole, getRoleLabel } from '../utils/formatters.js';
import { StatusBadge } from './StatusBadge.jsx';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activity, setActivity] = useState([]);

  const primaryLinks = [
    { to: '/', label: 'Home' },
    { to: '/departments', label: 'Departments' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/track', label: 'Track Grievance' }
  ];

  const infoLinks = [
    { to: '/about', label: 'About Us', desc: 'Mission, vision & prototype notice' },
    { to: '/contact', label: 'Contact Us', desc: 'Send an enquiry to helpdesk' },
    { to: '/faq', label: 'FAQ', desc: 'Common questions & SLA rules' }
  ];

  useEffect(() => {
    if (!user) {
      setActivity([]);
      setBellOpen(false);
      return;
    }
    api
      .get('/auth/activity')
      .then((res) => setActivity(res.data?.activity || []))
      .catch(() => {});
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
    <div className="min-h-screen flex flex-col bg-[#f6f7fb]">
      {/* Slim Prototype Compliance Strip */}
      <div className="no-print bg-slate-950 text-slate-300 text-[11px] py-1.5 px-4 text-center border-b border-slate-800">
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Recruitment Prototype
          </span>
          <span className="text-slate-600">•</span>
          <span>
            WhiteMatrix Assessment Demo — Not an official Government of Kerala / CMO website.
            Fictional sample data only.
          </span>
        </span>
      </div>

      {/* Spacious Standard Header */}
      <header className="no-print bg-white/95 backdrop-blur border-b border-slate-200/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-6">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl civic-gradient flex items-center justify-center text-amber-300 shadow-sm">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight whitespace-nowrap">
                    CM Kerala Portal
                  </p>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Prototype
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 whitespace-nowrap">
                  Public Grievance Redressal
                </p>
              </div>
            </Link>

            {/* Uncluttered Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {primaryLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
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
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap transition"
                >
                  Help &amp; Info
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {infoOpen && (
                  <div className="absolute left-0 top-full pt-1 w-64 z-50">
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

            {/* Auth Controls */}
            <div className="hidden lg:flex items-center gap-2.5 relative shrink-0">
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
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            Recent Workflow Activity
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
                              No recent activity yet.
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm whitespace-nowrap transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <div className="text-right pl-1">
                    <p className="text-xs font-semibold text-slate-800 max-w-[130px] truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500">{getRoleLabel(user.role)}</p>
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
                    className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold whitespace-nowrap shadow-sm transition"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
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
                    Go to {getRoleLabel(user.role)} Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-center px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-sm font-semibold"
                  >
                    Logout ({user.name})
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-center px-4 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm font-semibold"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="text-center px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Clean Standard Footer */}
      <footer className="no-print bg-slate-950 text-slate-300 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 text-white font-bold text-base mb-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              CM Kerala Public Grievance Portal
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A full-stack recruitment prototype demonstrating transparent citizen grievance
              submission, CMO routing, department action tracking, and Gemini AI-assisted triage.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Portal Pages</h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <li>
                <Link to="/citizen/submit" className="hover:text-amber-300">
                  Submit Grievance
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-amber-300">
                  Track Status
                </Link>
              </li>
              <li>
                <Link to="/departments" className="hover:text-amber-300">
                  Departments
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-amber-300">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-300">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-amber-300">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-300">
                  Demo Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Prototype Compliance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built exclusively for WhiteMatrix Software Solutions technical assessment. Not
              affiliated with or endorsed by the Government of Kerala or the Chief Minister&apos;s
              Office. All records and credentials are fictional.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
          CM Kerala Public Grievance Redressal Portal (Recruitment Prototype)
        </div>
      </footer>
    </div>
  );
}
