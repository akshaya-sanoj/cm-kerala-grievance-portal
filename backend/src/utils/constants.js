export const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod'
];

export const GRIEVANCE_CATEGORIES = [
  'Public Infrastructure',
  'Healthcare',
  'Education',
  'Electricity & Power',
  'Water Supply & Drainage',
  'Civic Services & Sanitation',
  'Revenue & Land Records',
  'Transport & Road Safety',
  'Public Welfare & Ration',
  'Other'
];

export const GRIEVANCE_STATUSES = [
  'Submitted',
  'Under Review',
  'In Progress',
  'Resolved',
  'Reopened'
];

export const GRIEVANCE_PRIORITIES = ['Low', 'Medium', 'High'];

export const USER_ROLES = {
  CITIZEN: 'citizen',
  CMO_ADMIN: 'cmo_admin',
  DEPARTMENT_OFFICER: 'department_officer'
};

export const PRIORITY_SLA_DAYS = {
  High: 3,
  Medium: 7,
  Low: 14
};

export const CATEGORY_TO_DEPARTMENT_CODE = {
  'Public Infrastructure': 'PWD',
  Healthcare: 'HEALTH',
  Education: 'EDU',
  'Electricity & Power': 'KSEB',
  'Water Supply & Drainage': 'KWA',
  'Civic Services & Sanitation': 'LSGD',
  'Revenue & Land Records': 'REVENUE',
  'Transport & Road Safety': 'TRANSPORT',
  'Public Welfare & Ration': 'LSGD',
  Other: 'LSGD'
};

export function computeDueDate(priority = 'Medium', fromDate = new Date()) {
  const days = PRIORITY_SLA_DAYS[priority] ?? 7;
  const due = new Date(fromDate);
  due.setDate(due.getDate() + days);
  return due;
}
