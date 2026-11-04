import { profileFor, LOLLIPOP_COST } from './flavors.js';
import { randInt } from './rng.js';

export const LOLLIPOP_PRICE = 1.0;

const CUSTOMER_NAMES = [
  'Maya Lopez', 'Leo Park', 'Ava Chen', 'Noah Reyes', 'Zoe Kim', 'Eli Brooks',
  'Mia Torres', 'Sam Patel', 'Ivy Nguyen', 'Max Romano', 'Ruby Hayes',
  'Theo Walsh', 'Lily Adams', 'Owen Diaz', 'Nora Bell', 'Jack Mori',
  'Emma Frost', 'Finn Olsen', 'Aria Singh', 'Cole Watts',
];

const LOVED_QUOTES = [
  'The {f} is amazing — and what a deal!',
  "Can't believe {f} is this cheap. I'm coming back tomorrow.",
  'Best {f} in town, easy. Great price too.',
  '{f}?? Incredible. Took a picture for my friends.',
];
const MIXED_QUOTES = [
  'The {f} was good. Fair price, I guess.',
  'Solid {f}. Nothing to complain about.',
  'I liked the {f}. About what I expected to pay.',
  '{f} was tasty. Decent value.',
];
const COMPLAINT_QUOTES = [
  'The {f} is good but wow, that price.',
  "Not sure {f} is worth that much, honestly.",
  'I love {f} but my allowance disagrees with this price.',
  "That's a lot for a scoop of {f}.",
];

function priceTone(price, ceiling) {
  const ratio = price / ceiling;
  if (ratio < 0.88) return 'loved';
  if (ratio <= 1.15) return 'mixed';
  return 'complaint';
}

function satisfactionFactor(tone) {
  return tone === 'loved' ? 1 : tone === 'mixed' ? 0.55 : 0.1;
}

// Simulates one full business day. Pure with respect to game state: returns
// results plus the updated buzz map and reputation gain; the caller commits.
export function simulateDay({
  regular, featured, prices, buzz, event, repTierIndex, collabFlavor,
  easyMode = false, incidentMult = 1,
}) {
  const menuAll = [...regular, ...featured].filter(Boolean);
  const profiles = Object.fromEntries(menuAll.map((f) => [f, profileFor(f)]));

  // Easy mode: ingredient costs are switched off, so profit ≈ revenue and the
  // 6-year-old can't slide into the red.
  const costMult = easyMode ? 0 : 1;

  // Easy mode also brings a slightly bigger, friendlier crowd.
  const baseCount = easyMode ? randInt(18, 26) : randInt(14, 22);
  const customerCount = Math.max(
    1,
    Math.round(
      baseCount * event.mult * incidentMult * (1 + Math.max(0, repTierIndex + 1) * 0.12),
    ),
  );

  const scoops = Object.fromEntries(menuAll.map((f) => [f, 0]));
  const flavorRevenue = Object.fromEntries(menuAll.map((f) => [f, 0]));
  let lollipops = 0;
  const reactions = [];

  for (let i = 0; i < customerCount; i++) {
    const weights = menuAll.map((f) => {
      const prof = profiles[f];
      const price = prices[f] ?? 3;
      const sensitivity = prof.exotic ? 0.8 : 1.0;
      const priceEffect = Math.max(0.05, 1 - (price - 2.5) * sensitivity * 0.18);
      const segmentBoost = event.segment && prof.segment === event.segment ? 1.45 : 1.0;
      const featuredBoost = featured.includes(f) ? 1.25 : 1.0;
      const buzzEffect = 1 + Math.min((buzz[f] || 0) * 0.45, 0.9);
      return prof.base * priceEffect * segmentBoost * featuredBoost * buzzEffect;
    });

    if (menuAll.length === 0) break;
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let chosen = menuAll[menuAll.length - 1];
    for (let j = 0; j < menuAll.length; j++) {
      roll -= weights[j];
      if (roll <= 0) { chosen = menuAll[j]; break; }
    }

    const price = prices[chosen] ?? 3;
    scoops[chosen] += 1;
    flavorRevenue[chosen] += price;
    if (Math.random() < 0.33) lollipops += 1;

    if (Math.random() < 0.28) {
      const tone = priceTone(price, profiles[chosen].ceiling);
      const pool = tone === 'loved' ? LOVED_QUOTES : tone === 'mixed' ? MIXED_QUOTES : COMPLAINT_QUOTES;
      const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
      reactions.push({
        name,
        initials: name.split(' ').map((p) => p[0]).join(''),
        tone,
        quote: pool[Math.floor(Math.random() * pool.length)].replace('{f}', chosen),
      });
    }
  }

  const scoopRevenue = Object.values(flavorRevenue).reduce((a, b) => a + b, 0);
  const lollipopRevenue = lollipops * LOLLIPOP_PRICE;
  const revenue = scoopRevenue + lollipopRevenue;

  // Ingredient cost of everything sold today. Profit is what actually banks.
  let cogs = 0;
  for (const f of menuAll) cogs += (scoops[f] || 0) * profiles[f].cost * costMult;
  cogs += lollipops * LOLLIPOP_COST * costMult;
  const profit = revenue - cogs;

  // --- buzz updates ---
  const newBuzz = { ...buzz };
  let buzzingCount = 0;
  for (const f of featured) {
    const tone = priceTone(prices[f] ?? 3, profiles[f].ceiling);
    const sat = satisfactionFactor(tone);
    let gain = (scoops[f] > 0 ? 0.12 : -0.06) + sat * 0.1 + (event.buzzBonus || 0);
    if (collabFlavor && f === collabFlavor) gain -= 0.05; // collab hype burns out faster
    newBuzz[f] = clamp01((newBuzz[f] || 0) + gain);
    if (newBuzz[f] > 0.65) buzzingCount += 1;
  }
  for (const f of regular) {
    if (newBuzz[f]) newBuzz[f] = clamp01(newBuzz[f] - 0.015);
  }

  // --- satisfaction (for reputation) ---
  let satSum = 0;
  let satN = 0;
  for (const f of menuAll) {
    if (scoops[f] === 0) continue;
    satSum += satisfactionFactor(priceTone(prices[f] ?? 3, profiles[f].ceiling)) * scoops[f];
    satN += scoops[f];
  }
  const satAvg = satN > 0 ? satSum / satN : 0.5;

  const repGain = Math.round(
    Math.min(revenue / 60, 2) * 4 + satAvg * 4 + buzzingCount * 2,
  );

  // --- summary bits ---
  let bestFlavor = null;
  for (const f of menuAll) {
    if (bestFlavor === null || scoops[f] > scoops[bestFlavor]) bestFlavor = f;
  }

  const quality =
    revenue >= 105 ? 'Great day' :
    revenue >= 60 ? 'Solid day' :
    revenue >= 35 ? 'Slow day' : 'Tough day';

  const sampleSize = Math.min(reactions.length, randInt(4, 8));
  const sampledReactions = reactions.slice(0, sampleSize);

  return {
    customerCount,
    scoops,
    flavorRevenue,
    lollipops,
    lollipopRevenue,
    revenue,
    cogs,
    profit,
    bestFlavor,
    quality,
    reactions: sampledReactions,
    newBuzz,
    repGain,
    satAvg,
  };
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export function eventRecap(event, result) {
  const expected = Math.round(18 * event.mult);
  const diff = result.customerCount - expected;
  const eventBit =
    event.type === 'great' || event.type === 'good'
      ? `"${event.title}" promised a busy day`
      : event.type === 'bad'
        ? `"${event.title}" meant a quieter day`
        : `"${event.title}" suggested an ordinary day`;
  if (Math.abs(diff) <= 3) return `${eventBit}, and that's about how it went — ${result.customerCount} customers came through.`;
  if (diff > 3) return `${eventBit}, and it turned out even busier — ${result.customerCount} customers came through.`;
  return `${eventBit}, but it ran a little lighter than expected — ${result.customerCount} customers came through.`;
}
