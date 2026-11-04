// Daily events, forecasts, rumors and surprise incidents.
//
// At the start of a season the whole 30-day schedule is drawn from a weighted
// pool (biased by a hidden "season mood") and stored in the save. Each day
// has an actual event and a forecast that is usually, but not always, right.
// Rumors are uncertain big days announced ahead of time; their outcome is also
// drawn up front, so refreshing the page can never change it.

import { makeRng, weightedPick, randInt, pick, shuffle } from './rng.js';

export const SEASON_LENGTH = 30;

export const EVENTS = {
  school: {
    title: 'School just let out nearby', type: 'great', mult: 1.6, segment: 'kids',
    weather: 'sunny', short: 'School-out crowd', helper: 'School is out! Lots of kids.',
    desc: 'A wave of kids with allowance money is headed straight for your block.',
    hint: 'Sweet, kid-friendly flavors will fly today.',
    forecast: 'a school-out rush',
  },
  sunny: {
    title: 'Hot and sunny afternoon', type: 'good', mult: 1.35,
    weather: 'sunny', short: 'Hot and sunny', helper: 'Hot and sunny. Busy day!',
    desc: 'Blue sky, no breeze. Perfect ice cream weather.',
    hint: 'Expect a bigger crowd than usual.',
    forecast: 'hot and sunny',
  },
  farmers: {
    title: 'Farmers market next door', type: 'good', mult: 1.3, segment: 'adventurous',
    weather: 'sunny', short: 'Farmers market', helper: 'Farmers market. People want new tastes.',
    desc: 'Foodies are browsing the stalls right next to your parlor.',
    hint: 'Bold and unusual flavors will get extra attention.',
    forecast: 'a farmers market',
  },
  blogger: {
    title: 'Food blogger in town', type: 'great', mult: 1.2, buzzBonus: 0.25, fameBonus: 2,
    weather: 'cloudy', short: 'Food blogger', helper: 'A food blogger is coming!',
    desc: 'A local food blogger is walking the block with a camera.',
    hint: 'A great day for your featured specials to shine.',
    forecast: 'a food blogger visit',
  },
  rain: {
    title: 'Rainy afternoon', type: 'bad', mult: 0.45,
    weather: 'rain', short: 'Rainy', helper: 'Rain. Not many people.',
    desc: 'Steady rain is keeping almost everyone indoors.',
    hint: 'A slow day. Loyal fans still come by.',
    forecast: 'rainy',
  },
  storm: {
    title: 'Thunderstorm', type: 'bad', mult: 0.3,
    weather: 'storm', short: 'Thunderstorm', helper: 'Big storm. Very few people.',
    desc: 'Thunder and wind. Only the bravest are out for ice cream.',
    hint: 'Hardly anyone will come. Shop costs still have to be paid.',
    forecast: 'stormy',
  },
  quiet: {
    title: 'Quiet weekday', type: 'neutral', mult: 1.0,
    weather: 'cloudy', short: 'Quiet day', helper: 'A normal day.',
    desc: 'Just an ordinary day on the block.',
    hint: 'Nothing unusual. A good day to study what sells.',
    forecast: 'an ordinary day',
  },
  birthday: {
    title: 'Birthday party group', type: 'good', mult: 1.4, segment: 'kids',
    weather: 'sunny', short: 'Birthday party', helper: 'A birthday party is coming!',
    desc: 'A birthday party is coming by this afternoon.',
    hint: 'Kids will fill up the line today.',
    forecast: 'a birthday party',
  },
  block: {
    title: 'Block party nearby', type: 'great', mult: 1.75,
    weather: 'sunny', short: 'Block party', helper: 'Block party! So many people!',
    desc: 'The whole neighborhood is out on the street.',
    hint: 'This could be your biggest crowd of the season.',
    forecast: 'a block party',
  },
  slow: {
    title: 'Slow, gray day', type: 'bad', mult: 0.65,
    weather: 'cloudy', short: 'Slow day', helper: 'Gray and slow.',
    desc: 'The street is unusually empty today.',
    hint: 'Fewer customers. Every sale counts.',
    forecast: 'slow and gray',
  },
  college: {
    title: 'College students on break', type: 'good', mult: 1.25, segment: 'adventurous',
    weather: 'cloudy', short: 'College crowd', helper: 'Big kids from college. They like weird tastes.',
    desc: 'Students are wandering over between classes.',
    hint: 'They love trying the weird stuff.',
    forecast: 'a college crowd',
  },
  chilly: {
    title: 'Chilly and windy', type: 'bad', mult: 0.6,
    weather: 'windy', short: 'Chilly', helper: 'Cold and windy.',
    desc: 'A cold wind is blowing. Most people want hot cocoa instead.',
    hint: 'A thinner crowd than usual.',
    forecast: 'chilly',
  },
};

// Hidden season moods tilt the weights so two seasons feel different.
export const MOODS = {
  summer: {
    name: 'a hot summer', weights: { sunny: 4, school: 2, block: 1.5, rain: 1, storm: 0.6, chilly: 0.2 },
  },
  rainy: {
    name: 'a rainy spring', weights: { rain: 3.5, storm: 1.3, slow: 2, chilly: 1.2, sunny: 1.2 },
  },
  foodie: {
    name: 'a foodie season', weights: { farmers: 3, college: 2.5, blogger: 1.8, school: 0.8 },
  },
  family: {
    name: 'a busy family season', weights: { school: 3, birthday: 2.5, block: 1.4, college: 0.6 },
  },
  mixed: { name: 'a mixed-up season', weights: {} },
};

const BASE_WEIGHTS = {
  school: 1.4, sunny: 2.2, farmers: 1.3, blogger: 0.8, rain: 1.6, storm: 0.5,
  quiet: 2.4, birthday: 1.1, block: 0.6, slow: 1.4, college: 1.2, chilly: 0.8,
};

// When a forecast is wrong, the real day is usually a "neighbor".
const NEIGHBORS = {
  school: ['quiet', 'birthday', 'slow'],
  sunny: ['quiet', 'block', 'chilly'],
  farmers: ['quiet', 'college', 'rain'],
  blogger: ['quiet', 'farmers'],
  rain: ['slow', 'storm', 'quiet', 'sunny'],
  storm: ['rain', 'slow'],
  quiet: ['slow', 'sunny', 'rain'],
  birthday: ['school', 'quiet'],
  block: ['sunny', 'rain'],
  slow: ['quiet', 'rain', 'sunny'],
  college: ['quiet', 'farmers', 'slow'],
  chilly: ['slow', 'quiet', 'sunny'],
};

export const CONFIDENCE = {
  sure: { label: 'Almost sure', helper: 'Almost sure', accuracy: 0.92 },
  likely: { label: 'Likely', helper: 'Likely', accuracy: 0.75 },
  maybe: { label: 'Maybe', helper: 'Not sure', accuracy: 0.55 },
};

// Rumors: uncertain big days, announced 1–2 days ahead.
export const RUMORS = {
  filming: {
    title: 'A PokéTuber might film on our street',
    helper: 'A PokéTuber might come film!',
    happened: 'The PokéTuber showed up and filmed the whole street!',
    fizzled: 'The PokéTuber never showed up. Maybe next time.',
    prep: 12, crowdIfHappens: 1.35, crowdIfAllIn: 1.8, fameIfHappens: 2, fameIfAllIn: 7,
    prepLabel: 'Decorate the shop and make a special sign',
  },
  parade: {
    title: 'There might be a parade on Main Street',
    helper: 'There might be a parade!',
    happened: 'The parade marched right past your door!',
    fizzled: 'The parade got moved to another street.',
    prep: 10, crowdIfHappens: 1.4, crowdIfAllIn: 2.0, fameIfHappens: 1, fameIfAllIn: 3,
    prepLabel: 'Make extra ice cream and hire a helper',
  },
  heatwave: {
    title: 'The weather news says it might get super hot',
    helper: 'It might be super hot!',
    happened: 'It was the hottest day of the year!',
    fizzled: 'The heat wave never came. Just a normal day.',
    prep: 8, crowdIfHappens: 1.3, crowdIfAllIn: 1.75, fameIfHappens: 0, fameIfAllIn: 2,
    prepLabel: 'Buy extra cones and a second freezer for the day',
  },
  critic: {
    title: 'A famous food critic might stop by',
    helper: 'A food critic might come taste!',
    happened: 'The food critic came by and tried your specials!',
    fizzled: 'The critic went to a different town.',
    prep: 10, crowdIfHappens: 1.1, crowdIfAllIn: 1.25, fameIfHappens: 2, fameIfAllIn: 9,
    exoticFame: true,
    prepLabel: 'Make your featured specials extra fancy',
  },
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export function dayName(day) {
  return DAY_NAMES[(day - 1) % 7];
}

// Build the whole season up front. Stored in the save.
export function buildSchedule(seed) {
  const rand = makeRng(seed, 'schedule');
  const moodId = weightedPick(
    [['summer', 1.2], ['rainy', 0.9], ['foodie', 1], ['family', 1], ['mixed', 1.1]],
    rand, (x) => x[1],
  )[0];
  const mood = MOODS[moodId];
  const weights = Object.fromEntries(
    Object.entries(BASE_WEIGHTS).map(([id, w]) => [id, w * (mood.weights[id] ?? 1)]),
  );

  const days = [];
  let prev = null;
  for (let d = 1; d <= SEASON_LENGTH; d++) {
    // Weather is streaky: yesterday's weather is a bit more likely again.
    const items = Object.entries(weights).map(([id, w]) => {
      let ww = w;
      if (prev && id === prev) ww *= EVENTS[id].type === 'great' ? 0.3 : 1.6;
      if (prev && EVENTS[prev].weather === 'rain' && EVENTS[id].weather === 'rain') ww *= 1.3;
      return [id, ww];
    });
    let actual = weightedPick(items, rand, (x) => x[1])[0];
    if (d === 1 && EVENTS[actual].type === 'bad') actual = 'quiet'; // gentle opener

    const confId = weightedPick([['sure', 0.35], ['likely', 0.45], ['maybe', 0.2]], rand, (x) => x[1])[0];
    let forecast = actual;
    if (rand() > CONFIDENCE[confId].accuracy) forecast = pick(NEIGHBORS[actual], rand);
    days.push({ day: d, actual, forecast, confidence: confId });
    prev = actual;
  }

  // 2–4 rumors on days 4–29, never two within 3 days of each other.
  const nRumors = randInt(2, 4, rand);
  const candidates = shuffle(Array.from({ length: 26 }, (_, i) => i + 4), rand);
  const rumorDays = [];
  for (const d of candidates) {
    if (rumorDays.length >= nRumors) break;
    if (rumorDays.every((x) => Math.abs(x - d) >= 4)) rumorDays.push(d);
  }
  const rumorTypes = shuffle(Object.keys(RUMORS), rand);
  rumorDays.sort((a, b) => a - b).forEach((d, i) => {
    const odds = pick([0.3, 0.4, 0.5, 0.6], rand);
    const lead = pick([1, 2], rand);
    const happens = rand() < odds;
    const entry = days[d - 1];
    entry.rumor = { type: rumorTypes[i % rumorTypes.length], odds, announce: d - lead, happens };
    // A rumor day should not be a storm when it happens (keeps it legible).
    if (happens && EVENTS[entry.actual].type === 'bad') entry.actual = 'quiet';
  });

  return { mood: moodId, days };
}

export function oddsWords(p) {
  if (p <= 0.3) return 'not very likely';
  if (p <= 0.4) return 'maybe';
  if (p <= 0.5) return 'about a coin flip';
  return 'pretty likely';
}

export function oddsHelper(p) {
  return `about ${Math.round(p * 10)} in 10`;
}

// --- Surprise incidents ------------------------------------------------------

export const INCIDENTS = {
  viral: {
    kind: 'good', title: 'Your shop went viral!', helper: 'Your shop is on the internet!',
    desc: 'A clip of your parlor is racing around the internet. Everyone wants a taste.',
    effect: { buzzSpike: 0.3, crowdMult: 1.25, fame: 3 },
  },
  news: {
    kind: 'good', title: 'The local news featured you', helper: 'You were on TV!',
    desc: 'A TV crew did a little segment on your parlor this morning.',
    effect: { crowdMult: 1.4, fame: 2 },
  },
  coupon: {
    kind: 'good', title: 'Word of mouth', helper: 'People are telling friends!',
    desc: 'Last week\'s customers told their friends. New faces are coming in.',
    effect: { crowdMult: 1.3 },
  },
  breakdown: {
    kind: 'bad', title: 'The freezer is acting up', helper: 'The freezer broke!',
    desc: 'You lost half the day fixing the freezer.',
    effect: { crowdMult: 0.5 },
  },
  rival: {
    kind: 'bad', title: 'A rival cart opened nearby', helper: 'A new ice cream cart opened nearby.',
    desc: 'A new ice cream cart set up down the street. Crowds will be thinner for a few days.',
    effect: { dip: { mult: 0.8, days: [3, 4] } },
  },
  shortage: {
    kind: 'bad', title: 'Ingredient shortage', helper: 'Uh oh! Not enough ingredients.',
    desc: 'A supplier is running low.',
    effect: { shortage: { days: [3, 5] } },
  },
};

export function rollIncident(seed, day, rand) {
  if (day <= 2) return null;
  if (rand() > 0.16) return null;
  const good = rand() < 0.5;
  const pool = Object.entries(INCIDENTS).filter(([, v]) => v.kind === (good ? 'good' : 'bad'));
  // Shortages are the most interesting bad surprise: weight them up.
  const [id] = weightedPick(pool, rand, ([k]) => (k === 'shortage' ? 2 : 1));
  return id;
}

export function eventFor(id) {
  return { id, ...EVENTS[id] };
}
