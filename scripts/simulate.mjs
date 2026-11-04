#!/usr/bin/env node
// Headless balance simulation. Plays many seasons with several bot strategies
// through the real game engine (no UI) and prints average results.
//
//   npm run sim                 # 400 seasons per strategy
//   npm run sim -- --n 1000     # more seasons
//   npm run sim -- --set overhead=8 --set refPrice=3.5   # try tuning changes

import {
  createSeason, runDay, finishWatching, advanceDay, profilesFor, visibleRumors,
  needsDecision, chooseShock, chooseRumor, setMenu, setPrices, forecastFor,
  availableFlavors, isLockedOut, canPrice, avgPricePaid, avgHappiness,
  SEASON_LENGTH,
} from '../src/game/engine.js';
import { makeVaultFlavor } from '../src/game/flavors.js';
import { AMBITIONS, gradeFor } from '../src/game/ambitions.js';
import { tierName } from '../src/game/fame.js';
import { TUNING } from '../src/game/tuning.js';
import { EVENTS } from '../src/game/events.js';
import { mulberry32 } from '../src/game/rng.js';

const args = process.argv.slice(2);
let N = 400;
const T = { ...TUNING };
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--n') N = parseInt(args[++i], 10);
  if (args[i] === '--set') {
    const [k, v] = args[++i].split('=');
    T[k] = parseFloat(v);
  }
}

const VAULT = [
  'Chocolate', 'Vanilla', 'Strawberry', 'Cookies and Cream', 'Birthday Cake',
  'Cotton Candy', 'Mint Chocolate Chip', 'Blue Raspberry', 'Lemon',
  'Hot Jalapeno', 'Spicy Honey', 'Pickle Swirl', 'Galaxy Goo', 'Ghost Pepper',
].map((n) => makeVaultFlavor(n));

const round = (x, step) => Math.round(x / step) * step;

// ---- bots -------------------------------------------------------------------

function split(season, ctx) {
  const profs = profilesFor(season, ctx.vault);
  const names = availableFlavors(season, ctx.vault).filter((f) => !isLockedOut(season, f));
  const std = names.filter((f) => !profs[f].exotic).sort((a, b) => profs[b].base - profs[a].base);
  const exo = names.filter((f) => profs[f].exotic).sort((a, b) => profs[b].base - profs[a].base);
  return { profs, std, exo, names };
}

function applyPrices(season, ctx, fn) {
  const profs = profilesFor(season, ctx.vault);
  const p = {};
  for (const f of [...season.menu.regular, ...season.menu.featured]) {
    if (canPrice(season, f, ctx)) p[f] = fn(profs[f], f);
  }
  return setPrices(season, p);
}

function rotateFeatured(season, pool, every) {
  // Pick a fresh pair of specials every `every` days.
  const k = Math.floor((season.day - 1) / every);
  const a = pool[(k * 2) % pool.length];
  const b = pool[(k * 2 + 1) % pool.length];
  return [a, b].filter(Boolean);
}

const BOTS = {
  cheap: {
    label: 'Cheap & busy',
    plan(season, ctx) {
      const { std } = split(season, ctx);
      season = setMenu(season, { regular: std.slice(0, 5), featured: std.slice(5, 7) });
      season = applyPrices(season, ctx, () => 2.25);
      for (const r of visibleRumors(season)) if (!r.choice) season = chooseRumor(season, r.day, 'safe');
      if (needsDecision(season) === 'shock') season = chooseShock(season, 'swap');
      return season;
    },
  },
  exotic: {
    label: 'Weird & loyal',
    plan(season, ctx) {
      const { exo, std } = split(season, ctx);
      const pool = [...exo, ...std];
      const featured = rotateFeatured(season, exo, 6);
      const regular = pool.filter((f) => !featured.includes(f)).slice(0, 5);
      season = setMenu(season, { regular, featured });
      season = applyPrices(season, ctx, (p) => round(p.ceiling * 0.95, 0.25));
      for (const r of visibleRumors(season)) {
        if (!r.choice) season = chooseRumor(season, r.day, r.odds >= 0.4 ? 'allin' : 'safe');
      }
      if (needsDecision(season) === 'shock') season = chooseShock(season, 'pay');
      return season;
    },
  },
  weirdfair: {
    label: 'Weird, fair price',
    plan(season, ctx) {
      const { exo, std } = split(season, ctx);
      const pool = [...exo, ...std];
      const featured = rotateFeatured(season, exo, 5);
      const regular = pool.filter((f) => !featured.includes(f)).slice(0, 5);
      season = setMenu(season, { regular, featured });
      season = applyPrices(season, ctx, (p) => round(p.ceiling * 0.85, 0.25));
      for (const r of visibleRumors(season)) {
        if (!r.choice) season = chooseRumor(season, r.day, r.odds >= 0.4 ? 'allin' : 'safe');
      }
      if (needsDecision(season) === 'shock') season = chooseShock(season, 'pay');
      return season;
    },
  },
  balanced: {
    label: 'Balanced',
    plan(season, ctx) {
      const { exo, std, profs } = split(season, ctx);
      const fc = forecastFor(season).event;
      const kidsDay = fc.segment === 'kids';
      const advDay = fc.segment === 'adventurous';
      const nExo = advDay ? 3 : kidsDay ? 1 : 2;
      const featuredPool = [...exo.slice(0, 2), ...std.slice(4, 8)];
      const featured = rotateFeatured(season, featuredPool, 4);
      const regular = [...exo.filter((f) => !featured.includes(f)).slice(0, nExo),
        ...std.filter((f) => !featured.includes(f))].slice(0, 5);
      season = setMenu(season, { regular, featured });
      season = applyPrices(season, ctx, (p) => round(p.ceiling * 0.85, 0.25));
      for (const r of visibleRumors(season)) {
        if (!r.choice) season = chooseRumor(season, r.day, r.odds >= 0.5 ? 'allin' : 'safe');
      }
      if (needsDecision(season) === 'shock') {
        season = chooseShock(season, profs[season.shock.flavor]?.exotic ? 'pay' : 'swap');
      }
      return season;
    },
  },
  maxprice: {
    label: 'Always max price',
    plan(season, ctx) {
      const { std, exo } = split(season, ctx);
      season = setMenu(season, { regular: std.slice(0, 4).concat(exo.slice(0, 1)), featured: std.slice(4, 6) });
      season = applyPrices(season, ctx, (p) => round(p.ceiling * 1.45, 0.25));
      for (const r of visibleRumors(season)) if (!r.choice) season = chooseRumor(season, r.day, 'allin');
      if (needsDecision(season) === 'shock') season = chooseShock(season, 'pay');
      return season;
    },
  },
  random: {
    label: 'Random',
    plan(season, ctx, rand) {
      const { names } = split(season, ctx);
      const shuffled = [...names].sort(() => rand() - 0.5);
      season = setMenu(season, { regular: shuffled.slice(0, 5), featured: rand() < 0.6 ? shuffled.slice(5, 7) : [] });
      season = applyPrices(season, ctx, () => round(1.5 + rand() * 4, 0.25));
      for (const r of visibleRumors(season)) {
        if (!r.choice) season = chooseRumor(season, r.day, rand() < 0.5 ? 'allin' : 'safe');
      }
      if (needsDecision(season) === 'shock') season = chooseShock(season, rand() < 0.5 ? 'pay' : 'swap');
      return season;
    },
  },
};

// ---- run --------------------------------------------------------------------

function playSeason(bot, seed, ambition) {
  const ctx = { vault: VAULT, mode: 'standard', dailyPricing: true, T };
  const rand = mulberry32(seed ^ 0xabcdef);
  let s = createSeason({ number: 1, seed, vault: VAULT, ambition, T });
  for (let d = 1; d <= SEASON_LENGTH; d++) {
    s = bot.plan(s, ctx, rand);
    s = runDay(s, ctx);
    s = finishWatching(s);
    s = advanceDay(s, ctx);
  }
  return s;
}

const AMB = [
  { id: 'weird' }, { id: 'crowd' }, { id: 'deal' },
  { id: 'bigtime', tier: 3 }, { id: 'bigtime', tier: 4 }, { id: 'bigtime', tier: 5 }, { id: 'bigtime', tier: 6 },
];
const ambLabel = (a) => (a.id === 'bigtime' ? `Big: ${tierName(a.tier)}` : AMBITIONS[a.id].name);

const pctile = (arr, p) => {
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.floor((a.length - 1) * p)];
};
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const rows = [];
for (const [id, bot] of Object.entries(BOTS)) {
  const cash = [];
  const fame = [];
  const tiers = [];
  const served = [];
  const price = [];
  const happy = [];
  const walked = [];
  const fanV = [];
  const losing = [];
  const badDay = [];
  const exoS = [];
  const amb = AMB.map(() => ({ nailed: 0, close: 0 }));
  for (let i = 0; i < N; i++) {
    const seed = 1000 + i * 7919;
    const s = playSeason(bot, seed, { id: 'crowd' });
    cash.push(s.cash);
    fame.push(s.fame);
    tiers.push(s.tierMax);
    served.push(s.stats.served);
    price.push(avgPricePaid(s.stats));
    happy.push(avgHappiness(s.stats));
    walked.push(s.stats.walked);
    fanV.push(s.stats.fanVisits);
    losing.push(s.cash < T.startCash ? 1 : 0);
    exoS.push(s.stats.exoticScoops);
    const bad = s.history.filter((h) => ['bad'].includes(EVENTS[s.schedule.days[h.day - 1].actual].type));
    if (bad.length) badDay.push(mean(bad.map((h) => h.profit)));
    AMB.forEach((a, j) => {
      const g = gradeFor(AMBITIONS[a.id].progress(s.stats, { ...s, ambition: a }, T).pct);
      if (g.id === 'nailed') amb[j].nailed++;
      else if (g.id === 'close') amb[j].close++;
    });
  }
  rows.push({ id, bot, cash, fame, tiers, served, price, happy, walked, fanV, losing, amb, badDay, exoS });
}

const f0 = (x) => x.toFixed(0).padStart(6);
const f2 = (x) => x.toFixed(2).padStart(6);
console.log(`\nIce Cream Parlor balance sim: ${N} seasons per strategy, ${SEASON_LENGTH} days each\n`);
console.log('strategy           end cash (p10 / median / p90)   lost $   fame  best tier          served  $/scoop  smiles  walked  fans  weird  bad-day $');
for (const r of rows) {
  console.log(
    r.bot.label.padEnd(18),
    `${f0(pctile(r.cash, 0.1))} /${f0(pctile(r.cash, 0.5))} /${f0(pctile(r.cash, 0.9))}`.padEnd(30),
    `${(mean(r.losing) * 100).toFixed(0).padStart(4)}%`,
    f0(mean(r.fame)),
    `  ${tierName(Math.round(pctile(r.tiers, 0.5)))}`.padEnd(20),
    f0(mean(r.served)),
    `  ${f2(mean(r.price))}`,
    `  ${(mean(r.happy) * 100).toFixed(0).padStart(4)}%`,
    f0(mean(r.walked)),
    f0(mean(r.fanV)),
    f0(mean(r.exoS)),
    `   ${f2(mean(r.badDay))}`,
  );
}
console.log('\nAmbition results: % "Nailed it" (+ % "Close")');
console.log('strategy'.padEnd(18), AMB.map((a) => ambLabel(a).slice(0, 21).padEnd(22)).join(''));
for (const r of rows) {
  console.log(
    r.bot.label.padEnd(18),
    r.amb.map((x) => `${((x.nailed / N) * 100).toFixed(0).padStart(3)}% (+${((x.close / N) * 100).toFixed(0)}%)`.padEnd(22)).join(''),
  );
}
console.log('');
