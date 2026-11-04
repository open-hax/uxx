// SPDX-License-Identifier: GPL-3.0-or-later
//
// background.test.js — event-page behavior (spec §10, design §9.2/§9.3).
//
// `src/theme/chrome-theme.js` is owned by chunk B (parallel dispatch); this
// file mocks it against the §10 export contract (`buildChromeTheme(pack)`)
// so background behavior is testable independently of chunk B's timing. The
// mock builder is itself contract-checked here: the built theme's key set
// must equal the §9.2/§10 key list, so a background regression that stops
// passing the full theme through `theme.update` fails this suite.
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoisted: needed inside the vi.mock factory (which is hoisted above imports).
const h = vi.hoisted(() => {
  // Required chrome-theme keys — spec §10's transcription of design §9.2.
  const REQUIRED_KEYS = [
    'frame', 'frame_inactive',
    'toolbar', 'toolbar_text', 'bookmark_text',
    'tab_selected', 'tab_text', 'tab_background_text', 'tab_line',
    'toolbar_field', 'toolbar_field_text', 'toolbar_field_border',
    'toolbar_field_border_focus', 'toolbar_field_focus',
    'toolbar_field_highlight', 'toolbar_field_highlight_text',
    'popup', 'popup_text', 'popup_border',
    'popup_highlight', 'popup_highlight_text',
    'sidebar', 'sidebar_text', 'sidebar_border',
    'sidebar_highlight', 'sidebar_highlight_text',
    'ntp_background', 'ntp_text', 'ntp_card_background',
    'icons', 'icons_attention',
    'toolbar_top_separator', 'toolbar_bottom_separator', 'toolbar_vertical_separator',
  ];
  return { REQUIRED_KEYS };
});

// Mock of chunk B's chrome-theme.js, built from the real pack via the §10
// key table so the values are genuine pack values.
vi.mock('../src/theme/chrome-theme.js', async () => {
  const { pack } = await import('../src/theme/tokens.js');
  const p = pack.palette;
  const buildChromeTheme = (pk) => ({
    colors: {
      frame: pk.palette.bg.darker,
      frame_inactive: pk.palette.bg.default,
      toolbar: pk.palette.bg.default,
      toolbar_text: pk.palette.fg.default,
      bookmark_text: pk.palette.fg.default,
      tab_selected: pk.palette.bg.lighter,
      tab_text: pk.palette.fg.default,
      tab_background_text: pk.palette.fg.soft,
      tab_line: pk.colors.interactive.default,
      toolbar_field: pk.palette.bg.selection,
      toolbar_field_text: pk.palette.fg.default,
      toolbar_field_border: pk.palette.bg.groupBorder,
      toolbar_field_border_focus: pk.colors.border.focus,
      toolbar_field_focus: pk.palette.bg.tabInactive,
      toolbar_field_highlight: pk.palette.bg.selection,
      toolbar_field_highlight_text: pk.palette.fg.default,
      popup: pk.palette.bg.lighter,
      popup_text: pk.palette.fg.default,
      popup_border: pk.palette.bg.groupBorder,
      popup_highlight: pk.palette.bg.selection,
      popup_highlight_text: pk.palette.fg.default,
      sidebar: pk.palette.bg.darker,
      sidebar_text: pk.palette.fg.default,
      sidebar_border: pk.palette.bg.groupBorder,
      sidebar_highlight: pk.palette.bg.selection,
      sidebar_highlight_text: pk.palette.fg.default,
      ntp_background: pk.palette.bg.default,
      ntp_text: pk.palette.fg.default,
      ntp_card_background: pk.palette.bg.lighter,
      icons: pk.palette.fg.default,
      icons_attention: pk.palette.accent.green,
      toolbar_top_separator: pk.palette.bg.groupBorder,
      toolbar_bottom_separator: pk.palette.bg.groupBorder,
      toolbar_vertical_separator: pk.palette.bg.groupBorder,
    },
    properties: { color_scheme: 'dark', content_color_scheme: 'dark' },
  });
  void p;
  return { buildChromeTheme };
});

// Import after the mock declarations; setup.js already set __UXX_TEST__, so
// this import must be side-effect-free (asserted in the first test below).
// `bg` is reloaded in beforeEach: background.js keeps an in-memory
// `applied: Map<windowId, signature>` (spec §10.1 idempotence), and a stale
// map from a previous test would short-circuit theme application.
let bg;
const { buildChromeTheme } = await import('../src/theme/chrome-theme.js');
const { pack } = await import('../src/theme/tokens.js');

// ---------------------------------------------------------------------------
// Fake browser API
// ---------------------------------------------------------------------------
function makeApi({
  sync = { enabled: true, themeId: 'monokai' },
  local = { disabledSites: [], preTheme: {} },
  windows = [{ id: 1 }, { id: 2 }],
  currentThemes = {},
  tabsList = [{ id: 10 }, { id: 20 }],
  rejectTabs = [],
} = {}) {
  const calls = { update: [], reset: [], sent: [], badge: [] };
  const api = {
    storage: {
      sync: {
        get: vi.fn(async () => ({ ...sync })),
        set: vi.fn(async (obj) => { Object.assign(sync, obj); }),
      },
      local: {
        get: vi.fn(async () => ({ ...local })),
        set: vi.fn(async (obj) => { Object.assign(local, obj); }),
      },
    },
    windows: { getAll: vi.fn(async () => windows) },
    theme: {
      update: vi.fn(async (windowId, theme) => { calls.update.push({ windowId, theme }); }),
      reset: vi.fn(async (windowId) => { calls.reset.push(windowId); }),
      getCurrent: vi.fn(async (windowId) => currentThemes[windowId] ?? {}),
      onUpdated: { addListener: vi.fn() },
    },
    action: {
      onClicked: { addListener: vi.fn() },
      setBadgeText: vi.fn(async (o) => { calls.badge.push(['text', o]); }),
      setBadgeBackgroundColor: vi.fn(async (o) => { calls.badge.push(['bg', o]); }),
      setBadgeTextColor: vi.fn(async (o) => { calls.badge.push(['textColor', o]); }),
    },
    runtime: {
      onStartup: { addListener: vi.fn() },
      onMessage: { addListener: vi.fn() },
    },
    tabs: {
      query: vi.fn(async () => tabsList),
      sendMessage: vi.fn(async (tabId, msg) => {
        calls.sent.push({ tabId, msg });
        if (rejectTabs.includes(tabId)) throw new Error('no receiver for tab');
      }),
    },
  };
  return { api, sync, local, calls };
}

beforeEach(async () => {
  globalThis.__UXX_TEST__ = true;
  // Fresh module instance per test: the `applied` idempotence map must not
  // leak between tests (same window ids would short-circuit updates).
  vi.resetModules();
  bg = await import('../src/background.js');
});

afterEach(() => {
  delete globalThis.browser;
  delete globalThis.chrome;
  globalThis.__UXX_TEST__ = true;
});

// ---------------------------------------------------------------------------
describe('background', () => {

  it('does not autostart under __UXX_TEST__ (guard, spec §10)', async () => {
    vi.resetModules();
    const { api } = makeApi();
    globalThis.browser = api; // present, but the guard must prevent wiring
    await import('../src/background.js');
    expect(api.runtime.onMessage.addListener).not.toHaveBeenCalled();
    expect(api.action.onClicked.addListener).not.toHaveBeenCalled();
    expect(api.theme.update).not.toHaveBeenCalled();
  });

  it('autostarts without the guard: wires listeners, applies theme, refreshes badge', async () => {
    vi.resetModules();
    delete globalThis.__UXX_TEST__;
    const { api } = makeApi();
    globalThis.browser = api;
    await import('../src/background.js');
    expect(api.runtime.onStartup.addListener).toHaveBeenCalledTimes(1);
    expect(api.action.onClicked.addListener).toHaveBeenCalledTimes(1);
    expect(api.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    expect(api.theme.onUpdated.addListener).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(api.theme.update).toHaveBeenCalled());
    await vi.waitFor(() =>
      expect(api.action.setBadgeText).toHaveBeenCalledWith({ text: 'ON' }));
  });

  it('fails open at startup when no extension API exists', async () => {
    vi.resetModules();
    delete globalThis.__UXX_TEST__;
    // no browser/chrome on globalThis — must not throw
    await expect(import('../src/background.js')).resolves.toBeDefined();
  });

  // -------------------------------------------------------------------------
  describe('applyThemeIfEnabled', () => {

    it('applies the §10-keyed theme to every window', async () => {
      const { api, calls } = makeApi();
      await bg.applyThemeIfEnabled(api);
      expect(api.theme.update).toHaveBeenCalledTimes(2);
      expect(calls.update.map((c) => c.windowId)).toEqual([1, 2]);
      const theme = calls.update[0].theme;
      // shape: exactly the §9.2/§10 key set + both color-scheme properties
      expect(Object.keys(theme.colors).sort()).toEqual([...h.REQUIRED_KEYS].sort());
      expect(theme.properties).toEqual({ color_scheme: 'dark', content_color_scheme: 'dark' });
      // passes through buildChromeTheme(pack) verbatim
      expect(theme).toEqual(buildChromeTheme(pack));
    });

    it('is a no-op when globally disabled', async () => {
      const { api } = makeApi({ sync: { enabled: false, themeId: 'monokai' } });
      const applied = await bg.applyThemeIfEnabled(api);
      expect(applied).toBe(false);
      expect(api.theme.update).not.toHaveBeenCalled();
    });

    it('is idempotent: already-applied windows are not re-updated', async () => {
      const { api } = makeApi();
      await bg.applyThemeIfEnabled(api);
      expect(api.theme.update).toHaveBeenCalledTimes(2);
      await bg.applyThemeIfEnabled(api);
      expect(api.theme.update).toHaveBeenCalledTimes(2); // no update/reset cycling
      expect(api.theme.reset).not.toHaveBeenCalled();
    });

    it('captures preTheme before first update when the current theme is not ours', async () => {
      const foreign = { colors: { frame: '#123456' } };
      const { api, local } = makeApi({ currentThemes: { 1: foreign }, windows: [{ id: 1 }] });
      await bg.applyThemeIfEnabled(api);
      expect(api.theme.getCurrent).toHaveBeenCalledWith(1);
      expect(local.preTheme[1]).toEqual(foreign);
      expect(api.theme.update).toHaveBeenCalledWith(1, buildChromeTheme(pack));
    });

    it('does not overwrite an already-captured preTheme', async () => {
      const captured = { colors: { frame: '#abcdef' } };
      const { api, local } = makeApi({
        local: { disabledSites: [], preTheme: { 1: captured } },
        currentThemes: { 1: { colors: { frame: '#000000' } } },
        windows: [{ id: 1 }],
      });
      await bg.applyThemeIfEnabled(api);
      expect(local.preTheme[1]).toEqual(captured); // untouched
    });

    it('does not capture preTheme when the current theme is already ours', async () => {
      const ours = buildChromeTheme(pack);
      const { api, local } = makeApi({ currentThemes: { 1: ours }, windows: [{ id: 1 }] });
      await bg.applyThemeIfEnabled(api);
      expect(local.preTheme[1]).toBeUndefined();
      expect(api.theme.update).toHaveBeenCalledWith(1, ours);
    });

    it('does not capture preTheme for an empty current theme', async () => {
      const { api, local } = makeApi({ currentThemes: { 1: {} }, windows: [{ id: 1 }] });
      await bg.applyThemeIfEnabled(api);
      expect(local.preTheme[1]).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('handleMessage ({type:"state"} handshake, spec §9.4)', () => {

    it('replies with {type, enabled, siteDisabled} for a known origin', async () => {
      const { api } = makeApi({ local: { disabledSites: ['https://dark.example'], preTheme: {} } });
      const reply = await bg.handleMessage({ type: 'state', origin: 'https://ok.example' }, api);
      expect(reply).toEqual({ type: 'state', enabled: true, siteDisabled: false });
    });

    it('marks origins on the disable list as siteDisabled', async () => {
      const { api } = makeApi({ local: { disabledSites: ['https://dark.example'], preTheme: {} } });
      const reply = await bg.handleMessage({ type: 'state', origin: 'https://dark.example' }, api);
      expect(reply).toEqual({ type: 'state', enabled: true, siteDisabled: true });
    });

    it('defaults to enabled when storage is empty (spec-pinned first run)', async () => {
      const { api } = makeApi({ sync: {} });
      const reply = await bg.handleMessage({ type: 'state', origin: 'https://x.example' }, api);
      expect(reply).toEqual({ type: 'state', enabled: true, siteDisabled: false });
    });

    it('reports enabled:false while globally disabled', async () => {
      const { api } = makeApi({ sync: { enabled: false, themeId: 'monokai' } });
      const reply = await bg.handleMessage({ type: 'state', origin: 'https://x.example' }, api);
      expect(reply).toEqual({ type: 'state', enabled: false, siteDisabled: false });
    });

    it('ignores non-state messages', async () => {
      const { api } = makeApi();
      await expect(bg.handleMessage({ type: 'other' }, api)).resolves.toBeUndefined();
      await expect(bg.handleMessage(undefined, api)).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('toggleEnabled (action.onClicked, popup-less)', () => {

    it('disable: restores per window, badge OFF, broadcasts, swallows tab rejects', async () => {
      const captured = { colors: { frame: '#abcdef' } };
      const { api, sync, local, calls } = makeApi({
        local: { disabledSites: [], preTheme: { 1: captured } },
        rejectTabs: [20],
      });
      // establish "applied" state first
      await bg.applyThemeIfEnabled(api);
      calls.update.length = 0;

      const next = await bg.toggleEnabled(api);
      expect(next).toBe(false);
      expect(sync.enabled).toBe(false);
      // window 1 restores the captured theme; window 2 (no capture) resets
      expect(calls.update).toEqual([{ windowId: 1, theme: captured }]);
      expect(calls.reset).toEqual([2]);
      expect(local.preTheme[1]).toBeUndefined(); // deleted after restore
      // badge OFF: taupe bg, dark text (design §9.3)
      expect(api.action.setBadgeText).toHaveBeenCalledWith({ text: 'OFF' });
      expect(api.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#75715e' });
      expect(api.action.setBadgeTextColor).toHaveBeenCalledWith({ color: '#272822' });
      // broadcast to every tab; the rejecting tab is skipped silently
      expect(calls.sent).toEqual([
        { tabId: 10, msg: { type: 'state', enabled: false, siteDisabled: false } },
        { tabId: 20, msg: { type: 'state', enabled: false, siteDisabled: false } },
      ]);
    });

    it('enable: applies the theme, badge ON, broadcasts enabled', async () => {
      const { api, sync, calls } = makeApi({ sync: { enabled: false, themeId: 'monokai' } });
      const next = await bg.toggleEnabled(api);
      expect(next).toBe(true);
      expect(sync.enabled).toBe(true);
      expect(calls.update.map((c) => c.windowId)).toEqual([1, 2]);
      expect(api.action.setBadgeText).toHaveBeenCalledWith({ text: 'ON' });
      expect(api.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#a6e22e' });
      expect(api.action.setBadgeTextColor).toHaveBeenCalledWith({ color: '#272822' });
      expect(calls.sent).toEqual([
        { tabId: 10, msg: { type: 'state', enabled: true, siteDisabled: false } },
        { tabId: 20, msg: { type: 'state', enabled: true, siteDisabled: false } },
      ]);
    });
  });

  // -------------------------------------------------------------------------
  describe('handleThemeUpdated (design §9.2 preTheme refresh)', () => {

    it("refreshes preTheme when the user's incoming theme differs from ours", async () => {
      const { api, local } = makeApi({ windows: [{ id: 1 }] });
      await bg.applyThemeIfEnabled(api); // ours is now last-applied for window 1
      const theirs = { colors: { frame: '#fedcba' } };
      await bg.handleThemeUpdated({ windowId: 1, theme: theirs }, api);
      expect(local.preTheme[1]).toEqual(theirs);
    });

    it('ignores our own theme update (signature matches last-applied)', async () => {
      const { api, local } = makeApi({ windows: [{ id: 1 }] });
      await bg.applyThemeIfEnabled(api);
      await bg.handleThemeUpdated({ windowId: 1, theme: buildChromeTheme(pack) }, api);
      expect(local.preTheme[1]).toBeUndefined();
    });

    it('ignores events without a windowId', async () => {
      const { api, local } = makeApi();
      await bg.handleThemeUpdated({ theme: { colors: { frame: '#000000' } } }, api);
      expect(local.preTheme).toEqual({});
      await bg.handleThemeUpdated(undefined, api); // must not throw
    });
  });

  // -------------------------------------------------------------------------
  describe('runtime.onMessage wiring', () => {

    it('replies via sendResponse and claims the message (returns true)', async () => {
      const { api } = makeApi();
      expect(bg.start(api)).toBe(true);
      const listener = api.runtime.onMessage.addListener.mock.calls[0][0];
      let response;
      const claimed = listener({ type: 'state', origin: 'https://x.example' },
        {}, (r) => { response = r; });
      expect(claimed).toBe(true);
      await vi.waitFor(() =>
        expect(response).toEqual({ type: 'state', enabled: true, siteDisabled: false }));
    });

    it('does not claim non-state messages', () => {
      const { api } = makeApi();
      bg.start(api);
      const listener = api.runtime.onMessage.addListener.mock.calls[0][0];
      expect(listener({ type: 'other' }, {}, () => {})).toBeUndefined();
    });

    it('start() returns false with no API (fails open)', () => {
      expect(bg.start(undefined)).toBe(false);
    });
  });
});
