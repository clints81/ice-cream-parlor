import { useState } from 'react';
import VaultEditor from './VaultEditor.jsx';
import Shelf from './Shelf.jsx';
import { Btn } from './common.jsx';
import { AMBITIONS, CUSTOM_METRICS } from '../game/ambitions.js';
import { tierName } from '../game/fame.js';
import { profileFor } from '../game/flavors.js';

const ORDER = ['weird', 'crowd', 'deal', 'bigtime', 'custom'];

export default function SeasonStart({ profile, onVault, onStart, onOpenCard }) {
  const helper = profile.mode === 'helper';
  const number = (profile.seasonCount || 0) + 1;
  const [pick, setPick] = useState(null);
  const [tier, setTier] = useState(4);
  const [custom, setCustom] = useState({ name: '', metric: 'cash', target: CUSTOM_METRICS.cash.targets[1] });
  const [showVault, setShowVault] = useState(number === 1 ? false : true);

  const exoticCount = profile.vault.filter((v) => profileFor(v.name, v.taste).exotic).length;
  const ready =
    pick &&
    profile.vault.length >= 3 &&
    (pick !== 'custom' || custom.name.trim());

  function start() {
    const ambition = { id: pick };
    if (pick === 'bigtime') ambition.tier = tier;
    if (pick === 'custom') ambition.custom = { ...custom, name: custom.name.trim() };
    onStart(ambition);
  }

  return (
    <div className="season-start">
      <h1 className="page-title">Season {number}</h1>

      {profile.shelf.length > 0 && (
        <section className="panel">
          <h2>{helper ? 'Your shelf' : 'Your season shelf'}</h2>
          <Shelf shelf={profile.shelf} onOpen={onOpenCard} />
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>{helper ? 'Your flavors' : `Flavor vault (${profile.vault.length})`}</h2>
          <button className="link-btn" onClick={() => setShowVault(!showVault)}>
            {showVault ? 'Hide' : helper ? 'Add or color flavors' : 'Add flavors or change colors'}
          </button>
        </div>
        {showVault ? (
          <VaultEditor vault={profile.vault} onChange={onVault} helper={helper} />
        ) : (
          <div className="vault-mini">
            {profile.vault.map((v) => (
              <span key={v.name} className="chip" style={{ '--chip': v.color }}>
                <i className="chip-dot" /> {v.icon} {v.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>{helper ? 'Pick your goal' : 'What is your ambition this season?'}</h2>
        <div className="ambition-grid">
          {ORDER.map((id) => {
            const a = AMBITIONS[id];
            return (
              <button key={id} className={`ambition-card ${pick === id ? 'on' : ''}`} onClick={() => setPick(id)} aria-pressed={pick === id}>
                <span className="amb-emoji">{a.emoji}</span>
                <span className="amb-name">{a.name}</span>
                <span className="amb-blurb">{helper ? a.helper : a.blurb}</span>
              </button>
            );
          })}
        </div>

        {pick === 'weird' && exoticCount < 3 && (
          <div className="amb-config amb-warn">
            {helper
              ? `You have ${exoticCount} weird or spicy flavor${exoticCount === 1 ? '' : 's'}. You need 3! Add some, or tap a flavor above and pick 🌀 weird.`
              : `Heads up: your vault has ${exoticCount} weird or spicy flavor${exoticCount === 1 ? '' : 's'}, and this goal needs 3 on the menu at once. Add some, or open a flavor above and change its taste to 🌀 weird or 🌶️ spicy.`}
          </div>
        )}

        {pick === 'bigtime' && (
          <div className="amb-config">
            <div className="vault-sub">{helper ? 'How famous?' : 'Which fame level are you going for?'}</div>
            <div className="seg-row">
              {AMBITIONS.bigtime.tierChoices.map((t) => (
                <button key={t} className={`seg ${tier === t ? 'on' : ''}`} onClick={() => setTier(t)}>
                  ★ {tierName(t, helper)}
                  {t === 5 && <small> (a real stretch)</small>}
                </button>
              ))}
            </div>
          </div>
        )}

        {pick === 'custom' && (
          <div className="amb-config">
            <div className="vault-sub">{helper ? 'Name your goal' : 'Give your goal a name'}</div>
            <input className="big-input" placeholder="My goal is…" maxLength={40} value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
            <div className="vault-sub">{helper ? 'What should we count?' : 'What counts toward it?'}</div>
            <div className="seg-row">
              {Object.entries(CUSTOM_METRICS).map(([k, m]) => (
                <button key={k} className={`seg ${custom.metric === k ? 'on' : ''}`} onClick={() => setCustom({ ...custom, metric: k, target: m.targets[1] })}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="vault-sub">Target</div>
            <div className="seg-row">
              {CUSTOM_METRICS[custom.metric].targets.map((t, i) => (
                <button key={t} className={`seg ${custom.target === t ? 'on' : ''}`} onClick={() => setCustom({ ...custom, target: t })}>
                  {CUSTOM_METRICS[custom.metric].format(t)} <small>{['(easier)', '(medium)', '(hard)'][i]}</small>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="start-row">
        <Btn kind="primary" big disabled={!ready} onClick={start}>
          {ready ? `Open the shop for Season ${number}! 🍦` : helper ? 'Pick a goal first' : 'Pick an ambition to start'}
        </Btn>
      </div>
    </div>
  );
}
