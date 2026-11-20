// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/incremental.test.js — steady-state (MutationObserver) theming.
//
// Regression: SPAs such as LinkedIn render nearly everything AFTER the first
// pass, as whole subtrees. The incremental path used to theme only the
// inserted ROOT (and against the page background, ignoring the real ancestor
// chain), so a chat bubble container went dark while the message text inside
// kept the site's native dark colour — unreadable — and links, buttons and
// semantic colours inside never received a role at all.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createProbe } from '../src/content/probe.js';
import {
  runPipeline,
  handleMutations,
  processFrame,
  stopSession,
  SUBTREE_BUDGET_MS,
  BREAKER_MUTATIONS,
  BREAKER_BACKOFF_MS,
  RESCAN_THRESHOLD,
  sessionStats,
  ancestorChainOf,
  SHADOW_SWEEP_MS,
} from '../src/content/main.js';

// Parse markup without assigning innerHTML (keeps `web-ext lint` quiet).
function parseNodes(html) {
  return Array.from(new DOMParser().parseFromString(html, 'text/html').body.children);
}

function cleanDocument() {
  document.head.replaceChildren();
  document.body.replaceChildren();
  for (const el of [document.documentElement, document.body]) {
    for (const attr of Array.from(el.attributes)) el.removeAttribute(attr.name);
  }
}

function layoutReady(html) {
  document.body.replaceChildren(...parseNodes(html));
  // jsdom reports hidden=true; handleMutations defers while hidden.
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  Object.defineProperty(document.body, 'scrollHeight', { value: 500, configurable: true });
  Object.defineProperty(document.body, 'clientHeight', { value: 500, configurable: true });
  Element.prototype.getBoundingClientRect = () => ({
    left: 0, top: 0, width: 100, height: 20, right: 100, bottom: 20, x: 0, y: 0,
  });
}

const rolesOf = (el) => (el.getAttribute('data-uxx-role') || '').split(/\s+/).filter(Boolean);

async function settledSession() {
  layoutReady('<div id="shell" style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0)">shell</div>');
  return runPipeline({ doc: document, win: window });
}

function insert(session, html) {
  const node = parseNodes(html)[0];
  document.body.appendChild(node);
  handleMutations(
    [{ type: 'childList', target: document.body, addedNodes: [node], removedNodes: [] }],
    session,
  );
  return node;
}

// Run frames until the queue is quiescent, as the rAF loop does in a browser.
// A single frame may legitimately park part of a large subtree (budget).
function drain(session) {
  for (let i = 0; i < 100 && session.pending.size > 0; i += 1) processFrame(session);
}

afterEach(() => {
  vi.restoreAllMocks();
  cleanDocument();
});

// REGRESSION (LinkedIn, observed with the self-diagnostic): after expanding the
// Messaging widget the page grew 1,615 → 3,181 elements but themed elements
// went 896 → 899. handleMutations returned BEFORE enqueuing anything whenever
// the circuit breaker had tripped, the breaker was in backoff, or the tab was
// hidden — so every insertion in a busy SPA (hundreds of records for one list
// render; a video-js player toggling classes forever) was silently discarded.
// A breaker must limit PROCESSING RATE; it must never lose what changed.
describe('the circuit breaker defers work, it never discards it', () => {
  // Page noise must come from UNTHEMED elements: records on themed targets are
  // ignored by design (they may be our own writes), so they never fill the window.
  const jitterEl = () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
  };
  const noise = (target, n = BREAKER_MUTATIONS) =>
    Array.from({ length: n }, () => ({ type: 'attributes', attributeName: 'class', target, addedNodes: [], removedNodes: [] }));

  it('an insertion that arrives while the breaker is tripped is themed once the backoff ends', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const session = await settledSession();
      const jitter = jitterEl();
      handleMutations(noise(jitter), session); // page noise fills the window…
      const trip = handleMutations(noise(jitter), session); // …and trips the breaker
      expect(trip.breaker).toBe(true);

      const bubble = insert(
        session,
        `<div id="late" style="background-color: rgb(235, 235, 235)"><p id="latemsg" style="color: rgb(0,0,0)">x</p></div>`,
      );
      drain(session);
      // Still inside the backoff: processing is deferred, not performed…
      expect(rolesOf(document.getElementById('latemsg'))).toEqual([]);

      // …and NOT lost: when the backoff ends the work happens by itself.
      await vi.advanceTimersByTimeAsync(BREAKER_BACKOFF_MS + 50);
      drain(session);
      expect(rolesOf(bubble)).toContain('surface');
      expect(rolesOf(document.getElementById('latemsg')).some((r) => r.startsWith('text-'))).toBe(true);
      stopSession(session);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a batch that itself trips the breaker is still enqueued (the 40-card list render)', async () => {
    const session = await settledSession();
    const jitter = jitterEl();
    handleMutations(noise(jitter), session);
    const list = parseNodes(
      `<ul id="cards">${Array.from({ length: 40 }, (_, i) => `<li><span id="c${i}" style="color: rgb(0,0,0)">n</span></li>`).join('')}</ul>`,
    )[0];
    document.body.appendChild(list);
    const result = handleMutations(
      [{ type: 'childList', target: document.body, addedNodes: [list], removedNodes: [] }],
      session,
    );
    expect(result.breaker).toBe(true);
    expect(result.accepted).toBe(1); // accepted, not dropped
    expect(session.pending.has(list)).toBe(true);
    stopSession(session);
  });

  it('records seen while the tab is hidden are kept and processed when it becomes visible', async () => {
    const session = await settledSession();
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    const bubble = insert(session, `<div id="bg" style="background-color: rgb(235,235,235)"><p id="bgt" style="color: rgb(0,0,0)">x</p></div>`);
    drain(session);
    expect(rolesOf(bubble)).toEqual([]); // hidden: deferred
    expect(session.pending.has(bubble)).toBe(true); // …but retained

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    drain(session);
    expect(rolesOf(bubble)).toContain('surface');
    expect(rolesOf(document.getElementById('bgt')).length).toBeGreaterThan(0);
    stopSession(session);
  });

  it('a rescan (queue overflow) themes pre-existing unthemed nodes within the frame budget', async () => {
    const session = await settledSession();
    // Nodes that slipped in earlier with no record at all (e.g. lost before the fix).
    const orphan = parseNodes(`<div id="orph" style="background-color: rgb(235,235,235)"><p id="orpht" style="color: rgb(0,0,0)">x</p></div>`)[0];
    document.body.appendChild(orphan);
    expect(rolesOf(orphan)).toEqual([]);

    const jitter = jitterEl();
    handleMutations(noise(jitter, RESCAN_THRESHOLD + 5), session);
    drain(session);
    expect(rolesOf(orphan)).toContain('surface');
    expect(rolesOf(document.getElementById('orpht')).length).toBeGreaterThan(0);
    stopSession(session);
  });

  it('nodes removed before their turn are skipped, not themed or thrown on', async () => {
    const session = await settledSession();
    const gone = insert(session, `<div id="gone" style="background-color: rgb(235,235,235)">x</div>`);
    gone.remove();
    expect(() => drain(session)).not.toThrow();
    expect(rolesOf(gone)).toEqual([]);
    stopSession(session);
  });

  it('already-themed nodes cost no style read when a subtree is re-walked', async () => {
    layoutReady('<div id="shell" style="background-color: rgb(255,255,255); color: rgb(0,0,0)"><p id="p1" style="color: rgb(0,0,0)">a</p></div>');
    const real = createProbe({ doc: document, win: window });
    let reads = 0;
    const probe = { ...real, readFact: (el) => ((reads += 1), real.readFact(el)) };
    const session = await runPipeline({ doc: document, win: window, probe });
    reads = 0;
    session.applyElement(document.documentElement, true); // everything is already marked
    expect(reads).toBeLessThanOrEqual(2); // only unmarked stragglers may be read
    stopSession(session);
  });
});

// RESILIENCE: processFrame cleared `pending` BEFORE looping and had no guard, so
// one node that made applyElement throw silently discarded every remaining node
// of that frame (and a throw inside a deep walk dropped the rest of the subtree).
// Observed class of symptom: whole components left unthemed with nothing logged.
// Shadow DOM: a MutationObserver on the document does NOT see changes inside
// shadow trees, and document stylesheets do not reach into them. The pipeline
// must (a) give each open shadow root its own copy of our sheet, (b) observe it,
// (c) discover roots attached later, (d) resolve ancestors across the host.
describe('open shadow roots are themed (LinkedIn interop-outlet)', () => {
  const addShadow = (hostId, markup) => {
    const host = document.createElement('div');
    host.id = hostId;
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });
    for (const n of parseNodes(markup)) root.appendChild(n);
    return { host, root };
  };
  const card = '<div id="scard" style="background-color: rgb(255,255,255)"><p id="stext" style="color: rgb(0,0,0)">x</p></div>';

  it('a shadow root present at the first pass gets our sheet and its elements are marked', async () => {
    layoutReady('<div id="shell" style="background-color: rgb(255,255,255); color: rgb(0,0,0)">s</div>');
    const { root } = addShadow('host1', card);
    const session = await runPipeline({ doc: document, win: window });
    expect(root.firstElementChild.getAttribute('data-uxx')).toBe('shadow');
    expect(rolesOf(root.getElementById('scard'))).toContain('surface');
    expect(rolesOf(root.getElementById('stext')).some((r) => r.startsWith('text-'))).toBe(true);
    expect(session.shadowObserved.has(root)).toBe(true); // observed: later renders are seen
    stopSession(session);
  });

  it('a host inserted later is adopted when it is processed (sheet + observe + deep theme)', async () => {
    const session = await settledSession();
    const { host, root } = addShadow('host2', card);
    handleMutations([{ type: 'childList', target: document.body, addedNodes: [host], removedNodes: [] }], session);
    drain(session);
    expect(root.querySelectorAll('style[data-uxx="shadow"]')).toHaveLength(1);
    expect(rolesOf(root.getElementById('scard'))).toContain('surface');
    expect(session.shadowObserved.has(root)).toBe(true);
    stopSession(session);
  });

  it('content added INSIDE an observed shadow root later is themed (records come from the shadow observer)', async () => {
    const session = await settledSession();
    const { host, root } = addShadow('host3', '<div id="seed"></div>');
    handleMutations([{ type: 'childList', target: document.body, addedNodes: [host], removedNodes: [] }], session);
    drain(session);

    const late = parseNodes('<div id="late-card" style="background-color: rgb(250,250,250)"><p id="late-text" style="color: rgb(0,0,0)">y</p></div>')[0];
    root.appendChild(late);
    handleMutations([{ type: 'childList', target: root, addedNodes: [late], removedNodes: [] }], session);
    drain(session);
    expect(rolesOf(late)).toContain('surface');
    expect(rolesOf(root.getElementById('late-text')).some((r) => r.startsWith('text-'))).toBe(true);
    stopSession(session);
  });

  it('a shadow root attached to an EXISTING host later is found by the sweep (no document mutation fires)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const session = await settledSession();
      const host = document.createElement('div');
      host.id = 'host4';
      document.body.appendChild(host); // host exists; no shadow yet
      const root = host.attachShadow({ mode: 'open' }); // attached afterwards, silently
      for (const n of parseNodes(card)) root.appendChild(n);
      expect(root.querySelector('style[data-uxx="shadow"]')).toBeNull();

      await vi.advanceTimersByTimeAsync(SHADOW_SWEEP_MS + 100);
      drain(session);
      expect(root.querySelectorAll('style[data-uxx="shadow"]')).toHaveLength(1);
      expect(rolesOf(root.getElementById('scard'))).toContain('surface');
      stopSession(session);
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-injects our sheet if the page wipes the shadow root, and keeps no timer after stopSession', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const session = await settledSession();
      const { host, root } = addShadow('host5', card);
      handleMutations([{ type: 'childList', target: document.body, addedNodes: [host], removedNodes: [] }], session);
      drain(session);
      root.firstElementChild.remove(); // framework wipes our <style>
      expect(root.querySelector('style[data-uxx="shadow"]')).toBeNull();
      await vi.advanceTimersByTimeAsync(SHADOW_SWEEP_MS + 100);
      expect(root.querySelectorAll('style[data-uxx="shadow"]')).toHaveLength(1);

      stopSession(session);
      expect(vi.getTimerCount()).toBe(0); // sweeping stops with the session
    } finally {
      vi.useRealTimers();
    }
  });

  it('ancestors resolve ACROSS the host boundary (a themed host surface is part of the chain)', async () => {
    const session = await settledSession();
    const { host, root } = addShadow('host6', '<p id="inner" style="color: rgb(0,0,0)">z</p>');
    host.setAttribute('data-uxx-role', 'surface');
    const { chain } = ancestorChainOf(root.getElementById('inner'));
    expect(chain.some((entry) => entry.role === 'surface')).toBe(true);
    stopSession(session);
  });

  it('sweeping finds roots nested inside other shadow roots', async () => {
    const session = await settledSession();
    const { root } = addShadow('host7', '<div id="inner-host"></div>');
    const nested = root.getElementById('inner-host').attachShadow({ mode: 'open' });
    for (const n of parseNodes(card)) nested.appendChild(n);
    session.sweepShadows();
    drain(session);
    expect(nested.querySelectorAll('style[data-uxx="shadow"]')).toHaveLength(1);
    expect(rolesOf(nested.getElementById('scard'))).toContain('surface');
    stopSession(session);
  });
});

describe('one bad node cannot lose the rest of the work', () => {
  it('a throwing target is recorded and skipped; the other targets in the frame are still themed', async () => {
    const session = await settledSession();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const a = insert(session, '<div id="ok1" style="background-color: rgb(235,235,235)">a</div>');
    const boom = insert(session, '<div id="boom" style="background-color: rgb(235,235,235)">b</div>');
    const c = insert(session, '<div id="ok2" style="background-color: rgb(235,235,235)">c</div>');
    const real = session.applyElement;
    session.applyElement = (el, deep) => {
      if (el === boom) throw new Error('synthetic failure on one node');
      return real(el, deep);
    };
    expect(() => processFrame(session)).not.toThrow();
    expect(rolesOf(a)).toContain('surface');
    expect(rolesOf(c)).toContain('surface'); // processed AFTER the failing one
    expect(session.errorCount).toBe(1);
    expect(session.errors[0]).toContain('synthetic failure on one node');
    expect(err).toHaveBeenCalled(); // never silent
    err.mockRestore();
    stopSession(session);
  });

  it('a throwing node inside a deep walk skips only that node; its siblings are still themed', async () => {
    layoutReady('<div id="shell" style="background-color: rgb(255,255,255); color: rgb(0,0,0)">s</div>');
    const real = createProbe({ doc: document, win: window });
    const probe = {
      ...real,
      readFact: (el) => {
        if (el.id === 'bad') throw new Error('probe exploded on #bad');
        return real.readFact(el);
      },
    };
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const session = await runPipeline({ doc: document, win: window, probe });
    const list = insert(
      session,
      `<div id="list" style="background-color: rgb(240,240,240)">
         <p id="first" style="color: rgb(0,0,0)">1</p>
         <p id="bad" style="color: rgb(0,0,0)">2</p>
         <p id="after" style="color: rgb(0,0,0)">3</p>
       </div>`,
    );
    drain(session);
    expect(rolesOf(list)).toContain('surface');
    expect(rolesOf(document.getElementById('first')).length).toBeGreaterThan(0);
    expect(rolesOf(document.getElementById('after')).length).toBeGreaterThan(0); // after the failure
    expect(rolesOf(document.getElementById('bad'))).toEqual([]);
    expect(session.errorCount).toBe(1);
    expect(session.errors[0]).toContain('probe exploded on #bad');
    err.mockRestore();
    stopSession(session);
  });

  it('error recording is bounded (a storm of failures cannot grow memory or spam the console)', async () => {
    const session = await settledSession();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    session.applyElement = () => {
      throw new Error('always');
    };
    for (let i = 0; i < 40; i += 1) insert(session, `<i id="n${i}"></i>`);
    processFrame(session);
    expect(session.errorCount).toBe(40);
    expect(session.errors.length).toBeLessThanOrEqual(5);
    expect(err.mock.calls.length).toBeLessThanOrEqual(5);
    err.mockRestore();
    stopSession(session);
  });

  it('sessionStats exposes the pipeline state (queue, breaker, errors, cache) for diagnosis', async () => {
    const session = await settledSession();
    insert(session, '<div id="s1">x</div>');
    const stats = sessionStats(session);
    expect(stats).toMatchObject({ pending: 1, fromCache: false, errors: 0, breakerTrips: 0, degraded: false });
    expect(sessionStats(null)).toBeNull();
    stopSession(session);
  });
});

describe('content inserted hidden is themed before it is revealed (SPA collapsed panels)', () => {
  // LinkedIn's messaging overlay, dropdown shells and lazily hydrated posts are
  // inserted collapsed/hidden and revealed later by toggling a class on a
  // WRAPPER. The observer re-checks only that wrapper, so anything classified
  // as "invisible" at insert time stayed unthemed forever.
  function hiddenAwareRects() {
    Element.prototype.getBoundingClientRect = function rect() {
      const hidden = this.closest && this.closest('.hidden');
      const w = hidden ? 0 : 100;
      const h = hidden ? 0 : 20;
      return { left: 0, top: 0, width: w, height: h, right: w, bottom: h, x: 0, y: 0 };
    };
  }

  it('themes descendants of a hidden wrapper, so revealing it needs no re-scan', async () => {
    const session = await settledSession();
    const style = document.createElement('style');
    style.textContent = '.hidden { display: none; }';
    document.head.appendChild(style);
    hiddenAwareRects();

    const panel = insert(
      session,
      `<div id="panel" class="hidden">
         <section id="inner" style="background-color: rgb(240, 240, 240)">
           <p id="txt" style="color: rgb(20, 20, 20)">x</p>
           <a id="lnk" href="/x" style="color: rgb(10, 102, 194)">y</a>
         </section>
       </div>`,
    );
    drain(session);

    // Reveal: only the wrapper's class changes (a shallow, target-only re-check).
    panel.classList.remove('hidden');
    handleMutations(
      [{ type: 'attributes', attributeName: 'class', target: panel, addedNodes: [], removedNodes: [] }],
      session,
    );
    drain(session);

    expect(rolesOf(document.getElementById('inner'))).toContain('surface');
    expect(rolesOf(document.getElementById('txt')).some((r) => r.startsWith('text-'))).toBe(true);
    expect(rolesOf(document.getElementById('lnk'))).toContain('link');
    stopSession(session);
  });
});

describe('incremental path themes the whole inserted subtree', () => {
  it('themes descendants, not just the inserted root', async () => {
    const session = await settledSession();
    const bubble = insert(
      session,
      `<div id="bubble" style="background-color: rgb(235, 235, 235)">
         <div id="row"><p id="msg" style="color: rgb(0, 0, 0)">hello</p></div>
       </div>`,
    );
    drain(session);

    expect(rolesOf(bubble)).toContain('surface'); // root: was already themed
    // The defect: the message text kept native black on the now-dark bubble.
    expect(rolesOf(document.getElementById('msg')).length).toBeGreaterThan(0);
    stopSession(session);
  });

  it('gives links and chromatic text inside the subtree their roles', async () => {
    const session = await settledSession();
    insert(
      session,
      `<div style="background-color: rgb(250, 250, 250)">
         <a id="lnk" href="/x" style="color: rgb(10, 102, 194)">profile</a>
         <span id="ok" style="color: rgb(0, 160, 60)">sent</span>
       </div>`,
    );
    drain(session);

    expect(rolesOf(document.getElementById('lnk'))).toContain('link');
    expect(rolesOf(document.getElementById('ok'))).toContain('semantic-success');
    stopSession(session);
  });

  it('contrast-checks against the real ancestor chain, not the page background', async () => {
    const session = await settledSession();
    // Nested light surface inside the inserted subtree: the text must be
    // evaluated against the themed (dark) parent, so a native-dark text colour
    // may not end up as an unrepaired dark-on-dark pair.
    insert(
      session,
      `<section style="background-color: rgb(240, 240, 240)">
         <p id="t" style="color: rgb(20, 20, 20)">body</p>
       </section>`,
    );
    drain(session);
    const t = document.getElementById('t');
    const roles = rolesOf(t);
    expect(roles.length).toBeGreaterThan(0);
    // No dark-on-dark: a text role must have been assigned (not left native).
    expect(roles.some((r) => r.startsWith('text-'))).toBe(true);
    stopSession(session);
  });

  it('does not re-theme already-marked elements (no role accumulation)', async () => {
    const session = await settledSession();
    const node = insert(session, '<div id="d" style="background-color: rgb(230, 230, 230)"><p id="p" style="color: rgb(0,0,0)">x</p></div>');
    drain(session);
    const first = rolesOf(document.getElementById('p')).join(' ');
    session.applyElement(node, true);
    expect(rolesOf(document.getElementById('p')).join(' ')).toBe(first);
    stopSession(session);
  });

  it('bounds the work per frame and defers the remainder to the next frame', async () => {
    const session = await settledSession();
    const items = Array.from({ length: 6 }, (_, i) => `<p id="p${i}" style="color: rgb(0,0,0)">x</p>`).join('');
    const wrapper = insert(session, `<div id="big" style="background-color: rgb(240,240,240)">${items}</div>`);
    session.pending.clear(); // drive applyElement directly below

    // Every Date.now() call advances well past the budget → the walk must
    // stop after the root and park the children for the next frame.
    let clock = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => (clock += SUBTREE_BUDGET_MS * 2));
    session.applyElement(wrapper, true);

    expect(session.pending.size).toBeGreaterThan(0);
    for (const parked of session.pending) {
      expect(wrapper.contains(parked)).toBe(true);
      expect(parked).not.toBe(wrapper);
    }
    vi.restoreAllMocks();

    // Next frame completes the job.
    drain(session);
    for (let i = 0; i < 6; i += 1) {
      expect(rolesOf(document.getElementById(`p${i}`)).length).toBeGreaterThan(0);
    }
    stopSession(session);
  });
});
