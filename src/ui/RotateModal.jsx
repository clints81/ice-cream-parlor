import { useState } from 'react';
import Cone from '../art/Cone.jsx';
import { Btn, Modal } from './common.jsx';
import { TASTE_META } from '../game/flavors.js';
import { profilesFor, availableFlavors, isLockedOut, MENU_REGULAR, MENU_FEATURED } from '../game/engine.js';
import { buzzLabel } from '../game/advisor.js';
import { sfx } from '../audio/sound.js';

// Tap a flavor to cycle it: off → on the menu → special → off.
export default function RotateModal({ season, ctx, onSave, onClose }) {
  const helper = ctx.mode === 'helper';
  const profs = profilesFor(season, ctx.vault);
  const names = availableFlavors(season, ctx.vault);
  const colorOf = Object.fromEntries(ctx.vault.map((v) => [v.name, v]));
  const [regular, setRegular] = useState(season.menu.regular);
  const [featured, setFeatured] = useState(season.menu.featured);
  const [shake, setShake] = useState(null);

  function cycle(f) {
    if (isLockedOut(season, f)) return;
    if (regular.includes(f)) {
      if (featured.length < MENU_FEATURED) {
        setRegular(regular.filter((x) => x !== f));
        setFeatured([...featured, f]);
        sfx.pop();
      } else {
        setRegular(regular.filter((x) => x !== f));
        sfx.tap();
      }
    } else if (featured.includes(f)) {
      setFeatured(featured.filter((x) => x !== f));
      sfx.tap();
    } else if (regular.length < MENU_REGULAR) {
      setRegular([...regular, f]);
      sfx.pop();
    } else if (featured.length < MENU_FEATURED) {
      setFeatured([...featured, f]);
      sfx.pop();
    } else {
      setShake(f);
      sfx.boop();
      setTimeout(() => setShake(null), 400);
    }
  }

  return (
    <Modal onClose={onClose} wide label="Pick today's flavors">
      <h2>{helper ? 'Pick your flavors' : "Pick today's flavors"}</h2>
      <p className="muted">
        {helper
          ? 'Tap once for the menu. Tap again to make it a special ⭐. Tap again to take it off.'
          : `Tap once to put a flavor on the menu (${MENU_REGULAR} spots), again to make it a featured special ⭐ (${MENU_FEATURED} spots), again to take it off.`}
      </p>
      <div className="slot-summary">
        <span className="slot-pill">
          🍦 {regular.length}/{MENU_REGULAR} {helper ? 'menu' : 'on the menu'}
        </span>
        <span className="slot-pill slot-special">
          ⭐ {featured.length}/{MENU_FEATURED} {helper ? 'specials' : 'featured specials'}
        </span>
      </div>
      <div className="rotate-grid">
        {names.map((f) => {
          const prof = profs[f];
          const v = colorOf[f] || { color: '#ffb547', icon: '🎁' };
          const locked = isLockedOut(season, f);
          const role = regular.includes(f) ? 'regular' : featured.includes(f) ? 'featured' : null;
          const b = season.buzz[f] || 0;
          const status = buzzLabel(season, f);
          const fans = season.fans[f] || 0;
          const isNew = !season.launched[f] && !(season.collab && season.collab.flavor === f);
          return (
            <button
              key={f}
              className={`rot-card ${role ? 'rot-' + role : ''} ${locked ? 'rot-locked' : ''} ${shake === f ? 'shake' : ''}`}
              onClick={() => cycle(f)}
              disabled={locked}
              aria-pressed={!!role}
            >
              <Cone colors={[v.color]} size={34} icon={v.icon} star={role === 'featured'} />
              <span className="rot-name">{f}</span>
              <span className="rot-tags">
                <span className={`tag taste-${prof.taste}`}>{TASTE_META[prof.taste].emoji}</span>
                {status && <span className={`tag tag-${status}`}>{status}</span>}
                {fans >= 1 && <span className="tag tag-fans">♥ {Math.round(fans)}</span>}
                {locked && <span className="tag tag-locked">shortage</span>}
                {season.collab?.flavor === f && <span className="tag tag-collab">collab</span>}
              </span>
              {role === 'featured' && isNew && (
                <span className="rot-new">{helper ? 'New! Test batch' : 'New special: test batch'} ${prof.exotic ? ctx.T.batchCostExotic : ctx.T.batchCostStd}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="modal-actions">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="primary" disabled={regular.length + featured.length === 0} onClick={() => onSave({ regular, featured })}>
          {helper ? 'Done!' : "Set today's menu"}
        </Btn>
      </div>
    </Modal>
  );
}
