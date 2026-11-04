import { useMemo, useState } from 'react';
import Storefront from '../art/Storefront.jsx';
import Chalkboard from './Chalkboard.jsx';
import RotateModal from './RotateModal.jsx';
import { ForecastCard, NewsCards, ShockCard, RumorCards, InventionCard } from './MorningCards.jsx';
import { Btn, ProgressBar, money } from './common.jsx';
import { forecastFor, needsDecision, pendingBatches, todayEntry, canPrice } from '../game/engine.js';
import { morningNotes, suggestMenu, suggestPrices } from '../game/advisor.js';
import { ambitionProgress, ambitionTitle, AMBITIONS } from '../game/ambitions.js';
import { tierFor } from '../game/fame.js';
import { RUMORS } from '../game/events.js';
import { unlockAudio, sfx } from '../audio/sound.js';

export function AmbitionCard({ season, T, helper }) {
  const prog = ambitionProgress(season, T);
  if (!prog) return null;
  const a = AMBITIONS[season.ambition.id];
  return (
    <section className="card ambition-now">
      <div className="amb-now-head">
        <span className="amb-emoji">{a.emoji}</span>
        <div>
          <div className="news-kicker">{helper ? 'My goal' : 'Season ambition'}</div>
          <strong>{ambitionTitle(season.ambition)}</strong>
        </div>
      </div>
      {prog.parts.map((p) => (
        <div key={p.label} className="amb-part">
          <div className="amb-part-top">
            <span>{p.label}</span>
            <span>
              <b>{p.value}</b> / {p.target}
            </span>
          </div>
          <ProgressBar pct={p.pct} label={p.label} tone={p.pct >= 1 ? 'mint' : 'pink'} />
        </div>
      ))}
    </section>
  );
}

export default function Parlor({ profile, season, ctx, actions }) {
  const helper = ctx.mode === 'helper';
  const [rotating, setRotating] = useState(false);
  const { event } = forecastFor(season);
  const tier = tierFor(season.fame);
  const meta = Object.fromEntries(profile.vault.map((v) => [v.name, v]));
  const menuAll = [...season.menu.featured, ...season.menu.regular];
  const colors = menuAll.map((f) => meta[f]?.color || '#ffb547');
  const notes = morningNotes(season, ctx);
  const blocked = needsDecision(season);
  const batches = pendingBatches(season, ctx);
  const entry = todayEntry(season);
  const rumorToday = entry.rumor && season.rumorChoices[season.day] === 'allin' ? RUMORS[entry.rumor.type] : null;
  const costLines = [
    { label: helper ? 'Shop costs' : 'Shop costs (rent, power, cones)', amount: ctx.T.overhead },
    ...batches.map((b) => ({ label: `${helper ? 'Test batch' : 'Test batch'}: ${b.flavor}`, amount: b.cost })),
    ...(rumorToday ? [{ label: helper ? 'Getting ready' : 'Big-day prep', amount: rumorToday.prep }] : []),
  ];
  const upfront = costLines.reduce((s, c) => s + c.amount, 0);

  const suggestion = useMemo(() => {
    if (!helper) return null;
    const m = suggestMenu(season, ctx);
    const p = suggestPrices(season, ctx, m.menu);
    const same =
      m.menu.regular.join('|') === season.menu.regular.join('|') &&
      m.menu.featured.join('|') === season.menu.featured.join('|') &&
      Object.entries(p.prices).every(([f, v]) => !canPrice(season, f, ctx) || season.prices[f] === v);
    return same ? null : { ...m, prices: p.prices, reason: m.reason };
  }, [helper, season, ctx]);

  function useSuggestion() {
    actions.setMenu(suggestion.menu);
    const prices = {};
    for (const [f, v] of Object.entries(suggestion.prices)) {
      // Only prices that can be changed today.
      if (canPrice({ ...season, menu: suggestion.menu }, f, ctx)) prices[f] = v;
    }
    actions.setPrices(prices);
    sfx.cheer();
  }

  const lineSize = [0, 1, 1, 2, 3, 5, 7][tier];

  return (
    <div className="parlor">
      <Storefront
        parlorName={profile.parlorName}
        time="morning"
        weather={event.weather}
        tier={tier}
        flavors={colors}
        line={lineSize}
        lineLooks={[season.seed % 1000, (season.seed >> 3) % 997, 77, 1234, 98765, 4321, 555]}
        open={false}
      />

      <div className="parlor-grid">
        <div className="parlor-main">
          <ForecastCard season={season} helper={helper} />
          <NewsCards season={season} helper={helper} />
          <ShockCard season={season} onChoose={actions.chooseShock} helper={helper} />
          <RumorCards season={season} onChoose={actions.chooseRumor} helper={helper} />
          <InventionCard season={season} onInvent={actions.invent} onSkip={actions.skipInvention} helper={helper} />
          <Chalkboard
            season={season}
            ctx={ctx}
            onPrices={actions.setPrices}
            onRotate={() => setRotating(true)}
            suggestion={suggestion}
            onUseSuggestion={useSuggestion}
          />
        </div>

        <aside className="parlor-side">
          <AmbitionCard season={season} T={ctx.T} helper={helper} />
          <section className="card costs">
            <h3>{helper ? 'Today you pay' : 'Costs before you sell anything'}</h3>
            <ul className="cost-list">
              {costLines.map((c) => (
                <li key={c.label}>
                  <span>{c.label}</span>
                  <span>{money(c.amount, helper)}</span>
                </li>
              ))}
            </ul>
            <div className="cost-total">
              <span>{helper ? 'Total' : 'Total'}</span>
              <span>{money(upfront, helper)}</span>
            </div>
          </section>
          {notes.length > 0 && (
            <section className="card notes">
              <h3>{helper ? 'Tips' : 'Notes'}</h3>
              <ul>
                {notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <div className="open-bar">
        <Btn
          kind="primary"
          big
          className="btn-open"
          disabled={menuAll.length === 0 || !!blocked}
          onClick={() => {
            unlockAudio();
            sfx.bell();
            actions.runDay();
          }}
        >
          {blocked ? (helper ? 'Decide about the shortage first ↑' : 'Decide about the shortage first ↑') : helper ? 'Open the shop! 🍦' : 'Open for business! 🍦'}
        </Btn>
      </div>

      {rotating && (
        <RotateModal
          season={season}
          ctx={ctx}
          onClose={() => setRotating(false)}
          onSave={(menu) => {
            actions.setMenu(menu);
            setRotating(false);
          }}
        />
      )}
    </div>
  );
}
