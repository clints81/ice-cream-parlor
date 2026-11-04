import Avatar from '../art/Avatar.jsx';
import { FameMeter, ProgressBar, money } from './common.jsx';
import { ambitionTitle, ambitionProgress, AMBITIONS } from '../game/ambitions.js';
import { TUNING } from '../game/tuning.js';
import { SEASON_LENGTH } from '../game/engine.js';

export default function TopBar({ profile, season, muted, onToggleMute, onSwitch, onSettings, onAmbition }) {
  const helper = profile.mode === 'helper';
  const prog = season ? ambitionProgress(season, TUNING) : null;
  const amb = season?.ambition ? AMBITIONS[season.ambition.id] : null;
  return (
    <header className="topbar">
      <div className="tb-left">
        <button className="tb-player" onClick={onSwitch} title="Switch player">
          <Avatar id={profile.avatar} size={44} />
          <span className="tb-names">
            <span className="tb-parlor">{profile.parlorName}</span>
            <span className="tb-switch">{helper ? 'Switch' : 'Switch player'} ⇄</span>
          </span>
        </button>
      </div>

      {season && (
        <div className="tb-mid">
          <div className="tb-day">
            <span className="tb-label">{helper ? 'Day' : 'Season ' + season.number + ' · Day'}</span>
            <span className="tb-big">
              {season.day}
              <small>/{SEASON_LENGTH}</small>
            </span>
          </div>
          <div className="tb-cash">
            <span className="tb-label">{helper ? 'Money' : 'Cash'}</span>
            <span className={`tb-big ${season.cash < 0 ? 'neg' : ''}`}>{money(season.cash, helper)}</span>
          </div>
          <FameMeter fame={season.fame} helper={helper} compact />
          {amb && prog && (
            <button className="tb-amb" onClick={onAmbition} title="Your season goal">
              <span className="tb-amb-emoji">{amb.emoji}</span>
              <span className="tb-amb-body">
                <span className="tb-amb-name">{ambitionTitle(season.ambition)}</span>
                <ProgressBar pct={prog.pct} label="Goal progress" tone="mint" />
              </span>
            </button>
          )}
        </div>
      )}

      <div className="tb-right">
        <button className="icon-btn" onClick={onToggleMute} aria-label={muted ? 'Turn sound on' : 'Turn sound off'} title={muted ? 'Sound off' : 'Sound on'}>
          {muted ? '🔇' : '🔊'}
        </button>
        <button className="icon-btn" onClick={onSettings} aria-label="Settings" title="Settings">
          ⚙️
        </button>
      </div>
    </header>
  );
}
