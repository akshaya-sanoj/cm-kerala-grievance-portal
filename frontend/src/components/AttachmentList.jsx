import { useState } from 'react';
import { Download, Eye, Paperclip, X } from 'lucide-react';
import { api, downloadAttachmentFile } from '../api/client.js';
import { formatFileSize } from '../utils/formatters.js';

export function AttachmentList({ attachments = [] }) {
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  if (!attachments.length) return null;

  function canPreview(mimeType = '') {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  }

  async function handlePreview(att) {
    setPreviewLoading(true);
    try {
      const response = await api.get(`/attachments/${att._id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: att.mimeType })
      );
      setPreview({
        url,
        name: att.originalName,
        mimeType: att.mimeType
      });
    } catch {
      await downloadAttachmentFile(att._id, att.originalName);
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    if (preview?.url) {
      window.URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  }

  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
        Attachments ({attachments.length})
      </h2>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att) => (
          <div
            key={att._id}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
          >
            <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="max-w-[200px] truncate">{att.originalName}</span>
            <span className="text-slate-400">
              ({att.attachmentType === 'action_taken_report' ? 'ATR' : 'Citizen'} •{' '}
              {formatFileSize(att.sizeBytes)})
            </span>
            {canPreview(att.mimeType) && (
              <button
                type="button"
                disabled={previewLoading}
                onClick={() => handlePreview(att)}
                title="Preview attachment"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-indigo-400 text-indigo-600 font-semibold"
              >
                <Eye className="w-3 h-3" /> Preview
              </button>
            )}
            <button
              type="button"
              onClick={() => downloadAttachmentFile(att._id, att.originalName)}
              title="Download attachment"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-slate-400 text-slate-700"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="animate-scale-in bg-white rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-slate-900 truncate">{preview.name}</p>
              <button
                type="button"
                onClick={closePreview}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100">
              {preview.mimeType.startsWith('image/') ? (
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="max-h-[72vh] rounded-lg shadow"
                />
              ) : (
                <iframe
                  src={preview.url}
                  title={preview.name}
                  className="w-full h-[72vh] rounded-lg border border-slate-200 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
