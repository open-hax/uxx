// SPDX-License-Identifier: GPL-3.0-or-later
// tests/color.test.js — spec §3 vectors (design §12 color tier).

import { describe, expect, it } from 'vitest';
import {
  NAMED_COLORS,
  composite,
  contrast,
  deltaE2000,
  deltaE2000Lab,
  formatColor,
  hueBucket,
  isTransparent,
  luminance,
  parseColor,
  rgbToLab,
  sameColor,
  sizeClassOf,
  thresholdFor,
  toHsl,
} from '../src/lib/color.js';

const C = (hex) => parseColor(hex);

describe('parseColor', () => {
  it('parses #rgb', () => {
    expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor('#abc')).toEqual({ r: 170, g: 187, b: 204, a: 1 });
  });

  it('parses #rgba (4-digit)', () => {
    const c = parseColor('#f008');
    expect(c.r).toBe(255);
    expect(c.a).toBeCloseTo(0x88 / 255, 5);
  });

  it('parses #rrggbb', () => {
    expect(parseColor('#272822')).toEqual({ r: 0x27, g: 0x28, b: 0x22, a: 1 });
    expect(parseColor('#F8F8F2')).toEqual({ r: 0xf8, g: 0xf8, b: 0xf2, a: 1 });
  });

  it('parses #rrggbbaa', () => {
    const c = parseColor('#66d9ef26');
    expect(c.r).toBe(0x66);
    expect(c.g).toBe(0xd9);
    expect(c.b).toBe(0xef);
    expect(c.a).toBeCloseTo(0x26 / 255, 5);
  });

  it('parses rgb()/rgba() comma syntax', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor('rgba(135,139,145,0.5)')).toEqual({ r: 135, g: 139, b: 145, a: 0.5 });
  });

  it('parses rgb() space syntax and slash alpha', () => {
    expect(parseColor('rgb(102 217 239)')).toEqual({ r: 102, g: 217, b: 239, a: 1 });
    expect(parseColor('rgb(102 217 239 / 0.15)')).toEqual({ r: 102, g: 217, b: 239, a: 0.15 });
    expect(parseColor('rgb(0 0 0 / 60%)')).toEqual({ r: 0, g: 0, b: 0, a: 0.6 });
  });

  it('parses percentage channels', () => {
    const c = parseColor('rgb(100%, 0%, 50%)');
    expect(c.r).toBe(255);
    expect(c.g).toBe(0);
    expect(c.b).toBeCloseTo(127.5, 5);
    const d = parseColor('rgb(100% 0% 0% / 50%)');
    expect(d.a).toBe(0.5);
  });

  it('parses hsl()/hsla() comma, space, slash, and deg syntax', () => {
    const red = { r: 255, g: 0, b: 0, a: 1 };
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual(red);
    expect(parseColor('hsl(0 100% 50%)')).toEqual(red);
    expect(parseColor('hsl(0deg 100% 50%)')).toEqual(red);
    expect(parseColor('hsla(0, 100%, 50%, 0.5)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(parseColor('hsl(0 100% 50% / 50%)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    const cyan = parseColor('hsl(180 100% 50%)');
    expect(cyan.r).toBeCloseTo(0, 5);
    expect(cyan.g).toBeCloseTo(255, 5);
    expect(cyan.b).toBeCloseTo(255, 5);
  });

  it('parses transparent', () => {
    expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it('parses the full CSS named-color table', () => {
    expect(Object.keys(NAMED_COLORS).length).toBe(148);
    for (const [name, hex] of Object.entries(NAMED_COLORS)) {
      expect(hex, `value for ${name}`).toMatch(/^#[0-9a-f]{6}$/);
      expect(parseColor(name), `parses ${name}`).not.toBeNull();
    }
    expect(parseColor('rebeccapurple')).toEqual({ r: 0x66, g: 0x33, b: 0x99, a: 1 });
    expect(parseColor('LightGoldenrodYellow')).toEqual({ r: 0xfa, g: 0xfa, b: 0xd2, a: 1 });
    expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    // 'transparent' is not a named color per se but parses; ensure it is not
    // polluting the named table itself.
    expect(NAMED_COLORS.transparent).toBeUndefined();
  });

  it('returns null for anything else', () => {
    for (const bad of ['', 'nope', '#12', '#1234567', '#gg0000', 'rgb(1,2)', 'hsl(1,2)',
      'currentColor', 'inherit', 'initial', 'unset', 'none', 'var(--x)', 'rgb(a,b,c)',
      'hsl(0 100 50)', 42, null, undefined, {}]) {
      expect(parseColor(bad), `rejects ${String(bad)}`).toBeNull();
    }
  });
});

describe('formatColor', () => {
  it('rounds ints and trims alpha', () => {
    expect(formatColor({ r: 10.4, g: 20.6, b: 30.5, a: 1 })).toBe('rgba(10, 21, 31, 1)');
    expect(formatColor({ r: 0, g: 0, b: 0, a: 0.5 })).toBe('rgba(0, 0, 0, 0.5)');
    expect(formatColor({ r: 135, g: 139, b: 145, a: 0.15 })).toBe('rgba(135, 139, 145, 0.15)');
  });

  it('rounds alpha to 3 decimals', () => {
    expect(formatColor({ r: 1, g: 2, b: 3, a: 0.15000000000000002 })).toBe('rgba(1, 2, 3, 0.15)');
  });
});

describe('isTransparent', () => {
  it('is a === 0', () => {
    expect(isTransparent({ r: 1, g: 2, b: 3, a: 0 })).toBe(true);
    expect(isTransparent({ r: 1, g: 2, b: 3, a: 0.001 })).toBe(false);
  });
});

describe('composite', () => {
  it('source-over: result alpha = fg.a + bg.a*(1-fg.a)', () => {
    const r = composite({ r: 135, g: 139, b: 145, a: 0.5 }, C('#414339'));
    expect(r.a).toBe(1);
    expect(r.r).toBeCloseTo(100, 5);
    expect(r.g).toBeCloseTo(103, 5);
    expect(r.b).toBeCloseTo(101, 5);
  });

  it('handles two translucent layers', () => {
    const r = composite({ r: 255, g: 255, b: 255, a: 0.5 }, { r: 0, g: 0, b: 0, a: 0.5 });
    expect(r.a).toBe(0.75);
    expect(r.r).toBeCloseTo((255 * 0.5 + 0 * 0.5 * 0.5) / 0.75, 5);
  });

  it('fully transparent fg over opaque bg yields bg', () => {
    const bg = C('#272822');
    const r = composite({ r: 255, g: 0, b: 0, a: 0 }, bg);
    expect(r.r).toBeCloseTo(0x27, 5);
    expect(r.a).toBe(1);
  });
});

describe('luminance (WCAG 2.x linearized)', () => {
  it('matches known values', () => {
    expect(luminance(C('#ffffff'))).toBeCloseTo(1, 5);
    expect(luminance(C('#000000'))).toBeCloseTo(0, 5);
    expect(luminance(C('#272822'))).toBeCloseTo(0.0206, 3);
  });

  it('follows the linearized formula, NOT getSRGBLightness', () => {
    // Known-bad shortcut counterexample (design §12): #808080 has sRGB
    // lightness 0.502 but WCAG relative luminance ≈ 0.2159. The shortcut
    // disagrees; our function must follow the linearized value.
    const gray = C('#808080');
    const shortcut = (gray.r + gray.g + gray.b) / (3 * 255); // ≈ 0.502
    expect(luminance(gray)).toBeCloseTo(0.2159, 3);
    expect(Math.abs(luminance(gray) - shortcut)).toBeGreaterThan(0.25);
    // Contrast consequence: linearized contrast(#808080, #000) ≈ 5.32,
    // the shortcut would claim ≈ 11.04.
    expect(contrast(gray, C('#000000'))).toBeCloseTo(5.32, 1);
    expect(contrast(gray, C('#000000'))).toBeLessThan(6);
  });
});

describe('contrast — W3C WCAG reference pairs', () => {
  it('#777777 vs #ffffff = 4.48, #767676 vs #ffffff = 4.54', () => {
    expect(contrast(C('#777777'), C('#ffffff'))).toBeCloseTo(4.48, 2);
    expect(contrast(C('#767676'), C('#ffffff'))).toBeCloseTo(4.54, 2);
    // The 4.5 boundary these two straddle:
    expect(contrast(C('#777777'), C('#ffffff'))).toBeLessThan(4.5);
    expect(contrast(C('#767676'), C('#ffffff'))).toBeGreaterThan(4.5);
  });

  it('is symmetric and ≥ 1', () => {
    const a = C('#f8f8f2');
    const b = C('#272822');
    expect(contrast(a, b)).toBeCloseTo(contrast(b, a), 10);
    expect(contrast(a, b)).toBeGreaterThanOrEqual(1);
  });
});

describe('contrast — arithmetic pins (fail loudly if a token moves)', () => {
  it('text.default vs button-primary.bg = 4.60:1 (binding text-pool case)', () => {
    expect(contrast(C('#f8f8f2'), C('#75715e'))).toBeCloseTo(4.60, 2);
    expect(contrast(C('#f8f8f2'), C('#75715e'))).toBeGreaterThanOrEqual(4.5);
  });

  it('text.default vs button-danger.bg = 3.55:1 (< 4.5 → pool exhaustion)', () => {
    expect(contrast(C('#f8f8f2'), C('#f92672'))).toBeCloseTo(3.55, 2);
    expect(contrast(C('#f8f8f2'), C('#f92672'))).toBeLessThan(4.5);
  });

  it('selection.default over input-surface vs text.default = 5.37:1 (passes 4.5, fails 7)', () => {
    const resolvedBg = composite(C('rgba(135, 139, 145, 0.5)'), C('#414339'));
    const ratio = contrast(C('#f8f8f2'), resolvedBg);
    expect(ratio).toBeCloseTo(5.37, 1);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeLessThan(7);
  });

  it('::placeholder text.soft on input-surface = 3.14:1; on page bg = 4.63:1', () => {
    expect(contrast(C('#90908a'), C('#414339'))).toBeCloseTo(3.14, 1);
    expect(contrast(C('#90908a'), C('#272822'))).toBeCloseTo(4.63, 2);
  });

  it('border.focus vs surface = 4.06:1, vs elevated = 3.59:1 (M1 non-text pins)', () => {
    expect(contrast(C('#99947c'), C('#34352f'))).toBeCloseTo(4.06, 2);
    expect(contrast(C('#99947c'), C('#3e3d32'))).toBeCloseTo(3.59, 2);
    // Both fail 4.5 — the nonText 3:1 channel is load-bearing:
    expect(contrast(C('#99947c'), C('#34352f'))).toBeLessThan(4.5);
    expect(contrast(C('#99947c'), C('#3e3d32'))).toBeLessThan(4.5);
  });
});

describe('toHsl', () => {
  it('converts primaries and grays', () => {
    expect(toHsl(C('#ff0000'))).toEqual({ h: 0, s: 1, l: 0.5 });
    const green = toHsl(C('#00ff00'));
    expect(green.h).toBeCloseTo(120, 5);
    expect(green.s).toBeCloseTo(1, 5);
    const gray = toHsl(C('#808080'));
    expect(gray.s).toBeCloseTo(0, 5);
    expect(gray.h).toBe(0);
  });

  it('recovers hsl() round trips', () => {
    const c = parseColor('hsl(200 40% 60%)');
    const hsl = toHsl(c);
    expect(hsl.h).toBeCloseTo(200, 1);
    expect(hsl.s).toBeCloseTo(0.4, 2);
    expect(hsl.l).toBeCloseTo(0.6, 2);
  });
});

describe('hueBucket — §8.4 table exactly', () => {
  const bucket = (h, s = 1) => hueBucket(parseColor(`hsl(${h} ${s * 100}% 50%)`));

  it('edge vectors at every boundary', () => {
    expect(bucket(0)).toBe('red');
    expect(bucket(14.99)).toBe('red');
    expect(bucket(15)).toBe('orange');
    expect(bucket(44.99)).toBe('orange');
    expect(bucket(45)).toBe('yellow');
    expect(bucket(69.99)).toBe('yellow');
    expect(bucket(70)).toBe('green');
    expect(bucket(164.99)).toBe('green');
    expect(bucket(165)).toBe('cyan-blue');
    expect(bucket(259.99)).toBe('cyan-blue');
    expect(bucket(260)).toBe('purple-magenta');
    expect(bucket(344.99)).toBe('purple-magenta');
    expect(bucket(345)).toBe('red');
    expect(bucket(359.99)).toBe('red');
  });

  it('saturation floor: S < 0.10 → neutral, S = 0.10 applies the hue', () => {
    expect(bucket(120, 0.099)).toBe('neutral');
    expect(bucket(120, 0.1)).toBe('green');
    expect(bucket(0, 0.099)).toBe('neutral');
  });

  it('Monokai token hues land in the expected buckets', () => {
    // Note the documented pack quirk: #f92672 sits at 338.4°, which is in
    // [260,345) → purple-magenta per the §8.4 table exactly. The button-danger
    // DETECTOR uses its own wider range ([330,360)∪[0,20)) that covers it.
    expect(hueBucket(C('#f92672'))).toBe('purple-magenta');
    expect(hueBucket(C('hsl(350 100% 56%)'))).toBe('red');
    expect(hueBucket(C('#fd971f'))).toBe('orange');
    expect(hueBucket(C('#e6db74'))).toBe('yellow');
    expect(hueBucket(C('#a6e22e'))).toBe('green');
    expect(hueBucket(C('#66d9ef'))).toBe('cyan-blue');
    expect(hueBucket(C('#ae81ff'))).toBe('purple-magenta');
    // Documented table quirk: #f8f8f2 is HSL s=0.30 h=60 (near-white HSL
    // saturation), so §8.4's table puts it in 'yellow', not 'neutral'.
    // Harmless in practice: classify's hue cue has an s >= 0.35 floor.
    const inv = toHsl(C('#f8f8f2'));
    expect(inv.h).toBeCloseTo(60, 5);
    expect(inv.s).toBeCloseTo(0.3, 5);
    expect(hueBucket(C('#f8f8f2'))).toBe('yellow');
    expect(hueBucket(C('#808080'))).toBe('neutral');
  });
});

describe('deltaE2000 — Sharma reference pairs', () => {
  const pairs = [
    [[50.0, 2.6772, -79.7751], [50.0, 0.0, -82.7485], 2.0425],
    [[50.0, 3.1571, -77.2803], [50.0, 0.0, -82.7485], 2.8615],
    [[50.0, 2.8361, -74.02], [50.0, 0.0, -82.7485], 3.4412],
    [[50.0, -1.3802, -84.2814], [50.0, 0.0, -82.7485], 1.0],
    [[50.0, -1.1848, -84.8006], [50.0, 0.0, -82.7485], 1.0],
    [[50.0, -0.9009, -85.5211], [50.0, 0.0, -82.7485], 1.0],
    [[50.0, 0.0, 0.0], [50.0, -1.0, 2.0], 2.3669],
    [[50.0, -1.0, 2.0], [50.0, 0.0, 0.0], 2.3669],
    [[50.0, 2.49, -0.001], [50.0, -2.49, 0.0009], 7.1792],
    [[50.0, 2.49, -0.001], [50.0, -2.49, 0.001], 7.1792],
    [[50.0, 2.49, -0.001], [50.0, -2.49, 0.0011], 7.2195],
    [[50.0, 2.49, -0.001], [50.0, -2.49, 0.0012], 7.2195],
    [[50.0, -0.001, 2.49], [50.0, 0.0009, -2.49], 4.8045],
    [[50.0, -0.001, 2.49], [50.0, 0.001, -2.49], 4.8045],
    [[50.0, -0.001, 2.49], [50.0, 0.0011, -2.49], 4.7461],
    [[50.0, 2.5, 0.0], [50.0, 0.0, -2.5], 4.3065],
    [[50.0, 2.5, 0.0], [73.0, 25.0, -18.0], 27.1492],
    [[50.0, 2.5, 0.0], [61.0, -5.0, 29.0], 22.8977],
    [[50.0, 2.5, 0.0], [56.0, -27.0, -3.0], 31.903],
    [[50.0, 2.5, 0.0], [58.0, 24.0, 15.0], 19.4535],
    [[50.0, 2.5, 0.0], [50.0, 3.1736, 0.5854], 1.0],
    [[50.0, 2.5, 0.0], [50.0, 3.2972, 0.0], 1.0],
    [[50.0, 2.5, 0.0], [50.0, 1.8634, 0.5757], 1.0],
    [[50.0, 2.5, 0.0], [50.0, 3.2592, 0.335], 1.0],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[63.0109, -31.0961, -5.8663], [62.8187, -29.7946, -4.0864], 1.263],
    [[61.2901, 3.7196, -5.3901], [61.4292, 2.248, -4.962], 1.8731],
    [[35.0831, -44.1164, 3.7933], [35.0232, -40.0716, 1.5901], 1.8645],
    [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
    [[36.4612, 47.858, 18.3852], [36.2715, 50.5065, 21.2231], 1.4146],
    [[90.8027, -2.0831, 1.441], [91.1528, -1.6435, 0.0447], 1.4441],
    [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381],
    [[6.7747, -0.2908, -2.4247], [5.8714, -0.0985, -2.2286], 0.6377],
    [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
  ];

  it('matches all 34 Sharma reference pairs', () => {
    for (const [lab1, lab2, expected] of pairs) {
      expect(deltaE2000Lab(lab1, lab2)).toBeCloseTo(expected, 3);
    }
  });

  it('deltaE2000 on Colors: identity is 0, near-identical ≤ 1, distinct > 1', () => {
    expect(deltaE2000(C('#f8f8f2'), C('#f8f8f2'))).toBeCloseTo(0, 6);
    expect(deltaE2000(C('#f8f8f2'), C('#f7f7f1'))).toBeLessThan(1);
    expect(deltaE2000(C('#f8f8f2'), C('#cccccc'))).toBeGreaterThan(1);
    expect(deltaE2000(C('#272822'), C('#34352f'))).toBeCloseTo(4.14, 1);
  });

  it('rgbToLab pins white/black anchors', () => {
    const white = rgbToLab(C('#ffffff'));
    expect(white[0]).toBeCloseTo(100, 2);
    expect(white[1]).toBeCloseTo(0, 2);
    expect(white[2]).toBeCloseTo(0, 2);
    const black = rgbToLab(C('#000000'));
    expect(black[0]).toBeCloseTo(0, 5);
  });
});

describe('thresholdFor — full truth table including nonText', () => {
  it('default → 4.5', () => {
    expect(thresholdFor({})).toBe(4.5);
    expect(thresholdFor({ sizeClass: 'normal', muted: false, nonText: false, prefersMore: false })).toBe(4.5);
  });

  it('large or muted → 3', () => {
    expect(thresholdFor({ sizeClass: 'large' })).toBe(3);
    expect(thresholdFor({ muted: true })).toBe(3);
    expect(thresholdFor({ sizeClass: 'large', muted: true })).toBe(3);
  });

  it('prefersMore → 7', () => {
    expect(thresholdFor({ prefersMore: true })).toBe(7);
    expect(thresholdFor({ prefersMore: true, sizeClass: 'large' })).toBe(7);
    expect(thresholdFor({ prefersMore: true, muted: true })).toBe(7);
  });

  it('nonText → 3 always — even under prefersMore (M1)', () => {
    expect(thresholdFor({ nonText: true })).toBe(3);
    expect(thresholdFor({ nonText: true, prefersMore: true })).toBe(3);
    expect(thresholdFor({ nonText: true, prefersMore: true, sizeClass: 'large', muted: true })).toBe(3);
    // nonText beats every other channel:
    for (const other of [
      { prefersMore: true },
      { sizeClass: 'large' },
      { muted: true },
      {},
    ]) {
      expect(thresholdFor({ ...other, nonText: true })).toBe(3);
    }
  });
});

describe('sizeClassOf', () => {
  it('edges: 23.9/24px and 18.65/18.66px bold', () => {
    expect(sizeClassOf(23.9, 400)).toBe('normal');
    expect(sizeClassOf(24, 400)).toBe('large');
    expect(sizeClassOf(18.65, 700)).toBe('normal');
    expect(sizeClassOf(18.66, 700)).toBe('large');
    expect(sizeClassOf(18.66, 699)).toBe('normal');
    expect(sizeClassOf(20, 400)).toBe('normal');
    expect(sizeClassOf(20, 700)).toBe('large');
  });
});

describe('sameColor', () => {
  it('per-channel within eps', () => {
    expect(sameColor({ r: 10, g: 20, b: 30, a: 1 }, { r: 10.3, g: 19.6, b: 30.4, a: 1 })).toBe(true);
    expect(sameColor({ r: 10, g: 20, b: 30, a: 1 }, { r: 11, g: 20, b: 30, a: 1 })).toBe(false);
    expect(sameColor({ r: 10, g: 20, b: 30, a: 1 }, { r: 10, g: 20, b: 30, a: 1 }, 0)).toBe(true);
  });
});
