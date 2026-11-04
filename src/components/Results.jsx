import { Header, DayPips, TasteTag } from './common.jsx';
import { eventRecap } from '../game/simulate.js';
import { eveningNotes, buzzStatus } from '../game/advisor.js';
import { REP_TIERS } from '../game/reputation.js';

export default function Results({ parlorName, current, onNextDay }) {
  const c = current;
  const { day, event, result, milestones, buzzBefore = {} } = c.lastResult;
  const menuAll = [...c.menu.regular, ...c.menu.featured];
  const maxScoops = Math.max(1, ...menuAll.map((f) => result.scoops[f] || 0));
  const notes = eveningNotes({
    day, seasonSeed: c.seasonSeed, result,
    regular: c.menu.regular, featured: c.menu.featured, buzz: c.buzz,
    prices: c.prices, easyMode: c.easyMode,
  });

  return (
    <div className="app">
      <Header parlorName={parlorName} current={c} />
      <DayPips day={day} />

      {milestones.map((m) => (
        <section key={m.tier} className="milestone-card">
          <div className="milestone-kicker">✦ {REP_TIERS[m.tier].name} ✦</div>
          <p>{m.text}</p>
        </section>
      ))}

      <section className="card results-summary">
        <div className="card-head">
          <h2>Day {day} results</h2>
          <span className={`tag tag-quality q-${result.quality.split(' ')[0].toLowerCase()}`}>
            {result.quality}
          </span>
        </div>
        <div className="stat-row">
          <div className="stat">
            <div className="stat-value">${result.revenue.toFixed(2)}</div>
            <div className="stat-label">revenue</div>
          </div>
          <div className="stat">
            <div className="stat-value">{result.customerCount}</div>
            <div className="stat-label">customers</div>
          </div>
          <div className="stat">
            <div className="stat-value">{result.bestFlavor || '—'}</div>
            <div className="stat-label">best seller</div>
          </div>
          <div className="stat">
            <div className="stat-value">{result.lollipops}</div>
            <div className="stat-label">lollipops (+${result.lollipopRevenue.toFixed(2)})</div>
          </div>
        </div>
        {!c.easyMode && (
          <div className="profit-line">
            <span>Revenue ${result.revenue.toFixed(2)}</span>
            <span className="profit-minus">− ingredients ${(result.cogs ?? 0).toFixed(2)}</span>
            <span className="profit-eq">
              = profit <strong>${(result.profit ?? result.revenue).toFixed(2)}</strong>
            </span>
          </div>
        )}
        <p className="muted">{eventRecap(event, result)}</p>
      </section>

      <section className="card">
        <h3>Flavor performance</h3>
        <div className="bars">
          {menuAll.map((f) => {
            const n = result.scoops[f] || 0;
            return (
              <div key={f} className="bar-row">
                <span className="bar-label">{f} <TasteTag flavor={f} /></span>
                <div className="bar-track">
                  <div
                    className={c.menu.featured.includes(f) ? 'bar bar-featured' : 'bar'}
                    style={{ width: `${Math.max(2, (n / maxScoops) * 100)}%` }}
                  />
                </div>
                <span className="bar-value">
                  {n} scoop{n === 1 ? '' : 's'} · ${(result.flavorRevenue[f] || 0).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {c.menu.featured.length > 0 && (
        <section className="card">
          <h3>Featured special buzz</h3>
          {c.menu.featured.map((f) => {
            const now = c.buzz[f] || 0;
            const before = buzzBefore[f] || 0;
            const status = buzzStatus(now);
            const dir = now > before ? 'up' : now < before ? 'down' : 'steady';
            return (
              <div key={f} className="buzz-row">
                <span className="menu-name">{f}</span>
                <span className="buzz-pct">{Math.round(now * 100)}% buzz</span>
                <span className={`buzz-dir ${dir}`}>
                  {dir === 'up' ? '▲ up today' : dir === 'down' ? '▼ down today' : '— steady'}
                </span>
                {status && <span className={`tag tag-${status}`}>{status}</span>}
              </div>
            );
          })}
        </section>
      )}

      {result.reactions.length > 0 && (
        <section className="card">
          <h3>Customer reactions</h3>
          <div className="reactions">
            {result.reactions.map((r, i) => (
              <div key={i} className={`reaction reaction-${r.tone}`}>
                <span className="avatar">{r.initials}</span>
                <span className="quote">“{r.quote}”</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card advisor">
        <h3>What to think about tomorrow</h3>
        <ul>
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>

      <button className="btn btn-primary btn-open" onClick={onNextDay}>
        {day >= 30 ? 'See season summary →' : `On to Day ${day + 1} →`}
      </button>
    </div>
  );
}
