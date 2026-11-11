import { useEffect, useState } from 'react';
import { Building2, Clock, Mail } from 'lucide-react';
import { api } from '../api/client.js';

export function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/departments')
      .then((res) => setDepartments(res.data?.departments || []))
      .catch(() => setError('Unable to load departments right now. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-wider text-civic-700">
          Nodal Agencies Directory
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Government Departments
        </h1>
        <p className="text-slate-600 text-base">
          Sample participating Kerala government departments connected to the CMO Grievance
          Redressal cell for investigation and action-taken reporting.
        </p>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-civic-300 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-civic-50 text-civic-800 border border-civic-200">
                    <Building2 className="w-3.5 h-3.5" />
                    {dept.code}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    SLA: {dept.slaDays} days
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">{dept.name}</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{dept.description}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <p>
                  <strong className="text-slate-700">Nodal Head:</strong> {dept.headDesignation}
                </p>
                {dept.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {dept.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {dept.contactEmail && (
                  <p className="flex items-center gap-1.5 text-slate-500 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    {dept.contactEmail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
