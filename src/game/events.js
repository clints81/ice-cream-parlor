import { mulberry32 } from './rng.js';

export const EVENTS = [
  {
    id: 'school', title: 'School just let out nearby', type: 'great', mult: 1.7,
    segment: 'kids',
    desc: 'A wave of kids with allowance money is headed straight for your block.',
    hint: 'Sweet, kid-friendly flavors will fly today.',
  },
  {
    id: 'sunny', title: 'Hot and sunny afternoon', type: 'good', mult: 1.4,
    desc: 'Blue sky, no breeze — perfect ice cream weather.',
    hint: 'Expect a bigger crowd than usual.',
  },
  {
    id: 'farmers', title: 'Farmers market next door', type: 'good', mult: 1.35,
    segment: 'adventurous',
    desc: 'Foodies are browsing the stalls right next to your parlor.',
    hint: 'Bold and unusual flavors will get extra attention.',
  },
  {
    id: 'blogger', title: 'Food blogger stopped by', type: 'great', mult: 1.25,
    buzzBonus: 0.25,
    desc: 'A local food blogger is in line — with a camera.',
    hint: 'A great day for your featured specials to shine.',
  },
  {
    id: 'rain', title: 'Rainy afternoon', type: 'bad', mult: 0.5,
    desc: 'Steady rain is keeping almost everyone indoors.',
    hint: 'A slow day — a safe time to experiment with your menu.',
  },
  {
    id: 'tuesday', title: 'Quiet Tuesday', type: 'neutral', mult: 1.0,
    desc: 'Just an ordinary day on the block.',
    hint: 'Nothing unusual — a good day to study what sells.',
  },
  {
    id: 'birthday', title: 'Birthday party group', type: 'good', mult: 1.5,
    segment: 'kids',
    desc: 'A birthday party is coming by this afternoon.',
    hint: 'Kids will dominate the line today.',
  },
  {
    id: 'block', title: 'Block party nearby', type: 'great', mult: 1.8,
    desc: 'The whole neighborhood is out on the street.',
    hint: 'This could be your biggest crowd of the season.',
  },
  {
    id: 'slowmorn', title: 'Slow morning', type: 'bad', mult: 0.65,
    desc: 'The street is unusually empty today.',
    hint: 'Fewer customers — every sale counts.',
  },
  {
    id: 'college', title: 'College students on break', type: 'good', mult: 1.3,
    segment: 'adventurous',
    desc: 'Students are wandering over between classes.',
    hint: 'They love trying the weird stuff.',
  },
];

// Same day in the same season always gets the same weather. Seeded off a
// per-season random seed (not the season number) so each new or restarted
// season has a different sequence, while staying stable across reloads.
export function eventForDay(seasonSeed, day) {
  const rand = mulberry32((seasonSeed >>> 0) * 7919 + day * 104729 + 12345);
  return EVENTS[Math.floor(rand() * EVENTS.length)];
}

// --- Surprise incidents -----------------------------------------------------
// These layer on top of the daily weather and are what make each playthrough
// feel different. Templates carry an `effect` the game loop applies; dynamic
// bits (which flavor, how many days) are filled in when applied.

export const GOOD_INCIDENTS = [
  {
    id: 'viral', kind: 'good', title: 'Your shop went viral!',
    desc: 'A clip of your parlor is racing around the internet. Everyone wants a taste.',
    effect: { buzzSpike: 0.3, crowdMult: 1.25 },
  },
  {
    id: 'news', kind: 'good', title: 'The local news featured you',
    desc: 'A TV crew did a little segment on your parlor this morning.',
    effect: { crowdMult: 1.45 },
  },
  {
    id: 'coupon', kind: 'good', title: 'Coupons paid off',
    desc: 'Coupons you handed out last week are bringing a wave of new faces.',
    effect: { crowdMult: 1.35 },
  },
  {
    id: 'heatwave', kind: 'good', title: 'Heat wave rush',
    desc: 'A surprise heat wave has the whole town craving something cold.',
    effect: { crowdMult: 1.6 },
  },
];

export const BAD_INCIDENTS = [
  {
    id: 'breakdown', kind: 'bad', title: 'The machine broke down',
    desc: 'Your ice cream machine jammed and you lost most of the day fixing it.',
    effect: { crowdMult: 0.45 },
  },
  {
    id: 'rival', kind: 'bad', title: 'A rival cart opened nearby',
    desc: 'A new ice cream cart set up down the street. Crowds will be thinner for a few days.',
    effect: { dip: { mult: 0.78, days: [3, 4] } },
  },
  {
    id: 'shortage', kind: 'bad', title: 'Ingredient shortage',
    desc: 'A supplier fell through — one of your menu flavors is unavailable for a few days.',
    effect: { shortage: { days: [3, 5] } },
  },
];

// Rolled once per day-advance (result is persisted, so plain Math.random is
// fine). Easy mode only ever draws good incidents and at a lower rate.
export function rollIncident(easyMode, day) {
  if (day <= 1) return null;
  const p = easyMode ? 0.07 : 0.13;
  if (Math.random() > p) return null;
  const pool = easyMode || Math.random() < 0.5 ? GOOD_INCIDENTS : BAD_INCIDENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
