import { tierIndexForScore, tierName } from '../game/reputation.js';
import { profileFor, TASTE_META } from '../game/flavors.js';

export function Header({ parlorName, current }) {
  const tier = tierName(tierIndexForScore(current.repScore));
  return (
    <header className="header">
      <div>
        <h1 className="parlor-name">{parlorName}</h1>
        <div className="header-sub">
          Day {current.day} of 30 · Season {current.seasonNumber}
        </div>
      </div>
      <div className="header-right">
        <div className="cash">${current.cash.toFixed(2)}</div>
        <div className="tier">{tier}</div>
      </div>
    </header>
  );
}

export function DayPips({ day }) {
  return (
    <div className="pips" aria-label={`Day ${day} of 30`}>
      {Array.from({ length: 30 }, (_, i) => {
        const d = i + 1;
        const cls = d < day ? 'pip past' : d === day ? 'pip today' : 'pip future';
        return <span key={d} className={cls} title={`Day ${d}`} />;
      })}
    </div>
  );
}

export function BuzzTag({ buzz }) {
  if (buzz > 0.65) return <span className="tag tag-buzzing">buzzing</span>;
  if (buzz >= 0.15 && buzz <= 0.45) return <span className="tag tag-fading">fading</span>;
  return null;
}

// A flavor's taste, shown so the player can read why it appeals to a crowd
// (🍬 sweet flavors win over kids, 🌶️ spicy over the adventurous, etc.).
export function TasteTag({ flavor }) {
  const meta = TASTE_META[profileFor(flavor).taste];
  if (!meta) return null;
  return (
    <span className={`tag taste-${profileFor(flavor).taste}`}>
      {meta.emoji} {meta.label}
    </span>
  );
}
