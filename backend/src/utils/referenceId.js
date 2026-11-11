import crypto from 'crypto';

/**
 * Generates a unique readable reference ID for a Kerala CMO grievance.
 * Format: KL-CMO-YYYY-XXXXXX (e.g., KL-CMO-2026-48291A)
 */
export function generateReferenceId() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `KL-CMO-${year}-${suffix}`;
}
