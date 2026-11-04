import { useState } from 'react';
import Avatar, { AVATARS } from '../art/Avatar.jsx';
import Storefront from '../art/Storefront.jsx';
import VaultEditor from './VaultEditor.jsx';
import { Btn } from './common.jsx';

export default function NewPlayer({ onDone, onCancel }) {
  const [step, setStep] = useState(0);
  const [parlorName, setName] = useState('');
  const [avatar, setAvatar] = useState('cat');
  const [vault, setVault] = useState([]);

  const back = (
    <button className="link-btn" onClick={() => (step === 0 ? onCancel?.() : setStep(step - 1))}>
      ← Back
    </button>
  );

  return (
    <div className="wizard">
      <div className="wizard-steps" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>

      {step === 0 && (
        <section className="wizard-card">
          <h1>Every parlor needs a name</h1>
          <Storefront parlorName={parlorName || 'Your Parlor'} tier={2} flavors={['#f59ab5', '#8be3b8', '#fbe36b']} className="scene-small" />
          <form onSubmit={(e) => { e.preventDefault(); if (parlorName.trim()) setStep(1); }}>
            <input className="big-input" autoFocus placeholder="Name your parlor…" value={parlorName} onChange={(e) => setName(e.target.value)} maxLength={30} />
            <div className="wizard-actions">
              {onCancel ? back : <span />}
              <Btn kind="primary" big type="submit" disabled={!parlorName.trim()}>That's the name →</Btn>
            </div>
          </form>
        </section>
      )}

      {step === 1 && (
        <section className="wizard-card">
          <h1>Pick your buddy</h1>
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <button key={a.id} className={`avatar-choice ${avatar === a.id ? 'on' : ''}`} onClick={() => setAvatar(a.id)} aria-label={a.name} aria-pressed={avatar === a.id}>
                <Avatar id={a.id} size={84} />
                <span>{a.name}</span>
              </button>
            ))}
          </div>
          <div className="wizard-actions">
            {back}
            <Btn kind="primary" big onClick={() => setStep(2)}>Next →</Btn>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="wizard-card">
          <h1>Your flavor vault</h1>
          <p className="lead">Type in every flavor you've invented. Tap one to give it a color.</p>
          <VaultEditor vault={vault} onChange={setVault} />
          <div className="wizard-actions">
            {back}
            <Btn kind="primary" big disabled={vault.length < 3} onClick={() => setStep(3)}>
              {vault.length < 3 ? `Add ${3 - vault.length} more` : 'Next →'}
            </Btn>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="wizard-card">
          <h1>How do you want to play?</h1>
          <p className="lead">You can switch any time in Settings.</p>
          <div className="mode-choices">
            <button className="mode-card" onClick={() => onDone({ parlorName, avatar, vault, mode: 'standard' })}>
              <span className="mode-emoji">🧑‍🍳</span>
              <span className="mode-title">Standard</span>
              <span className="mode-desc">The full game. You set prices every day, read the numbers, and take your own chances.</span>
            </button>
            <button className="mode-card mode-helper" onClick={() => onDone({ parlorName, avatar, vault, mode: 'helper' })}>
              <span className="mode-emoji">🤝</span>
              <span className="mode-title">Helper</span>
              <span className="mode-desc">Same game, with tips. Big words, easy money math, and ideas you can use with one tap.</span>
            </button>
          </div>
          <div className="wizard-actions">{back}</div>
        </section>
      )}
    </div>
  );
}
