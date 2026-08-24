/**
 * Format numerical or string price to Indian Currency (₹)
 * Never returns ₹0 or NaN if value is invalid/missing.
 */
export function formatPrice(value: number | string | undefined | null): string | null {
  if (value === undefined || value === null || value === "") return null;

  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;

  if (isNaN(num) || num <= 0) {
    return null;
  }

  // Format in Indian number system (lakhs, crores)
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format relative freshness time (e.g., "4 min ago", "2 hr ago", "Today")
 */
export function formatFreshness(timestampStr?: string): string {
  if (!timestampStr) return "Fresh";

  try {
    const time = new Date(timestampStr).getTime();
    if (isNaN(time)) return "Fresh";

    const diffSec = Math.floor((Date.now() - time) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return "Yesterday";
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return "Fresh";
  }
}

/**
 * Format expiration date safely (e.g. "Ends 31 Aug" or "Expiring Soon")
 */
export function formatExpiry(dateStr?: string): { text: string; isExpired: boolean; isSoon: boolean } | null {
  if (!dateStr) return null;

  try {
    const expiry = new Date(dateStr).getTime();
    if (isNaN(expiry)) return null;

    const diff = expiry - Date.now();
    if (diff <= 0) {
      return { text: "Expired", isExpired: true, isSoon: false };
    }

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 2) {
      return { text: days <= 1 ? "Ends today" : "Ends in 2 days", isExpired: false, isSoon: true };
    }

    const formatted = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
    }).format(new Date(dateStr));

    return { text: `Ends ${formatted}`, isExpired: false, isSoon: false };
  } catch {
    return null;
  }
}
