/**
 * Paise (Indian currency) utility functions.
 * All monetary values in the system are stored as integers in paise (₹1 = 100 paise).
 */

/**
 * Convert rupees to paise.
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees.
 */
export function toRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format paise as Indian rupee string e.g. "₹1,499.00".
 */
export function formatPaise(paise: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(paise / 100);
}

/**
 * Validate that a paise value is a non-negative integer.
 */
export function validatePaise(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}
