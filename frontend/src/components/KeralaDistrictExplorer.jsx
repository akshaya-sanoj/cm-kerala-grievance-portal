import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';

const REGION_ML = {
  All: 'എല്ലാം',
  'South Kerala': 'തെക്കൻ കേരളം',
  'Central Kerala': 'മധ്യ കേരളം',
  'North Kerala': 'വടക്കൻ കേരളം'
};

const KERALA_REGIONS = [
  {
    region: 'South Kerala',
    districts: [
      {
        name: 'Thiruvananthapuram',
        hq: 'Capital Zone',
        hqMl: 'തലസ്ഥാന മേഖല',
        focus: 'Secretariat, Water & Urban Transit',
        focusMl: 'സെക്രട്ടേറിയറ്റ്, കുടിവെള്ളം & നഗര ഗതാഗതം'
      },
      {
        name: 'Kollam',
        hq: 'Coastal South',
        hqMl: 'തെക്കൻ തീരദേശം',
        focus: 'Coastal Roads, Fisheries & Health',
        focusMl: 'തീരദേശ റോഡുകൾ, മത്സ്യബന്ധനം & ആരോഗ്യം'
      },
      {
        name: 'Pathanamthitta',
        hq: 'Central Travancore',
        hqMl: 'മധ്യ തിരുവിതാംകൂർ',
        focus: 'Pilgrim Roads, Power & Forest Fringe',
        focusMl: 'തീർത്ഥാടന പാതകൾ, വൈദ്യുതി & വനമേഖല'
      },
      {
        name: 'Alappuzha',
        hq: 'Kuttanad Belt',
        hqMl: 'കുട്ടനാട് മേഖല',
        focus: 'Canal Sanitation, Flood Drainage & Bridges',
        focusMl: 'കനാൽ ശുചിത്വം, വെള്ളപ്പൊക്ക നിവാരണം & പാലങ്ങൾ'
      },
      {
        name: 'Kottayam',
        hq: 'Midland South',
        hqMl: 'മധ്യ-തെക്കൻ മേഖല',
        focus: 'Highways, Schools & Public Health',
        focusMl: 'ഹൈവേകൾ, സ്കൂളുകൾ & പൊതുജനാരോഗ്യം'
      }
    ]
  },
  {
    region: 'Central Kerala',
    districts: [
      {
        name: 'Idukki',
        hq: 'High Range',
        hqMl: 'ഹൈറേഞ്ച് മേഖല',
        focus: 'Hill Highways, Power Lines & Land Records',
        focusMl: 'മലയോര പാതകൾ, വൈദ്യുതി ലൈനുകൾ & ഭൂമി രേഖകൾ'
      },
      {
        name: 'Ernakulam',
        hq: 'Metro Hub',
        hqMl: 'മെട്രോ ഹബ്ബ്',
        focus: 'Urban Infrastructure, Water & Traffic',
        focusMl: 'നഗര അടിസ്ഥാന സൗകര്യം, കുടിവെള്ളം & ഗതാഗതം'
      },
      {
        name: 'Thrissur',
        hq: 'Cultural Central',
        hqMl: 'സാംസ്കാരിക മധ്യമേഖല',
        focus: 'KSEB Transformers, Hospitals & Roads',
        focusMl: 'KSEB ട്രാൻസ്‌ഫോമറുകൾ, ആശുപത്രികൾ & റോഡുകൾ'
      },
      {
        name: 'Palakkad',
        hq: 'Eastern Gateway',
        hqMl: 'കിഴക്കൻ പ്രവേശന കവാടം',
        focus: 'Irrigation, School Infra & Rural Roads',
        focusMl: 'ജലസേചനം, സ്കൂൾ സൗകര്യം & ഗ്രാമീണ റോഡുകൾ'
      }
    ]
  },
  {
    region: 'North Kerala',
    districts: [
      {
        name: 'Malappuram',
        hq: 'Malabar Central',
        hqMl: 'മധ്യ മലബാർ',
        focus: 'Schools, Drinking Water & Healthcare',
        focusMl: 'സ്കൂളുകൾ, കുടിവെള്ളം & ആരോഗ്യ സേവനം'
      },
      {
        name: 'Kozhikode',
        hq: 'Malabar Hub',
        hqMl: 'മലബാർ ഹബ്ബ്',
        focus: 'Medical Supply, Coastal Roads & Civic',
        focusMl: 'മെഡിക്കൽ വിതരണം, തീരദേശ റോഡുകൾ & ശുചിത്വം'
      },
      {
        name: 'Wayanad',
        hq: 'Western Ghats',
        hqMl: 'പശ്ചിമഘട്ട മേഖല',
        focus: 'KSRTC Connectivity, Hospitals & Relief',
        focusMl: 'KSRTC യാത്രാ സൗകര്യം, ആശുപത്രികൾ & ദുരിതാശ്വാസം'
      },
      {
        name: 'Kannur',
        hq: 'North Malabar',
        hqMl: 'വടക്കൻ മലബാർ',
        focus: 'Revenue Mutation, Power & Highways',
        focusMl: 'റവന്യൂ പോക്കുവരവ്, വൈദ്യുതി & ഹൈവേകൾ'
      },
      {
        name: 'Kasaragod',
        hq: 'Northernmost',
        hqMl: 'വടക്കേ അറ്റം',
        focus: 'PHC Staffing, Bridges & Rural Electrification',
        focusMl: 'PHC ജീവനക്കാർ, പാലങ്ങൾ & ഗ്രാമീണ വൈദ്യുതീകരണം'
      }
    ]
  }
];

const ALL_DISTRICTS = KERALA_REGIONS.flatMap((r) =>
  r.districts.map((d) => ({ ...d, region: r.region }))
);

export function KeralaDistrictExplorer() {
  const { user } = useAuth();
  const { tr, tDistrict } = usePreferences();
  const [activeRegion, setActiveRegion] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState(ALL_DISTRICTS[6]);

  const visibleDistricts =
    activeRegion === 'All'
      ? ALL_DISTRICTS
      : ALL_DISTRICTS.filter((d) => d.region === activeRegion);

  const submitUrl =
    user?.role === 'citizen'
      ? `/citizen/submit?district=${encodeURIComponent(selectedDistrict.name)}`
      : '/login';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            {tr('Interactive State Coverage', 'സംസ്ഥാനതല കവറേജ്')}
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            {tr('Explore All 14 Districts of Kerala', 'കേരളത്തിലെ 14 ജില്ലകളും പരിശോധിക്കുക')}
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
          {['All', 'South Kerala', 'Central Kerala', 'North Kerala'].map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => setActiveRegion(region)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeRegion === region
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tr(region, REGION_ML[region])}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-wrap gap-2">
          {visibleDistricts.map((dist) => {
            const isSelected = selectedDistrict.name === dist.name;
            return (
              <button
                key={dist.name}
                type="button"
                onClick={() => setSelectedDistrict(dist)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                    : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-indigo-600'}`} />
                {tDistrict(dist.name)}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-4 rounded-2xl civic-gradient text-white p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {tr(selectedDistrict.region, REGION_ML[selectedDistrict.region])}
            </span>
            <Shield className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{tDistrict(selectedDistrict.name)}</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {tr(selectedDistrict.hq, selectedDistrict.hqMl)} {tr('Desk', 'ഡെസ്ക്')}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-xs text-slate-200 border border-white/10">
            <span className="block text-[10px] uppercase tracking-wider text-amber-300 font-bold mb-1">
              {tr('Key Redressal Focus', 'പ്രധാന ശ്രദ്ധാ മേഖലകൾ')}
            </span>
            {tr(selectedDistrict.focus, selectedDistrict.focusMl)}
          </div>
          <Link
            to={submitUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition"
          >
            {tr(
              `File Grievance for ${selectedDistrict.name}`,
              `${tDistrict(selectedDistrict.name)} ജില്ലയിൽ പരാതി നൽകുക`
            )}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
