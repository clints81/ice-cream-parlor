import { useEffect, useMemo, useState } from 'react';
import {
  loadStore, saveStore, newProfile, exportProfileText, backupFileName, parseImport,
  getDevicePrefs, setDevicePrefs,
} from './storage/storage.js';
import * as E from './game/engine.js';
import { TUNING } from './game/tuning.js';
import { newSeed } from './game/rng.js';
import { makeVaultFlavor, profileFor } from './game/flavors.js';
import {
  ambitionProgress, ambitionTitle, gradeFor, reportLines,
} from './game/ambitions.js';
import { setMuted, unlockAudio } from './audio/sound.js';
import PlayerPicker from './ui/PlayerPicker.jsx';
import NewPlayer from './ui/NewPlayer.jsx';
import SeasonStart from './ui/SeasonStart.jsx';
import SeasonReport from './ui/SeasonReport.jsx';
import TopBar from './ui/TopBar.jsx';
import Parlor from './ui/Parlor.jsx';
import DayShow from './ui/DayShow.jsx';
import DayReport from './ui/DayReport.jsx';
import Settings from './ui/Settings.jsx';
import { Modal } from './ui/common.jsx';
import { AmbitionCard } from './ui/Parlor.jsx';

function download(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Snapshot a finished season as a shelf card.
function makeCard(season, vault) {
  const prog = ambitionProgress(season, TUNING);
  const meta = Object.fromEntries(vault.map((v) => [v.name, v]));
  return {
    number: season.number,
    ambition: season.ambition,
    title: ambitionTitle(season.ambition),
    pct: prog?.pct ?? 0,
    grade: gradeFor(prog?.pct ?? 0),
    parts: prog?.parts ?? [],
    finalCash: season.cash,
    finalFame: season.fame,
    tierMax: season.tierMax,
    served: season.stats.served,
    topFlavors: E.topFlavors(season.stats.scoops, 5).map((t) => ({
      ...t,
      color: meta[t.flavor]?.color,
      icon: meta[t.flavor]?.icon,
    })),
    lines: reportLines(season, TUNING),
    history: season.history.map((h) => ({ day: h.day, cash: h.cash, fame: h.fame, profit: h.profit })),
    mood: season.schedule.mood,
    finishedAt: Date.now(),
  };
}

export default function App() {
  const [store, setStore] = useState(() => loadStore());
  const [creating, setCreating] = useState(false);
  const [settings, setSettings] = useState(false);
  const [viewCard, setViewCard] = useState(null);
  const [showAmbition, setShowAmbition] = useState(false);
  const [prefs, setPrefs] = useState(() => getDevicePrefs());

  // Autosave on every change.
  useEffect(() => {
    saveStore(store);
  }, [store]);

  useEffect(() => {
    setMuted(!!prefs.muted);
    setDevicePrefs(prefs);
  }, [prefs]);

  const profile = store.activeId ? store.profiles[store.activeId] : null;
  const season = profile?.season ?? null;

  useEffect(() => {
    document.documentElement.classList.toggle('helper', profile?.mode === 'helper');
  }, [profile?.mode]);

  const ctx = useMemo(
    () => (profile ? { vault: profile.vault, mode: profile.mode, dailyPricing: !!profile.dailyPricing, T: TUNING } : null),
    [profile],
  );

  function patchProfile(id, fn) {
    setStore((s) => {
      const p = s.profiles[id];
      if (!p) return s;
      const next = { ...fn(p), updatedAt: Date.now() };
      return { ...s, profiles: { ...s.profiles, [id]: next } };
    });
  }
  const patchActive = (fn) => patchProfile(store.activeId, fn);
  const updateSeason = (fn) => patchActive((p) => ({ ...p, season: fn(p.season, p) }));
  const ctxOf = (p) => ({ vault: p.vault, mode: p.mode, dailyPricing: !!p.dailyPricing, T: TUNING });

  // ---- profile actions ------------------------------------------------------
  function createPlayer(data) {
    const p = newProfile(data);
    setStore((s) => ({ ...s, activeId: p.id, profiles: { ...s.profiles, [p.id]: p } }));
    setCreating(false);
  }
  const selectPlayer = (id) => {
    unlockAudio();
    setStore((s) => ({ ...s, activeId: id }));
  };
  const switchPlayer = () => {
    setSettings(false);
    setViewCard(null);
    setStore((s) => ({ ...s, activeId: null }));
  };
  const renamePlayer = (id, parlorName) => patchProfile(id, (p) => ({ ...p, parlorName }));
  const deletePlayer = (id) =>
    setStore((s) => {
      const profiles = { ...s.profiles };
      delete profiles[id];
      return { ...s, activeId: s.activeId === id ? null : s.activeId, profiles };
    });
  const exportPlayer = (id) => {
    const p = store.profiles[id];
    if (p) download(backupFileName(p), exportProfileText(p));
  };
  const importPlayers = (text) => {
    const list = parseImport(text);
    setStore((s) => {
      const profiles = { ...s.profiles };
      for (const p of list) profiles[p.id] = p;
      return { ...s, profiles };
    });
    return list.length;
  };

  // ---- season actions -------------------------------------------------------
  function startSeason(ambition) {
    patchActive((p) => ({
      ...p,
      seasonCount: (p.seasonCount || 0) + 1,
      season: E.createSeason({ number: (p.seasonCount || 0) + 1, seed: newSeed(), vault: p.vault, ambition, T: TUNING }),
    }));
  }

  const actions = {
    setMenu: (menu) => updateSeason((s) => E.setMenu(s, menu)),
    setPrices: (prices) => updateSeason((s) => E.setPrices(s, prices)),
    chooseRumor: (day, choice) => updateSeason((s) => E.chooseRumor(s, day, choice)),
    chooseShock: (choice) => updateSeason((s) => E.chooseShock(s, choice)),
    invent: (name) =>
      patchActive((p) => {
        if (p.vault.some((v) => v.name.toLowerCase() === name.toLowerCase())) {
          return { ...p, season: E.markInventionDone(p.season, null) };
        }
        const vf = makeVaultFlavor(name);
        return {
          ...p,
          vault: [...p.vault, vf],
          season: E.markInventionDone(p.season, vf.name, profileFor(vf.name)),
        };
      }),
    skipInvention: () => updateSeason((s) => E.markInventionDone(s, null)),
    runDay: () => updateSeason((s, p) => (s.phase === 'plan' ? E.runDay(s, ctxOf(p)) : s)),
  };

  const finishWatching = () => updateSeason((s) => E.finishWatching(s));
  const ackMilestones = () =>
    updateSeason((s) => (s.lastDay ? { ...s, lastDay: { ...s.lastDay, milestonesAcked: true } } : s));

  function nextDay() {
    patchActive((p) => {
      const s = p.season;
      if (!s || s.phase !== 'report') return p;
      const next = E.advanceDay(s, ctxOf(p));
      if (next.phase === 'over') {
        // Put the card on the shelf right away so a refresh can't lose it.
        const card = makeCard(next, p.vault);
        return { ...p, shelf: [...p.shelf.filter((c) => c.number !== card.number), card], season: { ...next, cardSaved: true } };
      }
      return { ...p, season: next };
    });
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  const closeSeason = () => patchActive((p) => ({ ...p, season: null }));

  // ---- routing --------------------------------------------------------------
  const toggleMute = () => {
    unlockAudio();
    setPrefs((x) => ({ ...x, muted: !x.muted }));
  };

  if (!profile) {
    const list = Object.values(store.profiles);
    if (creating || list.length === 0) {
      return (
        <main className="app app-plain">
          <NewPlayer onDone={createPlayer} onCancel={list.length ? () => setCreating(false) : null} />
        </main>
      );
    }
    return (
      <main className="app app-plain">
        <PlayerPicker
          profiles={list}
          onSelect={selectPlayer}
          onNew={() => setCreating(true)}
          onRename={renamePlayer}
          onDelete={deletePlayer}
          onImport={importPlayers}
          onExport={exportPlayer}
        />
      </main>
    );
  }

  const helper = profile.mode === 'helper';
  let body;
  if (viewCard) {
    body = <SeasonReport card={viewCard} onClose={() => setViewCard(null)} helper={helper} startCash={TUNING.startCash} />;
  } else if (!season) {
    body = (
      <SeasonStart
        profile={profile}
        onVault={(vault) => patchActive((p) => ({ ...p, vault }))}
        onStart={startSeason}
        onOpenCard={setViewCard}
      />
    );
  } else if (season.phase === 'over') {
    const card = profile.shelf.find((c) => c.number === season.number) || makeCard(season, profile.vault);
    body = (
      <SeasonReport card={card} onClose={closeSeason} closeLabel={helper ? 'Put it on my shelf ✓' : 'Put it on the shelf ✓'} celebrate helper={helper} startCash={TUNING.startCash} />
    );
  } else if (season.phase === 'watch') {
    body = <DayShow key={season.day} profile={profile} season={season} onDone={finishWatching} />;
  } else if (season.phase === 'report') {
    body = <DayReport profile={profile} season={season} ctx={ctx} onNext={nextDay} onAckMilestones={ackMilestones} />;
  } else {
    body = <Parlor profile={profile} season={season} ctx={ctx} actions={actions} />;
  }

  return (
    <main className={`app ${helper ? 'is-helper' : ''}`}>
      <TopBar
        profile={profile}
        season={season && season.phase !== 'over' ? season : null}
        muted={!!prefs.muted}
        onToggleMute={toggleMute}
        onSwitch={switchPlayer}
        onSettings={() => setSettings(true)}
        onAmbition={() => setShowAmbition(true)}
      />
      {body}
      {settings && (
        <Settings
          profile={profile}
          inSeason={!!season && season.phase !== 'over'}
          onClose={() => setSettings(false)}
          onPatch={(patch) =>
            patchActive((p) => ({
              ...p,
              ...patch,
              ...(patch.mode && patch.dailyPricing === undefined ? { dailyPricing: patch.mode === 'standard' } : {}),
            }))
          }
          onVault={(vault) => patchActive((p) => ({ ...p, vault }))}
          onExport={() => exportPlayer(profile.id)}
          onOpenCard={(c) => {
            setSettings(false);
            setViewCard(c);
          }}
          muted={!!prefs.muted}
          onToggleMute={toggleMute}
        />
      )}
      {showAmbition && season && (
        <Modal onClose={() => setShowAmbition(false)} label="Season goal">
          <AmbitionCard season={season} T={TUNING} helper={helper} />
        </Modal>
      )}
    </main>
  );
}
