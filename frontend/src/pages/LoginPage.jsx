import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getDashboardPathForRole } from '../utils/formatters.js';

const DEMO_ACCOUNTS = [
  {
    label: 'Citizen Demo',
    email: 'citizen@kerala-demo.in',
    pass: 'DemoPass@2026',
    roleHint: 'Submit, track, feedback & reopen'
  },
  {
    label: 'CMO Administrator',
    email: 'cmo@kerala-demo.gov.in',
    pass: 'DemoPass@2026',
    roleHint: 'Review, assign, escalate, resolve & charts'
  },
  {
    label: 'PWD Department Officer',
    email: 'pwd.officer@kerala-demo.gov.in',
    pass: 'DemoPass@2026',
    roleHint: 'Investigate & submit Action-Taken Report'
  },
  {
    label: 'Health Department Officer',
    email: 'health.officer@kerala-demo.gov.in',
    pass: 'DemoPass@2026',
    roleHint: 'Investigate overdue Health grievance'
  }
];

export function LoginPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      setSession(res.data.token, res.data.user);
      navigate(getDashboardPathForRole(res.data.user.role));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function applyDemo(acc) {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError('');
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-lg civic-gradient text-white flex items-center justify-center">
            <LogIn className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Portal Sign In</h1>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Role-based sign in for Citizens, CMO Administrators, and Department Officers.
        </p>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-civic-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-civic-600 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-civic-700 hover:bg-civic-800 disabled:opacity-60 text-white font-semibold text-sm transition"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-600">
          New citizen user?{' '}
          <Link to="/register" className="font-bold text-civic-700 hover:underline">
            Register an account
          </Link>
        </p>
      </div>

      {/* Evaluator Demo Accounts Panel */}
      <div className="lg:col-span-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-civic-900">
          <KeyRound className="w-5 h-5 text-civic-700" />
          <h2 className="text-lg font-bold">Evaluator Demo Credentials (Test Accounts)</h2>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          Click any fictional test account below to auto-fill credentials and inspect each role-based
          dashboard. Password for all seeded accounts:{' '}
          <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">
            DemoPass@2026
          </code>
        </p>

        <div className="space-y-2.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => applyDemo(acc)}
              className="w-full text-left bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 transition flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-civic-700" />
                  {acc.label}
                </p>
                <p className="font-mono text-xs text-slate-600 mt-0.5">{acc.email}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{acc.roleHint}</p>
              </div>
              <span className="text-xs font-semibold text-civic-700 shrink-0">Auto-fill →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
