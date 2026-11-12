import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  CATEGORY_ML,
  DEPARTMENT_CODE_BY_NAME,
  DEPARTMENT_ML,
  DISTRICT_ML,
  PRIORITY_ML,
  ROLE_ML,
  STAGE_ML,
  STATUS_ML
} from '../utils/i18n.js';

const PreferencesContext = createContext(null);

const TRANSLATIONS = {
  en: {
    portalTitle: 'CM Kerala Portal',
    portalSub: 'Public Grievance Redressal',
    navHome: 'Home',
    navDepartments: 'Departments',
    navHow: 'How It Works',
    navTrack: 'Track Grievance',
    navInfo: 'Help & Info',
    signIn: 'Sign In',
    register: 'Register',
    dashboard: 'Dashboard',
    quickJump: 'Quick Jump',
    heroBadge: 'Live State Portal • 14 Kerala Districts • Gemini AI Triage',
    heroHeadlineStart: 'Direct, Transparent',
    heroHeadlineAccent: 'Public Redressal',
    heroHeadlineEnd: 'for Kerala',
    heroDesc:
      "Submit grievances directly to the Chief Minister's Office (CMO), follow every department action in real time, and verify outcomes transparently.",
    ctaSubmit: 'Submit Grievance',
    ctaTrack: 'Track Grievance',
    ctaDemo: 'CMO / Officer Demo Login',
    quickTrackTitle: 'Track Grievance Status',
    quickTrackSub: 'Enter your unique Reference ID to inspect department status and timeline.',
    quickTrackBtn: 'Check Live Status',
    howBadge: 'Mandatory Lifecycle',
    howTitle: 'How Redressal Works',
    aiBadge: 'Interactive Gemini AI Sandbox',
    aiTitle: 'Test Live AI Triage Now',
    featuredBadge: 'Nodal Wings',
    featuredTitle: 'Featured Government Departments'
  },
  ml: {
    portalTitle: 'സി.എം. കേരള പോർട്ടൽ',
    portalSub: 'പൊതുജന പരാതി പരിഹാരം',
    navHome: 'ഹോം',
    navDepartments: 'വകുപ്പുകൾ',
    navHow: 'പ്രവർത്തന രീതി',
    navTrack: 'പരാതി ട്രാക്ക്',
    navInfo: 'സഹായം',
    signIn: 'ലോഗിൻ',
    register: 'രജിസ്റ്റർ',
    dashboard: 'ഡാഷ്ബോർഡ്',
    quickJump: 'തിരയുക',
    heroBadge: 'ലൈവ് സ്റ്റേറ്റ് പോർട്ടൽ • 14 ജില്ലകൾ • Gemini AI സഹായം',
    heroHeadlineStart: 'നേരിട്ടുള്ളതും സുതാര്യവുമായ',
    heroHeadlineAccent: 'പൊതുജന പരാതി പരിഹാരം',
    heroHeadlineEnd: 'കേരളത്തിനായി',
    heroDesc:
      'മുഖ്യമന്ത്രിയുടെ ഓഫീസിലേക്ക് (CMO) നേരിട്ട് പരാതികൾ സമർപ്പിക്കുക, വകുപ്പുതല നടപടികൾ തത്സമയം പരിശോധിക്കുക.',
    ctaSubmit: 'പരാതി സമർപ്പിക്കുക',
    ctaTrack: 'പരാതി പരിശോധിക്കുക',
    ctaDemo: 'CMO / ഉദ്യോഗസ്ഥ ഡെമോ ലോഗിൻ',
    quickTrackTitle: 'പരാതി തൽസ്ഥിതി പരിശോധിക്കുക',
    quickTrackSub: 'വകുപ്പുതല പുരോഗതിയും ടൈംലൈനും കാണാൻ Reference ID നൽകുക.',
    quickTrackBtn: 'തൽസ്ഥിതി കാണുക',
    howBadge: 'നടപടിക്രമം',
    howTitle: 'പരാതി പരിഹാര ഘട്ടങ്ങൾ',
    aiBadge: 'തത്സമയ Gemini AI പരിശോധന',
    aiTitle: 'AI പരാതി വിശകലനം പരീക്ഷിക്കാം',
    featuredBadge: 'നോഡൽ വകുപ്പുകൾ',
    featuredTitle: 'പ്രധാന സർക്കാർ വകുപ്പുകൾ'
  }
};

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('cm_portal_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('cm_portal_lang') === 'ml' ? 'ml' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('cm_portal_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('cm_portal_lang', lang);
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  const value = useMemo(() => {
    const isMl = lang === 'ml';
    return {
      theme,
      isDark: theme === 'dark',
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
      lang,
      isMl,
      toggleLang: () => setLang((prev) => (prev === 'en' ? 'ml' : 'en')),
      t: TRANSLATIONS[lang] || TRANSLATIONS.en,
      tr: (en, ml) => (isMl && ml ? ml : en),
      tStatus: (s) => (isMl ? STATUS_ML[s] || s : s),
      tPriority: (p) => (isMl ? PRIORITY_ML[p] || p : p),
      tDistrict: (d) => (isMl ? DISTRICT_ML[d] || d : d),
      tCategory: (c) => (isMl ? CATEGORY_ML[c] || c : c),
      tStage: (st) => (isMl ? STAGE_ML[st] || st : st),
      tRole: (r) => (isMl ? ROLE_ML[r] || r : r),
      tDeptName: (deptOrName, codeOverride) => {
        if (!deptOrName) return '';
        if (!isMl) return typeof deptOrName === 'string' ? deptOrName : deptOrName.name || '';
        const code =
          codeOverride ||
          (typeof deptOrName === 'object' ? deptOrName.code : DEPARTMENT_CODE_BY_NAME[deptOrName]);
        if (code && DEPARTMENT_ML[code]) return DEPARTMENT_ML[code].name;
        return typeof deptOrName === 'string' ? deptOrName : deptOrName.name || '';
      },
      tDeptDesc: (dept) => {
        if (!dept) return '';
        if (!isMl) return dept.description || '';
        const code = dept.code || DEPARTMENT_CODE_BY_NAME[dept.name];
        return (code && DEPARTMENT_ML[code]?.description) || dept.description || '';
      },
      tDeptHead: (dept) => {
        if (!dept) return '';
        if (!isMl) return dept.headDesignation || '';
        const code = dept.code || DEPARTMENT_CODE_BY_NAME[dept.name];
        return (code && DEPARTMENT_ML[code]?.headDesignation) || dept.headDesignation || '';
      }
    };
  }, [theme, lang]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
}
