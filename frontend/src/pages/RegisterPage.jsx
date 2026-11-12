import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';

export function RegisterPage() {
  const { setSession } = useAuth();
  const { tr, tDistrict } = usePreferences();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    district: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/metadata')
      .then((res) => setDistricts(res.data?.metadata?.districts || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      setSession(res.data.token, res.data.user);
      navigate('/citizen/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-lg civic-gradient text-white flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {tr('Citizen Registration', 'പൗര രജിസ്ട്രേഷൻ')}
          </h1>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          {tr(
            'Create a prototype citizen account to submit and track grievances. Please use fictional test details.',
            'പരാതികൾ സമർപ്പിക്കാനും പരിശോധിക്കാനും പൗര അക്കൗണ്ട് നിർമ്മിക്കുക. സാങ്കൽപ്പിക വിവരങ്ങൾ മാത്രം നൽകുക.'
          )}
        </p>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr('Full Name *', 'പൂർണ്ണ നാമം *')}
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={tr('e.g., Arjun Krishnan', 'ഉദാ: അർജുൻ കൃഷ്ണൻ')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr('Email Address *', 'ഇമെയിൽ വിലാസം *')}
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="citizen@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr('Mobile Number *', 'മൊബൈൽ നമ്പർ *')}
              </label>
              <input
                type="tel"
                required
                value={form.mobileNumber}
                onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                placeholder="9847000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr('District (Optional)', 'ജില്ല (ഐച്ഛികം)')}
              </label>
              <select
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
              >
                <option value="">{tr('Select District', 'ജില്ല തിരഞ്ഞെടുക്കുക')}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {tDistrict(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr('Password *', 'പാസ്‌വേഡ് *')}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={tr('Minimum 6 characters', 'കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition"
          >
            {loading
              ? tr('Creating Account...', 'അക്കൗണ്ട് നിർമ്മിക്കുന്നു...')
              : tr('Create Citizen Account', 'അക്കൗണ്ട് നിർമ്മിക്കുക')}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-600">
          {tr('Already registered?', 'നേരത്തെ രജിസ്റ്റർ ചെയ്തിട്ടുണ്ടോ?')}{' '}
          <Link to="/login" className="font-bold text-indigo-600 hover:underline">
            {tr('Sign In here', 'ഇവിടെ ലോഗിൻ ചെയ്യുക')}
          </Link>
        </p>
      </div>
    </div>
  );
}
