import { profileFor } from './flavors.js';
import { eventForDay } from './events.js';
import { isPricingDay, nextPricingDay } from './pricing.js';

export function buzzStatus(b) {
  if (b > 0.65) return 'buzzing';
  if (b >= 0.15 && b <= 0.45) return 'fading';
  return null;
}

const SEGMENT_LABEL = {
  kids: 'kid-friendly',
  adventurous: 'adventurous',
  everyone: 'crowd-pleasing',
};

// Morning notes: reads today's event + current menu + buzz together.
// Easy mode keeps it short and skips the pricing/economics hints.
export function morningNotes({ day, event, regular, featured, buzz, easyMode = false }) {
  const notes = [];

  if (event.segment) {
    const matches = [...regular, ...featured].filter(
      (f) => profileFor(f).segment === event.segment,
    );
    if (matches.length > 0) {
      notes.push(
        `${SEGMENT_LABEL[event.segment][0].toUpperCase() + SEGMENT_LABEL[event.segment].slice(1)} day — ${matches.join(' and ')} should do well. Make sure they stay on the menu.`,
      );
    } else {
      notes.push(
        `Today's crowd leans ${SEGMENT_LABEL[event.segment]}, but nothing on your menu fits. Worth a rotation?`,
      );
    }
  }

  for (const f of featured) {
    const b = buzz[f] || 0;
    const status = buzzStatus(b);
    if (status === 'fading') {
      notes.push(`${f}'s buzz is starting to fade — you might get one more good day out of it.`);
    } else if (status === 'buzzing') {
      notes.push(`${f} is buzzing right now. Keep it featured while it's hot.`);
    } else if (b < 0.15) {
      notes.push(`${f} is early in its featured run. New specials take a few days to catch on.`);
    }
  }

  if (!easyMode && event.type === 'bad') {
    notes.push('A quiet day like this is a low-risk time to try something new on the menu.');
  }

  if (!easyMode) {
    if (isPricingDay(day)) {
      notes.push(`Prices are unlocked today. Whatever you set holds until Day ${nextPricingDay(day)}.`);
    } else if (isPricingDay(day + 1) && day + 1 <= 30) {
      notes.push("Pricing day tomorrow — pay attention to today's reactions before you lock anything in.");
    }
  }

  return notes.slice(0, easyMode ? 2 : 4);
}

// Evening notes: "what to think about tomorrow."
export function eveningNotes({
  day, seasonSeed, result, regular, featured, buzz, prices = {}, easyMode = false,
}) {
  const notes = [];

  const zeroSellers = [...regular, ...featured].filter((f) => (result.scoops[f] || 0) === 0);
  if (zeroSellers.length > 0) {
    notes.push(`Nobody ordered ${zeroSellers.join(' or ')} today. Worth rotating out?`);
  }

  for (const f of featured) {
    const status = buzzStatus(buzz[f] || 0);
    if (status === 'fading') {
      notes.push(`${f}'s buzz is fading. Think about what could take its featured spot.`);
    } else if (status === 'buzzing') {
      notes.push(`${f} is buzzing — riding it another day could pay off.`);
    }
  }

  // Discovery-style margin nudge: a popular flavor priced too close to its
  // ingredient cost. Never names "margin"; suppressed in easy mode.
  if (!easyMode) {
    const best = result.bestFlavor;
    if (best && (result.scoops[best] || 0) >= 4) {
      const price = prices[best] ?? 3;
      const margin = price - profileFor(best).cost;
      if (price > 0 && margin / price < 0.5) {
        notes.push(
          `You sold a lot of ${best} today, but each scoop barely covers what it costs to make. Could it handle a slightly higher price?`,
        );
      }
    }
  }

  if (day < 30) {
    const tomorrow = eventForDay(seasonSeed, day + 1);
    notes.push(`Tomorrow: ${tomorrow.title}. ${tomorrow.hint}`);
    if (!easyMode && isPricingDay(day + 1)) {
      notes.push("Tomorrow is a pricing day. Today's customer reactions are your best clue.");
    }
  }

  return notes.slice(0, 4);
}
