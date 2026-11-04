import { useRef, useState } from 'react';
import Avatar from '../art/Avatar.jsx';
import Cone from '../art/Cone.jsx';
import { Btn, Modal } from './common.jsx';
import { tierName, tierFor } from '../game/fame.js';
import { legacySaveText } from '../storage/storage.js';

function Status({ p }) {
  const s = p.season;
  if (!s) return <span>{p.shelf.length ? `${p.shelf.length} season${p.shelf.length > 1 ? 's' : ''} on the shelf` : 'Ready for Season 1'}</span>;
  if (s.phase === 'over') return <span>Season {s.number} finished!</span>;
  return (
    <span>
      Season {s.number} · Day {s.day} · ★ {tierName(tierFor(s.fame), p.mode === 'helper')}
    </span>
  );
}

export default function PlayerPicker({ profiles, onSelect, onNew, onRename, onDelete, onImport, onExport }) {
  const sorted = [...profiles].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const [menuFor, setMenuFor] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const hasLegacy = !!legacySaveText();

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const n = onImport(text);
      setMsg({ ok: true, text: `Welcome back! Added ${n} parlor${n === 1 ? '' : 's'}.` });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  function bringBackLegacy() {
    try {
      const n = onImport(legacySaveText());
      setMsg({ ok: true, text: `Brought back ${n} old parlor${n === 1 ? '' : 's'} (names and flavors).` });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  return (
    <div className="picker">
      <div className="picker-hero">
        <div className="picker-cones" aria-hidden="true">
          <Cone colors={['#f59ab5', '#8be3b8', '#7b4a2e']} size={54} />
          <Cone colors={['#fbe36b', '#5aa9f0']} size={54} />
          <Cone colors={['#c3a6ea']} size={54} />
        </div>
        <h1 className="picker-title">Who's playing?</h1>
      </div>

      <div className="player-grid">
        {sorted.map((p) => (
          <div key={p.id} className="player-card">
            <button className="player-main" onClick={() => onSelect(p.id)}>
              <Avatar id={p.avatar} size={96} />
              <span className="player-parlor">{p.parlorName}</span>
              <span className="player-status">
                <Status p={p} />
              </span>
              {p.mode === 'helper' && <span className="tag tag-helper">Helper</span>}
            </button>
            <button className="player-more" aria-label={`More options for ${p.parlorName}`} onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}>
              ⋯
            </button>
            {menuFor === p.id && (
              <div className="player-menu" role="menu">
                <button role="menuitem" onClick={() => { setRenaming({ id: p.id, name: p.parlorName }); setMenuFor(null); }}>✏️ Rename</button>
                <button role="menuitem" onClick={() => { onExport(p.id); setMenuFor(null); setMsg({ ok: true, text: 'Backup file saved to your Downloads.' }); }}>💾 Save a backup file</button>
                <button role="menuitem" className="danger" onClick={() => { setDeleting(p); setMenuFor(null); }}>🗑️ Delete…</button>
              </div>
            )}
          </div>
        ))}
        <button className="player-card player-new" onClick={onNew}>
          <span className="player-plus">+</span>
          <span className="player-parlor">New player</span>
        </button>
      </div>

      {msg && <p className={`flash ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</p>}

      <div className="picker-links">
        <button className="link-btn" onClick={() => fileRef.current?.click()}>
          📂 Open a backup file
        </button>
        {hasLegacy && (
          <button className="link-btn" onClick={bringBackLegacy} title="Copies parlor names and flavors from the older version of the game">
            🕰️ Bring back parlors from the old version
          </button>
        )}
        <input ref={fileRef} type="file" accept=".json,application/json,.txt" hidden onChange={handleFile} />
      </div>

      {renaming && (
        <Modal onClose={() => setRenaming(null)} label="Rename parlor">
          <h2>Rename parlor</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (renaming.name.trim()) {
                onRename(renaming.id, renaming.name.trim());
                setRenaming(null);
              }
            }}
          >
            <input className="big-input" autoFocus maxLength={30} value={renaming.name} onChange={(e) => setRenaming({ ...renaming, name: e.target.value })} />
            <div className="modal-actions">
              <Btn onClick={() => setRenaming(null)}>Cancel</Btn>
              <Btn kind="primary" type="submit" disabled={!renaming.name.trim()}>Save</Btn>
            </div>
          </form>
        </Modal>
      )}

      {deleting && <DeleteConfirm profile={deleting} onCancel={() => setDeleting(null)} onExport={onExport} onConfirm={() => { onDelete(deleting.id); setDeleting(null); }} />}
    </div>
  );
}

function DeleteConfirm({ profile, onCancel, onConfirm, onExport }) {
  const [sure, setSure] = useState(false);
  return (
    <Modal onClose={onCancel} label="Delete parlor">
      <div className="delete-confirm">
        <Avatar id={profile.avatar} size={72} />
        <h2>Delete “{profile.parlorName}”?</h2>
        <p>
          This removes the parlor, its flavor vault, and all {profile.shelf.length} season{profile.shelf.length === 1 ? '' : 's'} on its shelf.
          It can't be undone.
        </p>
        <p>
          <button className="link-btn" onClick={() => onExport(profile.id)}>💾 Save a backup file first</button>
        </p>
        <label className="check-row">
          <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} />
          Yes, I really want to delete this parlor.
        </label>
        <div className="modal-actions">
          <Btn onClick={onCancel}>Keep it</Btn>
          <Btn kind="danger" disabled={!sure} onClick={onConfirm}>Delete forever</Btn>
        </div>
      </div>
    </Modal>
  );
}
