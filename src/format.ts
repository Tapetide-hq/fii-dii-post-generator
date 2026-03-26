/**
 * Format a number in Indian notation with commas (e.g., 1,06,481).
 * Handles negative numbers and adds +/- prefix.
 */
export function formatIndian(n: number): string {
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  let result: string;

  if (s.length <= 3) {
    result = s;
  } else {
    // Last 3 digits, then groups of 2
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    const pairs: string[] = [];
    for (let i = rest.length; i > 0; i -= 2) {
      pairs.unshift(rest.slice(Math.max(0, i - 2), i));
    }
    result = pairs.join(',') + ',' + last3;
  }

  return n >= 0 ? `+${result}` : `-${result}`;
}

/**
 * Format date from "2026-03-24" to "24 Mar 2026"
 */
export function formatDate(isoDate: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m, d] = isoDate.split('-');
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

/**
 * Streak description: "17 days selling" or "19 days buying"
 */
export function streakText(streak: number): string {
  if (streak === 0) return 'neutral';
  const days = Math.abs(streak);
  const dir = streak > 0 ? 'buying' : 'selling';
  return `${days} day${days !== 1 ? 's' : ''} ${dir}`;
}

/**
 * Format large numbers in Lakh Cr for readability.
 * e.g., -109834 → "-1.10 Lakh Cr", 5867 → "₹+5,867 Cr"
 * Only uses Lakh Cr for abs >= 100000 (1 lakh crore).
 */
export function formatLakhCr(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100000) {
    const lakh = abs / 100000;
    const sign = n >= 0 ? '+' : '-';
    return `${sign}₹${lakh.toFixed(2)} Lakh Cr`;
  }
  return `₹${formatIndian(n)} Cr`;
}
