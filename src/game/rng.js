// Deterministic randomness. Every random outcome in a season is derived from
// the season seed plus a "salt" (day number, purpose), so the same save always
// produces the same results: refreshing the page can never reroll anything.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mix any number of numbers/strings into one 32-bit seed.
export function hashSeed(...parts) {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    const s = String(p);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  }
  return h >>> 0;
}

export function makeRng(...parts) {
  return mulberry32(hashSeed(...parts));
}

export function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

export function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

export function randInt(min, max, rand) {
  return min + Math.floor(rand() * (max - min + 1));
}

export function chance(p, rand) {
  return rand() < p;
}

// items: [{ ..., weight }] or [[value, weight]]
export function weightedPick(items, rand, weightOf = (x) => x.weight) {
  const total = items.reduce((s, x) => s + Math.max(0, weightOf(x)), 0);
  let roll = rand() * total;
  for (const x of items) {
    roll -= Math.max(0, weightOf(x));
    if (roll <= 0) return x;
  }
  return items[items.length - 1];
}

export function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
