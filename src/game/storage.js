// Multi-profile save store. Each profile is an independent game (its own
// parlor name, vault, season, easy-mode flag) so siblings can each have their
// own parlor on the same browser.
const KEY = 'ice-cream-parlor-profiles-v2';
const OLD_KEY = 'ice-cream-parlor-save-v1';

export function genId() {
  return 'p_' + Math.random().toString(36).slice(2, 9);
}

function emptyStore() {
  return { activeId: null, profiles: {} };
}

// Non-destructive migration: if a single-save v1 exists and there's no v2 yet,
// wrap it as one profile. The old key is left in place.
function migrateV1() {
  try {
    const raw = localStorage.getItem(OLD_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw);
    if (!old || !old.current) return null;
    const id = genId();
    const profile = {
      id,
      parlorName: old.parlorName,
      easyMode: false,
      createdAt: Date.now(),
      seasons: old.seasons || [],
      current: {
        ...old.current,
        easyMode: false,
        seasonSeed: old.current.seasonSeed ?? Math.floor(Math.random() * 1e9),
      },
    };
    return { activeId: null, profiles: { [id]: profile } };
  } catch {
    return null;
  }
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to migration / empty */
  }
  const migrated = migrateV1();
  if (migrated) {
    persistStore(migrated);
    return migrated;
  }
  return emptyStore();
}

export function persistStore(store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}
