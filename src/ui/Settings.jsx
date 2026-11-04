import { useState } from 'react';
import { Btn, Modal } from './common.jsx';
import VaultEditor from './VaultEditor.jsx';
import Shelf from './Shelf.jsx';

export default function Settings({ profile, inSeason, onClose, onPatch, onVault, onExport, onOpenCard, muted, onToggleMute }) {
  const [tab, setTab] = useState('play');
  const helper = profile.mode === 'helper';
  return (
    <Modal onClose={onClose} wide label="Settings">
      <h2>{profile.parlorName}</h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'play'} className={tab === 'play' ? 'on' : ''} onClick={() => setTab('play')}>
          How I play
        </button>
        <button role="tab" aria-selected={tab === 'flavors'} className={tab === 'flavors' ? 'on' : ''} onClick={() => setTab('flavors')}>
          My flavors
        </button>
        <button role="tab" aria-selected={tab === 'shelf'} className={tab === 'shelf' ? 'on' : ''} onClick={() => setTab('shelf')}>
          Season shelf
        </button>
      </div>

      {tab === 'play' && (
        <div className="settings-list">
          <label className="toggle-row">
            <span>
              <b>Helper mode</b>
              <small>Tips, big text, easy money math, and one-tap ideas. Nothing is hidden.</small>
            </span>
            <input
              type="checkbox"
              className="toggle"
              checked={helper}
              onChange={(e) => onPatch({ mode: e.target.checked ? 'helper' : 'standard' })}
            />
          </label>
          <label className="toggle-row">
            <span>
              <b>Change prices any day</b>
              <small>When this is off, prices can only change once a week (Days 1, 8, 15, 22, 29).</small>
            </span>
            <input type="checkbox" className="toggle" checked={!!profile.dailyPricing} onChange={(e) => onPatch({ dailyPricing: e.target.checked })} />
          </label>
          <label className="toggle-row">
            <span>
              <b>Sound</b>
              <small>Remembered on this computer.</small>
            </span>
            <input type="checkbox" className="toggle" checked={!muted} onChange={onToggleMute} />
          </label>
          <div className="toggle-row">
            <span>
              <b>Backup</b>
              <small>Saves live in this browser only. A backup file keeps them safe.</small>
            </span>
            <Btn onClick={onExport}>💾 Save backup file</Btn>
          </div>
        </div>
      )}

      {tab === 'flavors' && (
        <div>
          {inSeason && <p className="muted">You can add flavors and change colors now. Tastes can change between seasons.</p>}
          <VaultEditor vault={profile.vault} onChange={onVault} seasonLocked={inSeason} helper={helper} />
        </div>
      )}

      {tab === 'shelf' && <Shelf shelf={profile.shelf} onOpen={onOpenCard} />}
    </Modal>
  );
}
