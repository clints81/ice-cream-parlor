// Reputation is a hidden score; the player only ever sees tier names and
// surprise milestone cards. Notification text is built dynamically from the
// player's actual top flavor.
export const CHANNEL_NAMES = [
  'PokeSnackAttack', 'PikaBitesTV', 'SnorlaxSnacks', 'JigglyTreats',
  'ScoopDexDaily', 'EeveeEats',
];

export const REP_TIERS = [
  { score: 25, name: 'Local favorite' },
  { score: 60, name: 'Neighborhood buzz' },
  { score: 105, name: 'PokéTuber shoutout' },
  { score: 160, name: 'Featured in a video' },
  { score: 225, name: 'Filmed at your shop' },
  { score: 300, name: 'Sponsored flavor collab' },
];

export function tierIndexForScore(score) {
  let idx = -1;
  for (let i = 0; i < REP_TIERS.length; i++) {
    if (score >= REP_TIERS[i].score) idx = i;
  }
  return idx; // -1 = no tier yet
}

export function tierName(idx) {
  return idx >= 0 ? REP_TIERS[idx].name : 'New in town';
}

export function milestoneText(tierIdx, topFlavor, channel) {
  const flavor = topFlavor || 'your ice cream';
  switch (tierIdx) {
    case 0:
      return 'Word is getting around the neighborhood. People are starting to recognize your parlor.';
    case 1:
      return `A small food blog posted about your ${flavor}. A few new faces showed up today.`;
    case 2:
      return `${channel} just mentioned your ${flavor} in their latest video. Comments are asking where to find it.`;
    case 3:
      return `A mid-size PokéTuber did a 'hidden gems' episode and your parlor made the list. Traffic is up.`;
    case 4:
      return 'A popular PokéTuber reached out — they want to film a full video at your parlor. Lines around the block.';
    case 5:
      return `${channel} wants to create a signature flavor with you. It'll be a limited featured special with their name on it — and their audience will show up to try it.`;
    default:
      return '';
  }
}

export const COLLAB_FLAVOR_IDEAS = [
  'Cotton Candy Blast', 'Thunder Swirl', 'Berry Master Ball',
  'Galaxy Gummy Crunch', 'Snorlax Nap Fudge',
];
