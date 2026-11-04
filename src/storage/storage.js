// Persistence lives behind this small module so game logic never touches
// localStorage directly. To move saves somewhere else later, swap `backend`.
//
// Store shape (schemaVersion 3):
// {
//   schemaVersion: 3,
//   activeId: string | null,
//   profiles: { [id]: Profile },
// }
// Profile: { id, parlorName, avatar, mode: 'standard'|'helper', dailyPricing,
//            createdAt, updatedAt, vault: [{name,color,icon,taste}],
//            shelf: [SeasonCard], season: Season | null, seasonCount }
//
// History: v1 was a single save ('ice-cream-parlor-save-v1'), v2 added
// profiles ('ice-cream-parlor-profiles-v2'). v3 starts fresh under a new key
// and leaves the old keys untouched. Old saves can still be brought in by
// hand: the importer accepts v1/v2 backups and keeps the parlor name and
// flavor vault (not the old stats, which used different rules).

import { makeVaultFlavor } from '../game/flavors.js';

export const SCHEMA_VERSION = 3;
const KEY = 'ice-cream-parlor:store';
const DEVICE_KEY = 'ice-cream-parlor:device';
const LEGACY_KEYS = ['ice-cream-parlor-profiles-v2', 'ice-cream-parlor-save-v1'];

const memory = new Map();
export const backend = {
  get(key) {
    try {
      return globalThis.localStorage ? localStorage.getItem(key) : memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  },
  set(key, value) {
    try {
      if (globalThis.localStorage) localStorage.setItem(key, value);
      else memory.set(key, value);
      return true;
    } catch {
      memory.set(key, value);
      return false;
    }
  },
};

// Migrations from version N to N+1. Add new ones here when the shape changes;
// each takes the parsed store and returns the upgraded store.
const MIGRATIONS = {
  // 3: (store) => ({ ...store, schemaVersion: 4, ... }),
};

export function migrate(store) {
  let s = store;
  while (s.schemaVersion < SCHEMA_VERSION) {
    const step = MIGRATIONS[s.schemaVersion];
    if (!step) throw new Error(`No migration from schema ${s.schemaVersion}`);
    s = step(s);
  }
  return s;
}

export function emptyStore() {
  return { schemaVersion: SCHEMA_VERSION, activeId: null, profiles: {} };
}

export function loadStore() {
  const raw = backend.get(KEY);
  if (!raw) return emptyStore();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.profiles) return emptyStore();
    return migrate({ schemaVersion: parsed.schemaVersion ?? SCHEMA_VERSION, ...parsed });
  } catch (e) {
    // Never throw away a save we can't read: park it under a backup key.
    backend.set(`${KEY}:unreadable:${Date.now()}`, raw);
    console.error('Could not read save, starting fresh', e);
    return emptyStore();
  }
}

export function saveStore(store) {
  return backend.set(KEY, JSON.stringify(store));
}

// Do old-version saves exist in this browser? (Shown as a hint on the
// player screen, so a parent can bring an old parlor back if asked.)
export function legacySaveText() {
  for (const k of LEGACY_KEYS) {
    const raw = backend.get(k);
    if (raw) return raw;
  }
  return null;
}

// ---- profiles ---------------------------------------------------------------

export function genId() {
  return 'p_' + Math.random().toString(36).slice(2, 10);
}

export function newProfile({ parlorName, avatar, mode, vault }) {
  const now = Date.now();
  return {
    id: genId(),
    parlorName: parlorName.trim(),
    avatar,
    mode,
    dailyPricing: mode === 'standard',
    createdAt: now,
    updatedAt: now,
    vault,
    shelf: [],
    season: null,
    seasonCount: 0,
  };
}

// ---- backup files -----------------------------------------------------------

export function exportProfileText(profile) {
  return JSON.stringify(
    {
      kind: 'ice-cream-parlor-profile',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      profile,
    },
    null,
    1,
  );
}

export function backupFileName(profile) {
  const safe = profile.parlorName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const d = new Date().toISOString().slice(0, 10);
  return `${safe || 'parlor'}-backup-${d}.json`;
}

function fromLegacyProfile(p) {
  const vaultNames = p.current?.vault || p.vault || [];
  const collab = (n) => /'s /.test(n) && /PokeSnack|PikaBites|Snorlax|Jiggly|ScoopDex|Eevee/.test(n);
  return newProfile({
    parlorName: p.parlorName || 'My Parlor',
    avatar: 'cat',
    mode: p.easyMode ? 'helper' : 'standard',
    vault: vaultNames.filter((n) => !collab(n)).map((n) => makeVaultFlavor(n)),
  });
}

// Accepts: a v3 profile export, a whole v3 store, or a v1/v2 backup.
// Returns a list of profiles ready to add (with fresh ids).
export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text.trim());
  } catch {
    throw new Error("That file doesn't look like a parlor backup.");
  }
  const out = [];
  if (data?.kind === 'ice-cream-parlor-profile' && data.profile) {
    const wrapped = migrate({ schemaVersion: data.schemaVersion ?? SCHEMA_VERSION, activeId: null, profiles: { x: data.profile } });
    out.push(wrapped.profiles.x);
  } else if (data?.schemaVersion >= 3 && data.profiles) {
    out.push(...Object.values(migrate(data).profiles));
  } else if (data?.profiles) {
    // v2 store: { activeId, profiles: { id: { parlorName, easyMode, current: { vault } } } }
    out.push(...Object.values(data.profiles).filter((p) => p?.parlorName).map(fromLegacyProfile));
  } else if (data?.parlorName) {
    // v1 single save
    out.push(fromLegacyProfile(data));
  }
  if (out.length === 0) throw new Error('No parlors found in that file.');
  return out.map((p) => ({ ...p, id: genId(), updatedAt: Date.now() }));
}

// ---- per-device preferences (mute, etc.) -------------------------------------

export function getDevicePrefs() {
  try {
    return { muted: false, ...(JSON.parse(backend.get(DEVICE_KEY) || '{}')) };
  } catch {
    return { muted: false };
  }
}

export function setDevicePrefs(prefs) {
  backend.set(DEVICE_KEY, JSON.stringify(prefs));
}
