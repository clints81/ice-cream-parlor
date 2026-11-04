export const PRICING_DAYS = [1, 8, 15, 22, 29];

export function isPricingDay(day) {
  return PRICING_DAYS.includes(day);
}

export function nextPricingDay(afterDay) {
  for (const d of PRICING_DAYS) {
    if (d > afterDay) return d;
  }
  return null;
}
