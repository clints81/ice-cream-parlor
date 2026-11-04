// The season engine. Pure functions over plain data so the React UI and the
// headless simulation script (scripts/simulate.mjs) run exactly the same game.
//
//   createSeason → [plan: setMenu / setPrices / chooseRumor / chooseShock]
//     → runDay (phase "watch") → finishWatching (phase "report")
//     → advanceDay (next "plan", or phase "over" after day 30)
//
// ctx = { vault, mode, dailyPricing, T }  (T = tuning numbers)

import { makeRng, randInt, pick } from './rng.js';
import { profileFor, defaultPrice } from './flavors.js';
import {
  buildSchedule, eventFor, RUMORS, INCIDENTS, rollIncident, SEASON_LENGTH,
} from './events.js';
import {
  tierFor, milestoneText, CHANNEL_NAMES, COLLAB_FLAVOR_IDEAS, COLLAB_TIER,
} from './fame.js';
import { simulateDay, averagePrice } from './simulate.js';
import { TUNING } from './tuning.js';

export { SEASON_LENGTH };
export const PRICING_DAYS = [1, 8, 15, 22, 29];
export const MENU_REGULAR = 5;
export const MENU_FEATURED = 2;

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const round2 = (x) => Math.round(x * 100) / 100;

// ---- flavor lookups -------------------------------------------------------

export function collabProfile() {
  return { taste: 'sweet', segment: 'everyone', base: 0.8, ceiling: 4.5, cost: 1.2, exotic: false };
}

export function profilesFor(season, vault) {
  const out = {};
  for (const v of vault) out[v.name] = profileFor(v.name, v.taste);
  if (season?.collab) out[season.collab.flavor] = collabProfile();
  return out;
}

export function availableFlavors(season, vault) {
  const names = vault.map((v) => v.name);
  if (season.collab) names.push(season.collab.flavor);
  return names;
}

export function isLockedOut(season, flavor) {
  const s = season.shock;
  return !!(s && s.choice === 'swap' && s.flavor === flavor && season.day <= s.endDay);
}

// ---- creating a season ----------------------------------------------------

export function createSeason({ number, seed, vault, ambition, prices = {}, T = TUNING }) {
  const schedule = buildSchedule(seed);
  const rand = makeRng(seed, 'setup');
  const profs = Object.fromEntries(vault.map((v) => [v.name, profileFor(v.name, v.taste)]));
  const startPrices = {};
  for (const v of vault) startPrices[v.name] = prices[v.name] ?? defaultPrice(profs[v.name]);
  const standard = vault.filter((v) => !profs[v.name].exotic).map((v) => v.name);
  const exotic = vault.filter((v) => profs[v.name].exotic).map((v) => v.name);
  const regular = [...standard, ...exotic].slice(0, MENU_REGULAR);
  return {
    number,
    seed,
    ambition,
    schedule,
    day: 1,
    phase: 'plan',
    cash: T.startCash,
    fame: 0,
    tierMax: 0,
    menu: { regular, featured: [] },
    prices: startPrices,
    priced: Object.fromEntries(regular.map((f) => [f, true])),
    buzz: {},
    fans: {},
    dealFans: 0,
    launched: {}, // flavor → { day, outcome, revealed, until }
    featuredSince: {},
    menuKey: null,
    menuSameDays: 0,
    rumorChoices: {},
    incident: null,
    dip: null,
    shock: null,
    collab: null,
    collabPending: null,
    collabDone: false,
    inventionDay: randInt(9, 18, rand),
    inventionDone: false,
    morningCards: [],
    history: [],
    stats: {
      customers: 0, served: 0, walked: 0, nothing: 0, happySum: 0,
      scoopRevenue: 0, exoticScoops: 0, daysWith3Exotic: 0, scoops: {},
      flavorProfit: {}, fanVisits: 0, dealVisits: 0, badDays: 0,
      batches: { hit: 0, fine: 0, flop: 0 },
      rumors: { allInWon: 0, allInLost: 0, safeMissed: 0, safeDodged: 0 },
      shocks: { pay: 0, swap: 0 },
      bestDay: null, worstDay: null, priceDays: 0, menuPriceSum: 0,
    },
    lastDay: null,
  };
}

// ---- what the player sees in the morning ------------------------------------

export function todayEntry(season) {
  return season.schedule.days[season.day - 1];
}

export function forecastFor(season, day = season.day) {
  const e = season.schedule.days[day - 1];
  return { event: eventFor(e.forecast), confidence: e.confidence };
}

// Rumors visible today: announced on or before today, for today or later.
export function visibleRumors(season) {
  const out = [];
  for (const e of season.schedule.days) {
    if (!e.rumor) continue;
    if (e.rumor.announce <= season.day && e.day >= season.day) {
      const def = RUMORS[e.rumor.type];
      out.push({
        day: e.day,
        type: e.rumor.type,
        odds: e.rumor.odds,
        def,
        choice: season.rumorChoices[e.day] || null,
      });
    }
  }
  return out;
}

export function isPricingDay(day) {
  return PRICING_DAYS.includes(day);
}

export function nextPricingDay(day) {
  return PRICING_DAYS.find((d) => d > day) ?? null;
}

export function canPrice(season, flavor, ctx) {
  if (ctx.dailyPricing) return true;
  if (isPricingDay(season.day)) return true;
  return !season.priced[flavor];
}

// New specials need a test batch the first time they are featured.
export function pendingBatches(season, ctx) {
  const profs = profilesFor(season, ctx.vault);
  return season.menu.featured
    .filter((f) => !season.launched[f] && !(season.collab && season.collab.flavor === f))
    .map((f) => ({
      flavor: f,
      cost: profs[f]?.exotic ? ctx.T.batchCostExotic : ctx.T.batchCostStd,
      exotic: !!profs[f]?.exotic,
    }));
}

export function needsDecision(season) {
  if (season.shock && !season.shock.choice) return 'shock';
  return null;
}

// ---- plan-phase actions ----------------------------------------------------

export function setMenu(season, menu) {
  const regular = menu.regular.filter((f) => !isLockedOut(season, f)).slice(0, MENU_REGULAR);
  const featured = menu.featured.filter((f) => !isLockedOut(season, f)).slice(0, MENU_FEATURED);
  return { ...season, menu: { regular, featured } };
}

export function setPrices(season, prices) {
  return { ...season, prices: { ...season.prices, ...prices } };
}

export function chooseRumor(season, day, choice) {
  return { ...season, rumorChoices: { ...season.rumorChoices, [day]: choice } };
}

export function chooseShock(season, choice) {
  if (!season.shock) return season;
  const shock = { ...season.shock, choice };
  const stats = season.shock.choice
    ? season.stats
    : { ...season.stats, shocks: { ...season.stats.shocks, [choice]: season.stats.shocks[choice] + 1 } };
  let menu = season.menu;
  if (choice === 'swap') {
    menu = {
      regular: menu.regular.filter((f) => f !== shock.flavor),
      featured: menu.featured.filter((f) => f !== shock.flavor),
    };
  }
  return { ...season, shock, menu, stats };
}

export function markInventionDone(season, newFlavor, profile) {
  const prices = newFlavor
    ? { ...season.prices, [newFlavor]: defaultPrice(profile) }
    : season.prices;
  return { ...season, inventionDone: true, prices };
}

// ---- running a day ---------------------------------------------------------

export function runDay(season, ctx) {
  const T = ctx.T;
  const entry = todayEntry(season);
  const event = eventFor(entry.actual);
  const rand = makeRng(season.seed, 'day', season.day);
  const profs = profilesFor(season, ctx.vault);
  const { regular, featured } = season.menu;
  const menuAll = [...regular, ...featured];

  const costs = []; // extra cost lines for today
  const notes = []; // story bits for the report
  let fameDelta = T.fameDrift;
  const fameParts = { drift: T.fameDrift };
  // The more famous you are, the harder it is to get more famous.
  const damp = Math.max(0.15, 1 - season.fame / T.fameGainDamp);
  const addFame = (key, raw) => {
    if (!raw) return;
    const v = raw > 0 ? raw * damp : raw;
    fameDelta += v;
    fameParts[key] = round2((fameParts[key] || 0) + v);
  };

  // Crowd modifiers
  let crowdMult = 1;
  if (season.incident?.effect?.crowdMult) crowdMult *= season.incident.effect.crowdMult;
  if (season.incident?.effect?.fame) addFame('surprise', season.incident.effect.fame);
  if (season.dip && season.day >= season.dip.startDay && season.day <= season.dip.endDay) {
    crowdMult *= season.dip.mult;
  }

  // Rumor resolution
  let rumorResult = null;
  if (entry.rumor) {
    const def = RUMORS[entry.rumor.type];
    const choice = season.rumorChoices[season.day] || 'safe';
    const happened = entry.rumor.happens;
    if (choice === 'allin') costs.push({ label: 'Getting ready for the big day', amount: def.prep });
    if (happened) {
      crowdMult *= choice === 'allin' ? def.crowdIfAllIn : def.crowdIfHappens;
      let f = choice === 'allin' ? def.fameIfAllIn : def.fameIfHappens;
      if (def.exoticFame) {
        const exoticFeatured = featured.filter((x) => profs[x]?.exotic).length;
        f *= exoticFeatured > 0 ? 1 : 0.4;
      }
      addFame('bigDay', f);
    }
    rumorResult = { type: entry.rumor.type, choice, happened, odds: entry.rumor.odds };
  }

  // Test batches for brand-new specials (outcome revealed tomorrow)
  const launched = { ...season.launched };
  const newBatches = [];
  for (const b of pendingBatches(season, ctx)) {
    const r = makeRng(season.seed, 'batch', b.flavor)();
    const odds = b.exotic ? T.batchOddsExotic : T.batchOddsStd;
    const outcome = r < odds.flop ? 'flop' : r < odds.flop + odds.fine ? 'fine' : 'hit';
    launched[b.flavor] = { day: season.day, outcome, revealed: false, event: entry.actual };
    costs.push({ label: `Test batch: ${b.flavor}`, amount: b.cost });
    newBatches.push(b.flavor);
  }

  // Per-flavor modifiers (revealed test batches, surge costs)
  const mods = {};
  for (const [f, l] of Object.entries(launched)) {
    if (!l.revealed || season.day > l.until) continue;
    if (l.outcome === 'flop') mods[f] = { demandMult: T.flopDemand, flop: true };
    if (l.outcome === 'hit') mods[f] = { demandMult: 1.2 };
  }
  if (season.shock && season.shock.choice === 'pay' && season.day <= season.shock.endDay) {
    mods[season.shock.flavor] = { ...(mods[season.shock.flavor] || {}), surge: season.shock.surge };
  }

  const sim = simulateDay(
    {
      regular, featured, prices: season.prices, profiles: profs, mods,
      buzz: season.buzz, fans: season.fans, dealFans: season.dealFans,
      fame: season.fame, event, crowdMult,
    },
    rand,
    T,
  );
  addFame('customers', sim.fameFromCustomers);

  // Event fame (a blogger notices your featured specials)
  if (event.fameBonus && featured.length > 0) addFame('bigDay', event.fameBonus);

  // Fresh specials vs. a stale menu
  const featuredSince = { ...season.featuredSince };
  for (const f of Object.keys(featuredSince)) if (!featured.includes(f)) delete featuredSince[f];
  for (const f of featured) if (!featuredSince[f]) featuredSince[f] = season.day;
  for (const f of featured) {
    const run = season.day - featuredSince[f];
    if (run <= 3) addFame('fresh', T.fameFreshSpecial);
  }
  const menuKey = [...regular].sort().join('|') + '#' + [...featured].sort().join('|');
  const menuSameDays = menuKey === season.menuKey ? season.menuSameDays + 1 : 0;
  if (menuSameDays >= T.fameStaleDays) addFame('stale', T.fameStale);

  // Buzz for featured specials
  const newBuzz = { ...season.buzz };
  for (const f of featured) {
    const prof = profs[f];
    const sold = sim.scoops[f] || 0;
    const r = (season.prices[f] ?? 3) / prof.ceiling;
    const sat = r < 0.88 ? 1 : r <= 1.12 ? 0.55 : 0.1;
    let gain = (sold > 0 ? 0.12 : -0.06) + sat * 0.1 + (event.buzzBonus || 0);
    if (season.collab && f === season.collab.flavor) gain -= 0.12;
    // Specials that run too long lose their shine.
    if (season.day - featuredSince[f] >= 6) gain -= 0.12;
    newBuzz[f] = clamp((newBuzz[f] || 0) + gain, 0, 1);
  }
  for (const f of regular) if (newBuzz[f]) newBuzz[f] = clamp(newBuzz[f] - 0.04, 0, 1);

  // Money
  const otherCosts = costs.reduce((s, c) => s + c.amount, 0);
  const revenue = sim.scoopRevenue + sim.lollipopRevenue;
  const profit = round2(revenue - sim.scoopCost - sim.lollipopCost - T.overhead - otherCosts);
  const cash = round2(season.cash + profit);

  const fame = clamp(season.fame + fameDelta, 0, 100);
  const oldTierMax = season.tierMax;
  const tier = tierFor(fame);

  // Milestones (each tier once per season)
  const stats = updateStats(season, sim, profs, profit, menuAll, event);
  if (rumorResult) {
    const key = rumorResult.choice === 'allin'
      ? (rumorResult.happened ? 'allInWon' : 'allInLost')
      : (rumorResult.happened ? 'safeMissed' : 'safeDodged');
    stats.rumors = { ...stats.rumors, [key]: stats.rumors[key] + 1 };
  }
  const milestones = [];
  let collabPending = season.collabPending;
  let tierMax = oldTierMax;
  if (tier > oldTierMax) {
    const top = topFlavor(stats.scoops);
    const mr = makeRng(season.seed, 'milestone', season.day);
    for (let t = oldTierMax + 1; t <= tier; t++) {
      const channel = pick(CHANNEL_NAMES, mr);
      milestones.push({ tier: t, text: milestoneText(t, top, channel) });
      if (t === COLLAB_TIER && !season.collab && !season.collabDone) {
        collabPending = { channel, flavor: `${channel}'s ${pick(COLLAB_FLAVOR_IDEAS, mr)}` };
      }
    }
    tierMax = tier;
  }

  const flavorProfit = {};
  for (const f of menuAll) flavorProfit[f] = round2((sim.flavorRevenue[f] || 0) - (sim.flavorCost[f] || 0));

  const dayResult = {
    day: season.day,
    event: entry.actual,
    forecast: entry.forecast,
    confidence: entry.confidence,
    menu: { regular: [...regular], featured: [...featured] },
    prices: Object.fromEntries(menuAll.map((f) => [f, season.prices[f]])),
    customers: sim.customers,
    walkIns: sim.walkIns,
    fanVisits: sim.fanVisits,
    dealVisits: sim.dealVisits,
    served: sim.served,
    tally: sim.tally,
    happiness: sim.happiness,
    scoops: sim.scoops,
    flavorRevenue: sim.flavorRevenue,
    flavorCost: sim.flavorCost,
    flavorProfit,
    lollipops: sim.lollipops,
    lollipopRevenue: sim.lollipopRevenue,
    lollipopCost: sim.lollipopCost,
    revenue: round2(revenue),
    scoopCost: round2(sim.scoopCost),
    overhead: T.overhead,
    costs,
    profit,
    cashBefore: season.cash,
    cashAfter: cash,
    fameBefore: season.fame,
    fameAfter: fame,
    fameParts,
    milestones,
    rumor: rumorResult,
    newBatches,
    buzzBefore: season.buzz,
    log: sim.log,
    notes,
  };

  return {
    ...season,
    phase: 'watch',
    cash,
    fame,
    tierMax,
    buzz: newBuzz,
    fans: sim.newFans,
    dealFans: sim.newDealFans,
    launched,
    featuredSince,
    menuKey,
    menuSameDays,
    collabPending,
    priced: { ...season.priced, ...Object.fromEntries(menuAll.map((f) => [f, true])) },
    stats,
    history: [
      ...season.history,
      { day: season.day, profit, revenue: round2(revenue), customers: sim.customers, cash, fame: round2(fame) },
    ],
    lastDay: dayResult,
  };
}

function updateStats(season, sim, profs, profit, menuAll, event) {
  const s = season.stats;
  const scoops = { ...s.scoops };
  let exoticScoops = s.exoticScoops;
  const flavorProfit = { ...s.flavorProfit };
  for (const [f, n] of Object.entries(sim.scoops)) {
    scoops[f] = (scoops[f] || 0) + n;
    if (profs[f]?.exotic) exoticScoops += n;
    flavorProfit[f] = round2((flavorProfit[f] || 0) + sim.flavorRevenue[f] - sim.flavorCost[f]);
  }
  const exoticOnMenu = menuAll.filter((f) => profs[f]?.exotic).length;
  const day = season.day;
  return {
    ...s,
    customers: s.customers + sim.customers,
    served: s.served + sim.served,
    walked: s.walked + sim.tally.walked,
    nothing: s.nothing + sim.tally.nothing,
    happySum: s.happySum + sim.happiness * sim.customers,
    scoopRevenue: round2(s.scoopRevenue + sim.scoopRevenue),
    exoticScoops,
    daysWith3Exotic: s.daysWith3Exotic + (exoticOnMenu >= 3 ? 1 : 0),
    scoops,
    flavorProfit,
    fanVisits: s.fanVisits + sim.fanVisits,
    dealVisits: s.dealVisits + sim.dealVisits,
    badDays: s.badDays + (event.type === 'bad' ? 1 : 0),
    bestDay: !s.bestDay || profit > s.bestDay.profit ? { day, profit } : s.bestDay,
    worstDay: !s.worstDay || profit < s.worstDay.profit ? { day, profit } : s.worstDay,
    priceDays: s.priceDays + (menuAll.length ? 1 : 0),
    menuPriceSum: round2(s.menuPriceSum + averagePrice(menuAll, season.prices)),
  };
}

export function finishWatching(season) {
  return season.phase === 'watch' ? { ...season, phase: 'report' } : season;
}

// ---- moving to the next morning -------------------------------------------

export function advanceDay(season, ctx) {
  const T = ctx.T;
  if (season.day >= SEASON_LENGTH) return { ...season, phase: 'over' };
  const day = season.day + 1;
  const rand = makeRng(season.seed, 'advance', day);
  const cards = [];
  let menu = { regular: [...season.menu.regular], featured: [...season.menu.featured] };
  const buzz = { ...season.buzz };
  const prices = { ...season.prices };
  const stats = { ...season.stats };
  let fame = season.fame;
  let { shock, dip, collab, collabPending, collabDone } = season;
  const launched = { ...season.launched };

  // Reveal yesterday's test batches.
  for (const [f, l] of Object.entries(launched)) {
    if (l.revealed) continue;
    launched[f] = { ...l, revealed: true, until: day + 4 };
    stats.batches = { ...stats.batches, [l.outcome]: stats.batches[l.outcome] + 1 };
    if (l.outcome === 'hit') {
      buzz[f] = clamp((buzz[f] || 0) + T.hitBuzz, 0, 1);
      fame = clamp(fame + T.fameHit, 0, 100);
    } else if (l.outcome === 'flop') {
      fame = clamp(fame + T.fameFlop, 0, 100);
    }
    cards.push({ type: 'batch', flavor: f, outcome: l.outcome, event: l.event });
  }

  // Expire shortage / dip.
  if (shock && day > shock.endDay) {
    cards.push({ type: 'shockOver', flavor: shock.flavor });
    shock = null;
  }
  if (dip && day > dip.endDay) dip = null;

  // Sponsored collab arrives / ends.
  if (collabPending) {
    const { flavor, channel } = collabPending;
    buzz[flavor] = 0.7;
    prices[flavor] = 4.0;
    if (menu.featured.length < MENU_FEATURED) menu.featured.push(flavor);
    collab = { flavor, channel, endDay: day + 4 };
    launched[flavor] = { day, outcome: 'fine', revealed: true, until: 0 };
    collabPending = null;
    collabDone = true;
    cards.push({ type: 'collabStart', flavor, channel, endDay: day + 4 });
  } else if (collab && day > collab.endDay) {
    menu.regular = menu.regular.filter((f) => f !== collab.flavor);
    menu.featured = menu.featured.filter((f) => f !== collab.flavor);
    cards.push({ type: 'collabEnd', flavor: collab.flavor });
    collab = null;
  }

  // Surprise incident
  let incident = null;
  const incId = rollIncident(season.seed, day, rand);
  if (incId) {
    const def = INCIDENTS[incId];
    const applied = { id: incId, kind: def.kind, effect: {} };
    let took = true;
    if (def.effect.crowdMult) applied.effect.crowdMult = def.effect.crowdMult;
    if (def.effect.fame) applied.effect.fame = def.effect.fame;
    if (def.effect.buzzSpike) {
      const target = menu.featured[0];
      if (target) {
        buzz[target] = clamp((buzz[target] || 0) + def.effect.buzzSpike, 0, 1);
        applied.flavor = target;
      }
    }
    if (def.effect.shortage) {
      const pool = [...menu.regular, ...menu.featured].filter((f) => !collab || f !== collab.flavor);
      if (!shock && pool.length > 0) {
        const flavor = pick(pool, rand);
        const dur = randInt(def.effect.shortage.days[0], def.effect.shortage.days[1], rand);
        shock = { flavor, startDay: day, endDay: day + dur - 1, choice: null, surge: T.surgePerScoop };
        applied.flavor = flavor;
      } else took = false;
    }
    if (def.effect.dip) {
      if (!dip) {
        const dur = randInt(def.effect.dip.days[0], def.effect.dip.days[1], rand);
        dip = { startDay: day, endDay: day + dur - 1, mult: def.effect.dip.mult };
        applied.until = day + dur - 1;
      } else took = false;
    }
    if (took) incident = applied;
  }

  return {
    ...season,
    day,
    phase: 'plan',
    menu,
    buzz,
    prices,
    fame,
    stats,
    launched,
    shock,
    dip,
    collab,
    collabPending,
    collabDone,
    incident,
    morningCards: cards,
  };
}

export function topFlavor(scoops) {
  let best = null;
  for (const [f, n] of Object.entries(scoops)) if (best === null || n > scoops[best]) best = f;
  return best;
}

export function topFlavors(scoops, n = 5) {
  return Object.entries(scoops)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([flavor, count]) => ({ flavor, scoops: count }));
}

export function avgPricePaid(stats) {
  return stats.served > 0 ? stats.scoopRevenue / stats.served : 0;
}

export function avgHappiness(stats) {
  return stats.customers > 0 ? stats.happySum / stats.customers : 0;
}
