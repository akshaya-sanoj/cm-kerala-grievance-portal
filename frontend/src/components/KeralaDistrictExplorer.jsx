import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const KERALA_REGIONS = [
  {
    region: 'South Kerala',
    districts: [
      { name: 'Thiruvananthapuram', hq: 'Capital Zone', focus: 'Secretariat, Water & Urban Transit' },
      { name: 'Kollam', hq: 'Coastal South', focus: 'Coastal Roads, Fisheries & Health' },
      { name: 'Pathanamthitta', hq: 'Central Travancore', focus: 'Pilgrim Roads, Power & Forest Fringe' },
      { name: 'Alappuzha', hq: 'Kuttanad Belt', focus: 'Canal Sanitation, Flood Drainage & Bridges' },
      { name: 'Kottayam', hq: 'Midland South', focus: 'Highways, Schools & Public Health' }
    ]
  },
  {
    region: 'Central Kerala',
    districts: [
      { name: 'Idukki', hq: 'High Range', focus: 'Hill Highways, Power Lines & Land Records' },
      { name: 'Ernakulam', hq: 'Metro Hub', focus: 'Urban Infrastructure, Water & Traffic' },
      { name: 'Thrissur', hq: 'Cultural Central', focus: 'KSEB Transformers, Hospitals & Roads' },
      { name: 'Palakkad', hq: 'Eastern Gateway', focus: 'Irrigation, School Infra & Rural Roads' }
    ]
  },
  {
    region: 'North Kerala',
    districts: [
      { name: 'Malappuram', hq: 'Malabar Central', focus: 'Schools, Drinking Water & Healthcare' },
      { name: 'Kozhikode', hq: 'Malabar Hub', focus: 'Medical Supply, Coastal Roads & Civic' },
      { name: 'Wayanad', hq: 'Western Ghats', focus: 'KSRTC Connectivity, Hospitals & Relief' },
      { name: 'Kannur', hq: 'North Malabar', focus: 'Revenue Mutation, Power & Highways' },
      { name: 'Kasaragod', hq: 'Northernmost', focus: 'PHC Staffing, Bridges & Rural Electrification' }
    ]
  }
];

const ALL_DISTRICTS = KERALA_REGIONS.flatMap((r) =>
  r.districts.map((d) => ({ ...d, region: r.region }))
);

export function KeralaDistrictExplorer() {
  const { user } = useAuth();
  const [activeRegion, setActiveRegion] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState(ALL_DISTRICTS[6]); // Ernakulam default

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
            Interactive State Coverage
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            Explore All 14 Districts of Kerala
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
              {region}
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
                {dist.name}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-4 rounded-2xl civic-gradient text-white p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {selectedDistrict.region}
            </span>
            <Shield className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{selectedDistrict.name}</h3>
            <p className="text-xs text-slate-300 mt-0.5">{selectedDistrict.hq} Desk</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-xs text-slate-200 border border-white/10">
            <span className="block text-[10px] uppercase tracking-wider text-amber-300 font-bold mb-1">
              Key Redressal Focus
            </span>
            {selectedDistrict.focus}
          </div>
          <Link
            to={submitUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition"
          >
            File Grievance for {selectedDistrict.name}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
