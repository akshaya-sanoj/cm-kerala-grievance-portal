import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { getDashboardPathForRole } from '../utils/formatters.js';

const DEMO_ACCOUNTS = [
  {
    label: 'Citizen Demo',
    labelMl: 'പൗരൻ (ഡെമോ)',
    email: 'citizen@kerala-demo.in',
    pass: 'DemoPass@2026',
    roleHint: 'Submit, track, feedback & reopen',
    roleHintMl: 'പരാതി സമർപ്പിക്കുക, ട്രാക്ക് ചെയ്യുക, റീ-ഓപ്പൺ ചെയ്യുക'
  },
  {
    label: 'CMO Administrator',
    labelMl: 'CMO അഡ്മിനിസ്ട്രേറ്റർ',
    email: 'cmo@kerala-demo.gov.in',
    pass: 'DemoPass@2026',
    roleHint: 'Review, assign, escalate, resolve & charts',
    roleHintMl: 'പരിശോധിക്കുക, വകുപ്പുകൾക്ക് കൈമാറുക, തീർപ്പാക്കുക'
  },
  {
    label: 'PWD Department Officer',
    labelMl: 'PWD വകുപ്പ് ഉദ്യോഗസ്ഥൻ',
    email: 'pwd.officer@kerala-demo.gov.in',
    pass: 'DemoPass@2026',
    roleHint: 'Investigate & submit Action-Taken Report',
    roleHintMl: 'അന്വേഷണം നടത്തുക & ATR റിപ്പോർട്ട് സമർപ്പിക്കുക'
  },
  {
    label: 'Health Department Officer',
    labelMl: 'ആരോഗ്യ വകുപ്പ് ഉദ്യോഗസ്ഥൻ',
    email: 'health.officer@kerala-demo.gov.in',
    pass: 'DemoPass@2026',
    roleHint: 'Investigate overdue Health grievance',
    roleHintMl: 'കാലാവധി കഴിഞ്ഞ ആരോഗ്യ പരാതി പരിശോധിക്കുക'
  }
];

export function LoginPage() {
  const { setSession } = useAuth();
  const { tr } = usePreferences();
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
          <h1 className="text-2xl font-extrabold text-slate-900">
            {tr('Portal Sign In', 'പോർട്ടൽ ലോഗിൻ')}
          </h1>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          {tr(
            'Role-based sign in for Citizens, CMO Administrators, and Department Officers.',
            'പൗരന്മാർ, CMO അഡ്മിനിസ്ട്രേറ്റർമാർ, വകുപ്പ് ഉദ്യോഗസ്ഥർ എന്നിവർക്കുള്ള ലോഗിൻ.'
          )}
        </p>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr('Email Address', 'ഇമെയിൽ വിലാസം')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr('Password', 'പാസ്‌വേഡ്')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tr('Enter your password', 'പാസ്‌വേഡ് നൽകുക')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition"
          >
            {loading ? tr('Signing In...', 'ലോഗിൻ ചെയ്യുന്നു...') : tr('Sign In', 'ലോഗിൻ ചെയ്യുക')}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-600">
          {tr('New citizen user?', 'പുതിയ പൗരനാണോ?')}{' '}
          <Link to="/register" className="font-bold text-indigo-600 hover:underline">
            {tr('Register an account', 'പുതിയ അക്കൗണ്ട് രജിസ്റ്റർ ചെയ്യുക')}
          </Link>
        </p>
      </div>

      {/* Evaluator Demo Accounts Panel */}
      <div className="lg:col-span-6 civic-gradient text-white rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-2 text-amber-300">
          <KeyRound className="w-5 h-5" />
          <h2 className="text-lg font-bold">
            {tr('Evaluator Demo Credentials (Test Accounts)', 'ഡെമോ ലോഗിൻ വിവരങ്ങൾ (ടെസ്റ്റ് അക്കൗണ്ടുകൾ)')}
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {tr(
            'Click any fictional test account below to auto-fill credentials and inspect each role-based dashboard. Password for all seeded accounts:',
            'താഴെ കാണുന്ന ഏതെങ്കിലും ടെസ്റ്റ് അക്കൗണ്ടിൽ ക്ലിക്ക് ചെയ്ത് ഓരോ ഡാഷ്ബോർഡും പരിശോധിക്കാം. എല്ലാ അക്കൗണ്ടുകളുടെയും പാസ്‌വേഡ്:'
          )}{' '}
          <code className="font-mono bg-white/10 text-amber-200 px-1.5 py-0.5 rounded border border-white/20">
            DemoPass@2026
          </code>
        </p>

        <div className="space-y-2.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => applyDemo(acc)}
              className="w-full text-left bg-white hover:bg-indigo-50 border border-white/20 rounded-xl p-3.5 transition flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  {tr(acc.label, acc.labelMl)}
                </p>
                <p className="font-mono text-xs text-slate-600 mt-0.5">{acc.email}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{tr(acc.roleHint, acc.roleHintMl)}</p>
              </div>
              <span className="text-xs font-bold text-indigo-700 shrink-0">
                {tr('Auto-fill →', 'ചേർക്കുക →')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
