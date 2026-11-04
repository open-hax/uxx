// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/cache.test.js — §14.6 coverage (design §15): hashing, canonical walk,
// key, effect encode/decode, validateEntry, lookup settled-flag, store LRU /
// budget / entry-size, and the load-bearing main integration (second run does
// zero style reads and replays byte-identical effects).

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  CACHE_SCHEMA,
  CACHE_KEY_PREFIX,
  CACHE_BUDGET_BYTES,
  CACHE_MAX_ENTRIES,
  CACHE_MAX_ENTRY_BYTES,
  CACHE_HASH_MAX_CHARS,
  CACHE_LOOKUP_TIMEOUT_MS,
  VIEWPORT_BUCKET_PX,
  ROLE_KEYS,
  ROLE_INDEX,
  fnv1a32,
  hash64,
  styleSourceHash,
  canonicalWalk,
  computeKey,
  encodeEffects,
  decodeEffects,
  validateEntry,
  lookup,
  store,
  touch,
} from '../src/content/cache.js';
import { runPipeline, forEachElement, stopSession } from '../src/content/main.js';
import { createProbe } from '../src/content/probe.js';
import { createApply } from '../src/content/apply.js';
import * as tokensModule from '../src/theme/tokens.js';
import * as rolesModule from '../src/theme/roles.js';

// ── Helpers ────────────────────────────────────────────────────────────────

// In-memory browser.storage.local stand-in. `get(null)` returns a shallow
// copy of every key (the real API's enumeration), matching what store()'s
// no-index design relies on.
function fakeStorage() {
  const data = {};
  return {
    data,
    api: {
      storage: {
        local: {
          get: vi.fn(async (key) => {
            if (key === null) return { ...data };
            return { [key]: data[key] };
          }),
          set: vi.fn(async (obj) => {
            Object.assign(data, obj);
          }),
          remove: vi.fn(async (keys) => {
            for (const k of Array.isArray(keys) ? keys : [keys]) delete data[k];
          }),
        },
      },
    },
  };
}

function makeApi(extra = {}) {
  const { data, api } = fakeStorage();
  return {
    data,
    api: {
      ...api,
      runtime: {
        getManifest: () => ({ version: '0.1.0' }),
        ...extra.runtime,
      },
    },
  };
}

function baseEntry(overrides = {}) {
  return {
    s: CACHE_SCHEMA,
    v: '0.1.0',
    k: 'some-key',
    t: 1,
    sh: 'sh',
    ds: 'ds',
    degraded: false,
    pal: { backgrounds: [] },
    rt: [],
    bg: { r: 39, g: 40, b: 34, a: 1 },
    lum: 0.02,
    e: [],
    ...overrides,
  };
}

const VALIDATE_CTX = {
  lookupKey: 'some-key',
  version: '0.1.0',
  styleHash: 'sh',
  domSig: 'ds',
};

function cleanDocument() {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  for (const el of [document.documentElement, document.body]) {
    for (const attr of Array.from(el.attributes)) {
      el.removeAttribute(attr.name);
    }
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  cleanDocument();
});

// ── Hashing (design §15.2) ────────────────────────────────────────────────

describe('fnv1a32 / hash64 (design §15.2)', () => {
  it('is deterministic', () => {
    expect(fnv1a32('hello')).toBe(fnv1a32('hello'));
    expect(hash64('hello')).toBe(hash64('hello'));
  });

  it('avalanches: different input → different hash', () => {
    expect(hash64('hello')).not.toBe(hash64('hellp'));
    expect(hash64('a')).not.toBe(hash64('b'));
    expect(hash64('')).not.toBe(hash64(' '));
  });

  it('seed changes the hash (two independent passes)', () => {
    expect(fnv1a32('x', 0x811c9dc5)).not.toBe(fnv1a32('x', 0x9dc5811c));
    expect(hash64('x')).toHaveLength(16); // 8 + 8 hex chars
  });
});

describe('styleSourceHash (design §15.2)', () => {
  // NOTE: these use the GLOBAL document — `document.implementation.createHTMLDocument`
  // yields a document with no browsing context, and jsdom does not populate
  // `styleSheets` for it, so an inline <style> would be invisible to the hash.
  it('changes when an inline <style> text changes', () => {
    const style = document.createElement('style');
    style.textContent = 'div { color: red; }';
    document.head.appendChild(style);
    const before = styleSourceHash(document);
    style.textContent = 'div { color: blue; }';
    const after = styleSourceHash(document);
    expect(after).not.toBe(before);
  });

  it('excludes data-uxx-owned sheets (inject a boot sheet → hash unchanged)', () => {
    const style = document.createElement('style');
    style.textContent = 'div { color: red; }';
    document.head.appendChild(style);
    const before = styleSourceHash(document);
    const boot = document.createElement('style');
    boot.setAttribute('data-uxx', 'boot');
    boot.textContent = 'html { background: #272822; }';
    document.head.appendChild(boot);
    expect(styleSourceHash(document)).toBe(before);
  });

  it('cross-origin sheet (cssRules throws SecurityError) → href-only, no throw', () => {
    const href = 'https://cdn.example.com/a.css';
    const sheet = {
      ownerNode: { hasAttribute: () => false, textContent: '' },
      href,
      get cssRules() {
        throw new Error('SecurityError');
      },
    };
    const docA = { styleSheets: [sheet], documentElement: { getAttribute: () => '' } };
    const docB = {
      styleSheets: [
        {
          ownerNode: { hasAttribute: () => false, textContent: '' },
          href,
          get cssRules() {
            throw new Error('SecurityError');
          },
        },
      ],
      documentElement: { getAttribute: () => '' },
    };
    // Same href, unreadable rules → identical hash (href alone is the source).
    expect(styleSourceHash(docA)).toBe(styleSourceHash(docB));
    // Different href → different hash.
    const docC = {
      styleSheets: [
        {
          ownerNode: { hasAttribute: () => false, textContent: '' },
          href: 'https://cdn.example.com/b.css',
          get cssRules() {
            throw new Error('SecurityError');
          },
        },
      ],
      documentElement: { getAttribute: () => '' },
    };
    expect(styleSourceHash(docC)).not.toBe(styleSourceHash(docA));
  });

  it('ownerNode == null (constructed sheet) is hashed without throwing (R2)', () => {
    const constructed = { ownerNode: null, href: null, cssRules: [] };
    const doc = { styleSheets: [constructed], documentElement: { getAttribute: () => '' } };
    expect(() => styleSourceHash(doc)).not.toThrow();
    expect(styleSourceHash(doc)).toMatch(/^[0-9a-f]{16}$/);
    // Different constructed content → different hash.
    const other = { styleSheets: [{ ownerNode: null, href: null, cssRules: [{ cssText: 'a{}' }] }], documentElement: { getAttribute: () => '' } };
    expect(styleSourceHash(other)).not.toBe(styleSourceHash(doc));
  });

  it(`caps hashed characters at CACHE_HASH_MAX_CHARS and appends a marker`, () => {
    const style = document.createElement('style');
    document.head.appendChild(style);
    const hashWith = (text) => {
      style.textContent = text;
      return styleSourceHash(document);
    };
    const bigA = 'A'.repeat(CACHE_HASH_MAX_CHARS + 100_000);
    const bigB = 'A'.repeat(CACHE_HASH_MAX_CHARS) + 'B'.repeat(100_000);
    // Content past the cap is truncated → both hash identically.
    expect(hashWith(bigA)).toBe(hashWith(bigB));
    // Content before the cap still differentiates.
    expect(hashWith('A'.repeat(10))).not.toBe(hashWith('B'.repeat(10)));
  });
});

// ── Canonical walk (design §15.3) ─────────────────────────────────────────

describe('canonicalWalk (design §15.3, review R7/R1)', () => {
  function buildRichDoc() {
    const doc = document.implementation.createHTMLDocument('t');
    doc.body.innerHTML =
      '<div id="a"><span id="a1">x</span><b id="a2">y</b></div><p id="b">z</p>';
    const host = doc.createElement('div');
    host.id = 'host';
    doc.body.appendChild(host);
    if (typeof host.attachShadow === 'function') {
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<i id="s1">shadow</i>';
    }
    return doc;
  }

  it('order parity with the exported forEachElement (un-pruned)', () => {
    const doc = buildRichDoc();
    const viaForEach = [];
    forEachElement(doc, (el) => {
      viaForEach.push(el);
      return true; // never prune
    });
    const { elements } = canonicalWalk(doc);
    expect(elements.length).toBe(viaForEach.length);
    for (let i = 0; i < elements.length; i += 1) {
      expect(elements[i]).toBe(viaForEach[i]);
    }
  });

  it('documentElement is index 0; shadow root sits after the host light subtree, before next sibling', () => {
    const doc = buildRichDoc();
    const { elements, indexOf } = canonicalWalk(doc);
    expect(elements[0]).toBe(doc.documentElement);
    const host = doc.getElementById('host');
    if (host && host.shadowRoot) {
      const shadowChild = host.shadowRoot.firstElementChild;
      expect(indexOf.get(host)).toBeLessThan(indexOf.get(shadowChild));
      // host's next sibling (if any) comes after the shadow.
      const next = host.nextElementSibling;
      if (next) expect(indexOf.get(shadowChild)).toBeLessThan(indexOf.get(next));
    }
  });

  it('signature changes on class change via getAttribute on an SVG element (R1)', () => {
    const doc = document.implementation.createHTMLDocument('t');
    doc.body.innerHTML = '<svg><circle id="c" class="a" /></svg>';
    const circle = doc.getElementById('c');
    // Sanity: el.className on SVG is an SVGAnimatedString — the signature must
    // NOT be derived from it, or this change would be invisible.
    expect(typeof circle.className).not.toBe('string');
    const before = canonicalWalk(doc).signature;
    circle.setAttribute('class', 'b');
    expect(canonicalWalk(doc).signature).not.toBe(before);
  });

  it('signature changes on style change, id change, and element insert', () => {
    const doc = document.implementation.createHTMLDocument('t');
    doc.body.innerHTML = '<div id="d">x</div>';
    const div = doc.getElementById('d');
    const base = canonicalWalk(doc).signature;

    div.setAttribute('style', 'color: red;');
    const afterStyle = canonicalWalk(doc).signature;
    expect(afterStyle).not.toBe(base);

    div.setAttribute('id', 'd2');
    const afterId = canonicalWalk(doc).signature;
    expect(afterId).not.toBe(afterStyle);

    const extra = doc.createElement('span');
    doc.body.appendChild(extra);
    expect(canonicalWalk(doc).signature).not.toBe(afterId);
  });
});

// ── Key (design §15.1) ────────────────────────────────────────────────────

describe('computeKey (design §15.1)', () => {
  const base = {
    url: 'https://a.example/p',
    vw: 1000,
    vh: 800,
    prefersMore: false,
    prefersColorScheme: 'dark',
    forcedColors: 'none',
    isTopFrame: true,
    version: '0.1.0',
  };

  it('each component flips the key', () => {
    const k = computeKey(base);
    expect(computeKey({ ...base, version: '0.2.0' })).not.toBe(k);
    expect(computeKey({ ...base, url: 'https://a.example/q' })).not.toBe(k);
    expect(computeKey({ ...base, vw: 1000 + VIEWPORT_BUCKET_PX })).not.toBe(k);
    expect(computeKey({ ...base, vh: 800 + VIEWPORT_BUCKET_PX })).not.toBe(k);
    expect(computeKey({ ...base, prefersMore: true })).not.toBe(k);
    expect(computeKey({ ...base, prefersColorScheme: 'light' })).not.toBe(k);
    expect(computeKey({ ...base, forcedColors: 'active' })).not.toBe(k);
    expect(computeKey({ ...base, isTopFrame: false })).not.toBe(k);
  });

  it('bucket boundary flips at 127→128 and 383→384 (Math.round(vw/256))', () => {
    const at = (vw) => computeKey({ ...base, vw });
    expect(at(127)).not.toBe(at(128)); // 0.496→0 vs 0.5→1
    expect(at(383)).not.toBe(at(384)); // 1.496→1 vs 1.5→2
    // A 255→256 assertion would NOT flip (both round to 1) — must not be used.
    expect(Math.round(255 / 256)).toBe(Math.round(256 / 256));
  });

  it('url is length-prefixed so field boundaries cannot be forged', () => {
    // Two urls whose concatenation could collide without the length prefix.
    const a = computeKey({ ...base, url: 'ab' });
    const b = computeKey({ ...base, url: 'a', forcedColors: 'b' });
    expect(a).not.toBe(b);
  });
});

// ── Effect encoding (spec §14.4) ──────────────────────────────────────────

describe('encodeEffects / decodeEffects (spec §14.4)', () => {
  it('round-trips roles, exception, and inline redirects', () => {
    const records = [
      { idx: 3, roles: ['page-background', 'text-primary'], exception: true, inline: [['color', '#f8f8f2']] },
      { idx: 7, roles: ['surface'], exception: false, inline: [] },
    ];
    const e = encodeEffects(records);
    expect(e).toHaveLength(2);
    expect(e[0][1]).toEqual([ROLE_INDEX.get('page-background'), ROLE_INDEX.get('text-primary')]);
    expect(e[0][2]).toBe(true);
    const back = decodeEffects({ e });
    expect(back).toEqual(records);
  });

  it('omits elements with no role/exception/inline effect', () => {
    const e = encodeEffects([{ idx: 1, roles: [], exception: false, inline: [] }]);
    expect(e).toEqual([]);
    // An unknown role is dropped; if that was the only effect, the record goes.
    const onlyUnknown = encodeEffects([{ idx: 2, roles: ['not-a-role'], exception: false, inline: [] }]);
    expect(onlyUnknown).toEqual([]);
  });

  it('ROLE_KEYS covers every ROLE_RULES entry (0..32)', () => {
    expect(ROLE_KEYS).toHaveLength(33);
    expect(ROLE_INDEX.size).toBe(33);
  });
});

// ── validateEntry (design §15.6) ──────────────────────────────────────────

describe('validateEntry (design §15.6, review R4)', () => {
  it('accepts a well-formed entry', () => {
    expect(validateEntry(baseEntry(), VALIDATE_CTX)).toBe(true);
  });

  it('rejects each field mismatch with zero side effects', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const attrCount = () => el.attributes.length;

    const cases = [
      ['schema', { s: 'other' }],
      ['key', { k: 'wrong' }],
      ['version', { v: '9.9.9' }],
      ['degraded', { degraded: true }],
      ['styleHash', { sh: 'other' }],
      ['domSig', { ds: 'other' }],
      ['palette', { pal: null }],
      ['rankTable', { rt: 'not-array' }],
      ['bg', { bg: null }],
      ['lum', { lum: 'x' }],
      ['effects', { e: 'not-array' }],
      ['malformed record', { e: [[1, 'not-array', false, []]] }],
      ['malformed inline pair', { e: [[1, [], false, [['color']]]] }],
    ];
    const before = attrCount();
    for (const [label, patch] of cases) {
      expect(validateEntry(baseEntry(patch), VALIDATE_CTX), label).toBe(false);
    }
    expect(attrCount()).toBe(before); // no attribute was ever written
    expect(validateEntry(null, VALIDATE_CTX)).toBe(false);
    expect(validateEntry('x', VALIDATE_CTX)).toBe(false);
  });
});

// ── lookup (spec §14.4) ───────────────────────────────────────────────────

describe('lookup (spec §14.4, review R6)', () => {
  it('returns the stored entry', async () => {
    const { api } = makeApi();
    await store(api, 'k1', baseEntry({ k: 'k1' }));
    const got = await lookup(api, 'k1');
    expect(got).not.toBeNull();
    expect(got.k).toBe('k1');
  });

  it('returns null for an absent key, absent API, or missing storage', async () => {
    expect(await lookup(null, 'k')).toBeNull();
    expect(await lookup({}, 'k')).toBeNull();
    const { api } = makeApi();
    expect(await lookup(api, 'absent')).toBeNull();
  });

  it('discards a resolution arriving after the timeout — never a late hit (R6)', async () => {
    let resolveGet;
    const slowApi = {
      storage: {
        local: {
          get: () =>
            new Promise((resolve) => {
              resolveGet = resolve;
            }),
        },
      },
    };
    const result = await lookup(slowApi, 'k', 10);
    expect(result).toBeNull(); // timed out first
    // The late value arrives afterwards — it must not be applied.
    resolveGet({ [CACHE_KEY_PREFIX + 'k']: baseEntry() });
    await new Promise((r) => setTimeout(r, 5));
    expect(result).toBeNull();
    expect(CACHE_LOOKUP_TIMEOUT_MS).toBe(250); // pinned default
  });
});

// ── store (spec §14.4, design §15.5) ──────────────────────────────────────

describe('store (spec §14.4, design §15.5)', () => {
  const keyFor = (i) => `page-${i}`;

  it('evicts the oldest t at CACHE_MAX_ENTRIES (LRU), keeping the newest', async () => {
    const { api, data } = makeApi();
    for (let i = 1; i <= CACHE_MAX_ENTRIES; i += 1) {
      await store(api, keyFor(i), baseEntry({ k: keyFor(i), t: i }));
    }
    expect(Object.keys(data)).toHaveLength(CACHE_MAX_ENTRIES);
    await store(api, keyFor(101), baseEntry({ k: keyFor(101), t: 101 }));
    expect(Object.keys(data)).toHaveLength(CACHE_MAX_ENTRIES);
    expect(data[CACHE_KEY_PREFIX + keyFor(1)]).toBeUndefined(); // oldest evicted
    expect(data[CACHE_KEY_PREFIX + keyFor(101)]).toBeDefined();
    expect(data[CACHE_KEY_PREFIX + keyFor(2)]).toBeDefined();
  });

  it('enforces the 8 MB budget by evicting oldest entries', async () => {
    const { api, data } = makeApi();
    const pad = 'x'.repeat(Math.floor(CACHE_MAX_ENTRY_BYTES * 0.9)); // ~1.9 MB each
    const big = (i) => baseEntry({ k: keyFor(i), t: i, pad });
    for (let i = 1; i <= 4; i += 1) await store(api, keyFor(i), big(i));
    expect(Object.keys(data)).toHaveLength(4); // ~7.6 MB — under budget
    await store(api, keyFor(5), big(5)); // ~9.5 MB — over budget → evict oldest
    expect(data[CACHE_KEY_PREFIX + keyFor(1)]).toBeUndefined();
    expect(data[CACHE_KEY_PREFIX + keyFor(5)]).toBeDefined();
    expect(Object.keys(data)).toHaveLength(4);
  });

  it('skips an entry larger than CACHE_MAX_ENTRY_BYTES', async () => {
    const { api, data } = makeApi();
    const oversized = baseEntry({ pad: 'y'.repeat(CACHE_MAX_ENTRY_BYTES + 1000) });
    await store(api, 'huge', oversized);
    expect(Object.keys(data)).toHaveLength(0);
  });

  it('never caches a degraded entry', async () => {
    const { api, data } = makeApi();
    await store(api, 'd', baseEntry({ degraded: true }));
    expect(Object.keys(data)).toHaveLength(0);
  });

  it('two stores leave no orphan: entries are self-describing via t, no index key', async () => {
    const { api, data } = makeApi();
    await store(api, 'a', baseEntry({ k: 'a', t: 10 }));
    await store(api, 'b', baseEntry({ k: 'b', t: 20 }));
    const keys = Object.keys(data);
    expect(keys).toHaveLength(2);
    expect(keys.every((k) => k.startsWith(CACHE_KEY_PREFIX))).toBe(true);
    expect(keys.some((k) => k.includes('index'))).toBe(false);
    expect(data[CACHE_KEY_PREFIX + 'a'].t).toBe(10);
    expect(data[CACHE_KEY_PREFIX + 'b'].t).toBe(20);
  });
});

// ── Main integration (spec §14.6, the load-bearing case) ──────────────────

describe('main integration — cache hit replays with zero style reads (spec §14.6)', () => {
  function setupPage() {
    document.documentElement.style.setProperty('background-color', 'rgb(39, 40, 34)');
    document.body.innerHTML =
      '<div id="card" style="background-color: rgb(255, 255, 255); color: rgb(0, 0, 0);">hi</div>' +
      '<p id="t1" style="color: rgb(204, 204, 204);">one</p>' +
      '<p id="t2" style="color: rgb(166, 226, 46);">two</p>';
    document.body.style.setProperty('background-color', 'rgb(39, 40, 34)');
    document.body.style.setProperty('color', 'rgb(248, 248, 242)');
    // jsdom has no layout — stub the §9.3 gate and give elements a rect.
    Object.defineProperty(document.body, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(document.body, 'clientHeight', { value: 500, configurable: true });
    Element.prototype.getBoundingClientRect = () => ({
      left: 0, top: 0, width: 100, height: 20, right: 100, bottom: 20, x: 0, y: 0,
    });
  }

  // Capture the ROOT and BODY as full attribute sets, not just `style`:
  // run 1 marks documentElement and body too (both are `isRoot` →
  // `page-background`), and a restore that left their `data-uxx-role` in place
  // would let the replay assertion pass vacuously on the most visible element.
  const allAttrs = (el) => Array.from(el.attributes).map((a) => [a.name, a.value]);

  function capture() {
    return {
      headHtml: document.head.innerHTML,
      bodyHtml: document.body.innerHTML,
      rootAttrs: allAttrs(document.documentElement),
      bodyAttrs: allAttrs(document.body),
    };
  }

  function restore(c) {
    document.head.innerHTML = c.headHtml;
    document.body.innerHTML = c.bodyHtml;
    for (const [el, attrs] of [
      [document.documentElement, c.rootAttrs],
      [document.body, c.bodyAttrs],
    ]) {
      for (const attr of Array.from(el.attributes)) el.removeAttribute(attr.name);
      for (const [name, value] of attrs) el.setAttribute(name, value);
    }
  }

  const effects = () => document.documentElement.outerHTML;
  const markerCount = () => document.querySelectorAll('[data-uxx-role]').length;

  function spiedProbe() {
    const probe = createProbe({ doc: document, win: window });
    return { probe, readFact: vi.spyOn(probe, 'readFact'), grid: vi.spyOn(probe, 'sampleViewportGrid') };
  }

  async function run(api, probe, apply = null) {
    const session = await runPipeline({ doc: document, win: window, api, probe, apply });
    // cache.store is fire-and-forget — flush so the write lands before we assert.
    await new Promise((r) => setTimeout(r, 0));
    return session;
  }

  it('second run: zero readFact + zero sampleViewportGrid, byte-identical effects', async () => {
    setupPage();
    const pristine = capture();
    const { api } = makeApi();

    // Run 1 — miss (cold cache): full pipeline, populates the cache.
    const p1 = spiedProbe();
    const session1 = await run(api, p1.probe);
    expect(session1.degraded).toBe(false);
    expect(markerCount()).toBeGreaterThan(0);
    expect(p1.readFact).toHaveBeenCalled(); // full pipeline did style reads
    const firstEffects = effects();
    const firstRankSize = session1.rankTable instanceof Map ? session1.rankTable.size : -1;

    // A reload kills the old context: stop run 1's observer BEFORE restoring,
    // else its childList records for the restored nodes schedule a frame whose
    // applyElement could union different roles in and make the byte-identical
    // comparison timing-fragile.
    stopSession(session1);

    // Simulate a reload: restore the pristine DOM (no data-uxx, original styles).
    restore(pristine);

    // Run 2 — hit: must do ZERO style/layout reads and replay identically.
    const p2 = spiedProbe();
    const session2 = await run(api, p2.probe);
    expect(p2.readFact).not.toHaveBeenCalled();
    expect(p2.grid).not.toHaveBeenCalled();
    expect(session2.degraded).toBe(false);
    expect(effects()).toBe(firstEffects); // byte-identical replay
    // Rank table restored (R8): a fresh mapper starts with an EMPTY table.
    expect(session2.rankTable).toBeInstanceOf(Map);
    expect(session2.rankTable.size).toBe(firstRankSize);
    for (const [k, v] of session1.rankTable) expect(session2.rankTable.get(k)).toBe(v);
  });

  it('a class change invalidates the entry → full pipeline re-runs', async () => {
    setupPage();
    const pristine = capture();
    const { api } = makeApi();

    await run(api, spiedProbe().probe);
    restore(pristine);

    // Mutate a class — domSig must change → miss.
    document.getElementById('card').classList.add('mutated');
    const p = spiedProbe();
    const session = await run(api, p.probe);
    expect(p.readFact).toHaveBeenCalled(); // miss → full pipeline
    expect(session.degraded).toBe(false);
    expect(markerCount()).toBeGreaterThan(0);
  });

  it('a degraded run (MAX_ELEMENTS forced) caches nothing', async () => {
    setupPage();
    const { api, data } = makeApi();
    // Force the CLASSIFY walk to trip TIME_TRIP immediately after passStart.
    let t = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => {
      t += 4000; // > TIME_TRIP_MS (3000) on the first walk step
      return t;
    });
    const session = await run(api, spiedProbe().probe);
    expect(session.degraded).toBe(true);
    expect(Object.keys(data).filter((k) => k.startsWith(CACHE_KEY_PREFIX))).toHaveLength(0);
  });

  it('a hit restores rt, so ranked text maps to the rank-corrected role (R8)', async () => {
    setupPage();
    const pristine = capture();
    const { api } = makeApi();

    const session1 = await run(api, spiedProbe().probe);
    expect(session1.rankTable.size).toBeGreaterThan(0); // ranked text was detected
    restore(pristine);

    const session2 = await run(api, spiedProbe().probe);
    // The restored rankTable must equal run 1's — a fresh mapper starts with an
    // EMPTY internal table, so an unrestored rt would silently drop ranking.
    expect(session2.rankTable).toBeInstanceOf(Map);
    expect(session2.rankTable.size).toBe(session1.rankTable.size);
    for (const [k, v] of session1.rankTable) expect(session2.rankTable.get(k)).toBe(v);

    // card's source colour is black (0,0,0) → the table ranks it text-muted;
    // without the table map() falls back to the classify default (text-primary).
    const blackKey = 'rgba(0, 0, 0, 1)';
    expect(session2.rankTable.get(blackKey)).toBe('text-muted');
    const blackRanked = {
      property: 'color',
      role: 'text-primary',
      sourceColor: { r: 0, g: 0, b: 0, a: 1 },
      confidence: 0.5,
      ranked: true,
      sizeClass: 'normal',
    };
    const ctxOf = (rt) => ({
      resolvedBgColor: session2.pageBg,
      ancestorChain: [],
      rankTable: rt,
      prefersMore: session2.prefersMore,
    });
    const withRestored = session2.mapper.map(blackRanked, ctxOf(session2.rankTable));
    session2.mapper.clear(); // the mapper cache is keyed without rankTable contents
    const withEmpty = session2.mapper.map(blackRanked, ctxOf(new Map()));
    expect(withRestored.role).toBe('text-muted'); // restored rt applied
    expect(withEmpty.role).toBe('text-primary'); // R8 regression: empty rt → default

    // A live mutation after the hit keeps the steady-state session on the
    // rank-corrected role (card already carries text-muted from the replay).
    const card = document.getElementById('card');
    card.classList.add('ranked-again');
    session2.applyElement(card);
    expect(card.getAttribute('data-uxx-role').split(' ')).toContain('text-muted');
  });

  it('a mid-replay throw tears down, re-injects boot, and falls through to a clean full run', async () => {
    setupPage();
    const pristine = capture();
    const { api, data } = makeApi();

    // Run 1 — cold miss with a normal apply → populates the cache.
    const session1 = await run(api, spiedProbe().probe);
    stopSession(session1);
    restore(pristine);

    // Run 2 — hit, but make `mark` throw once during the REPLAY (call 3).
    // Replay uses the same apply the fall-through will use, so the wrapper
    // must throw exactly once, mid-replay, then behave normally afterwards.
    const apply = createApply({ doc: document, tokens: tokensModule, roles: rolesModule });
    const realMark = apply.mark.bind(apply);
    let marks = 0;
    let replayThrow = false;
    apply.mark = (el, role) => {
      marks += 1;
      if (marks === 3) {
        replayThrow = true;
        throw new Error('forced replay failure');
      }
      return realMark(el, role);
    };

    const session2 = await run(api, spiedProbe().probe, apply);
    expect(replayThrow).toBe(true); // the recovery path was actually exercised
    expect(session2).toBeDefined(); // did NOT escape runPipeline
    expect(session2.degraded).toBe(false);
    // teardown purged partial markers, then the full pipeline re-themed:
    expect(markerCount()).toBeGreaterThan(0);
    expect(document.querySelector('[data-uxx-degraded]')).toBeNull();
    // and the fall-through run stored a coherent entry (same pristine ds/sh).
    expect(Object.keys(data).some((k) => k.startsWith(CACHE_KEY_PREFIX))).toBe(true);

    // Run 3 — the entry stored AFTER the replay-throw must still hit, which
    // proves the fall-through wrote hashes describing the pristine state
    // (had it stored a post-replay signature, validation would miss here).
    stopSession(session2);
    restore(pristine);
    const p3 = spiedProbe();
    const session3 = await run(api, p3.probe);
    expect(p3.readFact).not.toHaveBeenCalled(); // coherent entry → hit
    expect(p3.grid).not.toHaveBeenCalled();
    expect(session3.degraded).toBe(false);
    stopSession(session3);
  });
});

describe('touch (design §15.6 step 6)', () => {
  it('refreshes t under the same key, leaving every other field unchanged', async () => {
    const { api, data } = makeApi();
    const entry = baseEntry({ k: 'k', t: 1, sh: 'keep-sh', ds: 'keep-ds' });
    await store(api, 'k', entry);
    await touch(api, 'k', entry);
    const after = data[CACHE_KEY_PREFIX + 'k'];
    expect(Object.keys(data)).toHaveLength(1); // entry-only write — no index key
    expect(after.t).toBeGreaterThanOrEqual(entry.t);
    expect(after.sh).toBe('keep-sh');
    expect(after.ds).toBe('keep-ds');
    expect(after.k).toBe('k');
  });

  it('is a silent no-op without a storage API', async () => {
    await expect(touch(null, 'k', baseEntry())).resolves.toBeUndefined();
    await expect(touch({}, 'k', baseEntry())).resolves.toBeUndefined();
    await expect(touch({ storage: {} }, 'k', null)).resolves.toBeUndefined();
  });
});
