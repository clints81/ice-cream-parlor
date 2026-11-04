import { useState } from 'react';
import { BuzzTag, TasteTag } from './common.jsx';

// Tap order decides roles: first 5 picks are the regular menu, the next 2 are
// featured specials. Tapping a selected flavor removes it.
export default function RotateModal({ current, onSave, onClose }) {
  const { vault, menu, buzz, everFeatured, activeShock, collab } = current;
  const [selected, setSelected] = useState([...menu.regular, ...menu.featured]);

  function toggle(f) {
    if (selected.includes(f)) {
      setSelected(selected.filter((x) => x !== f));
    } else if (selected.length < 7) {
      setSelected([...selected, f]);
    }
  }

  const regular = selected.slice(0, 5);
  const featured = selected.slice(5, 7);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Rotate flavors</h2>
        <p className="muted">
          Tap flavors in order: your first 5 picks fill the regular menu, the next 2
          become featured specials. Tap again to remove.
        </p>
        <div className="chip-row">
          {vault.map((f) => {
            const shocked = activeShock && activeShock.flavor === f;
            const idx = selected.indexOf(f);
            const role = idx === -1 ? null : idx < 5 ? 'regular' : 'featured';
            const b = buzz[f] || 0;
            return (
              <button
                key={f}
                disabled={shocked}
                className={
                  'chip chip-select' +
                  (role === 'regular' ? ' chip-regular' : '') +
                  (role === 'featured' ? ' chip-featured' : '') +
                  (shocked ? ' chip-disabled' : '')
                }
                onClick={() => toggle(f)}
              >
                {f}
                <TasteTag flavor={f} />
                {collab && collab.flavor === f && <span className="mini-note">limited</span>}
                {shocked && <span className="mini-note">shortage</span>}
                {!shocked && everFeatured[f] && (
                  <span className="mini-note">{Math.round(b * 100)}% buzz</span>
                )}
                {!shocked && <BuzzTag buzz={b} />}
              </button>
            );
          })}
        </div>
        <div className="rotate-summary">
          <div>
            <span className="dot dot-regular" /> Regular ({regular.length}/5):{' '}
            {regular.join(', ') || '—'}
          </div>
          <div>
            <span className="dot dot-featured" /> Featured ({featured.length}/2):{' '}
            {featured.join(', ') || '—'}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={regular.length + featured.length === 0}
            onClick={() => onSave({ regular, featured })}
          >
            Set today's menu
          </button>
        </div>
      </div>
    </div>
  );
}
