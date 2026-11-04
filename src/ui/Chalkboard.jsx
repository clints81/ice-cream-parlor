import { Scoop } from '../art/Cone.jsx';
import { Btn, Stepper, money } from './common.jsx';
import { TASTE_META, LOLLIPOP_PRICE, LOLLIPOP_COST } from '../game/flavors.js';
import { profilesFor, canPrice, nextPricingDay, isPricingDay, pendingBatches } from '../game/engine.js';
import { buzzLabel, roundHalf } from '../game/advisor.js';

function ChalkScoop({ color, icon, star }) {
  return (
    <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
      <Scoop color={color} cx={20} cy={21} r={14} icon={icon} chalk star={star} />
    </svg>
  );
}

// "It costs you $1. You charge $3. You keep $2." (whole dollars / 50¢ steps)
export function UnitLesson({ cost, price }) {
  const c = roundHalf(cost);
  const keep = price - c;
  return (
    <span className="unit-lesson">
      It costs you <b>{money(c, true)}</b>. You charge <b>{money(price, true)}</b>.{' '}
      {keep >= 0 ? (
        <>You keep <b className="keep">{money(keep, true)}</b>.</>
      ) : (
        <>You <b className="lose">lose {money(-keep, true)}</b>!</>
      )}
    </span>
  );
}

export default function Chalkboard({ season, ctx, onPrices, onRotate, suggestion, onUseSuggestion }) {
  const helper = ctx.mode === 'helper';
  const profs = profilesFor(season, ctx.vault);
  const meta = Object.fromEntries(ctx.vault.map((v) => [v.name, v]));
  const rows = [
    ...season.menu.featured.map((f) => ({ f, featured: true })),
    ...season.menu.regular.map((f) => ({ f, featured: false })),
  ];
  const batches = Object.fromEntries(pendingBatches(season, ctx).map((b) => [b.flavor, b]));
  const step = helper ? 0.5 : 0.25;
  const anyPriceable = rows.some(({ f }) => canPrice(season, f, ctx));
  const priceNote = ctx.dailyPricing
    ? null
    : isPricingDay(season.day)
      ? helper ? 'Price day! You can change prices.' : 'Pricing day: set prices for the week.'
      : `🔒 ${helper ? 'Prices stay the same until Day' : 'Prices locked until Day'} ${nextPricingDay(season.day) ?? '—'}`;

  return (
    <section className="chalkboard" aria-label="Today's menu">
      <div className="chalk-frame">
        <div className="chalk-head">
          <h2 className="chalk-title">{helper ? 'Menu' : "Today's Menu"}</h2>
          <Btn kind="chalk" onClick={onRotate}>
            {helper ? '🔄 Change flavors' : '🔄 Rotate flavors'}
          </Btn>
        </div>

        {suggestion && (
          <div className="suggest">
            <span className="suggest-text">💡 {suggestion.reason}</span>
            <Btn kind="sun" onClick={onUseSuggestion}>
              Use this idea
            </Btn>
          </div>
        )}

        {rows.length === 0 && <p className="chalk-empty">{helper ? 'No flavors yet! Tap Change flavors.' : 'Nothing on the menu yet. Rotate some flavors in.'}</p>}

        <ul className="chalk-list">
          {rows.map(({ f, featured }) => {
            const prof = profs[f];
            const m = meta[f] || { color: '#ffb547', icon: '🎁' };
            const price = season.prices[f] ?? 3;
            const editable = canPrice(season, f, ctx);
            const status = featured ? buzzLabel(season, f) : null;
            const fans = season.fans[f] || 0;
            const surge = season.shock?.choice === 'pay' && season.shock.flavor === f ? season.shock.surge : 0;
            const cost = prof.cost + surge;
            return (
              <li key={f} className={`chalk-row ${featured ? 'chalk-featured' : ''}`}>
                <ChalkScoop color={m.color} icon={m.icon} star={featured} />
                <div className="chalk-mid">
                  <div className="chalk-name">
                    {f}
                    {featured && <span className="chalk-special">{helper ? 'special!' : 'featured special'}</span>}
                  </div>
                  <div className="chalk-tags">
                    <span className="chalk-tag">{TASTE_META[prof.taste].emoji} {TASTE_META[prof.taste].label}</span>
                    {status && <span className={`chalk-tag chalk-${status}`}>{status}</span>}
                    {fans >= 1 && <span className="chalk-tag chalk-fans">♥ {Math.round(fans)} fans</span>}
                    {batches[f] && <span className="chalk-tag chalk-new">{helper ? 'New!' : 'new: test batch'} {money(batches[f].cost, helper)}</span>}
                    {surge > 0 && <span className="chalk-tag chalk-surge">+{money(surge, helper)} shortage</span>}
                  </div>
                  {helper ? (
                    <UnitLesson cost={cost} price={price} />
                  ) : (
                    <div className="chalk-cost">
                      costs {money(cost)} · you keep {money(price - cost)}
                    </div>
                  )}
                </div>
                <Stepper
                  value={price}
                  step={step}
                  min={1}
                  max={8}
                  disabled={!editable}
                  label={`${f} price`}
                  format={(v) => money(v, helper)}
                  onChange={(v) => onPrices({ [f]: v })}
                />
              </li>
            );
          })}
          <li className="chalk-row chalk-lolly">
            <span className="lolly-icon" aria-hidden="true">🍭</span>
            <div className="chalk-mid">
              <div className="chalk-name">Lollipops</div>
              {helper ? (
                <UnitLesson cost={LOLLIPOP_COST} price={LOLLIPOP_PRICE} />
              ) : (
                <div className="chalk-cost">always on the counter · costs {money(LOLLIPOP_COST)}</div>
              )}
            </div>
            <span className="step-val">{money(LOLLIPOP_PRICE, helper)}</span>
          </li>
        </ul>
        {priceNote && anyPriceable !== undefined && <div className="chalk-note">{priceNote}</div>}
      </div>
    </section>
  );
}
