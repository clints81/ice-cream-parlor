// Morning and evening notes, plus Helper-mode suggestions. Notes point at
// what to notice, never name the economics.

import {
  profilesFor, forecastFor, availableFlavors, isLockedOut, isPricingDay,
  nextPricingDay, SEASON_LENGTH, MENU_REGULAR, MENU_FEATURED,
} from './engine.js';
import { EVENTS } from './events.js';

export function buzzStatus(b) {
  if (b > 0.65) return 'buzzing';
  if (b >= 0.15 && b <= 0.45) return 'fading';
  return null;
}

// Like buzzStatus, but "fading" only when buzz actually went down since
// yesterday (a brand-new special climbing through 30% isn't fading).
export function buzzLabel(season, f) {
  const b = season.buzz[f] || 0;
  if (b > 0.65) return 'buzzing';
  const prev = season.lastDay?.buzzBefore?.[f];
  if (prev != null && b < prev - 0.001 && b <= 0.5) return 'fading';
  return null;
}

const CROWD = { kids: 'kids', adventurous: 'adventurous eaters', everyone: 'everybody' };

export function morningNotes(season, ctx) {
  const helper = ctx.mode === 'helper';
  const profs = profilesFor(season, ctx.vault);
  const { regular, featured } = season.menu;
  const menuAll = [...regular, ...featured];
  const { event } = forecastFor(season);
  const notes = [];

  if (event.segment) {
    const matches = menuAll.filter((f) => profs[f]?.segment === event.segment);
    if (matches.length) {
      notes.push(helper
        ? `${CROWD[event.segment][0].toUpperCase() + CROWD[event.segment].slice(1)} may come. ${matches[0]} is a good pick.`
        : `If the forecast is right, expect lots of ${CROWD[event.segment]}. ${matches.join(' and ')} should do well.`);
    } else {
      notes.push(helper
        ? `${CROWD[event.segment][0].toUpperCase() + CROWD[event.segment].slice(1)} may come, but nothing on the menu is for them.`
        : `The forecast points to ${CROWD[event.segment]}, but nothing on your menu is really for them.`);
    }
  }

  for (const [f, n] of Object.entries(season.fans)) {
    if (n >= 2 && !menuAll.includes(f) && !isLockedOut(season, f)) {
      notes.push(helper ? `${f} has fans. They miss it!` : `${f} has a little fan club. They won't visit if it's off the menu.`);
      break;
    }
  }

  for (const f of featured) {
    const s = buzzLabel(season, f);
    if (s === 'fading') notes.push(helper ? `${f} is getting old. Try a new special?` : `${f}'s buzz is fading. People have seen it a lot.`);
    else if (s === 'buzzing') notes.push(helper ? `${f} is a hit right now!` : `${f} is buzzing. Keep riding it?`);
  }

  if (season.menuSameDays >= 3) {
    notes.push(helper ? 'Same menu for a while. Change something?' : `Your menu has been the same for ${season.menuSameDays + 1} days. People notice.`);
  }

  if (event.type === 'bad') {
    notes.push(helper ? 'Slow days still cost shop money.' : 'A slow day still has shop costs. Fans are the ones who show up in bad weather.');
  }

  if (!ctx.dailyPricing) {
    if (isPricingDay(season.day)) notes.push(helper ? 'You can change prices today!' : `Prices are open today. They hold until Day ${nextPricingDay(season.day) ?? '—'}.`);
    else if (isPricingDay(season.day + 1) && season.day < SEASON_LENGTH) notes.push(helper ? 'Price day is tomorrow.' : 'Pricing day tomorrow. Watch how people react to prices today.');
  }

  if (menuAll.length === 0) notes.unshift(helper ? 'Pick some flavors first!' : 'Your menu is empty. Pick some flavors.');
  return notes.slice(0, helper ? 2 : 4);
}

export function eveningNotes(season, ctx) {
  const helper = ctx.mode === 'helper';
  const d = season.lastDay;
  if (!d) return [];
  const profs = profilesFor(season, ctx.vault);
  const notes = [];
  const menuAll = [...d.menu.regular, ...d.menu.featured];

  if (d.tally.walked >= 3) {
    const walkedFlavors = {};
    for (const e of d.log) if (e.outcome === 'walked') walkedFlavors[e.flavor] = (walkedFlavors[e.flavor] || 0) + 1;
    const worst = Object.entries(walkedFlavors).sort((a, b) => b[1] - a[1])[0]?.[0];
    notes.push(helper
      ? `${d.tally.walked} people left. They thought ${worst} cost too much.`
      : `${d.tally.walked} customers walked away without buying, mostly at the ${worst} price.`);
  }
  if (d.tally.nothing >= 4) {
    notes.push(helper ? `${d.tally.nothing} people found nothing they liked.` : `${d.tally.nothing} people looked at the menu and didn't find anything for them.`);
  }

  const zero = menuAll.filter((f) => (d.scoops[f] || 0) === 0);
  if (zero.length) notes.push(helper ? `Nobody picked ${zero[0]}.` : `Nobody ordered ${zero.join(' or ')} today.`);

  // A popular flavor that barely earns anything.
  let best = null;
  for (const f of menuAll) if (!best || (d.scoops[f] || 0) > (d.scoops[best] || 0)) best = f;
  if (best && (d.scoops[best] || 0) >= 5) {
    const per = (d.flavorProfit[best] || 0) / d.scoops[best];
    if (per < 1.0) {
      notes.push(helper
        ? `${best} sold a lot, but you only keep a little from each one.`
        : `${best} sold a lot, but each scoop only kept you about $${per.toFixed(2)}.`);
    }
  }

  for (const f of d.menu.featured) {
    const s = buzzLabel(season, f);
    if (s === 'fading') notes.push(helper ? `${f} is getting old.` : `${f}'s buzz is fading. Time for a new special soon?`);
  }

  if (d.profit < 0) {
    notes.push(helper ? 'You lost money today. That happens!' : 'You lost money today. Costs were bigger than sales.');
  }

  if (season.day < SEASON_LENGTH) {
    const fc = forecastFor(season, season.day + 1);
    notes.push(helper ? `Tomorrow: maybe ${fc.event.forecast}.` : `Tomorrow's forecast: ${fc.event.forecast} (${fc.confidence === 'sure' ? 'almost sure' : fc.confidence}).`);
  }
  void profs;
  return notes.slice(0, helper ? 3 : 5);
}

// ---- Helper-mode suggestions ----------------------------------------------

export function suggestMenu(season, ctx) {
  const profs = profilesFor(season, ctx.vault);
  const { event } = forecastFor(season);
  const names = availableFlavors(season, ctx.vault).filter((f) => !isLockedOut(season, f));
  const score = (f) => {
    const p = profs[f];
    let s = p.base;
    if (event.segment && p.segment === event.segment) s += 0.5;
    if (!event.segment && p.segment === 'everyone') s += 0.1;
    if ((season.fans[f] || 0) >= 1.5) s += 0.4;
    if (event.segment === 'kids' && p.exotic) s -= 0.3;
    return s;
  };
  const sorted = [...names].sort((a, b) => score(b) - score(a));

  // Keep a buzzing special; otherwise pick a fresh one with a good score.
  const featured = season.menu.featured.filter((f) => (season.buzz[f] || 0) > 0.45 && names.includes(f));
  for (const f of sorted) {
    if (featured.length >= MENU_FEATURED) break;
    const runDays = season.featuredSince[f] ? season.day - season.featuredSince[f] : 0;
    if (!featured.includes(f) && runDays < 5 && (season.buzz[f] || 0) < 0.6) featured.push(f);
  }
  const regular = sorted.filter((f) => !featured.includes(f)).slice(0, MENU_REGULAR);

  let reason;
  if (event.segment === 'kids') reason = `Lots of kids may come (${event.forecast}). Sweet flavors first!`;
  else if (event.segment === 'adventurous') reason = `People who like new tastes may come (${event.forecast}). Weird flavors can shine.`;
  else if (event.type === 'bad') reason = 'It may be slow. Keep flavors your fans love.';
  else reason = 'A mix of favorites that lots of people like.';
  return { menu: { regular, featured: featured.slice(0, MENU_FEATURED) }, reason };
}

export function roundHalf(x) {
  return Math.round(x * 2) / 2;
}

export function suggestPrices(season, ctx, menu = season.menu) {
  const profs = profilesFor(season, ctx.vault);
  const out = {};
  for (const f of [...menu.regular, ...menu.featured]) {
    out[f] = Math.max(1, roundHalf(profs[f].ceiling * 0.82));
  }
  return { prices: out, reason: 'Most people are happy to pay about this much.' };
}

export function eventMeta(id) {
  return EVENTS[id];
}
