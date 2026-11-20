// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/user-css.test.js — user-origin stylesheet: registration lifecycle and
// consistency with the content-level sheets (one shared builder, no drift).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  registerUserCss,
  unregisterUserCss,
  syncUserCss,
  toggleEnabled,
  start,
  USER_CSS_ID,
} from '../src/background.js';
import { userCss, roleSheetCss, inlineSheetCss } from '../src/theme/sheet-css.js';
import * as tokens from '../src/theme/tokens.js';
import * as roles from '../src/theme/roles.js';

function fakeApi({ enabled = true, withScripting = true, registerError } = {}) {
  const calls = { register: [], unregister: [] };
  const state = { enabled, themeId: 'monokai' }; // set() must persist for toggles
  const api = {
    calls,
    state,
    storage: {
      sync: {
        get: vi.fn(async () => ({ ...state })),
        set: vi.fn(async (next) => Object.assign(state, next)),
      },
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => {}),
      },
    },
    runtime: {
      onStartup: { addListener: vi.fn() },
      onMessage: { addListener: vi.fn() },
    },
    action: {
      onClicked: { addListener: vi.fn() },
      setBadgeText: vi.fn(async () => {}),
      setBadgeBackgroundColor: vi.fn(async () => {}),
      setBadgeTextColor: vi.fn(async () => {}),
    },
    theme: { onUpdated: { addListener: vi.fn() } },
    windows: { getAll: vi.fn(async () => []) },
    tabs: { query: vi.fn(async () => []) },
  };
  if (withScripting) {
    api.scripting = {
      registerContentScripts: vi.fn(async (scripts) => {
        if (registerError) throw registerError;
        calls.register.push(scripts);
      }),
      unregisterContentScripts: vi.fn(async (arg) => calls.unregister.push(arg)),
    };
  }
  return api;
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('registerUserCss', () => {
  it('registers the generated sheet as USER origin, at document_start, all frames, persistent', async () => {
    const api = fakeApi();
    expect(await registerUserCss(api)).toBe(true);
    expect(api.calls.register).toHaveLength(1);
    const scripts = api.calls.register[0];
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toMatchObject({
      id: USER_CSS_ID,
      css: ['dist/uxx-user.css'],
      matches: ['<all_urls>'],
      runAt: 'document_start',
      cssOrigin: 'user',
      allFrames: true,
      persistAcrossSessions: true,
    });
  });

  it('a missing scripting API degrades loudly, never throws', async () => {
    const api = fakeApi({ withScripting: false });
    expect(await registerUserCss(api)).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });

  it('a registration failure is reported and returns false', async () => {
    const api = fakeApi({ registerError: new Error('denied') });
    expect(await registerUserCss(api)).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('syncUserCss / toggle lifecycle', () => {
  it('registers when enabled, unregisters when disabled', async () => {
    const on = fakeApi({ enabled: true });
    await syncUserCss(on);
    expect(on.calls.register).toHaveLength(1);

    const off = fakeApi({ enabled: false });
    await syncUserCss(off);
    expect(off.calls.unregister).toEqual([{ ids: [USER_CSS_ID] }]);
    expect(off.calls.register).toHaveLength(0);
  });

  it('toggleEnabled flips registration with the flag', async () => {
    const api = fakeApi({ enabled: true });
    await toggleEnabled(api); // → disabled
    expect(api.calls.unregister).toEqual([{ ids: [USER_CSS_ID] }]);

    await toggleEnabled(api); // → enabled
    expect(api.calls.register).toHaveLength(1);
  });

  it('start() syncs on wake (content scripts are cleared on update)', async () => {
    const api = fakeApi({ enabled: true });
    start(api);
    await vi.waitFor(() => expect(api.calls.register).toHaveLength(1));
  });
});

describe('generated CSS is the SAME builder as the content sheets', () => {
  it('dist/uxx-user.css equals userCss(roles, resolveToken) exactly', () => {
    const onDisk = readFileSync(new URL('../dist/uxx-user.css', import.meta.url), 'utf8');
    expect(onDisk).toBe(userCss(roles, tokens.resolveToken));
  });

  it('contains the layered role + inline rules and the forced-colors guard', () => {
    const css = userCss(roles, tokens.resolveToken);
    expect(css.startsWith('@layer uxx-monokai;')).toBe(true);
    expect(css).toContain(roleSheetCss(roles, tokens.resolveToken));
    expect(css).toContain(inlineSheetCss());
    expect(css).toContain('@media screen and (forced-colors: none)');
    expect(css).toContain('[data-uxx-role~="surface"]{background-color:#34352f!important}');
  });
});
