import { useState } from 'react';
import { tierName, tierIndexForScore } from '../game/reputation.js';

// "Who's playing?" launcher. Each card is an independent saved parlor.
export default function ProfileSelect({ profiles, onSelect, onNew, onDelete, onImport, onExport }) {
  const sorted = [...profiles].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const [showImport, setShowImport] = useState(false);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);

  function doImport() {
    try {
      const n = onImport(code);
      setMsg({ ok: true, text: `Added ${n} parlor${n === 1 ? '' : 's'}!` });
      setCode('');
      setShowImport(false);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
  }

  async function doExport() {
    const data = onExport();
    try {
      await navigator.clipboard.writeText(data);
      setMsg({ ok: true, text: 'Backup copied to clipboard. Paste it somewhere safe.' });
    } catch {
      setMsg({ ok: true, text: data });
    }
  }

  return (
    <div className="app setup">
      <h1 className="setup-title">🍦 Who's playing?</h1>
      <p className="setup-lead">Pick a parlor to keep playing, or start a new one.</p>

      <div className="profile-list">
        {sorted.map((p) => {
          const cur = p.current;
          const tier = tierName(tierIndexForScore(cur.repScore));
          const done = cur.phase === 'end';
          return (
            <div key={p.id} className="profile-card">
              <button className="profile-main" onClick={() => onSelect(p.id)}>
                <div className="profile-head">
                  <span className="profile-name">{p.parlorName}</span>
                  {p.easyMode && <span className="tag tag-easy">★ easy</span>}
                </div>
                <div className="profile-sub">
                  Season {cur.seasonNumber} ·{' '}
                  {done ? 'season complete' : `Day ${cur.day} of 30`} · {tier}
                </div>
              </button>
              <button
                className="profile-delete"
                title="Delete this parlor"
                onClick={() => {
                  if (window.confirm(`Delete "${p.parlorName}"? This can't be undone.`)) {
                    onDelete(p.id);
                  }
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <button className="btn btn-primary btn-open" onClick={onNew}>
        + New parlor
      </button>

      {msg && (
        <p className={msg.ok ? 'import-msg ok' : 'import-msg err'}>{msg.text}</p>
      )}

      {showImport ? (
        <div className="import-box">
          <p className="muted">Paste a saved parlor code below and press Add.</p>
          <textarea
            className="import-area"
            placeholder="Paste save code here…"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <div className="import-actions">
            <button className="btn" onClick={() => { setShowImport(false); setCode(''); }}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={!code.trim()} onClick={doImport}>
              Add parlor
            </button>
          </div>
        </div>
      ) : (
        <div className="import-links">
          <button className="link-btn" onClick={() => { setMsg(null); setShowImport(true); }}>
            Import a saved parlor
          </button>
          {sorted.length > 0 && (
            <button className="link-btn" onClick={doExport}>Back up my parlors</button>
          )}
        </div>
      )}
    </div>
  );
}
