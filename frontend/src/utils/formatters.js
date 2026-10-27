/**
 * Category options matching SRS Section 3.2 (FR-2.1)
 */
export const COMPLAINT_CATEGORIES = [
  'Academic',
  'Hostel',
  'Harassment',
  'Infrastructure',
  'Administration & Fees',
  'Evaluation & Grading',
  'Canteen & Hygiene',
  'Other',
];

/**
 * Status enumeration mapping matching ComplaintBox.sol
 */
export const STATUS_MAP = {
  0: {
    label: 'Submitted',
    class: 'badge-submitted',
    description: 'Complaint recorded on-chain; pending authority triage.',
  },
  1: {
    label: 'Under Review',
    class: 'badge-underreview',
    description: 'Complaint is actively being investigated by the administration.',
  },
  2: {
    label: 'Resolved',
    class: 'badge-resolved',
    description: 'Remedial action taken and verified by authority.',
  },
  3: {
    label: 'Rejected',
    class: 'badge-rejected',
    description: 'Complaint closed as duplicate, unverifiable, or invalid.',
  },
};

/**
 * Converts a Unix timestamp (seconds) into a readable formatted string.
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  const num = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp);
  if (isNaN(num) || num === 0) return 'N/A';
  const date = new Date(num * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

