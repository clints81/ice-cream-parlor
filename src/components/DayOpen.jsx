import { useState } from 'react';
import { Header, DayPips, BuzzTag, TasteTag } from './common.jsx';
import RotateModal from './RotateModal.jsx';
import { eventForDay } from '../game/events.js';
import { morningNotes } from '../game/advisor.js';
import { isPricingDay, nextPricingDay } from '../game/pricing.js';
import { LOLLIPOP_PRICE } from '../game/simulate.js';
import { profileFor } from '../game/flavors.js';

export default function DayOpen({
  parlorName, current, onRotate, onPrices, onOpen, onInvent, onSkipInvention, onSwitch,
}) {
  const c = current;
  const [rotating, setRotating] = useState(false);
  const [inventDraft, setInventDraft] = useState('');
  const event = eventForDay(c.seasonSeed, c.day);
  const dipActive = c.activeDip && c.day >= c.activeDip.startDay && c.day <= c.activeDip.endDay;
  const pricingDay = isPricingDay(c.day);
  const notes = morningNotes({
    day: c.day, event, regular: c.menu.regular, featured: c.menu.featured,
    buzz: c.buzz, easyMode: c.easyMode,
  });
  const showInvention = c.day >= c.inventionDay && !c.inventionDone;
  const menuEmpty = c.menu.regular.length + c.menu.featured.length === 0;

  return (
    <div className="app">
      <Header parlorName={parlorName} current={c} />
      <DayPips day={c.day} />

      <section className={`event-hero event-${event.type}`}>
        <div className="event-type">{event.type === 'great' ? '★ great day ahead' : event.type === 'good' ? 'good day ahead' : event.type === 'bad' ? 'tough day ahead' : 'ordinary day'}</div>
        <h2>{event.title}</h2>
        <p>{event.desc}</p>
        <p className="event-hint">{event.hint}</p>
      </section>

      {c.incident && (
        <section className={`card incident-card incident-${c.incident.kind}`}>
          <strong>{c.incident.kind === 'good' ? '🎉 ' : '⚠️ '}{c.incident.title}</strong>{' '}
          {c.incident.desc}
        </section>
      )}
      {!c.incident && dipActive && (
        <section className="card incident-card incident-bad">
          A rival cart is still pulling some of your crowd — expect it to stay quieter
          through Day {c.activeDip.endDay}.
        </section>
      )}

      {c.activeShock && (
        <section className="card shock-card">
          <strong>Supply shortage!</strong> There's been a shortage of{' '}
          {c.activeShock.flavor.toLowerCase()} syrup — <strong>{c.activeShock.flavor}</strong> is
          unavailable until Day {c.activeShock.endDay + 1}. Fill its slot with something else.
        </section>
      )}
      {c.shockJustEnded && (
        <section className="card shock-over-card">
          The shortage is over — <strong>{c.shockJustEnded}</strong> is back in your vault.
        </section>
      )}
      {c.collab && (
        <section className="card collab-card">
          <strong>{c.collab.flavor}</strong> is live! {c.collab.channel}'s audience knows about
          it. Limited run through Day {c.collab.endDay}.
        </section>
      )}
      {c.collabJustEnded && (
        <section className="card shock-over-card">
          The <strong>{c.collabJustEnded}</strong> limited run has ended. What a week.
        </section>
      )}

      {showInvention && (
        <section className="card invention-card">
          <strong>You've been experimenting in the back kitchen.</strong> Want to add a new
          flavor to your vault?
          <form
            className="flavor-add-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (inventDraft.trim()) onInvent(inventDraft.trim());
            }}
          >
            <input
              className="big-input"
              placeholder="Name your new creation…"
              value={inventDraft}
              onChange={(e) => setInventDraft(e.target.value)}
              maxLength={40}
            />
            <button className="btn btn-primary" type="submit" disabled={!inventDraft.trim()}>
              Add it
            </button>
            <button className="btn" type="button" onClick={onSkipInvention}>
              Not today
            </button>
          </form>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h3>Today's menu</h3>
          <button className="btn" onClick={() => setRotating(true)}>Rotate flavors</button>
        </div>
        <div className="menu-list">
          {c.menu.regular.map((f) => (
            <div key={f} className="menu-item">
              <span className="dot dot-regular" />
              <span className="menu-name">{f}</span>
              <TasteTag flavor={f} />
              <BuzzTag buzz={c.buzz[f] || 0} />
              <span className="menu-price">${(c.prices[f] ?? 3).toFixed(2)}</span>
            </div>
          ))}
          {c.menu.featured.map((f) => (
            <div key={f} className="menu-item menu-featured">
              <span className="dot dot-featured" />
              <span className="menu-name">{f} <em>featured special</em></span>
              <TasteTag flavor={f} />
              <BuzzTag buzz={c.buzz[f] || 0} />
              <span className="menu-price">${(c.prices[f] ?? 3).toFixed(2)}</span>
            </div>
          ))}
          <div className="menu-item menu-lollipop">
            <span className="dot dot-lollipop" />
            <span className="menu-name">Lollipops <em>always available</em></span>
            <span className="menu-price">${LOLLIPOP_PRICE.toFixed(2)}</span>
          </div>
        </div>
        {menuEmpty && <p className="warn">Your menu is empty — rotate some flavors in.</p>}
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Prices</h3>
          {!pricingDay && (
            <span className="muted">Locked until Day {nextPricingDay(c.day) ?? '— (season over)'}</span>
          )}
          {pricingDay && <span className="tag tag-pricing">pricing day</span>}
        </div>
        {pricingDay ? (
          <div className="price-grid">
            {[...c.menu.regular, ...c.menu.featured].map((f) => {
              const price = c.prices[f] ?? 3;
              const cost = profileFor(f).cost;
              const margin = price - cost;
              return (
                <label key={f} className="price-row price-row-edit">
                  <span className="price-name">{f}</span>
                  {!c.easyMode && (
                    <span className="price-cost">costs ${cost.toFixed(2)}</span>
                  )}
                  <span className="price-input">
                    $
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.25"
                      value={price}
                      onChange={(e) =>
                        onPrices({ ...c.prices, [f]: parseFloat(e.target.value) || 1 })
                      }
                    />
                  </span>
                  {!c.easyMode && (
                    <span className={margin <= 0 ? 'price-margin neg' : 'price-margin'}>
                      {margin >= 0 ? '+' : '−'}${Math.abs(margin).toFixed(2)}/scoop
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        ) : (
          <div className="price-grid">
            {[...c.menu.regular, ...c.menu.featured].map((f) => (
              <div key={f} className="price-row">
                <span>{f}</span>
                <span>${(c.prices[f] ?? 3).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card advisor">
        <h3>Advisor's notes</h3>
        <ul>
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>

      <button className="btn btn-primary btn-open" disabled={menuEmpty} onClick={onOpen}>
        Open for business
      </button>

      <footer className="footer">
        <button className="link-btn" onClick={onSwitch}>← Switch player</button>
      </footer>

      {rotating && (
        <RotateModal
          current={c}
          onClose={() => setRotating(false)}
          onSave={(menu) => { onRotate(menu); setRotating(false); }}
        />
      )}
    </div>
  );
}
