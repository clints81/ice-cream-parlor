import { useState } from 'react';
import Cone from '../art/Cone.jsx';
import { Btn } from './common.jsx';
import {
  TASTES, TASTE_META, COLOR_CHOICES, ICON_CHOICES, makeVaultFlavor, profileFor,
} from '../game/flavors.js';

// The flavor vault: the kid's own flavors, each with a color (and optional
// icon) that shows up everywhere in the game. `seasonLocked` hides the parts
// that would change the economics mid-season (taste, removing).
export default function VaultEditor({ vault, onChange, seasonLocked = false, helper = false, minFlavors = 3 }) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(null);

  function add(e) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    if (vault.some((v) => v.name.toLowerCase() === name.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...vault, makeVaultFlavor(name)]);
    setDraft('');
    setOpen(name);
  }

  function patch(name, p) {
    onChange(vault.map((v) => (v.name === name ? { ...v, ...p } : v)));
  }

  return (
    <div className="vault">
      <form className="vault-add" onSubmit={add}>
        <input
          className="big-input"
          placeholder={helper ? 'Type a flavor…' : 'Type a new flavor and press Enter…'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={32}
          aria-label="New flavor name"
        />
        <Btn kind="primary" type="submit" disabled={!draft.trim()}>
          Add
        </Btn>
      </form>
      {vault.length < minFlavors && (
        <p className="muted">
          {helper ? `Add ${minFlavors - vault.length} more.` : `Add at least ${minFlavors - vault.length} more flavor${minFlavors - vault.length === 1 ? '' : 's'}.`}
        </p>
      )}
      <div className="vault-list">
        {vault.map((v) => {
          const prof = profileFor(v.name, v.taste);
          const isOpen = open === v.name;
          return (
            <div key={v.name} className={`vault-item ${isOpen ? 'open' : ''}`}>
              <button className="vault-row" onClick={() => setOpen(isOpen ? null : v.name)} aria-expanded={isOpen}>
                <Cone colors={[v.color]} size={30} icon={v.icon} />
                <span className="vault-name">{v.name}</span>
                <span className={`tag taste-${prof.taste}`}>
                  {TASTE_META[prof.taste].emoji} {TASTE_META[prof.taste].label}
                </span>
                <span className="vault-edit">{isOpen ? 'Done' : '🎨'}</span>
              </button>
              {isOpen && (
                <div className="vault-detail">
                  <div className="vault-sub">Color</div>
                  <div className="swatches">
                    {COLOR_CHOICES.map((c) => (
                      <button
                        key={c}
                        className={`swatch ${v.color === c ? 'on' : ''}`}
                        style={{ background: c }}
                        onClick={() => patch(v.name, { color: c })}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                    <label className="swatch swatch-custom" title="Pick any color">
                      <input type="color" value={v.color} onChange={(e) => patch(v.name, { color: e.target.value })} aria-label="Pick any color" />
                      🌈
                    </label>
                  </div>
                  <div className="vault-sub">Icon (optional)</div>
                  <div className="icons">
                    {ICON_CHOICES.map((ic) => (
                      <button key={ic || 'none'} className={`icon-choice ${v.icon === ic ? 'on' : ''}`} onClick={() => patch(v.name, { icon: ic })} aria-label={ic ? `Icon ${ic}` : 'No icon'}>
                        {ic || '∅'}
                      </button>
                    ))}
                  </div>
                  {!seasonLocked && (
                    <>
                      <div className="vault-sub">{helper ? 'What does it taste like?' : 'Taste (this decides who loves it)'}</div>
                      <div className="tastes">
                        {TASTES.map((t) => (
                          <button
                            key={t}
                            className={`tag taste-${t} taste-choice ${prof.taste === t ? 'on' : ''}`}
                            onClick={() => patch(v.name, { taste: t })}
                          >
                            {TASTE_META[t].emoji} {TASTE_META[t].label}
                          </button>
                        ))}
                      </div>
                      <button className="link-btn danger" onClick={() => onChange(vault.filter((x) => x.name !== v.name))}>
                        Remove {v.name}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
