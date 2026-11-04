import { useEffect, useMemo, useState } from 'react';
import Cone from '../art/Cone.jsx';
import Character, { moodFor } from '../art/Character.jsx';
import Confetti from '../art/Confetti.jsx';
import { Btn, Modal, money } from './common.jsx';
import { UnitLesson } from './Chalkboard.jsx';
import { FAME_TIERS, tierName } from '../game/fame.js';
import { EVENTS } from '../game/events.js';
import { eveningNotes } from '../game/advisor.js';
import { profilesFor, SEASON_LENGTH } from '../game/engine.js';
import { makeRng } from '../game/rng.js';
import { sfx } from '../audio/sound.js';

function quality(profit, helper) {
  if (profit >= 60) return { id: 'great', label: helper ? 'Great day!' : 'Great day!' };
  if (profit >= 30) return { id: 'good', label: helper ? 'Good day' : 'Solid day' };
  if (profit >= 10) return { id: 'slow', label: helper ? 'Slow day' : 'Slow day' };
  if (profit >= 0) return { id: 'tough', label: helper ? 'Tough day' : 'Tough day' };
  return { id: 'loss', label: helper ? 'Lost money' : 'Lost money today' };
}

const FAME_LABEL = {
  customers: 'Happy (and unhappy) customers',
  fresh: 'Fresh specials',
  stale: 'Same old menu',
  bigDay: 'Big moment',
  surprise: 'Surprise news',
  drift: 'People forget a little each day',
};

function MilestoneModal({ milestone, onClose }) {
  useEffect(() => {
    sfx.fanfare();
  }, [milestone.tier]);
  return (
    <Modal onClose={onClose} className="milestone-modal" label="Milestone">
      <Confetti />
      <div className="milestone">
        <div className="milestone-stars">★ ★ ★</div>
        <div className="milestone-kicker">{FAME_TIERS[milestone.tier].name}</div>
        <p className="milestone-text">{milestone.text}</p>
        <Btn kind="primary" big onClick={onClose}>
          Woohoo!
        </Btn>
      </div>
    </Modal>
  );
}

function MathMoment({ day, helper, meta }) {
  const q = useMemo(() => {
    const rand = makeRng(day.day, 'math');
    const options = Object.entries(day.scoops).filter(([f, n]) => n >= 2 && n <= 10 && day.prices[f] % 1 === 0);
    if (!options.length) return null;
    const [f, n] = options[Math.floor(rand() * options.length)];
    const price = day.prices[f];
    const answer = n * price;
    const wrong = [answer + price, Math.max(price, answer - price), answer + 1].filter((x) => x !== answer);
    const choices = [answer, ...wrong.slice(0, 2)].sort(() => rand() - 0.5);
    return { f, n, price, answer, choices };
  }, [day]);
  const [picked, setPicked] = useState(null);
  const [skipped, setSkipped] = useState(false);
  if (!helper || !q || skipped) return null;
  const right = picked === q.answer;
  return (
    <section className="card math">
      <div className="math-q">
        <Cone colors={[meta[q.f]?.color || '#f59ab5']} size={28} icon={meta[q.f]?.icon} />
        <span>
          You sold <b>{q.n}</b> scoops of {q.f} for <b>${q.price}</b> each. How much is that?
        </span>
      </div>
      <div className="math-choices">
        {q.choices.map((c) => (
          <button
            key={c}
            className={`math-choice ${picked === c ? (c === q.answer ? 'right' : 'wrong') : ''}`}
            onClick={() => {
              setPicked(c);
              c === q.answer ? sfx.cheer() : sfx.boop();
            }}
          >
            ${c}
          </button>
        ))}
      </div>
      {picked != null && (
        <p className="math-feedback">{right ? `Yes! ${q.n} × $${q.price} = $${q.answer} 🎉` : `Good try! It's ${q.n} × $${q.price} = $${q.answer}.`}</p>
      )}
      <button className="link-btn" onClick={() => setSkipped(true)}>
        Skip
      </button>
    </section>
  );
}

export default function DayReport({ profile, season, ctx, onNext, onAckMilestones }) {
  const helper = ctx.mode === 'helper';
  const d = season.lastDay;
  const [mIdx, setMIdx] = useState(0);
  const meta = Object.fromEntries(profile.vault.map((v) => [v.name, v]));
  const profs = profilesFor(season, ctx.vault);
  const q = quality(d.profit, helper);
  const menuAll = [...d.menu.featured, ...d.menu.regular];
  const maxKept = Math.max(1, ...menuAll.map((f) => Math.abs(d.flavorProfit[f] || 0)));
  const otherCosts = d.costs.reduce((s, c) => s + c.amount, 0);
  const notes = eveningNotes(season, ctx);
  const fameDelta = d.fameAfter - d.fameBefore;
  const reactions = d.log.filter((e) => e.quote).filter((_, i) => i % 3 === 0).slice(0, helper ? 4 : 6);

  useEffect(() => {
    if (d.profit < 0) sfx.sad();
    else if (q.id === 'great') sfx.cheer();
  }, [d.day]); // eslint-disable-line react-hooks/exhaustive-deps

  const milestone = d.milestones[mIdx];

  return (
    <div className="report">
      <header className={`report-head q-${q.id}`}>
        <div>
          <div className="news-kicker">
            Day {d.day} · {helper ? EVENTS[d.event].helper : EVENTS[d.event].title}
          </div>
          <h1>{q.label}</h1>
        </div>
        <div className={`report-profit ${d.profit < 0 ? 'neg' : ''}`}>
          <span className="rp-label">{helper ? 'You kept' : 'Profit'}</span>
          <span className="rp-num">{money(d.profit, helper)}</span>
        </div>
      </header>

      <div className="report-grid">
        <section className="card money-card">
          <h3>{helper ? 'Your money today' : 'Money'}</h3>
          {helper ? (
            <div className="money-simple">
              <div className="ms-row in"><span>💰 You got</span><b>{money(d.revenue, true)}</b></div>
              <div className="ms-row out"><span>🧾 You paid</span><b>{money(d.scoopCost + d.lollipopCost + d.overhead + otherCosts, true)}</b></div>
              <div className={`ms-row total ${d.profit < 0 ? 'neg' : ''}`}><span>{d.profit >= 0 ? '🐷 You kept' : '😢 You lost'}</span><b>{money(Math.abs(d.profit), true)}</b></div>
            </div>
          ) : (
            <table className="money-table">
              <tbody>
                <tr><td>Money in (scoops)</td><td>{money(d.revenue - d.lollipopRevenue)}</td></tr>
                <tr><td>Money in (lollipops)</td><td>{money(d.lollipopRevenue)}</td></tr>
                <tr className="minus"><td>Cost of scoops</td><td>−{money(d.scoopCost + d.lollipopCost)}</td></tr>
                <tr className="minus"><td>Shop costs</td><td>−{money(d.overhead)}</td></tr>
                {d.costs.map((c) => (
                  <tr key={c.label} className="minus"><td>{c.label}</td><td>−{money(c.amount)}</td></tr>
                ))}
                <tr className={`total ${d.profit < 0 ? 'neg' : ''}`}><td>Profit</td><td>{money(d.profit)}</td></tr>
              </tbody>
            </table>
          )}
          <div className="cash-line">
            {helper ? 'Money now:' : 'Cash:'} {money(d.cashBefore, helper)} → <b>{money(d.cashAfter, helper)}</b>
          </div>
        </section>

        <section className="card people-card">
          <h3>{helper ? 'Your customers' : `${d.customers} customers`}</h3>
          <div className="tally">
            <span title="Loved it">😍 {d.tally.loved}</span>
            <span title="Liked it">🙂 {d.tally.mixed}</span>
            <span title="Bought it but grumbled about the price">😬 {d.tally.grumble}</span>
            {d.tally.flop > 0 && <span title="Didn't like the new flavor">🤢 {d.tally.flop}</span>}
            <span title="Left because it cost too much">🚶 {d.tally.walked}</span>
            <span title="Didn't find anything they liked">🤷 {d.tally.nothing}</span>
          </div>
          <div className="tally-legend">
            {helper
              ? 'Loved it · liked it · grumbled · left (too much $) · nothing for them'
              : 'loved · liked · grumbled at price · walked away (price) · nothing for them'}
          </div>
          {(d.fanVisits > 0 || d.dealVisits > 0) && (
            <div className="regulars">
              {d.fanVisits > 0 && <span className="tag tag-fans">♥ {d.fanVisits} {helper ? 'fans came back' : 'loyal fans came back'}</span>}
              {d.dealVisits > 0 && <span className="tag tag-deal">🏷️ {d.dealVisits} {helper ? 'came for low prices' : 'deal hunters came back'}</span>}
            </div>
          )}
          <div className={`fame-change ${fameDelta >= 0 ? 'up' : 'down'}`}>
            <b>
              ★ {helper ? 'Fame' : 'Fame'} {fameDelta >= 0 ? '+' : '−'}
              {Math.abs(fameDelta).toFixed(1)}
            </b>
            <span>→ {tierName(Math.max(0, FAME_TIERS.findLastIndex((t) => d.fameAfter >= t.at)), helper)}</span>
          </div>
          {!helper && (
            <ul className="fame-parts">
              {Object.entries(d.fameParts)
                .filter(([, v]) => Math.abs(v) >= 0.05)
                .map(([k, v]) => (
                  <li key={k} className={v >= 0 ? 'up' : 'down'}>
                    {FAME_LABEL[k] || k}: {v >= 0 ? '+' : '−'}{Math.abs(v).toFixed(1)}
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card flavor-card">
        <h3>{helper ? 'How each flavor did' : 'What each flavor earned after cost'}</h3>
        <div className="flavor-rows">
          {menuAll.map((f) => {
            const n = d.scoops[f] || 0;
            const kept = d.flavorProfit[f] || 0;
            const m = meta[f] || { color: '#ffb547', icon: '🎁' };
            const price = d.prices[f];
            return (
              <div key={f} className="flavor-row">
                <Cone colors={[m.color]} size={26} icon={m.icon} star={d.menu.featured.includes(f)} />
                <div className="fr-mid">
                  <div className="fr-name">
                    {f} <span className="muted">· {n} scoop{n === 1 ? '' : 's'}</span>
                  </div>
                  <div className="fr-bar">
                    <div className={`fr-fill ${kept < 0 ? 'neg' : ''}`} style={{ width: `${Math.max(2, (Math.abs(kept) / maxKept) * 100)}%`, background: kept < 0 ? undefined : m.color }} />
                  </div>
                  {helper ? (
                    <UnitLesson cost={(d.flavorCost[f] || 0) / Math.max(1, n) || profs[f]?.cost || 1} price={price} />
                  ) : (
                    <div className="fr-sub">
                      {money(d.flavorRevenue[f] || 0)} in − {money(d.flavorCost[f] || 0)} cost
                      {n > 0 && <> · {money(kept / n)} per scoop</>}
                    </div>
                  )}
                </div>
                <div className={`fr-kept ${kept < 0 ? 'neg' : ''}`}>{money(kept, helper)}</div>
              </div>
            );
          })}
        </div>
      </section>

      <MathMoment day={d} helper={helper} meta={meta} />

      {reactions.length > 0 && (
        <section className="card reactions-card">
          <h3>{helper ? 'What people said' : 'What customers said'}</h3>
          <div className="reactions">
            {reactions.map((e, i) => (
              <div key={i} className={`reaction reaction-${e.outcome === 'bought' ? e.tone : e.outcome}`}>
                <div className="reaction-face">
                  <Character look={e.look} kid={e.seg === 'kids'} mood={moodFor(e)} />
                </div>
                <div className="reaction-quote">
                  “{e.quote}”<span className="reaction-name">{e.name}{e.kind === 'fan' ? ' ♥' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {notes.length > 0 && (
        <section className="card notes">
          <h3>{helper ? 'Think about' : 'What to think about tomorrow'}</h3>
          <ul>
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="open-bar">
        <Btn kind="primary" big onClick={onNext}>
          {d.day >= SEASON_LENGTH ? (helper ? 'See my season! →' : 'See your season report card →') : helper ? `Next day →` : `On to Day ${d.day + 1} →`}
        </Btn>
      </div>

      {milestone && !d.milestonesAcked && (
        <MilestoneModal
          milestone={milestone}
          onClose={() => {
            if (mIdx + 1 >= d.milestones.length) onAckMilestones();
            setMIdx(mIdx + 1);
          }}
        />
      )}
    </div>
  );
}
