import { useEffect, useState } from 'react';
import { loadStore, persistStore, genId } from './game/storage.js';
import { eventForDay, rollIncident } from './game/events.js';
import { simulateDay } from './game/simulate.js';
import {
  tierIndexForScore, milestoneText, CHANNEL_NAMES, COLLAB_FLAVOR_IDEAS,
} from './game/reputation.js';
import { randInt, pick } from './game/rng.js';
import { DEFAULT_PRICE } from './game/flavors.js';
import Setup from './components/Setup.jsx';
import ProfileSelect from './components/ProfileSelect.jsx';
import DayOpen from './components/DayOpen.jsx';
import Results from './components/Results.jsx';
import SeasonEnd from './components/SeasonEnd.jsx';

const SEASON_LENGTH = 30;

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function newSeasonState(seasonNumber, vault, prices, easyMode = false) {
  return {
    seasonNumber,
    seasonSeed: Math.floor(Math.random() * 1e9),
    easyMode,
    day: 1,
    phase: 'day',
    cash: 0,
    repScore: 0,
    vault: [...vault],
    menu: { regular: vault.slice(0, 5), featured: [] },
    prices: { ...prices },
    buzz: {},
    everFeatured: {},
    history: [],
    allTimeScoops: {},
    totalCustomers: 0,
    bestDay: null,
    activeShock: null,
    activeDip: null,
    incident: null,
    inventionDay: randInt(10, 20),
    inventionDone: false,
    collab: null,
    collabPending: null,
    lastResult: null,
  };
}

export default function App() {
  const [store, setStore] = useState(() => loadStore());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    persistStore(store);
  }, [store]);

  const active = store.activeId ? store.profiles[store.activeId] : null;
  const c = active?.current;

  // Patch the active profile's current season state.
  function update(patch) {
    setStore((s) => {
      const id = s.activeId;
      const prof = s.profiles[id];
      return {
        ...s,
        profiles: { ...s.profiles, [id]: { ...prof, current: { ...prof.current, ...patch } } },
      };
    });
  }

  function handleSetup(parlorName, vault, easyMode) {
    const prices = Object.fromEntries(vault.map((f) => [f, DEFAULT_PRICE]));
    const id = genId();
    const profile = {
      id, parlorName, easyMode, createdAt: Date.now(),
      seasons: [], current: newSeasonState(1, vault, prices, easyMode),
    };
    setStore((s) => ({ ...s, activeId: id, profiles: { ...s.profiles, [id]: profile } }));
    setCreating(false);
  }

  function selectProfile(id) {
    setStore((s) => ({ ...s, activeId: id }));
  }

  function switchPlayer() {
    setStore((s) => ({ ...s, activeId: null }));
  }

  function deleteProfile(id) {
    setStore((s) => {
      const profiles = { ...s.profiles };
      delete profiles[id];
      return { activeId: s.activeId === id ? null : s.activeId, profiles };
    });
  }

  // Merge parlors from a pasted save code into this browser's store. Used to
  // reunite parlors that got stranded on a different port/address. Additive:
  // never deletes existing parlors. Returns how many were added.
  function importProfiles(code) {
    let incoming;
    try {
      incoming = JSON.parse(code.trim());
    } catch {
      throw new Error("That doesn't look like a valid save code.");
    }
    // Accept a whole store {profiles:{...}}, a bare {id:profile} map, or an array.
    let list;
    if (Array.isArray(incoming)) list = incoming;
    else if (incoming.profiles) list = Object.values(incoming.profiles);
    else list = Object.values(incoming);
    const valid = list.filter((p) => p && p.id && p.parlorName && p.current);
    if (valid.length === 0) throw new Error('No parlors found in that code.');
    setStore((s) => {
      const profiles = { ...s.profiles };
      for (const p of valid) profiles[p.id] = p;
      return { ...s, profiles };
    });
    return valid.length;
  }

  function exportStore() {
    return JSON.stringify(store);
  }

  function topFlavor(allTimeScoops) {
    let best = null;
    for (const [f, n] of Object.entries(allTimeScoops)) {
      if (best === null || n > allTimeScoops[best]) best = f;
    }
    return best;
  }

  function runDay() {
    const event = eventForDay(c.seasonSeed, c.day);
    const dipMult =
      c.activeDip && c.day >= c.activeDip.startDay && c.day <= c.activeDip.endDay
        ? c.activeDip.mult
        : 1;
    const incidentMult = (c.incident?.effect?.crowdMult || 1) * dipMult;

    const result = simulateDay({
      regular: c.menu.regular,
      featured: c.menu.featured,
      prices: c.prices,
      buzz: c.buzz,
      event,
      repTierIndex: tierIndexForScore(c.repScore),
      collabFlavor: c.collab?.flavor,
      easyMode: active.easyMode,
      incidentMult,
    });

    const allTimeScoops = { ...c.allTimeScoops };
    for (const [f, n] of Object.entries(result.scoops)) {
      allTimeScoops[f] = (allTimeScoops[f] || 0) + n;
    }

    const oldTier = tierIndexForScore(c.repScore);
    const newScore = c.repScore + result.repGain;
    const newTier = tierIndexForScore(newScore);

    const milestones = [];
    let collabPending = c.collabPending;
    for (let t = oldTier + 1; t <= newTier; t++) {
      const channel = pick(CHANNEL_NAMES);
      milestones.push({ tier: t, text: milestoneText(t, topFlavor(allTimeScoops), channel) });
      if (t === 5 && !c.collab) {
        collabPending = { channel, flavor: `${channel}'s ${pick(COLLAB_FLAVOR_IDEAS)}` };
      }
    }

    const everFeatured = { ...c.everFeatured };
    for (const f of c.menu.featured) everFeatured[f] = true;

    const profit = result.profit;
    const bestDay =
      !c.bestDay || profit > c.bestDay.profit ? { day: c.day, profit } : c.bestDay;

    update({
      phase: 'results',
      cash: c.cash + profit,
      repScore: newScore,
      buzz: result.newBuzz,
      everFeatured,
      allTimeScoops,
      totalCustomers: c.totalCustomers + result.customerCount,
      bestDay,
      collabPending,
      history: [...c.history, { day: c.day, profit, revenue: result.revenue, customers: result.customerCount }],
      lastResult: { day: c.day, event, result, milestones, buzzBefore: c.buzz },
    });
  }

  function nextDay() {
    if (c.day >= SEASON_LENGTH) {
      finishSeason();
      return;
    }
    const day = c.day + 1;
    const patch = {
      day, phase: 'day', collabJustEnded: null, shockJustEnded: null, incident: null,
    };
    let menu = { regular: [...c.menu.regular], featured: [...c.menu.featured] };
    let vault = [...c.vault];
    const buzz = { ...c.buzz };
    const prices = { ...c.prices };

    // Expire an ingredient shortage.
    if (c.activeShock && day > c.activeShock.endDay) {
      patch.activeShock = null;
      patch.shockJustEnded = c.activeShock.flavor;
    } else {
      patch.activeShock = c.activeShock;
    }

    // Expire a rival-cart demand dip.
    let activeDip = c.activeDip && day > c.activeDip.endDay ? null : c.activeDip;

    // Sponsored collab flavor arrives with pre-built buzz.
    if (c.collabPending) {
      const { flavor, channel } = c.collabPending;
      vault.push(flavor);
      buzz[flavor] = 0.7;
      prices[flavor] = 4.0;
      if (menu.featured.length < 2) menu.featured.push(flavor);
      patch.collab = { flavor, channel, endDay: day + 4 };
      patch.collabPending = null;
    } else if (c.collab && day > c.collab.endDay) {
      vault = vault.filter((f) => f !== c.collab.flavor);
      menu.regular = menu.regular.filter((f) => f !== c.collab.flavor);
      menu.featured = menu.featured.filter((f) => f !== c.collab.flavor);
      patch.collab = null;
      patch.collabJustEnded = c.collab.flavor;
    }

    // Roll a surprise incident for the new day and apply its effect.
    const inc = rollIncident(active.easyMode, day);
    if (inc) {
      const applied = { id: inc.id, kind: inc.kind, title: inc.title, desc: inc.desc, effect: {} };
      let took = true;

      if (inc.effect.crowdMult) applied.effect.crowdMult = inc.effect.crowdMult;

      if (inc.effect.buzzSpike) {
        const target = menu.featured[0];
        if (target) {
          buzz[target] = clamp01((buzz[target] || 0) + inc.effect.buzzSpike);
          applied.flavor = target;
        }
      }

      if (inc.effect.shortage) {
        if (!patch.activeShock && menu.regular.length > 0) {
          const flavor = pick(menu.regular);
          const dur = randInt(inc.effect.shortage.days[0], inc.effect.shortage.days[1]);
          patch.activeShock = { flavor, startDay: day, endDay: day + dur - 1 };
          menu.regular = menu.regular.filter((f) => f !== flavor);
          applied.flavor = flavor;
          applied.until = day + dur;
        } else {
          took = false; // can't apply a shortage right now — skip the incident
        }
      }

      if (inc.effect.dip) {
        if (!activeDip) {
          const dur = randInt(inc.effect.dip.days[0], inc.effect.dip.days[1]);
          activeDip = { startDay: day, endDay: day + dur - 1, mult: inc.effect.dip.mult };
          applied.until = day + dur;
        } else {
          took = false;
        }
      }

      if (took) patch.incident = applied;
    }

    patch.activeDip = activeDip;
    update({ ...patch, menu, vault, buzz, prices });
  }

  function finishSeason() {
    const tops = Object.entries(c.allTimeScoops)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([flavor, scoops]) => ({ flavor, scoops }));
    const summary = {
      seasonNumber: c.seasonNumber,
      finalCash: c.cash,
      totalCustomers: c.totalCustomers,
      bestDay: c.bestDay,
      finalTier: tierIndexForScore(c.repScore),
      topFlavors: tops,
    };
    setStore((s) => {
      const id = s.activeId;
      const prof = s.profiles[id];
      return {
        ...s,
        profiles: {
          ...s.profiles,
          [id]: {
            ...prof,
            seasons: [...prof.seasons, summary],
            current: { ...prof.current, phase: 'end', summary },
          },
        },
      };
    });
  }

  function startNewSeason() {
    const vault = c.collab ? c.vault.filter((f) => f !== c.collab.flavor) : c.vault;
    update(newSeasonState(c.seasonNumber + 1, vault, c.prices, active.easyMode));
  }

  function inventFlavor(name) {
    update({
      vault: [...c.vault, name],
      prices: { ...c.prices, [name]: DEFAULT_PRICE },
      inventionDone: true,
    });
  }

  // --- routing ---
  if (!active) {
    const profileCount = Object.keys(store.profiles).length;
    if (creating || profileCount === 0) {
      return (
        <Setup
          onComplete={handleSetup}
          onCancel={profileCount > 0 ? () => setCreating(false) : null}
        />
      );
    }
    return (
      <ProfileSelect
        profiles={Object.values(store.profiles)}
        onSelect={selectProfile}
        onNew={() => setCreating(true)}
        onDelete={deleteProfile}
        onImport={importProfiles}
        onExport={exportStore}
      />
    );
  }

  if (c.phase === 'end') {
    return (
      <SeasonEnd
        parlorName={active.parlorName}
        summary={c.summary}
        onNewSeason={startNewSeason}
        onSwitch={switchPlayer}
      />
    );
  }
  if (c.phase === 'results') {
    return <Results parlorName={active.parlorName} current={c} onNextDay={nextDay} />;
  }
  return (
    <DayOpen
      parlorName={active.parlorName}
      current={c}
      onRotate={(menu) => update({ menu })}
      onPrices={(prices) => update({ prices })}
      onOpen={runDay}
      onInvent={inventFlavor}
      onSkipInvention={() => update({ inventionDone: true })}
      onSwitch={switchPlayer}
    />
  );
}
