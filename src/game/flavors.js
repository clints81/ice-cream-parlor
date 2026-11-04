// Flavor demand profiles. Every flavor has a "taste" (sweet/fruity/creamy/
// sour/spicy) that determines which crowd it appeals to and is shown to the
// player as a visible tag. Player-invented flavors not in the database get a
// taste inferred from their name.

export const TASTE_META = {
  sweet: { emoji: '🍬', label: 'sweet' },
  fruity: { emoji: '🍓', label: 'fruity' },
  creamy: { emoji: '🍦', label: 'creamy' },
  sour: { emoji: '🍋', label: 'sour' },
  spicy: { emoji: '🌶️', label: 'spicy' },
};

// Which crowd each taste appeals to. This is the legibility fix: the segment
// is now a readable property of the flavor, not a hidden number.
const TASTE_SEGMENT = {
  sweet: 'kids',
  fruity: 'everyone',
  creamy: 'everyone',
  sour: 'adventurous',
  spicy: 'adventurous',
};

// Compact table: [taste, base demand, price ceiling, ingredient cost, exotic].
// segment is derived from taste; exotic defaults to false.
const TABLE = {
  // sweet → kids
  'bubble gum': ['sweet', 0.7, 3.5, 0.8],
  'blue raspberry': ['sweet', 0.8, 3.5, 0.8],
  'cotton candy': ['sweet', 0.72, 3.5, 0.8],
  'sugar cookie': ['sweet', 0.7, 3.5, 0.85],
  marshmallow: ['sweet', 0.66, 3.5, 0.8],
  'birthday cake': ['sweet', 0.74, 3.75, 0.9],
  caramel: ['sweet', 0.68, 3.75, 0.95],
  // fruity → everyone
  strawberry: ['fruity', 0.75, 3.75, 0.85],
  watermelon: ['fruity', 0.65, 3.5, 0.8],
  cherry: ['fruity', 0.65, 3.75, 0.85],
  mango: ['fruity', 0.66, 3.75, 0.9],
  banana: ['fruity', 0.58, 3.5, 0.8],
  peach: ['fruity', 0.62, 3.75, 0.9],
  // creamy → everyone
  vanilla: ['creamy', 0.7, 3.5, 0.9],
  chocolate: ['creamy', 0.78, 3.75, 1.0],
  'peanut butter': ['creamy', 0.6, 4.0, 1.05],
  honey: ['creamy', 0.5, 4.0, 1.0],
  'butter pecan': ['creamy', 0.55, 4.0, 1.15],
  cheesecake: ['creamy', 0.6, 4.25, 1.15],
  // sour → adventurous
  lemon: ['sour', 0.58, 3.75, 0.9],
  lime: ['sour', 0.55, 4.0, 0.9],
  'green apple': ['sour', 0.55, 4.0, 0.95],
  'sour cherry': ['sour', 0.5, 4.0, 0.95],
  tangerine: ['sour', 0.52, 4.0, 0.95],
  // spicy → adventurous (exotic)
  'jalapeño lemon': ['spicy', 0.28, 5.5, 1.3, true],
  'jalapeno lemon': ['spicy', 0.28, 5.5, 1.3, true],
  'spicy honey': ['spicy', 0.32, 5.0, 1.2, true],
  'chili chocolate': ['spicy', 0.34, 5.0, 1.25, true],
  'cinnamon fire': ['spicy', 0.3, 5.0, 1.2, true],
  'ghost pepper': ['spicy', 0.22, 5.5, 1.4, true],
};

function build([taste, base, ceiling, cost, exotic = false]) {
  return { taste, base, ceiling, cost, exotic, segment: TASTE_SEGMENT[taste] };
}

const KNOWN_PROFILES = Object.fromEntries(
  Object.entries(TABLE).map(([name, spec]) => [name, build(spec)]),
);

// Keyword buckets for inferring a taste from an invented flavor's name.
// Checked in priority order: the most distinctive taste wins (a "Sour
// Watermelon Blast" is sour/adventurous, not fruity).
const SPICY_WORDS = [
  'spicy', 'hot', 'jalapeño', 'jalapeno', 'sriracha', 'wasabi', 'ghost',
  'chili', 'chilli', 'habanero', 'fire', 'pepper', 'cayenne', 'cinnamon', 'flamin',
];
const SOUR_WORDS = [
  'sour', 'lemon', 'lime', 'citrus', 'tangy', 'tart', 'tangerine',
  'grapefruit', 'kiwi', 'pickle',
];
const SWEET_WORDS = [
  'candy', 'sugar', 'gum', 'cookie', 'marshmallow', 'cake', 'caramel',
  'fudge', 'sprinkle', 'frosting', 'cotton', 'toffee', 'gummy', 'sweet',
];
const CREAMY_WORDS = [
  'cream', 'chocolate', 'peanut', 'butter', 'cheesecake', 'custard',
  'pudding', 'milk', 'coffee', 'mocha', 'nut', 'vanilla',
];
const FRUIT_WORDS = [
  'strawberry', 'watermelon', 'cherry', 'mango', 'banana', 'peach', 'berry',
  'apple', 'grape', 'pineapple', 'raspberry', 'blueberry', 'coconut', 'melon',
  'orange', 'fruit',
];

// Per-taste defaults for flavors we don't recognize by name.
const TASTE_DEFAULTS = {
  sweet: { base: 0.5, ceiling: 4.0, cost: 0.8, exotic: false },
  fruity: { base: 0.5, ceiling: 4.0, cost: 0.85, exotic: false },
  creamy: { base: 0.5, ceiling: 4.0, cost: 1.0, exotic: false },
  sour: { base: 0.5, ceiling: 4.0, cost: 0.9, exotic: false },
  spicy: { base: 0.3, ceiling: 5.0, cost: 1.3, exotic: true },
};

function inferTaste(key) {
  if (SPICY_WORDS.some((w) => key.includes(w))) return 'spicy';
  if (SOUR_WORDS.some((w) => key.includes(w))) return 'sour';
  if (SWEET_WORDS.some((w) => key.includes(w))) return 'sweet';
  if (CREAMY_WORDS.some((w) => key.includes(w))) return 'creamy';
  if (FRUIT_WORDS.some((w) => key.includes(w))) return 'fruity';
  return 'creamy'; // safe default: a plain everyone-pleaser
}

export function profileFor(name) {
  const key = name.trim().toLowerCase();
  if (KNOWN_PROFILES[key]) return KNOWN_PROFILES[key];
  const taste = inferTaste(key);
  const d = TASTE_DEFAULTS[taste];
  return { taste, segment: TASTE_SEGMENT[taste], ...d };
}

export const DEFAULT_PRICE = 3.0;
export const LOLLIPOP_COST = 0.25;
