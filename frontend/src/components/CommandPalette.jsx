import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Compass,
  FilePlus2,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  Search,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { getDashboardPathForRole } from '../utils/formatters.js';

const SAMPLE_IDS = [
  'KL-CMO-2026-100101',
  'KL-CMO-2026-100102',
  'KL-CMO-2026-100103',
  'KL-CMO-2026-100105',
  'KL-CMO-2026-100106'
];

export function CommandPalette({ open, onClose }) {
  const { user } = useAuth();
  const { tr } = usePreferences();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const actions = useMemo(() => {
    const base = [
      {
        id: 'home',
        label: tr('Home & Live AI Sandbox', 'ഹോം & ലൈവ് AI സാൻഡ്‌ബോക്സ്'),
        sub: tr('Overview metrics, AI preview & district feed', 'പ്രധാന വിവരങ്ങൾ, AI പരിശോധന & ജില്ലാ ഫീഡ്'),
        to: '/',
        icon: Compass
      },
      {
        id: 'track',
        label: tr('Track Grievance Status', 'പരാതി തൽസ്ഥിതി പരിശോധിക്കുക'),
        sub: tr('Public verification by Reference ID', 'Reference ID ഉപയോഗിച്ച് തത്സമയം പരിശോധിക്കുക'),
        to: '/track',
        icon: Search
      },
      {
        id: 'departments',
        label: tr('Departments & 14 Kerala Districts', 'വകുപ്പുകളും 14 ജില്ലകളും'),
        sub: tr('SLA comparison, map explorer & nodal wings', 'SLA സമയപരിധിയും ജില്ലാ വിവരങ്ങളും'),
        to: '/departments',
        icon: Building2
      },
      {
        id: 'submit',
        label: tr('Submit New Grievance', 'പുതിയ പരാതി സമർപ്പിക്കുക'),
        sub:
          user?.role === 'citizen'
            ? tr('Launch grievance wizard', 'പരാതി ഫോം തുറക്കുക')
            : tr('Sign in or register as citizen', 'പൗരനായി ലോഗിൻ അല്ലെങ്കിൽ രജിസ്റ്റർ ചെയ്യുക'),
        to: user?.role === 'citizen' ? '/citizen/submit' : '/register',
        icon: FilePlus2
      },
      {
        id: 'how',
        label: tr('How Redressal Works', 'പരാതി പരിഹാര രീതി'),
        sub: tr('5-stage mandatory CMO & officer lifecycle', '5-ഘട്ട CMO നടപടിക്രമം'),
        to: '/how-it-works',
        icon: Sparkles
      },
      {
        id: 'faq',
        label: tr('FAQ & SLA Rules', 'ചോദ്യോത്തരങ്ങളും SLA നിയമങ്ങളും'),
        sub: tr('Escalation matrix & prototype guidelines', 'പതിവ് ചോദ്യങ്ങളും മാർഗ്ഗനിർദ്ദേശങ്ങളും'),
        to: '/faq',
        icon: HelpCircle
      }
    ];

    if (user) {
      base.unshift({
        id: 'dash',
        label: tr(
          `Open My ${user.role === 'cmo_admin' ? 'CMO' : user.role === 'department_officer' ? 'Officer' : 'Citizen'} Dashboard`,
          'എന്റെ ഡാഷ്ബോർഡ് തുറക്കുക'
        ),
        sub: `${tr('Signed in as', 'ലോഗിൻ ചെയ്തത്:')} ${user.name}`,
        to: getDashboardPathForRole(user.role),
        icon: LayoutDashboard
      });
    } else {
      base.push({
        id: 'login',
        label: tr('Evaluator Demo Login (Citizen / CMO / Officer)', 'ഡെമോ ലോഗിൻ (പൗരൻ / CMO / ഉദ്യോഗസ്ഥൻ)'),
        sub: tr('One-click auto-fill credentials', 'ഒറ്റ ക്ലിക്കിൽ ടെസ്റ്റ് അക്കൗണ്ടുകൾ'),
        to: '/login',
        icon: LogIn
      });
    }

    const q = query.trim().toLowerCase();
    const filteredPages = q
      ? base.filter((item) => `${item.label} ${item.sub}`.toLowerCase().includes(q))
      : base;

    const trimmedUpper = query.trim().toUpperCase();
    const isRefLookalike = /^KL[-A-Z0-9]*$/i.test(trimmedUpper) && trimmedUpper.length >= 4;

    const dynamicTrack = isRefLookalike
      ? [
          {
            id: `track-${trimmedUpper}`,
            label: `Track Reference ID "${trimmedUpper}"`,
            sub: 'Lookup live status, department & action report',
            to: `/track?ref=${encodeURIComponent(trimmedUpper)}`,
            icon: Search
          }
        ]
      : [];

    const matchingSamples = SAMPLE_IDS.filter(
      (id) => !q || id.toLowerCase().includes(q)
    )
      .slice(0, 3)
      .map((id) => ({
        id: `sample-${id}`,
        label: `Inspect Sample ${id}`,
        sub: 'Seeded public verification record',
        to: `/track?ref=${id}`,
        icon: Search
      }));

    return [...dynamicTrack, ...filteredPages, ...matchingSamples];
  }, [query, user]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  function go(item) {
    if (!item) return;
    onClose();
    navigate(item.to);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (actions.length ? (prev + 1) % actions.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        actions.length ? (prev - 1 + actions.length) % actions.length : 0
      );
    } else if (e.key === 'Enter' && actions[selectedIndex]) {
      e.preventDefault();
      go(actions[selectedIndex]);
    }
  }

  return (
    <div
      className="no-print fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50/70">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr(
              'Jump to page or enter Reference ID (e.g. KL-CMO-2026-100101)...',
              'പേജിലേക്ക് പോകുക അല്ലെങ്കിൽ Reference ID നൽകുക (KL-CMO-2026-100101)...'
            )}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
            aria-label="Close quick search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2.5 space-y-1">
          {actions.map((item, idx) => {
            const Icon = item.icon;
            const active = idx === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => go(item)}
                className={`w-full text-left flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl transition ${
                  active ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      active ? 'bg-white/15 text-amber-300' : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold truncate">{item.label}</p>
                    <p
                      className={`text-[11px] truncate ${
                        active ? 'text-indigo-100' : 'text-slate-500'
                      }`}
                    >
                      {item.sub}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    active ? 'translate-x-0.5 text-amber-300' : 'text-slate-400'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>{tr('Use ↑ ↓ arrows & Enter to navigate', '↑ ↓ ആരോ കീകളും Enter-ഉം ഉപയോഗിക്കുക')}</span>
          <span className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded">
            {tr('Esc to close', 'Esc അമർത്തുക')}
          </span>
        </div>
      </div>
    </div>
  );
}
