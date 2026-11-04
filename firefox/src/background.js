// SPDX-License-Identifier: GPL-3.0-or-later
//
// background.js — MV3 event page (Firefox: scripts + type "module").
// Owns the browser chrome theme (browser.theme), the global enable flag, the
// per-site disable list, the action-badge toggle, and the {type:'state'}
// handshake broadcast to content scripts. Spec §10, design §9.2/§9.3.
//
// State model (design §9.3):
//   storage.sync  → { enabled: boolean /* default true, spec-pinned F22 */,
//                     themeId: string  /* 'monokai' */ }
//   storage.local → { disabledSites: string[] /* origins */,
//                     preTheme: Record<windowId, Theme> }
//
// The event page is stateless across unloads — everything re-derives from
// storage on wake; the in-memory `applied` map only prevents gratuitous
// update/reset cycling within one lifetime.

import { pack } from './theme/tokens.js';
import { buildChromeTheme } from './theme/chrome-theme.js';

export const DEFAULT_ENABLED = true;
export const DEFAULT_THEME_ID = 'monokai';

// Badge colors, resolved from the pack (design §9.3: ON green / OFF taupe,
// dark text) — emitted values must be pack values (spec §0 invariant).
const BADGE_ON_BG = pack.colors.interactive.default;   // #a6e22e
const BADGE_OFF_BG = pack.colors.button.primary.bg;    // #75715e
const BADGE_TEXT = pack.colors.background.default;     // #272822

// windowId → JSON signature of the last theme WE sent for that window
// (spec §10.1 idempotence). In-memory only; see header.
const applied = new Map();

export function getApi() {
  return globalThis.browser ?? globalThis.chrome;
}

export function themeSignature(theme) {
  return JSON.stringify(theme);
}

function reportError(err) {
  console.error('[uxx-monokai] background error:', err);
}

export async function getSyncState(api = getApi()) {
  const state = await api.storage.sync.get(['enabled', 'themeId']);
  return {
    enabled: state?.enabled ?? DEFAULT_ENABLED,
    themeId: state?.themeId ?? DEFAULT_THEME_ID,
  };
}

export async function getDisabledSites(api = getApi()) {
  const state = await api.storage.local.get(['disabledSites']);
  return state?.disabledSites ?? [];
}

export function isStateRequest(message) {
  return Boolean(message) && message.type === 'state' &&
    typeof message.origin === 'string';
}

/**
 * Design §9.2 restart-loss policy: the window theme does not survive browser
 * restart, so the theme is (re)applied on every wake — top-level evaluation
 * and runtime.onStartup. Idempotent: a window whose stored signature matches
 * the theme we would send is skipped (no update/reset cycling).
 *
 * preTheme capture (design §9.2): before our first update for a window, the
 * user's current theme is captured into storage.local.preTheme — unless
 * already captured, or the current theme is already ours (would otherwise
 * capture ourselves as "previous").
 */
export async function applyThemeIfEnabled(api = getApi()) {
  const { enabled } = await getSyncState(api);
  if (!enabled) return false;
  const theme = buildChromeTheme(pack);
  const sig = themeSignature(theme);
  const windows = await api.windows.getAll();
  const stored = await api.storage.local.get(['preTheme']);
  const preTheme = stored?.preTheme ?? {};
  let preThemeDirty = false;
  for (const win of windows) {
    if (applied.get(win.id) === sig) continue; // already ours — idempotent
    if (preTheme[win.id] === undefined) {
      const current = await api.theme.getCurrent(win.id);
      const currentSig = current ? themeSignature(current) : null;
      const nonEmpty = current && Object.keys(current).length > 0;
      if (nonEmpty && currentSig !== sig) {
        preTheme[win.id] = current;
        preThemeDirty = true;
      }
    }
    await api.theme.update(win.id, theme);
    applied.set(win.id, sig);
  }
  if (preThemeDirty) await api.storage.local.set({ preTheme });
  return true;
}

/**
 * Disable path (spec §10.5): per window, restore the captured preTheme if we
 * have one, else theme.reset(windowId) (which restores the *default* theme,
 * not the user's — the reason preTheme exists, bug 1415267). Entries we
 * restored are deleted; entries for windows no longer open are kept.
 */
export async function restoreThemes(api = getApi()) {
  const stored = await api.storage.local.get(['preTheme']);
  const preTheme = stored?.preTheme ?? {};
  const windows = await api.windows.getAll();
  for (const win of windows) {
    if (preTheme[win.id] !== undefined) {
      await api.theme.update(win.id, preTheme[win.id]);
      delete preTheme[win.id];
    } else {
      await api.theme.reset(win.id);
    }
    applied.delete(win.id);
  }
  await api.storage.local.set({ preTheme });
}

export async function updateBadge(api, enabled) {
  await api.action.setBadgeText({ text: enabled ? 'ON' : 'OFF' });
  await api.action.setBadgeBackgroundColor({ color: enabled ? BADGE_ON_BG : BADGE_OFF_BG });
  await api.action.setBadgeTextColor({ color: BADGE_TEXT });
}

export async function refreshBadge(api = getApi()) {
  const { enabled } = await getSyncState(api);
  await updateBadge(api, enabled);
}

/** content → background → content (spec §9.4 shapes). */
export async function handleMessage(message, api = getApi()) {
  if (!isStateRequest(message)) return undefined;
  const { enabled } = await getSyncState(api);
  const disabledSites = await getDisabledSites(api);
  return { type: 'state', enabled, siteDisabled: disabledSites.includes(message.origin) };
}

/**
 * action.onClicked (popup-less toggle, design §9.3): flip enabled, badge,
 * apply-or-restore per window, broadcast {type:'state'} to every tab. Tabs
 * without a receiver (privileged pages) reject → skipped silently.
 */
export async function toggleEnabled(api = getApi()) {
  const { enabled, themeId } = await getSyncState(api);
  const next = !enabled;
  await api.storage.sync.set({ enabled: next, themeId });
  await updateBadge(api, next);
  if (next) await applyThemeIfEnabled(api);
  else await restoreThemes(api);
  const tabs = await api.tabs.query({});
  await Promise.allSettled(tabs.map((tab) =>
    api.tabs.sendMessage(tab.id, { type: 'state', enabled: next, siteDisabled: false })
  ));
  return next;
}

/**
 * theme.onUpdated (design §9.2): the user switched themes while we were
 * enabled — if the incoming theme differs from what we last applied for that
 * window, refresh preTheme so disable restores their *newest* choice.
 */
export async function handleThemeUpdated(event, api = getApi()) {
  if (!event || event.windowId === undefined || event.windowId === null) return;
  if (!event.theme) return;
  const incomingSig = themeSignature(event.theme);
  if (applied.get(event.windowId) === incomingSig) return; // our own update
  const ours = themeSignature(buildChromeTheme(pack));
  if (incomingSig === ours) return; // ours, applied before a cold wake
  const stored = await api.storage.local.get(['preTheme']);
  const preTheme = stored?.preTheme ?? {};
  preTheme[event.windowId] = event.theme;
  await api.storage.local.set({ preTheme });
}

/**
 * Wire listeners + initial wake work. Exported so tests can drive it; the
 * module bottom calls it only when __UXX_TEST__ is unset (spec §10, same
 * guard as content main.js §9.2).
 */
export function start(api = getApi()) {
  if (!api) return false; // fail open: no extension API, nothing to do
  api.runtime.onStartup?.addListener(() => {
    applyThemeIfEnabled(api).then(() => refreshBadge(api)).catch(reportError);
  });
  api.action.onClicked?.addListener(() => {
    toggleEnabled(api).catch(reportError);
  });
  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isStateRequest(message)) return undefined;
    handleMessage(message, api).then(sendResponse).catch(reportError);
    return true; // keep the channel open for the async reply
  });
  api.theme.onUpdated?.addListener((event) => {
    handleThemeUpdated(event, api).catch(reportError);
  });
  // Restart-loss policy: apply on every wake (idempotent), then reflect the
  // state in the badge (spec-extension beyond §10.2: the badge would otherwise
  // be blank after an event-page restart while enabled).
  applyThemeIfEnabled(api).then(() => refreshBadge(api)).catch(reportError);
  return true;
}

// Guarded autostart (spec §10): define handlers at top level, apply the theme
// at load when enabled. Never runs under vitest (tests/setup.js sets the flag).
if (!globalThis.__UXX_TEST__) start();
