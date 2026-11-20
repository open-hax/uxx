// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/diagnose.test.js — the developer "why wasn't this themed?" report.
// Most important test: the PRIVACY CONTRACT — nothing a page contains about
// other people (text, ids, links, labels, URL paths) may reach the report.

import { describe, it, expect } from 'vitest';
import {
  diagnose,
  registerDiagnose,
  DIAG_SCHEMA,
  DIAG_MESSAGE,
  DIAG_LOW_CONTRAST,
} from '../src/content/diagnose.js';

const BASE = {
  display: 'block',
  visibility: 'visible',
  opacity: '1',
  backgroundColor: 'rgba(0, 0, 0, 0)',
  backgroundImage: 'none',
  color: 'rgb(248, 248, 242)',
  mixBlendMode: 'normal',
  filter: 'none',
  backdropFilter: 'none',
};

function page(html, overrides = {}, loc = {}) {
  const parsed = new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, 'text/html');
  const doc = document.implementation.createHTMLDocument('t');
  doc.replaceChild(doc.importNode(parsed.documentElement, true), doc.documentElement);
  const getComputedStyle = (el) => ({ ...BASE, ...(overrides[el.getAttribute('data-t')] || {}) });
  const win = {
    location: { origin: 'https://example.test', pathname: '/', ...loc },
    innerWidth: 1000,
    innerHeight: 800,
    getComputedStyle,
  };
  win.top = win;
  return { doc, win };
}

const run = (p, extra = {}) => diagnose({ doc: p.doc, win: p.win, ...extra });
const groupKeys = (report, reason) => (report.reasons[reason] ? report.reasons[reason].groups.map((g) => g.key) : []);

describe('privacy contract', () => {
  it('never leaks text, ids, links, labels or deep URL paths', () => {
    const p = page(
      `<div class="card" data-t="a" id="ember-SECRETID" style="x:y">
         <p class="line" data-t="b" aria-label="SECRET-LABEL" title="SECRET-TITLE">SECRET-TEXT Kimball Bighorse</p>
         <a class="lnk" data-t="c" href="/in/secret-person" data-foo="SECRET-DATA">SECRET-LINK-TEXT</a>
         <img class="av" data-t="d" src="https://cdn.test/SECRET-SRC.jpg" alt="SECRET-ALT">
         <input class="f" data-t="e" value="SECRET-VALUE" placeholder="SECRET-PLACEHOLDER">
       </div>`,
      { a: { backgroundColor: 'rgb(235, 235, 235)' }, b: { color: 'rgb(20, 20, 20)' } },
      { pathname: '/in/secret-person/details/experience' },
    );
    const report = run(p);
    // Non-vacuous: the report must actually describe this page, otherwise an
    // empty report would trivially "contain no secrets".
    expect(report.totals.elements).toBeGreaterThanOrEqual(6);
    expect(groupKeys(report, 'bg-unmarked')).toEqual(['div.card']);
    expect(groupKeys(report, 'low-contrast').length).toBeGreaterThan(0);
    const text = JSON.stringify(report);
    for (const needle of ['SECRET', 'secret-person', 'Kimball', 'Bighorse', 'ember', 'cdn.test', 'details', 'experience']) {
      expect(text).not.toContain(needle);
    }
    // The first path segment is the only path information allowed through.
    expect(JSON.parse(text).url.firstSegment).toBe('/in');
  });

  it('only emits whitelist-shaped class tokens (odd tokens are dropped, not echoed)', () => {
    const p = page(`<div class="ok-class weird:token 9bad SECRET.dot" data-t="a"></div>`, {
      a: { backgroundColor: 'rgb(240, 240, 240)' },
    });
    const keys = groupKeys(run(p), 'bg-unmarked');
    expect(keys).toEqual(['div.ok-class']);
  });
});

describe('reasons', () => {
  it('marked elements count as themed and produce no reason', () => {
    const p = page(`<div class="m" data-t="a" data-uxx-role="surface">x</div>`, {
      a: { backgroundColor: 'rgb(65, 67, 57)' },
    });
    const r = run(p);
    expect(r.schema).toBe(DIAG_SCHEMA);
    expect(r.totals.themed).toBe(1);
    expect(r.roles.surface).toBe(1);
    expect(r.reasons['bg-unmarked']).toBeUndefined();
  });

  it('an unmarked painted background is bg-unmarked; unmarked own text is text-unmarked', () => {
    const p = page(
      `<div class="panel" data-t="a"><span class="txt" data-t="b">hello</span></div>`,
      { a: { backgroundColor: 'rgb(240, 240, 240)' } },
    );
    const r = run(p);
    expect(groupKeys(r, 'bg-unmarked')).toEqual(['div.panel']);
    expect(groupKeys(r, 'text-unmarked')).toEqual(['span.txt']);
  });

  it('background images are their own reason (left native by design)', () => {
    const p = page(`<div class="hero" data-t="a">x</div>`, {
      a: { backgroundImage: 'linear-gradient(red, blue)' },
    });
    expect(groupKeys(run(p), 'bg-image')).toEqual(['div.hero']);
  });

  it('separates the prune ROOT from everything inside the pruned subtree, with the cause', () => {
    const p = page(
      `<div class="blur" data-t="a"><div class="in" data-t="b"><span class="deep" data-t="c">t</span></div></div>`,
      {
        a: { backdropFilter: 'blur(8px)', backgroundColor: 'rgb(250, 250, 250)' },
        b: { backgroundColor: 'rgb(240, 240, 240)' },
      },
    );
    const r = run(p);
    expect(groupKeys(r, 'pruned-root')).toEqual(['div.blur|backdrop-filter']);
    expect(groupKeys(r, 'pruned-subtree').sort()).toEqual(['div.in|backdrop-filter', 'span.deep|backdrop-filter']);
    const inner = r.reasons['pruned-subtree'].groups.find((g) => g.key.startsWith('div.in'));
    expect(inner.sample.prunedAt).toContain('div.blur');
    expect(inner.sample.cause).toBe('backdrop-filter');
  });

  it('a nested filter inside an already-pruned subtree does not become a second root', () => {
    const p = page(`<div class="o" data-t="a"><div class="i" data-t="b">x</div></div>`, {
      a: { filter: 'blur(2px)', backgroundColor: 'rgb(9, 9, 9)' },
      b: { mixBlendMode: 'multiply', backgroundColor: 'rgb(8, 8, 8)' },
    });
    const r = run(p);
    expect(r.reasons['pruned-root'].count).toBe(1);
    expect(r.reasons['pruned-subtree'].count).toBe(1);
  });

  it('ignores elements that never render (style/script/head/meta/template…) — no false positives', () => {
    const p = page(
      `<style>.x{}</style><script>var a=1</script><template><p>t</p></template><noscript>n</noscript>
       <div class="real" data-t="a">visible</div>`,
      { a: { color: 'rgb(248, 248, 242)' } },
    );
    const r = run(p);
    expect(groupKeys(r, 'text-unmarked')).toEqual(['div.real']);
    expect(r.reasons['text-unmarked'].count).toBe(1);
  });

  it('flags hidden elements instead of treating them as visible problems', () => {
    const p = page(`<div class="gone" data-t="a"><p class="in" data-t="b">hidden text</p></div>`, {
      a: { display: 'none' },
      b: { color: 'rgb(20, 20, 20)', backgroundColor: 'rgb(30, 30, 30)' },
    });
    const r = run(p);
    const g = r.reasons['bg-unmarked'].groups[0];
    expect(g.sample.hidden).toBe(true);
    expect(r.reasons['low-contrast']).toBeUndefined(); // not rendered → no contrast verdict
  });
});

// Blind spot found on LinkedIn: the Messaging widget was a solid WHITE bar with
// dark text — fully readable (so never "low contrast") and the diagnostic
// reported nothing, because it only saw UNMARKED elements. The page's own
// `!important` rules can beat our `[data-uxx-role]` rule, leaving a MARKED
// element painted in its native colour. These checks see that.
describe('marked-but-overridden and light surfaces left on the dark page', () => {
  // surface = colors.background.elevated in the Monokai pack.
  const EXPECTED_SURFACE = 'rgb(52, 53, 47)';

  it('role-overridden: a marked element whose computed bg is not its role colour', () => {
    const p = page(`<div class="bar" data-t="a" data-uxx-role="surface">x</div>`, {
      a: { backgroundColor: 'rgb(255, 255, 255)' }, // page CSS won
    });
    const r = run(p);
    const g = r.reasons['role-overridden'].groups[0];
    expect(g.key).toBe('div.bar|bg|surface');
    expect(g.sample.actual).toBe('rgb(255,255,255)');
    expect(g.sample.expected).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it('is silent when the role colour really painted', () => {
    const p = page(`<div class="bar" data-t="a" data-uxx-role="surface">x</div>`, {
      a: { backgroundColor: EXPECTED_SURFACE },
    });
    expect(run(p).reasons['role-overridden']).toBeUndefined();
  });

  it('role-overridden also covers text colour', () => {
    const p = page(`<p class="t" data-t="a" data-uxx-role="text-primary">x</p>`, {
      a: { color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(39, 40, 34)' },
    });
    expect(groupKeys(run(p), 'role-overridden')).toEqual(['p.t|color|text-primary']);
  });

  it('light-surface: an opaque light background on the page, marked or not', () => {
    const p = page(
      `<div class="white" data-t="a" data-uxx-role="surface">x</div><div class="dark" data-t="b">y</div><div class="faint" data-t="c">z</div>`,
      {
        a: { backgroundColor: 'rgb(255, 255, 255)' },
        b: { backgroundColor: 'rgb(39, 40, 34)' },
        c: { backgroundColor: 'rgba(255, 255, 255, 0.2)' }, // translucent: not a light surface
      },
    );
    const r = run(p);
    expect(groupKeys(r, 'light-surface')).toEqual(['div.white']);
    expect(r.reasons['light-surface'].groups[0].sample.marked).toBe(true);
  });

  it('screen-reader-only text is not a contrast finding', () => {
    const p = page(`<span class="sr" data-t="a">hidden label</span>`, {
      a: { position: 'absolute', width: '1px', height: '1px', color: 'rgb(30,30,30)', backgroundColor: 'rgb(39,40,34)' },
    });
    expect(run(p).reasons['low-contrast']).toBeUndefined();
  });

  it('names the winning !important site rule (class selectors only), never our own sheets', () => {
    const style = document.createElement('style');
    style.textContent = '.win-bar { background-color: rgb(255, 255, 255) !important; } .calm { background-color: red; }';
    document.head.appendChild(style);
    const own = document.createElement('style');
    own.setAttribute('data-uxx', 'role');
    own.textContent = '[data-uxx-role~="surface"] { background-color: rgb(65,67,57) !important; }';
    document.head.appendChild(own);
    try {
      const host = document.createElement('div');
      host.className = 'win-bar calm';
      host.setAttribute('data-uxx-role', 'surface');
      host.textContent = 'x';
      document.body.appendChild(host);
      const win = {
        location: { origin: 'https://example.test', pathname: '/' },
        innerWidth: 1000,
        innerHeight: 800,
        getComputedStyle: () => ({ ...BASE, backgroundColor: 'rgb(255, 255, 255)' }),
      };
      win.top = win;
      const r = diagnose({ doc: document, win });
      const sample = r.reasons['role-overridden'].groups[0].sample;
      expect(sample.winners.map((w) => w.selector)).toEqual(['.win-bar']);
      expect(sample.winners[0].prop).toBe('background-color');
      expect(JSON.stringify(sample.winners)).not.toContain('data-uxx');
      host.remove();
    } finally {
      style.remove();
      own.remove();
    }
  });
});

describe('shadow roots (document styles do not pierce them)', () => {
  function shadowPage() {
    const p = page('<div class="outlet" id="interop-outlet" data-t="h"></div>', { h: {}, c: { backgroundColor: 'rgb(255, 255, 255)' } });
    const host = p.doc.querySelector('.outlet');
    const root = host.attachShadow({ mode: 'open' });
    const card = p.doc.createElement('div');
    card.className = 'msg-card';
    card.setAttribute('data-t', 'c');
    card.setAttribute('data-uxx-role', 'surface');
    card.textContent = 'SECRET-TEXT';
    root.appendChild(card);
    return { ...p, host, root, card };
  }

  it('paths cross the shadow boundary to the host and flag the element as inside a shadow root', () => {
    const { doc, win } = shadowPage();
    const r = diagnose({ doc, win });
    const sample = r.reasons['role-overridden'].groups[0].sample;
    expect(sample.inShadow).toBe(true);
    expect(sample.path).toContain('div.msg-card');
    expect(sample.path).toContain('div.outlet'); // the host, across the boundary
    expect(JSON.stringify(r)).not.toContain('SECRET');
    expect(JSON.stringify(r)).not.toContain('interop-outlet'); // ids are never reported
  });

  it('counts shadow roots and how many carry our sheet (the LinkedIn failure: roots=1, withSheet=0)', () => {
    const { doc, win, root } = shadowPage();
    expect(diagnose({ doc, win }).shadow).toEqual({ roots: 1, withSheet: 0 });

    const ours = doc.createElement('style');
    ours.setAttribute('data-uxx', 'shadow');
    root.insertBefore(ours, root.firstChild);
    expect(diagnose({ doc, win }).shadow).toEqual({ roots: 1, withSheet: 1 });
  });

  it('light-DOM elements are not flagged as inside a shadow root', () => {
    const p = page('<div class="plain" data-t="a" data-uxx-role="surface">x</div>', { a: { backgroundColor: 'rgb(255, 255, 255)' } });
    const sample = diagnose({ doc: p.doc, win: p.win }).reasons['role-overridden'].groups[0].sample;
    expect(sample.inShadow).toBe(false);
  });
});

describe('point probes and frames', () => {
  it('reports what stacks at chosen points: label, role and painted colours only', () => {
    const p = page(`<div class="widget" data-t="a" data-uxx-role="surface"><p class="in" data-t="b">SECRET-TEXT</p></div>`, {
      a: { backgroundColor: 'rgb(255, 255, 255)' },
      b: { color: 'rgb(0, 0, 0)' },
    });
    const el = (cls) => p.doc.querySelector(`.${cls}`);
    p.doc.elementsFromPoint = () => [el('in'), el('widget'), p.doc.body, p.doc.documentElement];
    const r = run(p);
    const stack = r.points.find((pt) => pt.name === 'bottom-right').stack;
    expect(stack[0]).toMatchObject({ label: 'p.in', color: 'rgb(0,0,0)' });
    expect(stack[1]).toMatchObject({ label: 'div.widget', role: 'surface', bg: 'rgb(255,255,255)' });
    expect(JSON.stringify(r)).not.toContain('SECRET');
  });

  it('lists iframes by host only, with size — never their URLs', () => {
    const p = page(`<iframe class="f" src="https://ads.example.net/secret/path?q=SECRET" width="300" height="250"></iframe>`);
    const r = run(p);
    expect(r.frames).toEqual([{ host: 'ads.example.net', w: 300, h: 250 }]);
    expect(JSON.stringify(r)).not.toContain('SECRET');
    expect(JSON.stringify(r)).not.toContain('/secret/path');
  });

  it('survives a document without elementsFromPoint', () => {
    const p = page('<p data-t="a">x</p>');
    delete p.doc.elementsFromPoint;
    expect(run(p).points.every((pt) => Array.isArray(pt.stack))).toBe(true);
  });
});

describe('low-contrast detector (rendered text vs effective painted background)', () => {
  it('flags dark-on-dark and ignores light-on-dark', () => {
    const p = page(
      `<div class="bad" data-t="a">x</div><div class="good" data-t="b">y</div>`,
      {
        a: { color: 'rgb(30, 30, 30)', backgroundColor: 'rgb(39, 40, 34)' },
        b: { color: 'rgb(248, 248, 242)', backgroundColor: 'rgb(39, 40, 34)' },
      },
    );
    const r = run(p);
    expect(groupKeys(r, 'low-contrast')).toEqual(['div.bad']);
    expect(r.reasons['low-contrast'].groups[0].sample.ratio).toBeLessThan(DIAG_LOW_CONTRAST);
  });

  it('composites ancestors: transparent child text is judged against the parent surface', () => {
    const p = page(`<section data-t="a"><p class="t" data-t="b">x</p></section>`, {
      a: { backgroundColor: 'rgb(255, 255, 255)' },
      b: { color: 'rgb(250, 250, 250)' },
    });
    expect(groupKeys(run(p), 'low-contrast')).toEqual(['p.t']);
  });

  it('makes no verdict when an image/gradient sits behind the text', () => {
    const p = page(`<div data-t="a"><p class="t" data-t="b">x</p></div>`, {
      a: { backgroundImage: 'url(x.png)' },
      b: { color: 'rgb(250, 250, 250)' },
    });
    expect(run(p).reasons['low-contrast']).toBeUndefined();
  });

  it('records whether the offender was themed (marked) or not', () => {
    const p = page(`<p class="t" data-t="a" data-uxx-role="text-primary">x</p>`, {
      a: { color: 'rgb(30, 30, 30)', backgroundColor: 'rgb(39, 40, 34)' },
    });
    const sample = run(p).reasons['low-contrast'].groups[0].sample;
    expect(sample.marked).toBe(true);
    expect(sample.role).toBe('text-primary');
  });
});

describe('on-demand rescan experiment (does a FULL pass theme what the incremental path missed?)', () => {
  function harness(extra = {}) {
    const p = page('<div class="w" data-t="a">hi</div>', { a: { backgroundColor: 'rgb(255, 255, 255)' } });
    const listeners = [];
    const api = { runtime: { onMessage: { addListener: (fn) => listeners.push(fn) } } };
    const state = { rescans: 0, idle: true };
    registerDiagnose(api, {
      doc: p.doc,
      win: p.win,
      version: 't',
      stats: () => ({ pending: 0, errors: 3, fromCache: true, firstErrors: ['x: boom'] }),
      rescan: () => {
        state.rescans += 1;
        // the full pass themes the element
        p.doc.querySelector('.w').setAttribute('data-uxx-role', 'surface');
      },
      idle: () => state.idle,
      ...extra,
    });
    return { p, handler: listeners[0], state };
  }

  it('reports BEFORE state + session stats, runs one rescan, then reports what changed', async () => {
    const { handler, state } = harness();
    const report = await handler({ type: DIAG_MESSAGE });
    expect(state.rescans).toBe(1);
    expect(report.session).toMatchObject({ errors: 3, fromCache: true });
    expect(report.totals.themed).toBe(0); // before: the white element was unthemed
    expect(report.afterRescan.totals.themed).toBe(1); // after the full pass it is
    expect(report.afterRescan.session.errors).toBe(3);
  });

  it('rescan:false skips the experiment (read-only report)', async () => {
    const { handler, state } = harness();
    const report = await handler({ type: DIAG_MESSAGE, rescan: false });
    expect(state.rescans).toBe(0);
    expect(report.afterRescan).toBeUndefined();
  });

  it('does not wait forever if the pipeline never settles', async () => {
    const { handler } = harness({ idle: () => false, rescanWaitMs: 150 });
    const t0 = Date.now();
    const report = await handler({ type: DIAG_MESSAGE });
    expect(Date.now() - t0).toBeLessThan(2000);
    expect(report.afterRescan.settled).toBe(false);
  });
});

describe('bounds and plumbing', () => {
  it('stops at maxElements and says so', () => {
    const many = Array.from({ length: 50 }, () => '<i data-t="a"></i>').join('');
    const r = run(page(many), { maxElements: 10 });
    expect(r.totals.truncated).toBe(true);
    expect(r.totals.elements).toBe(10);
  });

  it('registerDiagnose answers only the diagnose message, only in the top frame', async () => {
    const p = page('<p class="t" data-t="a">x</p>');
    const listeners = [];
    const api = { runtime: { onMessage: { addListener: (fn) => listeners.push(fn) } } };
    expect(registerDiagnose(api, { doc: p.doc, win: p.win, version: '9.9.9' })).toBe(true);
    const [handler] = listeners;
    expect(handler({ type: 'state' })).toBeUndefined();
    expect(handler(undefined)).toBeUndefined();
    const report = await handler({ type: DIAG_MESSAGE });
    expect(report.schema).toBe(DIAG_SCHEMA);
    expect(report.ext.version).toBe('9.9.9');

    const framed = { ...p.win, top: {} };
    const [h2] = (() => {
      const l = [];
      registerDiagnose({ runtime: { onMessage: { addListener: (fn) => l.push(fn) } } }, { doc: p.doc, win: framed });
      return l;
    })();
    expect(h2({ type: DIAG_MESSAGE })).toBeUndefined();
  });
});
