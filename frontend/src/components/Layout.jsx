import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Building2, LogOut, Menu, Shield, UserCheck, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime, getDashboardPathForRole, getRoleLabel } from '../utils/formatters.js';
import { StatusBadge } from './StatusBadge.jsx';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [activity, setActivity] = useState([]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About Us' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/departments', label: 'Departments' },
    { to: '/track', label: 'Track Grievance' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/faq', label: 'FAQ' }
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Sleek Prototype Compliance Strip */}
      <div className="no-print bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 text-center border-b border-slate-800">
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Recruitment Prototype
          </span>
          <span className="text-slate-500">•</span>
          <span>
            WhiteMatrix Technical Assessment — Not an official Government of Kerala / CMO website.
            Fictional sample data only.
          </span>
        </span>
      </div>

      {/* Main Header */}
      <header className="no-print bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl civic-gradient flex items-center justify-center text-white shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm sm:text-base font-extrabold text-civic-950 leading-tight whitespace-nowrap">
                    CM Kerala Grievance Portal
                  </p>
                  <span className="hidden xl:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-civic-800 border border-emerald-200">
                    Prototype
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                  Public Redressal &amp; AI Triage System
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-2.5 xl:px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition ${
                      isActive
                        ? 'bg-civic-50 text-civic-800 font-semibold'
                        : 'text-slate-600 hover:text-civic-800 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Auth Controls */}
            <div className="hidden lg:flex items-center gap-2 relative shrink-0">
              {user ? (
                <>
                  {/* Recent Activity Bell */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setBellOpen((prev) => !prev)}
                      title="Recent Grievance Activity"
                      className="relative p-2 rounded-lg text-slate-600 hover:text-civic-800 hover:bg-slate-100 transition"
                    >
                      <Bell className="w-4 h-4" />
                      {activity.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600" />
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
                                  <span className="font-mono text-[11px] font-bold text-civic-800">
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-civic-700 hover:bg-civic-800 text-white text-sm font-semibold shadow-sm transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <div className="text-right px-2">
                    <p className="text-xs font-semibold text-slate-800 max-w-[140px] truncate">
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
                    className="px-3 py-2 rounded-lg text-[13px] font-semibold text-civic-800 hover:bg-civic-50 whitespace-nowrap transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-2 rounded-lg bg-civic-700 hover:bg-civic-800 text-white text-[13px] font-semibold whitespace-nowrap shadow-sm transition"
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
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-civic-50 text-civic-800 font-semibold' : 'text-slate-700'
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
                    className="w-full text-center px-4 py-2 rounded-lg bg-civic-700 text-white text-sm font-semibold"
                  >
                    Go to {getRoleLabel(user.role)} Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-center px-4 py-2 rounded-lg border border-rose-200 text-rose-700 text-sm font-semibold"
                  >
                    Logout ({user.name})
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-center px-4 py-2 rounded-lg border border-civic-700 text-civic-800 text-sm font-semibold"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="text-center px-4 py-2 rounded-lg bg-civic-700 text-white text-sm font-semibold"
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

      {/* Footer */}
      <footer className="no-print bg-slate-900 text-slate-300 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 text-white font-bold text-base mb-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              CM Kerala Public Grievance Portal
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A full-stack recruitment prototype demonstrating transparent citizen grievance
              submission, CMO routing, department action tracking, and Gemini AI-assisted triage.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/citizen/submit" className="hover:text-emerald-300">
                  Submit Grievance
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-emerald-300">
                  Track Grievance Status
                </Link>
              </li>
              <li>
                <Link to="/departments" className="hover:text-emerald-300">
                  Departments Directory
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-emerald-300">
                  Redressal Workflow
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-emerald-300">
                  Contact &amp; Helpdesk
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Disclaimer &amp; Demo Info</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built exclusively as a technical assessment prototype for WhiteMatrix Software
              Solutions. Does not represent or hold authorization from the Government of Kerala or
              the Office of the Chief Minister. All records and credentials are fictional.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800 py-4 px-4 text-center text-xs text-slate-500">
          CM Kerala Public Grievance Redressal Portal (Recruitment Prototype) • Demo Environment
        </div>
      </footer>
    </div>
  );
}
