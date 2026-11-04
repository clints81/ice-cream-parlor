import { tierName } from '../game/reputation.js';

export default function SeasonEnd({ parlorName, summary, onNewSeason, onSwitch }) {
  return (
    <div className="app setup">
      <h1 className="setup-title">🍦 {parlorName}</h1>
      <h2>Season {summary.seasonNumber} complete!</h2>

      <section className="card results-summary">
        <div className="stat-row">
          <div className="stat">
            <div className="stat-value">${summary.finalCash.toFixed(2)}</div>
            <div className="stat-label">final cash</div>
          </div>
          <div className="stat">
            <div className="stat-value">{summary.totalCustomers}</div>
            <div className="stat-label">total customers</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              {summary.bestDay ? `$${(summary.bestDay.profit ?? summary.bestDay.revenue ?? 0).toFixed(2)}` : '—'}
            </div>
            <div className="stat-label">
              best day{summary.bestDay ? ` (Day ${summary.bestDay.day})` : ''}
            </div>
          </div>
          <div className="stat">
            <div className="stat-value">{tierName(summary.finalTier)}</div>
            <div className="stat-label">reputation</div>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Top flavors this season</h3>
        <ol className="top-flavors">
          {summary.topFlavors.map((t) => (
            <li key={t.flavor}>
              {t.flavor} — {t.scoops} scoops
            </li>
          ))}
        </ol>
      </section>

      <button className="btn btn-primary btn-open" onClick={onNewSeason}>
        Start Season {summary.seasonNumber + 1} →
      </button>
      <footer className="footer">
        <button className="link-btn" onClick={onSwitch}>← Back to players</button>
      </footer>
    </div>
  );
}
