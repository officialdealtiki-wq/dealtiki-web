/**
 * Calculates percentage discount safely from MRP and Price,
 * or validates a reported discount percentage.
 */
export function calculateDiscount(
  price?: number,
  mrp?: number,
  reportedDiscount?: number
): number | undefined {
  if (reportedDiscount && reportedDiscount > 0 && reportedDiscount < 100) {
    return Math.round(reportedDiscount);
  }

  if (price && mrp && mrp > price && mrp > 0) {
    const discount = ((mrp - price) / mrp) * 100;
    if (discount >= 1 && discount < 100) {
      return Math.round(discount);
    }
  }

  return undefined;
}
