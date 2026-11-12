import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, CheckCircle2, Download, Link2, Printer, ShieldCheck, X } from 'lucide-react';
import { formatDate } from '../utils/formatters.js';
import { SlaCountdownBadge } from './SlaCountdownBadge.jsx';

export function VerificationSealModal({ grievance, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const trackingUrl = grievance?.referenceId
    ? `${window.location.origin}/track?ref=${encodeURIComponent(grievance.referenceId)}`
    : '';

  useEffect(() => {
    if (!trackingUrl) {
      setQrDataUrl('');
      return undefined;
    }

    let cancelled = false;
    QRCode.toDataURL(trackingUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [trackingUrl]);

  if (!grievance) return null;

  function handleDownloadReceipt() {
    const lines = [
      'CM KERALA PUBLIC GRIEVANCE PORTAL - VERIFICATION RECEIPT (PROTOTYPE)',
      '======================================================================',
      `Reference ID     : ${grievance.referenceId}`,
      `Subject          : ${grievance.subject}`,
      `Status           : ${grievance.status}`,
      `Priority         : ${grievance.priority}`,
      `District         : ${grievance.district}`,
      `Department       : ${grievance.assignedDepartment?.name || 'Pending CMO Assignment'}`,
      `Workflow Stage   : ${grievance.workflowStage}`,
      `Submitted Date   : ${formatDate(grievance.createdAt)}`,
      `Target SLA Date  : ${formatDate(grievance.dueDate)}`,
      '',
      `Action Report    : ${grievance.actionTakenReport || 'In progress'}`,
      `Tracking Link    : ${trackingUrl}`,
      '',
      'Notice: WhiteMatrix Technical Assessment Prototype — Fictional Demo Record.'
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${grievance.referenceId}-receipt.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadQrPng() {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${grievance.referenceId}-qr.png`;
    link.click();
  }

  function handleCopyUrl() {
    if (!trackingUrl) return;
    navigator.clipboard?.writeText(trackingUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  return (
    <div
      className="no-print fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="civic-gradient text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Digital Verification Card
              </p>
              <h3 className="text-base font-extrabold">{grievance.referenceId}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Close verification card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-5 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shrink-0 shadow-sm text-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR verification code for ${grievance.referenceId}`}
                  className="w-24 h-24 rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-slate-100 animate-pulse" />
              )}
              <span className="text-[9px] font-semibold text-slate-500 block mt-1">
                Scan to Verify
              </span>
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Scannable Verification QR
              </div>
              <p className="text-sm font-bold text-slate-900 line-clamp-2">{grievance.subject}</p>
              <SlaCountdownBadge dueDate={grievance.dueDate} status={grievance.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 p-3">
              <span className="text-slate-500 block">District</span>
              <span className="font-bold text-slate-900">{grievance.district}</span>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <span className="text-slate-500 block">Status</span>
              <span className="font-bold text-slate-900">{grievance.status}</span>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 col-span-2">
              <span className="text-slate-500 block">Assigned Department</span>
              <span className="font-bold text-slate-900">
                {grievance.assignedDepartment?.name || 'Pending CMO Assignment'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold transition"
            >
              <Download className="w-4 h-4" /> Receipt (.txt)
            </button>
            <button
              type="button"
              onClick={handleDownloadQrPng}
              disabled={!qrDataUrl}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 border border-indigo-200 text-xs font-bold transition"
            >
              <Download className="w-4 h-4" /> Save QR
            </button>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" /> Copy Link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(() => window.print(), 120);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              <Printer className="w-4 h-4" /> Print PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
