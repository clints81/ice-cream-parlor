// Fame: a visible 0–100 meter. It rises with happy customers (especially ones
// who tried something exciting), fresh specials, and big moments. It falls
// with overpricing, a stale menu, and flops, and it slowly drifts down if you
// coast. Tier milestones arrive as surprise cards with text built from the
// player's real top flavor.

export const FAME_TIERS = [
  { at: 0, name: 'New in town', helper: 'New shop' },
  { at: 8, name: 'Local favorite', helper: 'Local favorite' },
  { at: 18, name: 'PokéTuber shoutout', helper: 'Got a shoutout' },
  { at: 30, name: 'Hidden gems video', helper: 'In a video' },
  { at: 44, name: 'Filmed at your shop', helper: 'Filmed here' },
  { at: 56, name: 'Sponsored flavor collab', helper: 'Flavor collab' },
  { at: 72, name: 'Destination spot', helper: 'Famous!' },
];

export const COLLAB_TIER = 5;

export function tierFor(fame) {
  let idx = 0;
  for (let i = 0; i < FAME_TIERS.length; i++) if (fame >= FAME_TIERS[i].at) idx = i;
  return idx;
}

export function tierName(idx, helper = false) {
  const t = FAME_TIERS[Math.max(0, idx)];
  return helper ? t.helper : t.name;
}

export function nextTierProgress(fame) {
  const idx = tierFor(fame);
  const cur = FAME_TIERS[idx];
  const next = FAME_TIERS[idx + 1];
  if (!next) return { idx, pct: 1, next: null };
  return { idx, pct: (fame - cur.at) / (next.at - cur.at), next };
}

export const CHANNEL_NAMES = [
  'PokeSnackAttack', 'PikaBitesTV', 'SnorlaxSnacks', 'JigglyTreats',
  'ScoopDexDaily', 'EeveeEats',
];

export const COLLAB_FLAVOR_IDEAS = [
  'Cotton Candy Blast', 'Thunder Swirl', 'Berry Master Ball',
  'Galaxy Gummy Crunch', 'Sleepy Nap Fudge',
];

export function milestoneText(tierIdx, topFlavor, channel) {
  const flavor = topFlavor || 'your ice cream';
  switch (tierIdx) {
    case 1:
      return `Word is getting around the neighborhood. People keep asking for your ${flavor}.`;
    case 2:
      return `${channel} just mentioned your ${flavor} in their latest video. Comments are asking where to find it.`;
    case 3:
      return `A PokéTuber did a "hidden gems" episode and your parlor made the list. They couldn't stop talking about the ${flavor}.`;
    case 4:
      return `${channel} reached out. They want to film a whole video at your parlor. Lines around the block!`;
    case 5:
      return `${channel} wants to make a signature flavor with you. It'll be a limited special with their name on it, and their fans will come to try it.`;
    case 6:
      return `People are driving in from other towns just to visit your parlor. Your ${flavor} is famous!`;
    default:
      return '';
  }
}
