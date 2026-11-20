// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/background-diag.test.js — the keyboard-triggered report sender
// (diagnostic build only). Failure paths must be loud, never silent.

import { describe, it, expect, vi } from 'vitest';
import { runDiagnose, wireDiagnose, DIAG_COMMAND, DIAG_HEADER } from '../src/background-diag.js';
import { DIAG_SCHEMA, DIAG_MESSAGE } from '../src/content/diagnose.js';

function fakeApi({ tabs = [{ id: 7 }], reply = { schema: DIAG_SCHEMA, n: 1 }, sendError } = {}) {
  const badges = [];
  const commandListeners = [];
  return {
    badges,
    commandListeners,
    tabs: {
      query: vi.fn(async () => tabs),
      sendMessage: vi.fn(async () => {
        if (sendError) throw sendError;
        return reply;
      }),
    },
    action: { setBadgeText: vi.fn(async (arg) => badges.push(arg)) },
    commands: { onCommand: { addListener: (fn) => commandListeners.push(fn) } },
  };
}

describe('runDiagnose', () => {
  it('asks the active tab TOP frame, posts the report with the guard header, badges ✓ on that tab only', async () => {
    const api = fakeApi();
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    const result = await runDiagnose(api, { fetchImpl, endpoint: 'http://127.0.0.1:1/report' });

    expect(result.ok).toBe(true);
    expect(api.tabs.sendMessage).toHaveBeenCalledWith(7, { type: DIAG_MESSAGE }, { frameId: 0 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:1/report');
    expect(init.method).toBe('POST');
    expect(init.headers[DIAG_HEADER]).toBe('1');
    expect(JSON.parse(init.body).schema).toBe(DIAG_SCHEMA);
    expect(api.badges).toEqual([{ text: '✓', tabId: 7 }]); // tab-scoped, never the global badge
  });

  it('no active tab → explicit failure, nothing sent', async () => {
    const api = fakeApi({ tabs: [] });
    const fetchImpl = vi.fn();
    expect(await runDiagnose(api, { fetchImpl })).toEqual({ ok: false, error: 'no-active-tab' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('content script unreachable → badge !, error carries the cause, nothing sent', async () => {
    const api = fakeApi({ sendError: new Error('Receiving end does not exist') });
    const fetchImpl = vi.fn();
    const result = await runDiagnose(api, { fetchImpl });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('content-unreachable');
    expect(result.error).toContain('Receiving end does not exist');
    expect(api.badges).toEqual([{ text: '!', tabId: 7 }]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('a reply that is not a diagnostic report is refused, never forwarded', async () => {
    const api = fakeApi({ reply: { schema: 'something-else', secret: 'x' } });
    const fetchImpl = vi.fn();
    expect(await runDiagnose(api, { fetchImpl })).toEqual({ ok: false, error: 'bad-report' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(api.badges).toEqual([{ text: '!', tabId: 7 }]);
  });

  it('listener not running (fetch rejects) → badge ! and an explicit error', async () => {
    const api = fakeApi();
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('NetworkError when attempting to fetch resource.');
    });
    const result = await runDiagnose(api, { fetchImpl });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('post-failed');
    expect(api.badges).toEqual([{ text: '!', tabId: 7 }]);
  });

  it('listener answers non-2xx → treated as failure, not success', async () => {
    const api = fakeApi();
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 403 }));
    const result = await runDiagnose(api, { fetchImpl });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('403');
    expect(api.badges).toEqual([{ text: '!', tabId: 7 }]);
  });
});

describe('wireDiagnose', () => {
  const urls = (fetchImpl) => fetchImpl.mock.calls.map(([url]) => url.replace(/^.*127\.0\.0\.1:\d+/, ''));
  const stages = (fetchImpl) =>
    fetchImpl.mock.calls
      .filter(([url]) => url.endsWith('/stage'))
      .map(([, init]) => JSON.parse(init.body).stage);

  it('reacts only to the uxx-diagnose command, reporting each stage', async () => {
    const api = fakeApi();
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    expect(wireDiagnose(api, { fetchImpl })).toBe(true);
    const [handler] = api.commandListeners;
    handler('some-other-command');
    await Promise.resolve();
    expect(api.tabs.query).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
    handler(DIAG_COMMAND);
    await vi.waitFor(() => expect(stages(fetchImpl)).toEqual(['command-fired', 'sent']));
    expect(urls(fetchImpl)).toContain('/report');
  });

  it('a failure is reported to the listener with its cause, not swallowed', async () => {
    const api = fakeApi({ sendError: new Error('Receiving end does not exist') });
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    wireDiagnose(api, { fetchImpl });
    api.commandListeners[0](DIAG_COMMAND);
    await vi.waitFor(() => expect(stages(fetchImpl)).toEqual(['command-fired', 'failed']));
    const failed = fetchImpl.mock.calls.map(([, i]) => JSON.parse(i.body)).find((b) => b.stage === 'failed');
    expect(failed.detail).toContain('Receiving end does not exist');
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it('a stage beacon that cannot be delivered is logged, not thrown', async () => {
    const api = fakeApi();
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('NetworkError');
    });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    wireDiagnose(api, { fetchImpl });
    expect(() => api.commandListeners[0](DIAG_COMMAND)).not.toThrow();
    await vi.waitFor(() => expect(err).toHaveBeenCalled());
    err.mockRestore();
  });

  it('missing commands API is reported, not ignored', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(wireDiagnose({}, {})).toBe(false);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
