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
        label: 'Home & Live AI Sandbox',
        sub: 'Overview metrics, AI preview & district feed',
        to: '/',
        icon: Compass
      },
      {
        id: 'track',
        label: 'Track Grievance Status',
        sub: 'Public verification by Reference ID',
        to: '/track',
        icon: Search
      },
      {
        id: 'departments',
        label: 'Departments & 14 Kerala Districts',
        sub: 'SLA comparison, map explorer & nodal wings',
        to: '/departments',
        icon: Building2
      },
      {
        id: 'submit',
        label: 'Submit New Grievance',
        sub: user?.role === 'citizen' ? 'Launch grievance wizard' : 'Sign in or register as citizen',
        to: user?.role === 'citizen' ? '/citizen/submit' : '/register',
        icon: FilePlus2
      },
      {
        id: 'how',
        label: 'How Redressal Works',
        sub: '5-stage mandatory CMO & officer lifecycle',
        to: '/how-it-works',
        icon: Sparkles
      },
      {
        id: 'faq',
        label: 'FAQ & SLA Rules',
        sub: 'Escalation matrix & prototype guidelines',
        to: '/faq',
        icon: HelpCircle
      }
    ];

    if (user) {
      base.unshift({
        id: 'dash',
        label: `Open My ${user.role === 'cmo_admin' ? 'CMO' : user.role === 'department_officer' ? 'Officer' : 'Citizen'} Dashboard`,
        sub: `Signed in as ${user.name}`,
        to: getDashboardPathForRole(user.role),
        icon: LayoutDashboard
      });
    } else {
      base.push({
        id: 'login',
        label: 'Evaluator Demo Login (Citizen / CMO / Officer)',
        sub: 'One-click auto-fill credentials',
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
            placeholder="Jump to page or enter Reference ID (e.g. KL-CMO-2026-100101)..."
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
          <span>Use ↑ ↓ arrows &amp; Enter to navigate</span>
          <span className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded">
            Esc to close
          </span>
        </div>
      </div>
    </div>
  );
}
