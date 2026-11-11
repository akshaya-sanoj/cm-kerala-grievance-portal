export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getRoleLabel(role) {
  switch (role) {
    case 'cmo_admin':
      return 'CMO Administrator';
    case 'department_officer':
      return 'Department Officer';
    case 'citizen':
      return 'Citizen';
    default:
      return role || 'User';
  }
}

export function getDashboardPathForRole(role) {
  switch (role) {
    case 'cmo_admin':
      return '/cmo/dashboard';
    case 'department_officer':
      return '/officer/dashboard';
    case 'citizen':
      return '/citizen/dashboard';
    default:
      return '/';
  }
}
