// One business day, simulated customer by customer. Pure: it takes the
// day's inputs plus a seeded random function and returns what happened,
// including a per-customer log that the animated day replays.

import { randInt } from './rng.js';
import { LOLLIPOP_PRICE, LOLLIPOP_COST } from './flavors.js';

const FIRST = ['Maya', 'Leo', 'Ava', 'Noah', 'Zoe', 'Eli', 'Mia', 'Sam', 'Ivy', 'Max',
  'Ruby', 'Theo', 'Lily', 'Owen', 'Nora', 'Jack', 'Emma', 'Finn', 'Aria', 'Cole',
  'Rosa', 'Kai', 'Jade', 'Omar', 'Lena', 'Hugo', 'Tess', 'Ravi', 'Gus', 'Pia'];

const QUOTES = {
  loved: [
    'The {f} is amazing, and what a deal!',
    "Can't believe {f} is this cheap. Coming back tomorrow!",
    'Best {f} in town, easy.',
    'Mmm, {f}! Great price too.',
  ],
  lovedExotic: [
    '{f}?? Incredible. Taking a picture for my friends!',
    "I've never tasted anything like {f}!",
    'Okay, {f} is my new favorite thing.',
    'Weird... but SO good. {f} forever!',
  ],
  mixed: [
    'The {f} was good. Fair price.',
    'Solid {f}. No complaints.',
    'I liked the {f}.',
    '{f} was tasty.',
  ],
  grumble: [
    'The {f} is good, but wow, that price.',
    'Not sure {f} is worth that much.',
    'My allowance does not like this price.',
    "That's a lot for one scoop of {f}.",
  ],
  walked: [
    '{p} for {f}? No thanks.',
    "Too expensive for me. I'll skip it.",
    "Hmm, {p}? Maybe somewhere else.",
  ],
  nothing: [
    "Nothing on the menu for me today.",
    "Hmm, I don't really like any of these.",
    'Do you have anything less... unusual?',
  ],
  flop: [
    'Hmm. The {f} tastes a little funny.',
    "I don't think {f} is for me.",
  ],
  fan: [
    "I come here just for the {f}!",
    'My usual {f}, please!',
    'Back again for {f}. I told everyone about it.',
  ],
  deal: [
    'Best prices on the block!',
    'Cheap and tasty. My favorite kind of shop.',
  ],
};

function quote(kind, rand, f, p) {
  const pool = QUOTES[kind];
  return pool[Math.floor(rand() * pool.length)]
    .replace('{f}', f || 'ice cream')
    .replace('{p}', p != null ? `$${p.toFixed(2)}` : '');
}

function priceTone(price, ceiling) {
  const r = price / ceiling;
  if (r < 0.88) return 'loved';
  if (r <= 1.12) return 'mixed';
  return 'grumble';
}

const HAPPY = { loved: 1, mixed: 0.65, grumble: 0.25, flop: 0.3, walked: 0, nothing: 0.1 };

export function averagePrice(menuAll, prices) {
  if (menuAll.length === 0) return 0;
  return menuAll.reduce((s, f) => s + (prices[f] ?? 3), 0) / menuAll.length;
}

export function simulateDay(input, rand, T) {
  const {
    regular, featured, prices, profiles, mods = {}, buzz = {}, fans = {},
    dealFans = 0, fame = 0, event, crowdMult = 1,
  } = input;
  const menuAll = [...regular, ...featured].filter(Boolean);
  const avgPrice = averagePrice(menuAll, prices);

  // ---- who shows up --------------------------------------------------------
  const valueMult = Math.max(
    T.valueMin,
    Math.min(T.valueMax, Math.pow(T.refPrice / Math.max(0.5, avgPrice), T.valueExp)),
  );
  const fameMult = 1 + (fame / 100) * T.fameCrowd;
  const walkIns = Math.max(
    1,
    Math.round(randInt(T.walkInMin, T.walkInMax, rand) * event.mult * crowdMult * valueMult * fameMult),
  );

  const mix = { ...T.segmentMix };
  if (event.segment) {
    for (const k of Object.keys(mix)) mix[k] *= 1 - T.segmentEventShift;
    mix[event.segment] += T.segmentEventShift;
  }
  const drawSegment = () => {
    const r = rand();
    if (r < mix.kids) return 'kids';
    if (r < mix.kids + mix.everyone) return 'everyone';
    return 'adventurous';
  };

  const queue = [];
  for (let i = 0; i < walkIns; i++) queue.push({ kind: 'walkin', seg: drawSegment() });

  // Loyal fans are less bothered by weather.
  const weatherSoft = Math.pow(event.mult, 0.3);
  for (const [f, n] of Object.entries(fans)) {
    if (!menuAll.includes(f) || n <= 0) continue;
    const expected = n * T.fanVisitRate * weatherSoft * Math.min(1.3, crowdMult);
    const count = Math.floor(expected) + (rand() < expected % 1 ? 1 : 0);
    for (let i = 0; i < count; i++) queue.push({ kind: 'fan', seg: 'adventurous', fanOf: f });
  }
  const dealAppeal = Math.max(0, Math.min(1, (T.dealPrice - avgPrice) / 0.9));
  const dealExpected = dealFans * T.dealVisitRate * Math.pow(event.mult, 0.6) * (0.3 + 0.7 * dealAppeal);
  const dealCount = Math.floor(dealExpected) + (rand() < dealExpected % 1 ? 1 : 0);
  for (let i = 0; i < dealCount; i++) queue.push({ kind: 'deal', seg: drawSegment() });

  // Shuffle arrival order so fans and walk-ins mix in the animation.
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  // ---- serve them ----------------------------------------------------------
  const zero = () => Object.fromEntries(menuAll.map((f) => [f, 0]));
  const scoops = zero();
  const flavorRevenue = zero();
  const flavorCost = zero();
  const flavorHappy = zero();
  const flavorLoved = zero();
  let lollipops = 0;
  const tally = { loved: 0, mixed: 0, grumble: 0, flop: 0, walked: 0, nothing: 0 };
  let happySum = 0;
  let happyStd = 0;
  let happyExotic = 0;
  const log = [];

  for (const cust of queue) {
    const name = FIRST[Math.floor(rand() * FIRST.length)];
    const entry = { kind: cust.kind, seg: cust.seg, name, look: Math.floor(rand() * 1e6) };
    if (menuAll.length === 0) {
      entry.outcome = 'nothing';
      tally.nothing++;
      log.push(entry);
      continue;
    }

    const weights = menuAll.map((f) => {
      const prof = profiles[f];
      const price = prices[f] ?? 3;
      let sens = prof.exotic ? 0.8 : 1.0;
      if (cust.kind === 'deal') sens *= 2;
      const priceEffect = Math.max(0.05, 1 - (price - 2.5) * sens * 0.18);
      const aff = T.affinity[cust.seg][prof.segment];
      const featuredBoost = featured.includes(f) ? 1.25 : 1.0;
      const buzzEffect = 1 + Math.min((buzz[f] || 0) * 0.45, 0.9);
      const mod = mods[f]?.demandMult ?? 1;
      const fanBoost = cust.fanOf === f ? 6 : 1;
      return prof.base * priceEffect * aff * featuredBoost * buzzEffect * mod * fanBoost;
    });

    // Some customers don't find anything that appeals to them.
    const best = Math.max(...weights);
    const buyChance = cust.kind === 'walkin' ? Math.max(0.12, Math.min(1, best / T.appealToBuy)) : 1;
    if (rand() > buyChance) {
      entry.outcome = 'nothing';
      tally.nothing++;
      happySum += HAPPY.nothing;
      log.push(entry);
      continue;
    }

    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rand() * total;
    let chosen = menuAll[menuAll.length - 1];
    for (let j = 0; j < menuAll.length; j++) {
      roll -= weights[j];
      if (roll <= 0) { chosen = menuAll[j]; break; }
    }
    const prof = profiles[chosen];
    const price = prices[chosen] ?? 3;
    entry.flavor = chosen;
    entry.price = price;

    // Price too high for this customer? They might walk away.
    const tolerance = cust.kind === 'fan' ? T.fanTolerance : cust.kind === 'deal' ? T.dealTolerance : 1;
    const limit = prof.ceiling * tolerance;
    if (price > limit) {
      const pWalk = Math.min(T.walkAwayMax, (price / limit - 1) * T.walkAwaySlope);
      if (rand() < pWalk) {
        entry.outcome = 'walked';
        tally.walked++;
        log.push(entry);
        continue;
      }
    }

    entry.outcome = 'bought';
    scoops[chosen] += 1;
    flavorRevenue[chosen] += price;
    flavorCost[chosen] += prof.cost + (mods[chosen]?.surge || 0);

    let tone = priceTone(price, prof.ceiling * (cust.kind === 'fan' ? T.fanTolerance : 1));
    if (mods[chosen]?.flop && rand() < 0.5) tone = 'flop';
    entry.tone = tone;
    tally[tone]++;
    const h = HAPPY[tone];
    happySum += h;
    flavorHappy[chosen] += h;
    if (tone === 'loved' || tone === 'mixed') {
      // Regulars don't spread the word as much as first-timers do.
      const w = cust.kind === 'fan' ? T.fanFameWeight : 1;
      if (prof.exotic) happyExotic += h * w;
      else happyStd += h * w;
    }
    if (tone === 'loved') flavorLoved[chosen] += 1;

    const lollyRate = cust.seg === 'kids' ? T.lollipopKidRate : T.lollipopRate;
    if (rand() < lollyRate) {
      lollipops += 1;
      entry.lolly = true;
    }
    log.push(entry);
  }

  // ---- speech bubbles -------------------------------------------------------
  for (const e of log) {
    let kind;
    if (e.outcome === 'nothing') kind = 'nothing';
    else if (e.outcome === 'walked') kind = 'walked';
    else if (e.tone === 'flop') kind = 'flop';
    else if (e.kind === 'fan' && rand() < 0.5) kind = 'fan';
    else if (e.kind === 'deal' && e.tone === 'loved' && rand() < 0.4) kind = 'deal';
    else if (e.tone === 'loved' && profiles[e.flavor]?.exotic) kind = 'lovedExotic';
    else kind = e.tone;
    e.quoteKind = kind;
    e.quote = quote(kind, rand, e.flavor, e.price);
  }

  // ---- money -----------------------------------------------------------------
  const scoopRevenue = Object.values(flavorRevenue).reduce((a, b) => a + b, 0);
  const lollipopRevenue = lollipops * LOLLIPOP_PRICE;
  const scoopCost = Object.values(flavorCost).reduce((a, b) => a + b, 0);
  const lollipopCost = lollipops * LOLLIPOP_COST;
  const served = Object.values(scoops).reduce((a, b) => a + b, 0);

  // ---- fans & deal hunters for tomorrow ------------------------------------
  const newFans = { ...fans };
  for (const f of Object.keys(newFans)) {
    const decay = menuAll.includes(f) ? T.fanDecayOn : T.fanDecayOff;
    newFans[f] = newFans[f] * (1 - decay);
    if (newFans[f] < 0.2) delete newFans[f];
  }
  for (const f of menuAll) {
    const prof = profiles[f];
    const mult = prof.exotic ? T.exoticFanGainMult : T.standardFanGainMult;
    const loved = flavorLoved[f];
    const mixedish = Math.max(0, flavorHappy[f] - loved);
    // There are only so many adventurous people in town: new fans get harder
    // to win as your fan club fills up.
    const totalFans = Object.values(newFans).reduce((a, b) => a + b, 0);
    const room = Math.max(0, 1 - totalFans / T.fanCapTotal);
    const gain = (loved * T.fanGainLoved + mixedish * T.fanGainMixed) * mult * room;
    if (gain > 0) newFans[f] = Math.min(T.fanCap, (newFans[f] || 0) + gain);
  }

  const happyBuyers = tally.loved + tally.mixed;
  const priceRiseLoss = 1 - dealAppeal; // prices went up → deal hunters drift off
  let newDealFans = dealFans * (1 - T.dealDecay - 0.35 * priceRiseLoss) + happyBuyers * T.dealGain * dealAppeal;
  newDealFans = Math.max(0, Math.min(T.dealCap, newDealFans));

  // ---- fame from customers -------------------------------------------------
  const fameFromCustomers =
    Math.sqrt(happyStd) * T.fameHappyStd +
    happyExotic * T.fameHappyExotic +
    tally.grumble * T.fameGrumble +
    tally.walked * T.fameWalkAway;

  const customers = queue.length;
  return {
    customers,
    walkIns,
    fanVisits: queue.filter((q) => q.kind === 'fan').length,
    dealVisits: dealCount,
    served,
    tally,
    happiness: customers > 0 ? happySum / customers : 0,
    avgPrice,
    scoops,
    flavorRevenue,
    flavorCost,
    lollipops,
    lollipopRevenue,
    lollipopCost,
    scoopRevenue,
    scoopCost,
    log,
    newFans,
    newDealFans,
    fameFromCustomers,
  };
}
