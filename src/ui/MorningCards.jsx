import { useState } from 'react';
import { Btn, money } from './common.jsx';
import { EVENTS, CONFIDENCE, INCIDENTS, dayName, oddsWords, oddsHelper } from '../game/events.js';
import { forecastFor, visibleRumors } from '../game/engine.js';

const WEATHER_ICON = { sunny: '☀️', cloudy: '⛅', rain: '🌧️', storm: '⛈️', windy: '🌬️' };

export function ForecastCard({ season, helper }) {
  const { event, confidence } = forecastFor(season);
  const conf = CONFIDENCE[confidence];
  return (
    <section className={`card forecast forecast-${event.type}`}>
      <div className="forecast-icon" aria-hidden="true">{WEATHER_ICON[event.weather]}</div>
      <div className="forecast-body">
        <div className="forecast-kicker">
          {helper ? "Today's guess" : `${dayName(season.day)}'s forecast`}
          <span className={`conf conf-${confidence}`}>{helper ? conf.helper : conf.label}</span>
        </div>
        <h2 className="forecast-title">{helper ? event.helper : event.title}</h2>
        {!helper && <p>{event.desc}</p>}
        <p className="forecast-hint">{event.hint}</p>
      </div>
    </section>
  );
}

function batchStory(card, helper) {
  const where = EVENTS[card.event]?.short?.toLowerCase() || 'shop';
  if (card.outcome === 'hit') {
    return helper
      ? { emoji: '🚀', title: `${card.flavor} is a hit!`, text: 'People loved it. Lots more will want some.' }
      : { emoji: '🚀', title: `${card.flavor} took off!`, text: `${card.flavor} got a lot of attention at the ${where} yesterday. People are talking about it.` };
  }
  if (card.outcome === 'flop') {
    return helper
      ? { emoji: '😬', title: `${card.flavor} flopped`, text: 'Some people made funny faces. Maybe try a different special.' }
      : { emoji: '😬', title: `${card.flavor} didn't catch on`, text: 'Yesterday\'s test batch got some funny faces. It will be a harder sell for a few days.' };
  }
  return helper
    ? { emoji: '👍', title: `${card.flavor} did fine`, text: 'Some people liked it. Some shrugged.' }
    : { emoji: '👍', title: `${card.flavor} did fine`, text: 'The test batch went okay. Some people loved it, some shrugged.' };
}

export function NewsCards({ season, helper }) {
  const cards = [];
  for (const c of season.morningCards || []) {
    if (c.type === 'batch') {
      const s = batchStory(c, helper);
      cards.push(
        <section key={'b' + c.flavor} className={`card news news-${c.outcome}`}>
          <span className="news-emoji">{s.emoji}</span>
          <div>
            <div className="news-kicker">{helper ? 'Test batch news' : "Last night's test batch"}</div>
            <strong>{s.title}</strong>
            <p>{s.text}</p>
          </div>
        </section>,
      );
    } else if (c.type === 'shockOver') {
      cards.push(
        <section key={'so' + c.flavor} className="card news news-fine">
          <span className="news-emoji">📦</span>
          <div><strong>{c.flavor} is back!</strong> {helper ? 'The ingredients came in.' : 'The shortage is over. Normal prices again.'}</div>
        </section>,
      );
    } else if (c.type === 'collabStart') {
      cards.push(
        <section key="cs" className="card news news-hit">
          <span className="news-emoji">🎬</span>
          <div>
            <strong>{c.flavor} is here!</strong>
            <p>{c.channel}'s fans know about it. It's a limited special through Day {c.endDay}.</p>
          </div>
        </section>,
      );
    } else if (c.type === 'collabEnd') {
      cards.push(
        <section key="ce" className="card news news-fine">
          <span className="news-emoji">🎞️</span>
          <div>The <strong>{c.flavor}</strong> collab is over. What a week!</div>
        </section>,
      );
    }
  }
  const inc = season.incident;
  if (inc && INCIDENTS[inc.id] && inc.id !== 'shortage') {
    const def = INCIDENTS[inc.id];
    cards.push(
      <section key="inc" className={`card news news-${inc.kind === 'good' ? 'hit' : 'flop'}`}>
        <span className="news-emoji">{inc.kind === 'good' ? '🎉' : '⚠️'}</span>
        <div>
          <strong>{helper ? def.helper : def.title}</strong>
          {!helper && <p>{def.desc}{inc.flavor ? ` (${inc.flavor} got a boost!)` : ''}{inc.until ? ` It should last through Day ${inc.until}.` : ''}</p>}
        </div>
      </section>,
    );
  }
  return cards;
}

export function ShockCard({ season, onChoose, helper }) {
  const s = season.shock;
  if (!s) return null;
  const days = s.endDay - season.day + 1;
  if (s.choice) {
    return (
      <section className="card shock shock-done">
        <span className="news-emoji">📦</span>
        <div>
          {s.choice === 'pay'
            ? <>You're paying extra for <strong>{s.flavor}</strong> through Day {s.endDay}.</>
            : <><strong>{s.flavor}</strong> is off the menu until Day {s.endDay + 1}.</>}
        </div>
      </section>
    );
  }
  return (
    <section className="card shock shock-open" aria-live="polite">
      <div className="shock-head">
        <span className="news-emoji">📦</span>
        <div>
          <div className="news-kicker">{helper ? 'Uh oh!' : 'Ingredient shortage'}</div>
          <strong>
            {helper
              ? `${s.flavor} ingredients are hard to get.`
              : `The supplier is running low on what you need for ${s.flavor}.`}
          </strong>
          <p>{helper ? `For ${days} days. What do you want to do?` : `It'll last about ${days} days. You need to decide before opening.`}</p>
        </div>
      </div>
      <div className="choice-row">
        <button className="choice choice-risk" onClick={() => onChoose('pay')}>
          <span className="choice-title">{helper ? 'Keep it' : `Keep ${s.flavor}`}</span>
          <span className="choice-sub">{helper ? `Each scoop costs ${money(s.surge, true)} more` : `Each scoop costs ${money(s.surge)} more to make for ${days} days`}</span>
        </button>
        <button className="choice choice-safe" onClick={() => onChoose('swap')}>
          <span className="choice-title">{helper ? 'Take it off' : 'Swap it out'}</span>
          <span className="choice-sub">{helper ? `Off the menu for ${days} days` : `Off the menu until Day ${s.endDay + 1}. Pick something else.`}</span>
        </button>
      </div>
    </section>
  );
}

export function RumorCards({ season, onChoose, helper }) {
  const rumors = visibleRumors(season);
  return rumors.map((r) => {
    const today = r.day === season.day;
    const when = today ? (helper ? 'Today!' : 'Today') : r.day === season.day + 1 ? (helper ? 'Tomorrow' : 'Tomorrow') : `${dayName(r.day)} (Day ${r.day})`;
    const def = r.def;
    return (
      <section key={r.day} className={`card rumor ${r.choice ? 'rumor-chosen' : ''}`}>
        <div className="rumor-head">
          <span className="news-emoji">👀</span>
          <div>
            <div className="news-kicker">{helper ? 'I heard…' : 'Rumor'} · {when}</div>
            <strong>{helper ? def.helper : def.title}</strong>
            <p className="rumor-odds">
              {helper ? `Chance: ${oddsHelper(r.odds)}` : `Chance: ${oddsWords(r.odds)} (about ${Math.round(r.odds * 100)}%)`}
            </p>
          </div>
        </div>
        <div className="choice-row">
          <button className={`choice choice-risk ${r.choice === 'allin' ? 'on' : ''}`} onClick={() => onChoose(r.day, 'allin')} aria-pressed={r.choice === 'allin'}>
            <span className="choice-title">{helper ? 'Go all in!' : 'Go all in'}</span>
            <span className="choice-sub">
              {helper
                ? `Pay ${money(def.prep, true)}. If it happens: a HUGE day!`
                : `${def.prepLabel}: costs ${money(def.prep)}. If it happens, a much bigger crowd${def.fameIfAllIn >= 5 ? ' and a lot more fame' : ''}. If not, the money's gone.`}
            </span>
          </button>
          <button className={`choice choice-safe ${r.choice === 'safe' ? 'on' : ''}`} onClick={() => onChoose(r.day, 'safe')} aria-pressed={r.choice === 'safe'}>
            <span className="choice-title">{helper ? 'Play it safe' : 'Play it safe'}</span>
            <span className="choice-sub">{helper ? 'Pay nothing. If it happens, a little busier.' : 'No cost. If it happens you still get a bit of the crowd.'}</span>
          </button>
        </div>
      </section>
    );
  });
}

export function InventionCard({ season, onInvent, onSkip, helper }) {
  const [draft, setDraft] = useState('');
  if (season.inventionDone || season.day < season.inventionDay) return null;
  return (
    <section className="card invention">
      <span className="news-emoji">🧪</span>
      <div className="invention-body">
        <strong>{helper ? 'You made something new in the kitchen!' : "You've been experimenting in the back kitchen."}</strong>
        <p>{helper ? 'What is it called?' : 'Want to add a new flavor to your vault?'}</p>
        <form onSubmit={(e) => { e.preventDefault(); if (draft.trim()) onInvent(draft.trim()); }} className="vault-add">
          <input className="big-input" placeholder="Name your creation…" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={32} aria-label="New flavor name" />
          <Btn kind="primary" type="submit" disabled={!draft.trim()}>Add it</Btn>
          <Btn onClick={onSkip}>Not today</Btn>
        </form>
      </div>
    </section>
  );
}
