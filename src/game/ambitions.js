// Season ambitions: the goal the player picks for a season. Each one reports
// progress (0..1+) from the season stats, and a friendly grade at the end.
// Targets come from the headless simulation (scripts/simulate.mjs).

import { FAME_TIERS, tierName } from './fame.js';
import { avgPricePaid, avgHappiness, topFlavor } from './engine.js';

export const TARGETS = {
  weirdScoops: 220,
  weirdDays: 15,
  crowdCustomers: 900,
  crowdHappy: 0.7,
  dealPrice: 2.75,
  dealProfit: 1,
};

const pct = (x) => `${Math.round(x * 100)}%`;

export const AMBITIONS = {
  weird: {
    name: 'The Weird Shop',
    emoji: '🌀',
    blurb: 'Sell lots of weird and spicy scoops, and keep 3 or more of them on the menu.',
    helper: 'Sell lots of weird and spicy ice cream.',
    progress(stats) {
      const a = stats.exoticScoops / TARGETS.weirdScoops;
      const b = stats.daysWith3Exotic / TARGETS.weirdDays;
      return {
        pct: Math.min(a, b),
        parts: [
          { label: 'weird scoops', value: stats.exoticScoops, target: TARGETS.weirdScoops, pct: a },
          { label: 'days with 3+ weird flavors', value: stats.daysWith3Exotic, target: TARGETS.weirdDays, pct: b },
        ],
      };
    },
  },
  crowd: {
    name: 'The Crowd-Pleaser',
    emoji: '😄',
    blurb: `Serve ${TARGETS.crowdCustomers} customers and keep most of them smiling.`,
    helper: 'Lots of happy customers.',
    progress(stats) {
      const a = stats.served / TARGETS.crowdCustomers;
      const h = avgHappiness(stats);
      const b = stats.customers > 0 ? h / TARGETS.crowdHappy : 0;
      return {
        pct: Math.min(a, b),
        parts: [
          { label: 'scoops served', value: stats.served, target: TARGETS.crowdCustomers, pct: a },
          { label: 'smiles', value: pct(h), target: pct(TARGETS.crowdHappy), pct: b },
        ],
      };
    },
  },
  deal: {
    name: 'Best Deal in Town',
    emoji: '🏷️',
    blurb: `Keep the average scoop at $${TARGETS.dealPrice.toFixed(2)} or less and still make money.`,
    helper: 'Low prices, and still make money.',
    progress(stats, season, T) {
      const avg = avgPricePaid(stats);
      const profit = season.cash - T.startCash;
      const priceOk = stats.served === 0 || avg <= TARGETS.dealPrice
        ? 1
        : Math.max(0, 1 - (avg - TARGETS.dealPrice));
      const profitOk = profit > 0 ? 1 : Math.max(0, 1 + profit / 100) * 0.95;
      return {
        pct: Math.min(priceOk, profitOk),
        parts: [
          { label: 'average scoop price', value: `$${avg.toFixed(2)}`, target: `$${TARGETS.dealPrice.toFixed(2)} or less`, pct: priceOk },
          { label: 'money made', value: `${profit >= 0 ? '' : '−'}$${Math.abs(Math.round(profit))}`, target: 'more than $0', pct: profitOk },
        ],
      };
    },
  },
  bigtime: {
    name: 'Big Time',
    emoji: '⭐',
    blurb: 'Get famous! Reach a PokéTuber fame level.',
    helper: 'Get famous!',
    tierChoices: [3, 4, 5],
    progress(stats, season) {
      const goal = season.ambition.tier ?? 4;
      const target = FAME_TIERS[goal].at;
      const best = Math.max(season.tierMax, 0);
      const reached = best >= goal;
      return {
        pct: reached ? 1 : Math.min(0.99, season.fame / target),
        parts: [
          { label: `reach "${tierName(goal)}"`, value: tierName(best), target: tierName(goal), pct: reached ? 1 : season.fame / target },
        ],
      };
    },
  },
  custom: {
    name: 'My Own Goal',
    emoji: '✏️',
    blurb: 'Name your own goal and pick what to count.',
    helper: 'Make up your own goal.',
    progress(stats, season, T) {
      const c = season.ambition.custom || { metric: 'cash', target: 300 };
      const m = CUSTOM_METRICS[c.metric];
      const v = m.value(stats, season, T);
      return {
        pct: v / c.target,
        parts: [{ label: m.label, value: m.format(v), target: m.format(c.target), pct: v / c.target }],
      };
    },
  },
};

export const CUSTOM_METRICS = {
  cash: {
    label: 'money in the bank', targets: [200, 350, 500],
    value: (s, season) => season.cash, format: (v) => `$${Math.round(v)}`,
  },
  served: {
    label: 'scoops served', targets: [600, 900, 1200],
    value: (s) => s.served, format: (v) => `${Math.round(v)}`,
  },
  fame: {
    label: 'fame', targets: [30, 50, 70],
    value: (s, season) => Math.max(season.fame, 0), format: (v) => `${Math.round(v)}`,
  },
  weird: {
    label: 'weird scoops', targets: [100, 200, 300],
    value: (s) => s.exoticScoops, format: (v) => `${Math.round(v)}`,
  },
  fans: {
    label: 'visits from loyal fans', targets: [60, 150, 250],
    value: (s) => s.fanVisits, format: (v) => `${Math.round(v)}`,
  },
  bestDay: {
    label: 'best single day', targets: [25, 40, 60],
    value: (s) => s.bestDay?.profit ?? 0, format: (v) => `$${Math.round(v)}`,
  },
};

export function ambitionTitle(ambition) {
  if (!ambition) return '';
  if (ambition.id === 'custom') return ambition.custom?.name || 'My Own Goal';
  if (ambition.id === 'bigtime') return `Big Time: ${tierName(ambition.tier ?? 4)}`;
  return AMBITIONS[ambition.id].name;
}

export function ambitionProgress(season, T) {
  const def = AMBITIONS[season.ambition?.id];
  if (!def) return null;
  return def.progress(season.stats, season, T);
}

export function gradeFor(pctDone) {
  if (pctDone >= 1) return { id: 'nailed', label: 'Nailed it!', emoji: '🏆' };
  if (pctDone >= 0.7) return { id: 'close', label: 'Close!', emoji: '👏' };
  return { id: 'notyet', label: 'Not yet', emoji: '🌱' };
}

// A few friendly lines about what happened and which choices mattered.
export function reportLines(season, T) {
  const s = season.stats;
  const lines = [];
  const profit = season.cash - T.startCash;
  const avg = avgPricePaid(s);
  const happy = avgHappiness(s);
  const top = topFlavor(s.scoops);

  if (profit > 0) lines.push(`You turned $${T.startCash} into $${Math.round(season.cash).toLocaleString('en-US')}.`);
  else lines.push(`You started with $${T.startCash} and ended with $${Math.round(season.cash)}. Costs ate up the money this time.`);

  if (avg > 0) {
    if (avg <= 2.6) lines.push(`Your scoops averaged $${avg.toFixed(2)}, cheaper than most shops. Lots of people came for the deals.`);
    else if (avg >= 4) lines.push(`Your scoops averaged $${avg.toFixed(2)}. Each one earned a lot, but some customers walked away.`);
    else lines.push(`Your scoops averaged $${avg.toFixed(2)}.`);
  }
  if (s.walked >= 25) lines.push(`${s.walked} customers left without buying because the price was too high.`);
  if (s.fanVisits >= 40) lines.push(`Loyal fans visited ${s.fanVisits} times. They kept coming even on gray days.`);
  if (s.dealVisits >= 40) lines.push(`Deal hunters came back ${s.dealVisits} times for your low prices.`);
  if (happy >= 0.75) lines.push(`Customers were happy ${Math.round(happy * 100)}% of the time.`);
  if (top) lines.push(`${top} was the star: ${s.scoops[top]} scoops.`);
  const b = s.batches;
  if (b.hit + b.flop > 0) {
    lines.push(`New specials: ${b.hit} took off, ${b.fine} did fine, ${b.flop} flopped.`);
  }
  const r = s.rumors;
  if (r.allInWon + r.allInLost > 0) {
    lines.push(`Big bets on rumors: ${r.allInWon} paid off, ${r.allInLost} didn't happen.`);
  }
  if (s.badDays >= 9) lines.push(`It was a rough-weather season: ${s.badDays} slow or rainy days.`);
  return lines.slice(0, 6);
}
