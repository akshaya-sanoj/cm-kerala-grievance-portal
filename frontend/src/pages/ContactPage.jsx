import { useState } from 'react';
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.post('/contact', form);
      setSuccessMsg(res.data?.message || 'Your enquiry has been saved.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-civic-700">
              Helpdesk & General Enquiries
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Contact Us</h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Have questions about submitting or tracking a grievance? Send an enquiry below. All
              enquiries are persisted in the database for CMO helpdesk review.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-civic-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Prototype Grievance Cell (Demo)</p>
                <p className="text-slate-600 text-xs">
                  Secretariat Demo Wing, Thiruvananthapuram, Kerala 695001
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-civic-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Helpdesk Email (Sample)</p>
                <p className="text-slate-600 text-xs">helpdesk@demo.kerala-portal.example</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-civic-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Toll-Free Demo Helpline</p>
                <p className="text-slate-600 text-xs">1800-000-0000 (Prototype Sample Only)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Send an Enquiry</h2>

            {successMsg && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-civic-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-civic-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief subject of your enquiry"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-civic-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write your question or feedback..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-civic-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-civic-700 hover:bg-civic-800 disabled:opacity-60 text-white font-semibold text-sm transition"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Enquiry'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
