import { useEffect } from 'react';
import Cone from '../art/Cone.jsx';
import Confetti from '../art/Confetti.jsx';
import { Btn, ProgressBar, wholeMoney } from './common.jsx';
import { tierName } from '../game/fame.js';
import { MOODS } from '../game/events.js';
import { sfx } from '../audio/sound.js';

function Chart({ history, startCash }) {
  if (!history?.length) return null;
  const W = 300;
  const H = 90;
  const cash = [startCash, ...history.map((h) => h.cash)];
  const fame = [0, ...history.map((h) => h.fame)];
  const max = Math.max(...cash, 1);
  const min = Math.min(0, ...cash);
  const x = (i) => (i / (cash.length - 1)) * W;
  const y = (v) => H - ((v - min) / (max - min || 1)) * (H - 8) - 4;
  const yf = (v) => H - (v / 100) * (H - 8) - 4;
  const path = (arr, fy) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${fy(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Cash and fame over the season">
      {min < 0 && <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="#e8d5c4" strokeDasharray="4 4" />}
      <path d={path(fame, yf)} fill="none" stroke="#9b6bd1" strokeWidth="2.5" strokeLinecap="round" />
      <path d={path(cash, y)} fill="none" stroke="#3cc8a7" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function SeasonReport({ card, onClose, closeLabel = 'Back', celebrate = false, helper = false, startCash = 60 }) {
  useEffect(() => {
    if (celebrate) card.grade.id === 'nailed' ? sfx.fanfare() : sfx.cheer();
  }, [celebrate, card.grade.id]);
  return (
    <div className="report-card-page">
      {celebrate && card.grade.id !== 'notyet' && <Confetti />}
      <article className={`report-card grade-${card.grade.id}`}>
        <header className="rc-head">
          <div className="rc-season">Season {card.number} report card</div>
          <div className="rc-grade">
            <span className="rc-grade-emoji">{card.grade.emoji}</span>
            <span className="rc-grade-label">{card.grade.label}</span>
          </div>
          <div className="rc-amb">{card.title}</div>
        </header>

        <section className="rc-parts">
          {card.parts.map((p) => (
            <div key={p.label} className="rc-part">
              <div className="rc-part-top">
                <span>{p.label}</span>
                <strong>
                  {p.value} <small>/ {p.target}</small>
                </strong>
              </div>
              <ProgressBar pct={p.pct} label={p.label} tone={p.pct >= 1 ? 'mint' : 'pink'} />
            </div>
          ))}
        </section>

        <section className="rc-stats">
          <div>
            <span className="rc-big">{wholeMoney(card.finalCash)}</span>
            <span className="rc-label">{helper ? 'money at the end' : 'final cash'}</span>
          </div>
          <div>
            <span className="rc-big">★ {tierName(card.tierMax, helper)}</span>
            <span className="rc-label">{helper ? 'most famous' : 'top fame level'}</span>
          </div>
          <div>
            <span className="rc-big">{card.served}</span>
            <span className="rc-label">{helper ? 'scoops sold' : 'scoops served'}</span>
          </div>
        </section>

        <section className="rc-lines">
          <h3>{helper ? 'What happened' : 'What happened this season'}</h3>
          <ul>
            {card.lines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
          {card.mood && MOODS[card.mood] && (
            <p className="muted">Looking back, it was {MOODS[card.mood].name}.</p>
          )}
        </section>

        <section className="rc-flavors">
          <h3>{helper ? 'Top flavors' : 'Top flavors'}</h3>
          <div className="rc-top">
            {card.topFlavors.map((t, i) => (
              <div key={t.flavor} className="rc-top-item">
                <Cone colors={[t.color || '#f59ab5']} icon={t.icon} size={i === 0 ? 46 : 34} star={i === 0} />
                <span className="rc-top-name">{t.flavor}</span>
                <span className="rc-top-n">{t.scoops} scoops</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rc-chart">
          <Chart history={card.history} startCash={startCash} />
          <div className="chart-key">
            <span className="key-cash">— cash</span> <span className="key-fame">— fame</span>
          </div>
        </section>
      </article>
      <div className="start-row">
        <Btn kind="primary" big onClick={onClose}>
          {closeLabel}
        </Btn>
      </div>
    </div>
  );
}
