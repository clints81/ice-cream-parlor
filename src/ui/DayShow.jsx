import { useEffect, useMemo, useRef, useState } from 'react';
import Storefront from '../art/Storefront.jsx';
import Character, { moodFor } from '../art/Character.jsx';
import Cone from '../art/Cone.jsx';
import { Btn, money, useReducedMotion } from './common.jsx';
import { EVENTS, RUMORS, CONFIDENCE } from '../game/events.js';
import { tierFor } from '../game/fame.js';
import { sfx } from '../audio/sound.js';

const INTRO = 2200;
const LIFE = 2600;
const MAX_SHOWN = 26;

// Pick which customers to show, keeping the real mix of outcomes.
function sample(log, n) {
  if (log.length <= n) return log.map((e, i) => ({ ...e, idx: i }));
  const out = [];
  const step = log.length / n;
  for (let i = 0; i < n; i++) {
    const j = Math.floor(i * step);
    out.push({ ...log[j], idx: j });
  }
  return out;
}

function shortQuote(e, helper) {
  if (e.outcome === 'walked') return helper ? 'Too much!' : e.quote;
  if (e.outcome === 'nothing') return helper ? 'Nothing for me' : e.quote;
  if (helper) {
    if (e.tone === 'loved') return 'Yum!';
    if (e.tone === 'flop') return 'Hmm…';
    if (e.tone === 'grumble') return 'Pricey!';
    return 'Thanks!';
  }
  return e.quote;
}

const TONE_EMOJI = { loved: '😍', mixed: '🙂', grumble: '😬', flop: '🤢' };

export default function DayShow({ profile, season, onDone }) {
  const helper = profile.mode === 'helper';
  const reduced = useReducedMotion();
  const d = season.lastDay;
  const event = EVENTS[d.event];
  const forecastEvent = EVENTS[d.forecast];
  const meta = Object.fromEntries(profile.vault.map((v) => [v.name, v]));
  const colorOf = (f) => meta[f]?.color || '#ffb547';
  const shown = useMemo(() => sample(d.log, MAX_SHOWN), [d.log]);
  const gap = Math.max(260, Math.min(650, 9500 / Math.max(1, shown.length)));
  const total = INTRO + shown.length * gap + LIFE + 900;
  const buyers = shown.filter((e) => e.outcome === 'bought').length;
  const perBuyer = buyers ? d.revenue / buyers : 0;
  const perServed = buyers ? d.served / buyers : 0;

  const [t, setT] = useState(0);
  const start = useRef(null);
  const played = useRef(new Set());
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    let raf;
    const tick = (now) => {
      if (start.current == null) start.current = now;
      const el = now - start.current;
      setT(el);
      if (el < total) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    sfx.whoosh();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sounds for customers reaching the counter.
  useEffect(() => {
    shown.forEach((e, i) => {
      const at = INTRO + i * gap + LIFE * 0.35;
      if (t >= at && !played.current.has(i)) {
        played.current.add(i);
        if (e.outcome === 'bought') {
          sfx.coin();
          if (e.lolly) setTimeout(() => sfx.pop(), 120);
        } else sfx.boop();
      }
    });
  }, [t, shown, gap]);

  let servedSoFar = 0;
  let moneySoFar = 0;
  shown.forEach((e, i) => {
    if (e.outcome === 'bought' && t >= INTRO + i * gap + LIFE * 0.35) {
      servedSoFar += perServed;
      moneySoFar += perBuyer;
    }
  });
  const ending = t >= total - 900;
  if (ending) {
    servedSoFar = d.served;
    moneySoFar = d.revenue;
  }

  const forecastRight = d.event === d.forecast;
  const rumor = d.rumor;

  return (
    <div className="dayshow">
      <Storefront
        parlorName={profile.parlorName}
        time={ending ? 'evening' : 'afternoon'}
        weather={event.weather}
        tier={tierFor(d.fameBefore)}
        flavors={[...d.menu.featured, ...d.menu.regular].map(colorOf)}
        open={!ending}
        className="scene-show"
      >
        {shown.map((e, i) => {
          const t0 = INTRO + i * gap;
          const p = (t - t0) / LIFE;
          if (p < 0 || p > 1) return null;
          const slot = 30 + (i % 3) * 10;
          let x;
          let walking = false;
          let leaving = false;
          if (reduced) x = slot;
          else if (p < 0.3) {
            x = -10 + (slot + 10) * (p / 0.3);
            walking = true;
          } else if (p < 0.7) x = slot;
          else {
            leaving = true;
            walking = true;
            const q = (p - 0.7) / 0.3;
            x = e.outcome === 'bought' ? slot + (112 - slot) * q : slot - (slot + 14) * q;
          }
          const atCounter = p >= 0.3 && p < 0.78;
          const mood = atCounter || leaving ? moodFor(e) : 'neutral';
          const kid = e.seg === 'kids';
          const opacity = reduced ? (p < 0.1 ? p / 0.1 : p > 0.9 ? (1 - p) / 0.1 : 1) : 1;
          return (
            <div
              key={i}
              className={`actor ${kid ? 'actor-kid' : ''}`}
              style={{ left: `${x}%`, opacity, zIndex: 10 + i }}
            >
              {atCounter && (
                <div className={`bubble bubble-${e.outcome === 'bought' ? e.tone : e.outcome}`}>
                  {e.outcome === 'bought' && <Cone colors={[colorOf(e.flavor)]} size={18} icon={meta[e.flavor]?.icon} />}
                  <span className="bubble-text">
                    {e.outcome === 'bought' && <span className="bubble-emoji">{TONE_EMOJI[e.tone]}</span>}
                    {e.kind === 'fan' && e.outcome === 'bought' && <span className="bubble-fan">♥</span>}
                    {(i % 3 === 0 || e.outcome !== 'bought' || helper) && <span>{shortQuote(e, helper)}</span>}
                  </span>
                </div>
              )}
              {atCounter && e.outcome === 'bought' && p > 0.36 && p < 0.62 && (
                <div className="coin-pop">+{money(e.price, helper)}</div>
              )}
              {atCounter && e.lolly && p > 0.42 && p < 0.66 && <div className="lolly-pop">🍭</div>}
              <Character look={e.look} kid={kid} mood={mood} walking={walking && !reduced} flip={leaving && e.outcome !== 'bought'} holding={leaving && e.outcome === 'bought' ? colorOf(e.flavor) : null} />
            </div>
          );
        })}

        {t < INTRO && (
          <div className="reveal" role="status">
            <div className="reveal-card">
              <div className="reveal-small">
                {helper ? 'The guess was:' : 'Forecast:'} {forecastEvent.forecast}
                {!forecastRight && ` (${CONFIDENCE[d.confidence].label.toLowerCase()})`}
              </div>
              <div className="reveal-big">{forecastRight ? (helper ? 'Right!' : 'Right on!') : helper ? 'Surprise!' : 'Plot twist!'} {helper ? event.helper : event.title}</div>
              {rumor && (
                <div className={`reveal-rumor ${rumor.happened ? 'yes' : 'no'}`}>
                  {rumor.happened ? '🎉 ' : '💨 '}
                  {rumor.happened ? RUMORS[rumor.type].happened : RUMORS[rumor.type].fizzled}
                </div>
              )}
            </div>
          </div>
        )}
        {ending && (
          <div className="reveal">
            <div className="reveal-card">
              <div className="reveal-big">{helper ? 'Closing time!' : 'Closing time!'} 🌙</div>
            </div>
          </div>
        )}
      </Storefront>

      <div className="show-bar">
        <div className="show-counter">
          <span className="show-num">{Math.round(servedSoFar)}</span>
          <span className="show-lbl">{helper ? 'scoops' : 'scoops served'}</span>
        </div>
        <div className="show-counter">
          <span className="show-num">{money(moneySoFar, helper)}</span>
          <span className="show-lbl">{helper ? 'money in' : 'money in'}</span>
        </div>
        <div className="show-counter">
          <span className="show-num">{d.customers}</span>
          <span className="show-lbl">{helper ? 'people came' : 'customers today'}</span>
        </div>
        <Btn onClick={finish} className="show-skip">
          {helper ? 'Skip ⏭' : 'Skip to results ⏭'}
        </Btn>
      </div>
    </div>
  );
}
