// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/main.test.js — §9 coverage (design §5/§9.3/§10): autostart guard,
// fail-open path (messaging rejects → boot removed, observer never
// attached), disabled path, timeout path (fake timers, 2000ms), observer
// ignores data-uxx* mutations (self-write loop does not retrigger), rAF
// batching honors the frame budget, handshake reply toggles teardown.

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  start,
  runPipeline,
  handleMutations,
  processFrame,
  isIgnoredMutation,
  getApi,
  withSheetsDisabled,
  FRAME_MAX_ELEMENTS,
  BREAKER_MUTATIONS,
} from '../src/content/main.js';

function injectedStyles() {
  return Array.from(document.querySelectorAll('style[data-uxx]'));
}

function cleanDocument() {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  for (const el of [document.documentElement, document.body]) {
    for (const attr of Array.from(el.attributes)) {
      el.removeAttribute(attr.name);
    }
  }
}

function fakeApi(state = { type: 'state', enabled: true, siteDisabled: false }) {
  const listeners = [];
  return {
    listeners,
    runtime: {
      sendMessage: vi.fn(async () => state),
      onMessage: {
        addListener: (fn) => listeners.push(fn),
      },
    },
  };
}

function layoutReadyBody(html) {
  document.body.innerHTML = html;
  // jsdom has no layout — stub the §9.3 gate dimensions and give every
  // element a non-zero rect (classify skips invisible 0×0 facts).
  Object.defineProperty(document.body, 'scrollHeight', { value: 500, configurable: true });
  Object.defineProperty(document.body, 'clientHeight', { value: 500, configurable: true });
  Element.prototype.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 100,
    height: 20,
    right: 100,
    bottom: 20,
    x: 0,
    y: 0,
  });
}

afterEach(() => {
  vi.useRealTimers();
  cleanDocument();
});

describe('autostart guard (spec §9.2)', () => {
  it('importing main.js did not inject anything (__UXX_TEST__ set)', () => {
    // tests/setup.js sets globalThis.__UXX_TEST__ = true; the module-side
    // autostart must be inert. This test runs before any other test touches
    // the document.
    expect(globalThis.__UXX_TEST__).toBe(true);
    expect(injectedStyles()).toHaveLength(0);
    expect(document.querySelectorAll('[data-uxx-role]')).toHaveLength(0);
  });

  it('getApi is exported and fails open without browser/chrome', () => {
    expect(typeof getApi).toBe('function');
    expect(getApi()).toBeNull();
  });
});

describe('withSheetsDisabled (design §5 DETECT (a))', () => {
  it('disables injected sheets during fn, re-enables in finally', () => {
    const styleEl = document.createElement('style');
    styleEl.textContent = 'div { color: red; }';
    document.head.appendChild(styleEl);
    const seen = [];
    const result = withSheetsDisabled([styleEl], () => {
      seen.push(styleEl.sheet.disabled);
      return 42;
    });
    expect(result).toBe(42);
    expect(seen).toEqual([true]);
    expect(styleEl.sheet.disabled).toBe(false);
  });
});

describe('start — fail-open paths (design §9.3)', () => {
  it('messaging rejects → boot removed, observer never attached, pipeline never ran', async () => {
    layoutReadyBody('<div id="card">hello</div>');
    const api = {
      runtime: {
        sendMessage: vi.fn(() => Promise.reject(new Error('background dead'))),
      },
    };
    const result = await start({ doc: document, win: window, api });
    expect(result.status).toBe('fail-open');
    expect(injectedStyles()).toHaveLength(0); // boot removed by teardown
    expect(document.querySelectorAll('[data-uxx-role]')).toHaveLength(0);
    expect(document.querySelector('style[data-uxx="role"]')).toBeNull();
  });

  it('no messaging API at all → fail open (boot removed)', async () => {
    layoutReadyBody('<div>hello</div>');
    const result = await start({ doc: document, win: window, api: null });
    expect(result.status).toBe('fail-open');
    expect(injectedStyles()).toHaveLength(0);
  });

  it('disabled → teardown, stop, no observers, no probing', async () => {
    layoutReadyBody('<div>hello</div>');
    const api = fakeApi({ type: 'state', enabled: false, siteDisabled: false });
    const result = await start({ doc: document, win: window, api });
    expect(result.status).toBe('disabled');
    expect(injectedStyles()).toHaveLength(0);
    expect(document.querySelectorAll('[data-uxx-role]')).toHaveLength(0);
  });

  it('siteDisabled → teardown, stop', async () => {
    layoutReadyBody('<div>hello</div>');
    const api = fakeApi({ type: 'state', enabled: true, siteDisabled: true });
    const result = await start({ doc: document, win: window, api });
    expect(result.status).toBe('disabled');
    expect(injectedStyles()).toHaveLength(0);
  });

  it('timeout path: no answer within 2000ms → fail open (fake timers)', async () => {
    vi.useFakeTimers();
    layoutReadyBody('<div>hello</div>');
    const api = {
      runtime: {
        sendMessage: vi.fn(() => new Promise(() => {})), // never settles
      },
    };
    const pending = start({ doc: document, win: window, api });
    await vi.advanceTimersByTimeAsync(2000);
    const result = await pending;
    expect(result.status).toBe('fail-open');
    expect(injectedStyles()).toHaveLength(0);
  });
});

describe('start — enabled path (real pipeline)', () => {
  it('handshake ok → boot + role + inline sheets, elements marked, observer attached', async () => {
    // jsdom's getComputedStyle reflects inline styles only — give the
    // document real colors so the pipeline has facts to classify.
    document.documentElement.style.setProperty('background-color', 'rgb(39, 40, 34)');
    layoutReadyBody(
      '<div id="card" style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">hi</div>',
    );
    document.body.style.setProperty('background-color', 'rgb(39, 40, 34)');
    document.body.style.setProperty('color', 'rgb(248, 248, 242)');
    const api = fakeApi();
    const session = await start({ doc: document, win: window, api });

    expect(session.status).toBeUndefined(); // a session, not a status
    expect(api.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'state',
      origin: window.location.origin,
    });
    expect(document.querySelector('style[data-uxx="boot"]')).not.toBeNull();
    expect(document.querySelector('style[data-uxx="role"]')).not.toBeNull();
    expect(document.querySelector('style[data-uxx="inline"]')).not.toBeNull();
    // Root gets page-background; the card carries a multi-role union.
    expect(document.documentElement.getAttribute('data-uxx-role')).toContain('page-background');
    const card = document.getElementById('card');
    expect(card.hasAttribute('data-uxx-role')).toBe(true);
    expect(session.observer).not.toBeNull();

    // Toggle broadcast → full teardown (handshake reply toggles teardown).
    expect(api.listeners).toHaveLength(1);
    api.listeners[0]({ type: 'state', enabled: false, siteDisabled: false });
    expect(injectedStyles()).toHaveLength(0);
    expect(document.querySelectorAll('[data-uxx-role]')).toHaveLength(0);
    expect(session.observer).toBeNull(); // observer disconnected
  });

  it('runPipeline can be driven directly with injected fakes', async () => {
    layoutReadyBody(
      '<section style="background-color: rgb(52, 53, 47); color: rgb(248, 248, 242);">' +
        '<p style="color: rgb(204, 204, 204);">text</p></section>',
    );
    document.documentElement.style.setProperty('background-color', 'rgb(39, 40, 34)');
    document.body.style.setProperty('background-color', 'rgb(39, 40, 34)');
    const session = await runPipeline({ doc: document, win: window });
    expect(session.palette).toBeDefined();
    expect(session.rankTable).toBeDefined();
    expect(session.degraded).toBe(false);
    expect(document.querySelectorAll('[data-uxx-role]').length).toBeGreaterThan(0);
  });
});

describe('observer self-ignore (spec §9.3 step 8, review F9)', () => {
  it('ignores data-uxx attribute mutations and --uxx- style writes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    // Attribute named data-uxx* — ignored outright.
    expect(
      isIgnoredMutation({ type: 'attributes', attributeName: 'data-uxx-role', target: el }),
    ).toBe(true);

    // Target carrying our marker — ignored (self-write loop).
    el.setAttribute('data-uxx-role', 'surface');
    expect(
      isIgnoredMutation({ type: 'attributes', attributeName: 'style', target: el }),
    ).toBe(true);

    // F9 correctness check: --uxx- in the style attribute, no marker needed.
    el.removeAttribute('data-uxx-role');
    el.setAttribute('style', 'color: red; --uxx-inline-color: #f8f8f2;');
    expect(
      isIgnoredMutation({ type: 'attributes', attributeName: 'style', target: el }),
    ).toBe(true);

    // A plain style mutation is NOT ignored.
    el.setAttribute('style', 'color: red;');
    expect(
      isIgnoredMutation({ type: 'attributes', attributeName: 'style', target: el }),
    ).toBe(false);

    // Added nodes carrying our markers are ignored; plain nodes are not
    // (spec §9.3 step 8: only data-uxx* carriers are ignorable).
    el.setAttribute('data-uxx-role', 'surface');
    expect(
      isIgnoredMutation({
        type: 'childList',
        target: document.body,
        addedNodes: [el],
        removedNodes: [],
      }),
    ).toBe(true);
    const plainNode = document.createElement('span');
    expect(
      isIgnoredMutation({
        type: 'childList',
        target: document.body,
        addedNodes: [plainNode],
        removedNodes: [],
      }),
    ).toBe(false);
  });

  it('handleMutations filters self-writes and accepts page mutations', () => {
    const rafQueue = [];
    const session = {
      doc: document,
      win: { requestAnimationFrame: (cb) => rafQueue.push(cb) },
      queue: [],
      pending: new Set(),
      burst: [],
      frameScheduled: false,
      backoffUntil: 0,
      suspended: new WeakSet(),
      teardowns: new WeakMap(),
      applyElement: () => {},
    };
    const marked = document.createElement('div');
    marked.setAttribute('data-uxx-role', 'surface');
    document.body.appendChild(marked);
    const plain = document.createElement('div');
    document.body.appendChild(plain);

    const result = handleMutations(
      [
        { type: 'attributes', attributeName: 'style', target: marked },
        { type: 'attributes', attributeName: 'class', target: plain },
      ],
      session,
    );
    expect(result.accepted).toBe(1); // only the plain element's mutation
    expect(session.pending.has(plain)).toBe(true);
    expect(session.pending.has(marked)).toBe(false);
  });

  it('circuit breaker: BREAKER_MUTATIONS records within the window → backoff', () => {
    const session = {
      doc: document,
      win: { requestAnimationFrame: () => {} },
      queue: [],
      pending: new Set(),
      burst: [],
      frameScheduled: false,
      backoffUntil: 0,
      suspended: new WeakSet(),
      teardowns: new WeakMap(),
      applyElement: () => {},
    };
    const target = document.createElement('div');
    document.body.appendChild(target);
    const records = Array.from({ length: BREAKER_MUTATIONS }, () => ({
      type: 'attributes',
      attributeName: 'class',
      target,
    }));
    const first = handleMutations(records, session);
    expect(first.accepted).toBe(BREAKER_MUTATIONS);
    const second = handleMutations(records, session);
    expect(second).toEqual({ accepted: 0, rescan: false, breaker: true });
  });
});

describe('rAF batching (spec §9.3 step 8)', () => {
  it('honors FRAME_MAX_ELEMENTS per frame, remainder queued to the next frame', () => {
    const rafQueue = [];
    const processed = [];
    const session = {
      doc: document,
      win: { requestAnimationFrame: (cb) => rafQueue.push(cb) },
      queue: [],
      pending: new Set(),
      burst: [],
      frameScheduled: false,
      backoffUntil: 0,
      suspended: new WeakSet(),
      teardowns: new WeakMap(),
      applyElement: (el) => processed.push(el),
    };
    const total = FRAME_MAX_ELEMENTS + 100;
    const els = [];
    for (let i = 0; i < total; i += 1) {
      const el = document.createElement('div');
      document.body.appendChild(el);
      els.push(el);
    }
    handleMutations(
      [{ type: 'childList', target: document.body, addedNodes: els, removedNodes: [] }],
      session,
    );
    // One frame scheduled for the batch.
    expect(rafQueue).toHaveLength(1);

    rafQueue.shift()(); // run frame 1
    expect(processed).toHaveLength(FRAME_MAX_ELEMENTS);
    expect(session.pending.size).toBe(100); // remainder queued
    expect(rafQueue).toHaveLength(1); // next frame scheduled

    rafQueue.shift()(); // run frame 2
    expect(processed).toHaveLength(total);
    expect(session.pending.size).toBe(0);
    expect(rafQueue).toHaveLength(0); // drained
  });

  it('processFrame returns a whole-root rescan verdict above RESCAN_THRESHOLD', () => {
    const session = {
      doc: document,
      win: { requestAnimationFrame: () => {} },
      queue: Array.from({ length: 1001 }, () => ({})),
      pending: new Set(),
      burst: [],
      frameScheduled: false,
      backoffUntil: 0,
      suspended: new WeakSet(),
      teardowns: new WeakMap(),
      applyElement: () => {},
      rescanAll: vi.fn(),
    };
    const result = processFrame(session);
    expect(result.rescan).toBe(true);
    expect(session.rescanAll).toHaveBeenCalledTimes(1);
  });
});
