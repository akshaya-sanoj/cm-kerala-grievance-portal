import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  timeout: 25000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kerala_portal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) {
    const details = error.response.data.errors;
    if (Array.isArray(details) && details.length > 0) {
      return `${error.response.data.message} (${details.map((d) => d.message).join('; ')})`;
    }
    return error.response.data.message;
  }
  return error?.message || fallback;
}

export async function downloadAttachmentFile(attachmentId, originalName) {
  const response = await api.get(`/attachments/${attachmentId}/download`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', originalName || 'attachment');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
