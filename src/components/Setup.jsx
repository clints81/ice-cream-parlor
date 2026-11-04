import { useState } from 'react';

export default function Setup({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [flavors, setFlavors] = useState([]);
  const [draft, setDraft] = useState('');

  function addFlavor(e) {
    e.preventDefault();
    const f = draft.trim();
    if (!f) return;
    if (flavors.some((x) => x.toLowerCase() === f.toLowerCase())) {
      setDraft('');
      return;
    }
    setFlavors([...flavors, f]);
    setDraft('');
  }

  if (step === 0) {
    return (
      <div className="app setup">
        <h1 className="setup-title">🍦 Ice Cream Parlor</h1>
        <p className="setup-lead">First things first — every parlor needs a name.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setStep(1);
          }}
        >
          <input
            className="big-input"
            autoFocus
            placeholder="Name your parlor…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
          <button className="btn btn-primary" type="submit" disabled={!name.trim()}>
            That's the name
          </button>
        </form>
        {onCancel && (
          <footer className="footer">
            <button className="link-btn" onClick={onCancel}>← Back to players</button>
          </footer>
        )}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="app setup">
        <h1 className="setup-title">{name.trim()}</h1>
        <p className="setup-lead">
          Now build your flavor vault. Type in every flavor you've invented — one at a
          time. You need at least 3 to open for the season.
        </p>
        <form onSubmit={addFlavor} className="flavor-add-row">
          <input
            className="big-input"
            autoFocus
            placeholder="Type a flavor and press Enter…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={40}
          />
          <button className="btn" type="submit" disabled={!draft.trim()}>
            Add
          </button>
        </form>
        {flavors.length > 0 && (
          <div className="chip-row">
            {flavors.map((f) => (
              <button
                key={f}
                className="chip"
                onClick={() => setFlavors(flavors.filter((x) => x !== f))}
                title="Tap to remove"
              >
                {f} ✕
              </button>
            ))}
          </div>
        )}
        <button
          className="btn btn-primary"
          disabled={flavors.length < 3}
          onClick={() => setStep(2)}
        >
          {flavors.length < 3 ? `Add ${3 - flavors.length} more to continue` : 'Next →'}
        </button>
      </div>
    );
  }

  // Step 2 — difficulty. Sets the easy-mode flag for this parlor.
  return (
    <div className="app setup">
      <h1 className="setup-title">{name.trim()}</h1>
      <p className="setup-lead">One last thing — who's playing this parlor?</p>
      <div className="mode-choices">
        <button className="mode-card" onClick={() => onComplete(name.trim(), flavors, false)}>
          <div className="mode-emoji">🧑‍🍳</div>
          <div className="mode-title">On my own</div>
          <div className="mode-desc">
            The full game — ingredient costs, pricing decisions, and surprises that can go
            either way.
          </div>
        </button>
        <button className="mode-card" onClick={() => onComplete(name.trim(), flavors, true)}>
          <div className="mode-emoji">🧒</div>
          <div className="mode-title">Playing together — take it easy</div>
          <div className="mode-desc">
            A gentler version: no money worries, bigger crowds, and only happy surprises.
            Great for younger players.
          </div>
        </button>
      </div>
      <footer className="footer">
        <button className="link-btn" onClick={() => setStep(1)}>← Back</button>
      </footer>
    </div>
  );
}
