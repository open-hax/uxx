// SPDX-License-Identifier: GPL-3.0-or-later
// tests/palette.test.js — spec §5 (design §12 palette tier).

import { describe, expect, it } from 'vitest';
import { aggregate, isOurs } from '../src/lib/palette.js';
import { composite, parseColor } from '../src/lib/color.js';

const C = (hex) => parseColor(hex);

// Inverse WCAG linearization: opaque gray with the given relative luminance.
function grayWithLuminance(L) {
  const c = L <= 0.0031308 ? 12.92 * L : 1.055 * L ** (1 / 2.4) - 0.055;
  const v = c * 255;
  return { r: v, g: v, b: v, a: 1 };
}

const sample = (x, y, color, skipped = false) => ({ x, y, color, skipped });

describe('aggregate — grid sample stack compositing (top-down)', () => {
  it('a translucent hit composites over the previous opaque sample', () => {
    const grid = [
      sample(0, 0, C('#272822')),
      sample(1, 0, { r: 135, g: 139, b: 145, a: 0.5 }),
    ];
    const p = aggregate(grid, {}, {});
    expect(p.backgrounds.length).toBe(2);
    expect(p.backgrounds[0]).toEqual({ r: 0x27, g: 0x28, b: 0x22, a: 1 });
    // composite of the tint over the opaque beneath:
    const expected = composite({ r: 135, g: 139, b: 145, a: 0.5 }, C('#272822'));
    expect(p.backgrounds[1].r).toBeCloseTo(expected.r, 5);
    expect(p.backgrounds[1].g).toBeCloseTo(expected.g, 5);
    expect(p.backgrounds[1].b).toBeCloseTo(expected.b, 5);
    expect(p.backgrounds[1].a).toBe(1);
  });

  it('a leading translucent hit with nothing opaque beneath is not a sample', () => {
    const grid = [
      sample(0, 0, { r: 0, g: 0, b: 0, a: 0.6 }),
      sample(1, 0, C('#111111')),
    ];
    const p = aggregate(grid, {}, {});
    expect(p.backgrounds.length).toBe(1);
    expect(p.backgrounds[0]).toEqual({ r: 0x11, g: 0x11, b: 0x11, a: 1 });
  });

  it('translucent chains stack through each other', () => {
    const grid = [
      sample(0, 0, C('#272822')),
      sample(0, 1, { r: 255, g: 255, b: 255, a: 0.5 }),
      sample(0, 2, { r: 0, g: 0, b: 0, a: 0.5 }),
    ];
    const p = aggregate(grid, {}, {});
    expect(p.backgrounds.length).toBe(3);
    const two = composite({ r: 255, g: 255, b: 255, a: 0.5 }, C('#272822'));
    const three = composite({ r: 0, g: 0, b: 0, a: 0.5 }, two);
    expect(p.backgrounds[2].r).toBeCloseTo(three.r, 5);
    expect(p.backgrounds[2].a).toBe(1);
  });

  it('dominant first: the most frequent composite leads', () => {
    const grid = [
      sample(0, 0, C('#eeeeee')),
      sample(1, 0, C('#272822')),
      sample(2, 0, C('#eeeeee')),
    ];
    const p = aggregate(grid, {}, {});
    expect(p.backgrounds[0]).toEqual({ r: 0xee, g: 0xee, b: 0xee, a: 1 });
    expect(p.backgrounds.length).toBe(2);
  });
});

describe('aggregate — miss/skip drops', () => {
  it('null colors and skipped samples are dropped', () => {
    const grid = [
      sample(0, 0, null),
      sample(1, 0, C('#272822'), true),
      sample(2, 0, undefined),
      { x: 3, y: 0 }, // malformed: no color key at all
    ];
    const p = aggregate(grid, {}, {});
    expect(p.backgrounds).toEqual([]);
  });

  it('off-viewport/img hits arrive as null colors and drop (probe contract)', () => {
    const grid = [sample(0, 0, null), sample(1, 0, null), sample(2, 0, C('#34352f'))];
    const p = aggregate(grid, {}, {});
    expect(p.backgrounds).toEqual([{ r: 0x34, g: 0x35, b: 0x2f, a: 1 }]);
  });
});

describe('aggregate — appearance verdict', () => {
  it('median L < 0.5 → dark; = 0.5 → light (boundary)', () => {
    expect(aggregate([sample(0, 0, grayWithLuminance(0.4999))], {}, {}).appearance).toBe('dark');
    expect(aggregate([sample(0, 0, grayWithLuminance(0.5))], {}, {}).appearance).toBe('light');
    expect(aggregate([sample(0, 0, grayWithLuminance(0.5001))], {}, {}).appearance).toBe('light');
  });

  it('median, not mean: a dark majority beats a bright outlier', () => {
    const grid = [
      sample(0, 0, grayWithLuminance(0.1)),
      sample(1, 0, grayWithLuminance(0.15)),
      sample(2, 0, grayWithLuminance(0.9)),
    ];
    expect(aggregate(grid, {}, {}).appearance).toBe('dark');
  });

  it('empty harvest → dark with empty lists (round-4 N3 empty-harvest case)', () => {
    const p = aggregate([], {}, {});
    expect(p.appearance).toBe('dark');
    expect(p.backgrounds).toEqual([]);
    expect(p.textColors).toEqual([]);
    expect(p.borderColors).toEqual([]);
    expect(p.linkColors).toEqual([]);
    expect(p.accents).toEqual([]);
    // (§4.1: the content layer falls back to the pack's
    // colors.background.default luminance for pageLuminance here.)
  });
});

describe('aggregate — distinctness dedup (ΔE2000 ≤ 1 collapses)', () => {
  it('near-identical harvested colors collapse to the first', () => {
    const p = aggregate(
      [],
      { textColors: [C('#f8f8f2'), C('#f7f7f1'), C('#cccccc')] },
      {},
    );
    expect(p.textColors.length).toBe(2);
    expect(p.textColors[0]).toEqual({ r: 0xf8, g: 0xf8, b: 0xf2, a: 1 });
    expect(p.textColors[1]).toEqual({ r: 0xcc, g: 0xcc, b: 0xcc, a: 1 });
  });

  it('near-identical grid composites collapse and their counts add', () => {
    const grid = [
      sample(0, 0, C('#272822')),
      sample(1, 0, C('#272823')),
      sample(2, 0, C('#272822')),
    ];
    const p = aggregate(grid, {}, {});
    expect(p.backgrounds.length).toBe(1);
    expect(p.backgrounds[0]).toEqual({ r: 0x27, g: 0x28, b: 0x22, a: 1 });
  });

  it('all harvested channels dedupe and keep first-seen order', () => {
    const p = aggregate(
      [],
      {
        textColors: [C('#aaaaaa'), C('#a9a9a9')],
        borderColors: [C('#333333'), C('#323232')],
        linkColors: [C('#a6e22e'), C('#a5e12d')],
        accents: [C('#66d9ef'), C('#65d8ee')],
      },
      {},
    );
    expect(p.textColors).toEqual([{ r: 0xaa, g: 0xaa, b: 0xaa, a: 1 }]);
    expect(p.borderColors).toEqual([{ r: 0x33, g: 0x33, b: 0x33, a: 1 }]);
    expect(p.linkColors).toEqual([{ r: 0xa6, g: 0xe2, b: 0x2e, a: 1 }]);
    expect(p.accents).toEqual([{ r: 0x66, g: 0xd9, b: 0xef, a: 1 }]);
  });
});

describe('aggregate — harvested merge & cssVars', () => {
  it('grid composites come first; harvested backgrounds merge stably behind ties', () => {
    const grid = [sample(0, 0, C('#272822'))];
    const p = aggregate(grid, { backgrounds: [C('#414339')] }, {});
    expect(p.backgrounds).toEqual([
      { r: 0x27, g: 0x28, b: 0x22, a: 1 },
      { r: 0x41, g: 0x43, b: 0x39, a: 1 },
    ]);
  });

  it('count ties keep grid-first order; duplicates make dominance unambiguous', () => {
    const grid = [sample(0, 0, C('#272822'))];
    const p = aggregate(grid, { backgrounds: [C('#414339')] }, {});
    // counts tie at 1 each → first-seen (grid) leads:
    expect(p.backgrounds[0]).toEqual({ r: 0x27, g: 0x28, b: 0x22, a: 1 });
    // now with a duplicated grid sample the grid color clearly dominates:
    const p2 = aggregate([sample(0, 0, C('#272822')), sample(1, 0, C('#272822'))], { backgrounds: [C('#414339')] }, {});
    expect(p2.backgrounds[0]).toEqual({ r: 0x27, g: 0x28, b: 0x22, a: 1 });
  });

  it('cssVars pass through as-is', () => {
    const vars = { '--page-bg': C('#272822'), '--accent': C('#a6e22e') };
    const p = aggregate([], {}, vars);
    expect(p.cssVars).toEqual(vars);
  });

  it('appearance reflects the merged background list', () => {
    const p = aggregate([], { backgrounds: [grayWithLuminance(0.8)] }, {});
    expect(p.appearance).toBe('light');
  });
});

describe('isOurs (spec §5 — exposed for tests, not the hot path)', () => {
  it('exact parsed comparison with alpha', () => {
    expect(isOurs(C('#272822'), ['#272822', '#f8f8f2'])).toBe(true);
    expect(isOurs(C('#f8f8f2'), ['#272822', '#f8f8f2'])).toBe(true);
    expect(isOurs(C('#272823'), ['#272822'])).toBe(false);
    expect(isOurs({ r: 0, g: 0, b: 0, a: 0.5 }, ['rgba(0, 0, 0, 1)'])).toBe(false);
    expect(isOurs({ r: 0, g: 0, b: 0, a: 0.5 }, ['rgba(0, 0, 0, 0.5)'])).toBe(true);
    expect(isOurs(null, ['#272822'])).toBe(false);
  });
});
