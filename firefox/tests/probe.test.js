// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/probe.test.js — §7 coverage (design §5/§6/§10): fact shape for each
// tag family; skip nulls for img/canvas/video and mix-blend-mode subtrees
// (no style reads inside the skipped subtree); hasOurs propagation; grid
// sample cap 16; size-class edges; cssVars collection incl. SecurityError
// drop; harvest dedup.

import { describe, it, expect, beforeEach } from 'vitest';
import { createProbe, GRID_CELL_PX } from '../src/content/probe.js';

// ── the injected getComputedStyle resolver seam ──────────────────────────
const styleMap = new Map();
let styleReads = [];
const resolver = (node) => {
  styleReads.push(node);
  return styleMap.get(node) || {};
};

const BASE_STYLE = {
  display: 'block',
  visibility: 'visible',
  position: 'static',
  backgroundColor: 'rgb(39, 40, 34)',
  backgroundImage: 'none',
  color: 'rgb(248, 248, 242)',
  mixBlendMode: 'normal',
  filter: 'none',
  backdropFilter: 'none',
  fontSize: '16px',
  fontWeight: '400',
  outlineStyle: 'none',
  outlineWidth: '0px',
  borderTopWidth: '0px',
  borderRightWidth: '0px',
  borderBottomWidth: '0px',
  borderLeftWidth: '0px',
  borderTopColor: 'rgb(0, 0, 0)',
  borderRightColor: 'rgb(0, 0, 0)',
  borderBottomColor: 'rgb(0, 0, 0)',
  borderLeftColor: 'rgb(0, 0, 0)',
};

function styled(node, overrides = {}) {
  styleMap.set(node, { ...BASE_STYLE, ...overrides });
  return node;
}

function makeEl(tag, attrs = {}, rect = { x: 0, y: 0, w: 100, h: 20 }) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.getBoundingClientRect = () => ({
    left: rect.x,
    top: rect.y,
    width: rect.w,
    height: rect.h,
  });
  return node;
}

function makeWin(overrides = {}) {
  return {
    innerWidth: 1024,
    innerHeight: 768,
    matchMedia: () => ({ matches: false }),
    ...overrides,
  };
}

function makeProbe(win = makeWin(), doc = document) {
  return createProbe({ doc, win, getComputedStyle: resolver });
}

beforeEach(() => {
  styleMap.clear();
  styleReads = [];
  document.body.innerHTML = '';
  delete document.elementFromPoint;
});

describe('readFact — fact shape', () => {
  it('emits the §4.1 fact shape for a div', () => {
    const div = makeEl('div');
    styled(div);
    const fact = makeProbe().readFact(div);

    expect(fact).not.toBeNull();
    expect(fact.isRoot).toBe(false);
    expect(fact.tag).toBe('div');
    expect(fact.type).toBeNull();
    expect(fact.ariaRole).toBeNull();
    expect(fact.display).toBe('block');
    expect(fact.attrs).toEqual({
      popover: false,
      ariaModal: false,
      ariaInvalid: null,
      ariaDisabled: false,
      ariaCurrent: null,
      dataSemantic: null,
      href: false,
    });
    expect(fact.background).toEqual({
      color: { r: 39, g: 40, b: 34, a: 1 },
      hasImage: false,
      isGradient: false,
    });
    expect(fact.border).toEqual({ widthPx: 0, color: null });
    expect(fact.color).toEqual({ r: 248, g: 248, b: 242, a: 1 });
    expect(fact.fontSizePx).toBe(16);
    expect(fact.fontWeight).toBe(400);
    expect(fact.rect).toEqual({ x: 0, y: 0, w: 100, h: 20 });
    expect(fact.viewport).toEqual({ w: 1024, h: 768 });
    expect(fact.position).toBe('static');
    expect(fact.blendMode).toBe('normal');
    expect(fact.filter).toBe('none');
    expect(fact.backdropFilter).toBe('none');
    expect(fact.isSvg).toBe(false);
    expect(fact.svgBBox).toBeNull();
    expect(fact.hasOurs).toBe(false);
    expect(fact.visible).toBe(true);
    expect(fact.isPlaceholder).toBe(false);
    expect(fact.hasOutlineFocus).toBe(false);
    expect(fact.isFocused).toBe(false);
    expect(fact.inlineImportant).toEqual([]);
    expect(fact.isTopmost).toBe(false);
  });

  it('flags isRoot for documentElement and body', () => {
    const probe = makeProbe();
    styled(document.documentElement);
    styled(document.body);
    expect(probe.readFact(document.documentElement).isRoot).toBe(true);
    expect(probe.readFact(document.body).isRoot).toBe(true);
  });

  it('reads per-tag-family facts (input type, a[href], aria + popover attrs)', () => {
    const probe = makeProbe();
    const input = makeEl('input', { type: 'TEXT' });
    styled(input);
    const inputFact = probe.readFact(input);
    expect(inputFact.tag).toBe('input');
    expect(inputFact.type).toBe('text'); // lowercased

    const anchor = makeEl('a', { href: '#x', role: 'link', 'aria-current': 'page', 'data-semantic': 'error' });
    styled(anchor);
    const anchorFact = probe.readFact(anchor);
    expect(anchorFact.attrs.href).toBe(true);
    expect(anchorFact.ariaRole).toBe('link');
    expect(anchorFact.attrs.ariaCurrent).toBe('page');
    expect(anchorFact.attrs.dataSemantic).toBe('error');

    const dialog = makeEl('div', { popover: '', 'aria-modal': 'true', 'aria-invalid': 'true', 'aria-disabled': 'true' });
    styled(dialog);
    const dialogFact = probe.readFact(dialog);
    expect(dialogFact.attrs.popover).toBe(true);
    expect(dialogFact.attrs.ariaModal).toBe(true);
    expect(dialogFact.attrs.ariaInvalid).toBe('true');
    expect(dialogFact.attrs.ariaDisabled).toBe(true);
  });

  it('records the widest visible border side', () => {
    const div = makeEl('div');
    styled(div, {
      borderTopWidth: '1px',
      borderRightWidth: '3px',
      borderBottomWidth: '2px',
      borderLeftWidth: '0px',
      borderRightColor: 'rgb(52, 53, 47)',
    });
    const fact = makeProbe().readFact(div);
    expect(fact.border).toEqual({ widthPx: 3, color: { r: 52, g: 53, b: 47, a: 1 } });
  });

  it('records gradient backgrounds as isGradient (design §6 skip)', () => {
    const div = makeEl('div');
    styled(div, { backgroundImage: 'linear-gradient(red, blue)' });
    const fact = makeProbe().readFact(div);
    expect(fact.background.hasImage).toBe(true);
    expect(fact.background.isGradient).toBe(true);
  });

  it('records inline-!important properties', () => {
    const div = makeEl('div');
    styled(div);
    div.style.setProperty('color', 'red', 'important');
    div.style.setProperty('background-color', 'blue', 'important');
    div.style.setProperty('border-color', 'lime'); // no !important — not recorded
    const fact = makeProbe().readFact(div);
    expect(fact.inlineImportant).toContain('color');
    expect(fact.inlineImportant).toContain('background-color');
    expect(fact.inlineImportant).not.toContain('border-color');
  });

  it('parses SVG fill/stroke into background.color/color', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 16, height: 16 });
    styled(svg, { fill: 'rgb(230, 219, 116)', stroke: 'rgb(166, 226, 46)' });
    const fact = makeProbe().readFact(svg);
    expect(fact.isSvg).toBe(true);
    expect(fact.background.color).toEqual({ r: 230, g: 219, b: 116, a: 1 });
    expect(fact.color).toEqual({ r: 166, g: 226, b: 46, a: 1 });
  });

  it('records hasOutlineFocus from outlineStyle/outlineWidth', () => {
    const div = makeEl('div');
    styled(div, { outlineStyle: 'solid', outlineWidth: '2px' });
    expect(makeProbe().readFact(div).hasOutlineFocus).toBe(true);
  });

  it('isTopmost via elementFromPoint for fixed overlays (review F18)', () => {
    const probe = makeProbe();
    const fixed = makeEl('div', {}, { x: 0, y: 0, w: 1024, h: 768 });
    styled(fixed, { position: 'fixed' });
    document.elementFromPoint = () => fixed;
    expect(probe.readFact(fixed).isTopmost).toBe(true);

    const child = makeEl('span');
    styled(child);
    fixed.appendChild(child);
    document.elementFromPoint = () => child;
    expect(probe.readFact(fixed).isTopmost).toBe(true); // descendant hit counts

    const other = makeEl('section');
    styled(other);
    document.elementFromPoint = () => other;
    expect(probe.readFact(fixed).isTopmost).toBe(false);
  });
});

describe('readFact — skip list (design §6/§10)', () => {
  it('returns null for img/canvas/video', () => {
    const probe = makeProbe();
    for (const tag of ['img', 'canvas', 'video']) {
      const node = makeEl(tag);
      styled(node);
      expect(probe.readFact(node), tag).toBeNull();
    }
  });

  it('returns null for mix-blend-mode / backdrop-filter / filter subtrees WITHOUT reading descendants', () => {
    const probe = makeProbe();
    const blended = makeEl('div');
    styled(blended, { mixBlendMode: 'multiply' });
    const child = makeEl('span');
    styled(child);
    blended.appendChild(child);

    styleReads = [];
    expect(probe.readFact(blended)).toBeNull();
    // Only the blended element's own style was read — no descendant reads.
    expect(styleReads).toEqual([blended]);

    const filtered = makeEl('div');
    styled(filtered, { filter: 'blur(2px)' });
    expect(probe.readFact(filtered)).toBeNull();

    const backdrop = makeEl('div');
    styled(backdrop, { backdropFilter: 'blur(4px)' });
    expect(probe.readFact(backdrop)).toBeNull();
  });

  it('propagates hasOurs for data-uxx* attributes', () => {
    const probe = makeProbe();
    const marked = makeEl('div', { 'data-uxx-role': 'surface', 'data-uxx-contrast': 'exception' });
    styled(marked);
    expect(probe.readFact(marked).hasOurs).toBe(true);

    const plain = makeEl('div', { 'data-other': 'x' });
    styled(plain);
    expect(probe.readFact(plain).hasOurs).toBe(false);
  });
});

describe('sampleViewportGrid', () => {
  it('caps at 4x4 = 16 samples with cell-center geometry (round-3 m5)', () => {
    const probe = createProbe({
      doc: document,
      win: makeWin({ innerWidth: 4096, innerHeight: 4096 }),
      getComputedStyle: resolver,
    });
    const hit = makeEl('div');
    styled(hit, { backgroundColor: 'rgb(30, 31, 28)' });
    document.elementFromPoint = () => hit;

    const samples = probe.sampleViewportGrid();
    expect(samples).toHaveLength(16);
    expect(GRID_CELL_PX).toBe(256);
    // Cell centers at (i + 0.5) * (vw / cols); cols vary fastest within rows.
    expect(samples.map((s) => s.x)).toEqual(
      Array.from({ length: 4 }, () => [512, 1536, 2560, 3584]).flat(),
    );
    expect(samples.every((s) => s.color && s.color.r === 30)).toBe(true);
    expect(samples.every((s) => s.skipped === false)).toBe(true);
  });

  it('shrinks the grid for small viewports (still ≤16)', () => {
    const probe = createProbe({
      doc: document,
      win: makeWin({ innerWidth: 300, innerHeight: 200 }),
      getComputedStyle: resolver,
    });
    const hit = makeEl('div');
    styled(hit, { backgroundColor: 'rgb(30, 31, 28)' });
    document.elementFromPoint = () => hit;
    const samples = probe.sampleViewportGrid();
    // cols = min(4, ceil(300/256)) = 2, rows = min(4, ceil(200/256)) = 1.
    expect(samples).toHaveLength(2);
    expect(samples.map((s) => s.x)).toEqual([75, 225]);
  });

  it('drops misses, off-viewport, img hits and unparsable colors as skipped', () => {
    const probe = createProbe({
      doc: document,
      win: makeWin({ innerWidth: 300, innerHeight: 200 }),
      getComputedStyle: resolver,
    });
    const img = makeEl('img');
    styled(img);
    document.elementFromPoint = () => img;
    const samples = probe.sampleViewportGrid();
    expect(samples).toHaveLength(2);
    expect(samples.every((s) => s.color === null)).toBe(true);
    expect(samples.every((s) => s.skipped === true)).toBe(true);

    document.elementFromPoint = () => null;
    expect(probe.sampleViewportGrid()[0].skipped).toBe(true);
  });
});

describe('harvest', () => {
  const baseFact = () => ({
    hasOurs: false,
    color: { r: 166, g: 226, b: 46, a: 1 },
    border: { widthPx: 1, color: { r: 70, g: 71, b: 65, a: 1 } },
    attrs: { href: true },
    background: { color: { r: 39, g: 40, b: 34, a: 1 }, hasImage: false, isGradient: false },
  });

  it('harvests text/border/link/accent/background colors from a fact', () => {
    const probe = makeProbe();
    const out = probe.harvest(baseFact());
    expect(out.textColors).toEqual([{ r: 166, g: 226, b: 46, a: 1 }]);
    expect(out.borderColors).toEqual([{ r: 70, g: 71, b: 65, a: 1 }]);
    expect(out.linkColors).toEqual([{ r: 166, g: 226, b: 46, a: 1 }]);
    expect(out.accents).toEqual([{ r: 166, g: 226, b: 46, a: 1 }]); // s ≥ 0.35
    expect(out.backgrounds).toEqual([{ r: 39, g: 40, b: 34, a: 1 }]);
  });

  it('dedupes across calls (returns only new colors)', () => {
    const probe = makeProbe();
    probe.harvest(baseFact());
    const second = probe.harvest(baseFact());
    expect(second.textColors).toHaveLength(0);
    expect(second.borderColors).toHaveLength(0);
    expect(second.linkColors).toHaveLength(0);
    expect(second.accents).toHaveLength(0);
    expect(second.backgrounds).toHaveLength(0);
  });

  it('skips hasOurs facts (self-contamination guard)', () => {
    const probe = makeProbe();
    const fact = baseFact();
    fact.hasOurs = true;
    const out = probe.harvest(fact);
    expect(out.textColors).toHaveLength(0);
    expect(out.backgrounds).toHaveLength(0);
  });

  it('does not harvest neutral text as accent', () => {
    const probe = makeProbe();
    const fact = baseFact();
    fact.color = { r: 144, g: 144, b: 138, a: 1 }; // #90908a, s < 0.35
    const out = probe.harvest(fact);
    expect(out.accents).toHaveLength(0);
    expect(out.textColors).toHaveLength(1);
  });
});

describe('collectCssVars', () => {
  it('collects custom properties whose values parse as colors, from every rule', () => {
    const fakeRule = {
      style: {
        length: 3,
        item: (i) => ['--my-color', '--not-color', 'color'][i],
        getPropertyValue: (name) =>
          ({ '--my-color': '#ff0000', '--not-color': '10px', color: '#00ff00' }[name]),
      },
      cssRules: [
        {
          style: {
            length: 1,
            item: (i) => ['--nested-color'][i],
            getPropertyValue: () => 'rgba(0, 255, 0, 0.5)',
          },
          cssRules: [],
        },
      ],
    };
    const fakeDoc = {
      styleSheets: [{ cssRules: [fakeRule] }],
      documentElement: { style: null },
    };
    const probe = createProbe({ doc: fakeDoc, win: makeWin(), getComputedStyle: resolver });
    const out = probe.collectCssVars();
    expect(out['--my-color']).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(out['--nested-color']).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
    expect(out['--not-color']).toBeUndefined(); // not a color
    expect(out.color).toBeUndefined(); // plain property, not custom
  });

  it('drops cross-origin sheets on SecurityError — not fatal (design §5(d))', () => {
    const evilSheet = {
      get cssRules() {
        throw new Error('SecurityError');
      },
    };
    const okRule = {
      style: {
        length: 1,
        item: (i) => ['--ok'][i],
        getPropertyValue: () => '#123456',
      },
      cssRules: [],
    };
    const fakeDoc = {
      styleSheets: [evilSheet, { cssRules: [okRule] }],
      documentElement: { style: null },
    };
    const probe = createProbe({ doc: fakeDoc, win: makeWin(), getComputedStyle: resolver });
    const out = probe.collectCssVars();
    expect(out['--ok']).toEqual({ r: 0x12, g: 0x34, b: 0x56, a: 1 });
  });

  it('collects documentElement inline custom properties (review F8: no :root restriction)', () => {
    document.documentElement.style.setProperty('--inline-color', '#00ff00');
    document.documentElement.style.setProperty('--inline-size', '10px');
    const probe = makeProbe();
    const out = probe.collectCssVars();
    expect(out['--inline-color']).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(out['--inline-size']).toBeUndefined();
    document.documentElement.style.removeProperty('--inline-color');
    document.documentElement.style.removeProperty('--inline-size');
  });
});

describe('measureSizeClass (spec §3 edges)', () => {
  const probe = makeProbe();
  it('pins the WCAG large-text boundary', () => {
    expect(probe.measureSizeClass({ fontSizePx: 23.9, fontWeight: 400 })).toBe('normal');
    expect(probe.measureSizeClass({ fontSizePx: 24, fontWeight: 400 })).toBe('large');
    expect(probe.measureSizeClass({ fontSizePx: 18.65, fontWeight: 700 })).toBe('normal');
    expect(probe.measureSizeClass({ fontSizePx: 18.66, fontWeight: 700 })).toBe('large');
    expect(probe.measureSizeClass({ fontSizePx: 18.66, fontWeight: 400 })).toBe('normal');
  });
});

describe('prefersContrastMore', () => {
  it('reads win.matchMedia(prefers-contrast: more)', () => {
    const yes = makeProbe(makeWin({ matchMedia: () => ({ matches: true }) }));
    expect(yes.prefersContrastMore()).toBe(true);
    const no = makeProbe(makeWin({ matchMedia: () => ({ matches: false }) }));
    expect(no.prefersContrastMore()).toBe(false);
    const missing = makeProbe(makeWin({ matchMedia: undefined }));
    expect(missing.prefersContrastMore()).toBe(false);
  });
});
