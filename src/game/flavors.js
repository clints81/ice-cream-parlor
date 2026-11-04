// Flavor demand profiles. Every flavor has a "taste" that decides which crowd
// it appeals to. Spicy and weird flavors are "exotic": fewer people try them,
// they cost more to make, and they can carry a higher price and build loyal
// fans. Player-invented flavors get a taste guessed from their name, and the
// player can change it in the vault.

export const TASTES = ['sweet', 'fruity', 'creamy', 'sour', 'spicy', 'weird'];

export const TASTE_META = {
  sweet: { emoji: '🍬', label: 'sweet', helperLabel: 'sweet', color: '#f472b6' },
  fruity: { emoji: '🍓', label: 'fruity', helperLabel: 'fruity', color: '#fb7185' },
  creamy: { emoji: '🍦', label: 'creamy', helperLabel: 'creamy', color: '#fde7c2' },
  sour: { emoji: '🍋', label: 'sour', helperLabel: 'sour', color: '#facc15' },
  spicy: { emoji: '🌶️', label: 'spicy', helperLabel: 'spicy', color: '#ef4444' },
  weird: { emoji: '🌀', label: 'weird', helperLabel: 'weird', color: '#a78bfa' },
};

// Which crowd each taste appeals to.
export const TASTE_SEGMENT = {
  sweet: 'kids',
  fruity: 'everyone',
  creamy: 'everyone',
  sour: 'adventurous',
  spicy: 'adventurous',
  weird: 'adventurous',
};

export function isExoticTaste(taste) {
  return taste === 'spicy' || taste === 'weird';
}

// [taste, base demand, price ceiling, cost per scoop]
const TABLE = {
  'bubble gum': ['sweet', 0.7, 3.5, 0.85],
  'blue raspberry': ['sweet', 0.8, 3.5, 0.85],
  'cotton candy': ['sweet', 0.72, 3.5, 0.85],
  'sugar cookie': ['sweet', 0.7, 3.5, 0.9],
  marshmallow: ['sweet', 0.66, 3.5, 0.85],
  'birthday cake': ['sweet', 0.74, 3.75, 0.95],
  caramel: ['sweet', 0.68, 3.75, 0.95],
  'cookie dough': ['sweet', 0.74, 3.75, 1.0],
  'cookies and cream': ['sweet', 0.76, 3.75, 1.0],
  'fudge brownie': ['sweet', 0.7, 3.75, 1.05],
  strawberry: ['fruity', 0.75, 3.75, 0.9],
  watermelon: ['fruity', 0.65, 3.5, 0.85],
  cherry: ['fruity', 0.65, 3.75, 0.9],
  mango: ['fruity', 0.66, 3.75, 0.95],
  banana: ['fruity', 0.58, 3.5, 0.8],
  peach: ['fruity', 0.62, 3.75, 0.95],
  vanilla: ['creamy', 0.7, 3.5, 0.8],
  chocolate: ['creamy', 0.78, 3.75, 0.95],
  'mint chocolate chip': ['creamy', 0.7, 3.75, 1.0],
  'rocky road': ['creamy', 0.64, 3.75, 1.05],
  'peanut butter': ['creamy', 0.6, 4.0, 1.05],
  honey: ['creamy', 0.5, 4.0, 1.0],
  'butter pecan': ['creamy', 0.55, 4.0, 1.1],
  cheesecake: ['creamy', 0.6, 4.25, 1.1],
  lemon: ['sour', 0.58, 3.75, 0.9],
  lime: ['sour', 0.55, 4.0, 0.9],
  'green apple': ['sour', 0.55, 4.0, 0.95],
  'sour cherry': ['sour', 0.5, 4.0, 0.95],
  tangerine: ['sour', 0.52, 4.0, 0.95],
  'jalapeño lemon': ['spicy', 0.3, 5.5, 1.8],
  'jalapeno lemon': ['spicy', 0.3, 5.5, 1.8],
  'spicy honey': ['spicy', 0.34, 5.0, 1.6],
  'chili chocolate': ['spicy', 0.36, 5.0, 1.7],
  'cinnamon fire': ['spicy', 0.32, 5.0, 1.5],
  'ghost pepper': ['spicy', 0.24, 5.5, 2.0],
  pickle: ['weird', 0.26, 5.0, 1.5],
  'pickle swirl': ['weird', 0.26, 5.0, 1.5],
  bacon: ['weird', 0.32, 5.25, 1.9],
  'maple bacon': ['weird', 0.34, 5.25, 1.9],
  lavender: ['weird', 0.34, 5.0, 1.6],
  'black sesame': ['weird', 0.3, 5.0, 1.7],
};

const KNOWN = Object.fromEntries(Object.entries(TABLE).map(([k, v]) => [k, v]));

// Keyword buckets for guessing a taste from an invented flavor's name.
// Priority order: the most distinctive taste wins.
const WORDS = {
  weird: [
    'pickle', 'garlic', 'bacon', 'cheese', 'onion', 'mustard', 'ketchup',
    'pollen', 'mystery', 'galaxy', 'alien', 'exploding', 'potato', 'corn',
    'broccoli', 'squid', 'olive', 'tomato', 'lavender', 'rose', 'sesame',
    'seaweed', 'popcorn', 'cereal', 'pretzel', 'slime', 'monster',
    'unicorn', 'dragon', 'zombie', 'cosmic', 'glitter',
  ],
  spicy: [
    'spicy', 'hot', 'jalapeño', 'jalapeno', 'sriracha', 'wasabi', 'ghost',
    'chili', 'chilli', 'habanero', 'fire', 'pepper', 'cayenne', 'flamin',
    'lava', 'volcano',
  ],
  sour: [
    'sour', 'lemon', 'lime', 'citrus', 'tangy', 'tart', 'tangerine',
    'grapefruit', 'kiwi',
  ],
  sweet: [
    'candy', 'sugar', 'gum', 'cookie', 'marshmallow', 'cake', 'caramel',
    'fudge', 'sprinkle', 'frosting', 'cotton', 'toffee', 'gummy', 'sweet',
    'brownie', 'doughnut', 'donut', 'pie', 'birthday', 'moon',
  ],
  creamy: [
    'cream', 'chocolate', 'peanut', 'butter', 'cheesecake', 'custard',
    'pudding', 'milk', 'coffee', 'mocha', 'nut', 'vanilla', 'mint', 'road',
    'neapolitan', 'neopolitan', 'neopoitan',
  ],
  fruity: [
    'strawberry', 'watermelon', 'cherry', 'mango', 'banana', 'peach', 'berry',
    'apple', 'grape', 'pineapple', 'raspberry', 'blueberry', 'coconut', 'melon',
    'orange', 'fruit',
  ],
};
// Note "spicy" wins over "weird" when both match ("Exploding Hot Sauce").
const PRIORITY = ['spicy', 'weird', 'sour', 'sweet', 'creamy', 'fruity'];

export function guessTaste(name) {
  const key = name.trim().toLowerCase();
  if (KNOWN[key]) return KNOWN[key][0];
  for (const t of PRIORITY) {
    if (WORDS[t].some((w) => key.includes(w))) return t;
  }
  return 'creamy';
}

// A small deterministic number in [0,1) from a name, so unknown flavors get
// slightly different stats instead of all being identical.
function nameJitter(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

const TASTE_DEFAULTS = {
  sweet: { base: 0.66, ceiling: 3.6, cost: [0.85, 1.0] },
  fruity: { base: 0.62, ceiling: 3.75, cost: [0.85, 1.0] },
  creamy: { base: 0.64, ceiling: 3.75, cost: [0.85, 1.1] },
  sour: { base: 0.52, ceiling: 4.0, cost: [0.9, 1.05] },
  spicy: { base: 0.3, ceiling: 5.1, cost: [1.4, 2.0] },
  weird: { base: 0.3, ceiling: 5.1, cost: [1.4, 2.0] },
};

// profileFor(name, tasteOverride?) → { taste, segment, base, ceiling, cost, exotic }
// If the player changes a known flavor's taste, the taste defaults are used.
export function profileFor(name, tasteOverride) {
  const key = name.trim().toLowerCase();
  const known = KNOWN[key];
  const taste = tasteOverride || (known ? known[0] : guessTaste(name));
  let base, ceiling, cost;
  if (known && known[0] === taste) {
    [, base, ceiling, cost] = known;
  } else {
    const d = TASTE_DEFAULTS[taste] || TASTE_DEFAULTS.creamy;
    const j = nameJitter(key);
    base = d.base + (j - 0.5) * 0.08;
    ceiling = d.ceiling;
    cost = Math.round((d.cost[0] + j * (d.cost[1] - d.cost[0])) * 20) / 20;
  }
  return {
    taste,
    segment: TASTE_SEGMENT[taste],
    base,
    ceiling,
    cost,
    exotic: isExoticTaste(taste),
  };
}

// ---- colors & icons ---------------------------------------------------------

const COLOR_WORDS = [
  ['mint', '#8be3b8'], ['pistachio', '#b5d99c'], ['chocolate', '#7b4a2e'],
  ['fudge', '#5c3a21'], ['brownie', '#6b4226'], ['coffee', '#8a5a3b'],
  ['mocha', '#8a5a3b'], ['vanilla', '#fbefd5'], ['strawberry', '#f59ab5'],
  ['cherry', '#d9304f'], ['raspberry', '#e0457b'], ['blueberry', '#6c7fd8'],
  ['blue', '#5aa9f0'], ['berry', '#b0466e'], ['lemon', '#fbe36b'],
  ['lime', '#a6e35b'], ['citrus', '#ffcd3c'], ['orange', '#ffa24c'],
  ['tangerine', '#ff9a3c'], ['mango', '#ffb547'], ['peach', '#ffc19e'],
  ['banana', '#fbe7a1'], ['watermelon', '#ff6f7d'], ['apple', '#9ad66b'],
  ['grape', '#9b6bd1'], ['cotton', '#f7b6e3'], ['bubble', '#ff9fd8'],
  ['birthday', '#ffd1ec'], ['cake', '#ffe0b8'], ['caramel', '#d9944a'],
  ['toffee', '#c98b4b'], ['honey', '#f2b84b'], ['peanut', '#d9a066'],
  ['cookie', '#c9a27a'], ['cream', '#fff4dc'], ['rocky', '#8a5b3e'],
  ['jalape', '#5dbb63'], ['pepper', '#e2483d'], ['hot', '#ef4b3a'],
  ['spicy', '#e8452c'], ['fire', '#ff6a2b'], ['chili', '#c9302c'],
  ['cinnamon', '#b8643a'], ['pickle', '#9fbf4a'], ['lavender', '#c3a6ea'],
  ['galaxy', '#5b4bc4'], ['moon', '#7fb6ff'], ['sesame', '#3d3a3a'],
  ['bacon', '#c46a50'], ['pollen', '#f5d14c'], ['rainbow', '#ff8fc7'],
  ['unicorn', '#e7a6ff'], ['doughnut', '#e9b07c'], ['donut', '#e9b07c'],
];

export function defaultColor(name) {
  const key = name.toLowerCase();
  for (const [w, c] of COLOR_WORDS) if (key.includes(w)) return c;
  return TASTE_META[guessTaste(name)].color;
}

export const ICON_CHOICES = [
  '', '🍫', '🍓', '🍋', '🌶️', '🍪', '🎂', '🍬', '🫐', '🍌', '🥭', '🍒', '🍯',
  '☕', '🌙', '⭐', '🔥', '🥒', '🍉', '🍑', '🥥', '🌈', '🦄', '👻', '🍭', '🌀',
];

export const COLOR_CHOICES = [
  '#7b4a2e', '#c9a27a', '#fbefd5', '#fff4dc', '#f59ab5', '#ff6f7d', '#d9304f',
  '#ffa24c', '#fbe36b', '#a6e35b', '#8be3b8', '#5aa9f0', '#6c7fd8', '#9b6bd1',
  '#c3a6ea', '#f7b6e3', '#e8452c', '#5dbb63', '#3d3a3a', '#d9944a',
];

export function makeVaultFlavor(name, extra = {}) {
  return { name: name.trim(), color: defaultColor(name), icon: '', taste: null, ...extra };
}

export function defaultPrice(prof) {
  return prof.exotic ? 4.0 : 3.0;
}

export const LOLLIPOP_PRICE = 1.0;
export const LOLLIPOP_COST = 0.3;
