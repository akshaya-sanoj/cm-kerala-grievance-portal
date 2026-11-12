import { CheckCircle2, Download, Printer, ShieldCheck, X } from 'lucide-react';
import { formatDate } from '../utils/formatters.js';
import { SlaCountdownBadge } from './SlaCountdownBadge.jsx';

function buildMatrixCells(seed) {
  const size = 9;
  const cells = [];
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const inFinder =
        (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);
      if (inFinder) {
        const outer =
          r === 0 ||
          r === 2 ||
          r === size - 1 ||
          r === size - 3 ||
          c === 0 ||
          c === 2 ||
          c === size - 1 ||
          c === size - 3;
        const center =
          (r === 1 && c === 1) || (r === 1 && c === size - 2) || (r === size - 2 && c === 1);
        cells.push(outer || center);
      } else {
        const bit = ((hash >>> ((r * size + c) % 24)) ^ (r * 7 + c * 13)) & 1;
        cells.push(Boolean(bit));
      }
    }
  }
  return { size, cells };
}

export function VerificationSealModal({ grievance, onClose }) {
  if (!grievance) return null;
  const { size, cells } = buildMatrixCells(grievance.referenceId || 'KL-CMO-2026');

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
      `Tracking Link    : ${window.location.origin}/track?ref=${encodeURIComponent(
        grievance.referenceId
      )}`,
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
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-5 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shrink-0 shadow-sm">
              <svg
                viewBox={`0 0 ${size} ${size}`}
                className="w-20 h-20"
                aria-label="Reference verification matrix"
              >
                {cells.map((filled, idx) => {
                  const r = Math.floor(idx / size);
                  const c = idx % size;
                  return filled ? (
                    <rect
                      key={`${r}-${c}`}
                      x={c}
                      y={r}
                      width="0.88"
                      height="0.88"
                      rx="0.16"
                      fill="#0f172a"
                    />
                  ) : null;
                })}
              </svg>
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Verified Portal Record
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

          <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold transition"
            >
              <Download className="w-4 h-4" /> Download Receipt (.txt)
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                setTimeout(() => window.print(), 120);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              <Printer className="w-4 h-4" /> Print PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
