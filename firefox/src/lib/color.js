// SPDX-License-Identifier: GPL-3.0-or-later
// Pure color math (spec §3). No DOM, no imports.

/** @typedef {{ r: number, g: number, b: number, a: number }} Color */

// Full CSS named-color table (CSS Color Module Level 4, incl. rebeccapurple).
export const NAMED_COLORS = {
  aliceblue: '#f0f8ff', antiquewhite: '#faebd7', aqua: '#00ffff',
  aquamarine: '#7fffd4', azure: '#f0ffff', beige: '#f5f5dc',
  bisque: '#ffe4c4', black: '#000000', blanchedalmond: '#ffebcd',
  blue: '#0000ff', blueviolet: '#8a2be2', brown: '#a52a2a',
  burlywood: '#deb887', cadetblue: '#5f9ea0', chartreuse: '#7fff00',
  chocolate: '#d2691e', coral: '#ff7f50', cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc', crimson: '#dc143c', cyan: '#00ffff',
  darkblue: '#00008b', darkcyan: '#008b8b', darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9', darkgreen: '#006400', darkgrey: '#a9a9a9',
  darkkhaki: '#bdb76b', darkmagenta: '#8b008b', darkolivegreen: '#556b2f',
  darkorange: '#ff8c00', darkorchid: '#9932cc', darkred: '#8b0000',
  darksalmon: '#e9967a', darkseagreen: '#8fbc8f', darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f', darkslategrey: '#2f4f4f', darkturquoise: '#00ced1',
  darkviolet: '#9400d3', deeppink: '#ff1493', deepskyblue: '#00bfff',
  dimgray: '#696969', dimgrey: '#696969', dodgerblue: '#1e90ff',
  firebrick: '#b22222', floralwhite: '#fffaf0', forestgreen: '#228b22',
  fuchsia: '#ff00ff', gainsboro: '#dcdcdc', ghostwhite: '#f8f8ff',
  gold: '#ffd700', goldenrod: '#daa520', gray: '#808080',
  green: '#008000', greenyellow: '#adff2f', grey: '#808080',
  honeydew: '#f0fff0', hotpink: '#ff69b4', indianred: '#cd5c5c',
  indigo: '#4b0082', ivory: '#fffff0', khaki: '#f0e68c',
  lavender: '#e6e6fa', lavenderblush: '#fff0f5', lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd', lightblue: '#add8e6', lightcoral: '#f08080',
  lightcyan: '#e0ffff', lightgoldenrodyellow: '#fafad2', lightgray: '#d3d3d3',
  lightgreen: '#90ee90', lightgrey: '#d3d3d3', lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a', lightseagreen: '#20b2aa', lightskyblue: '#87cefa',
  lightslategray: '#778899', lightslategrey: '#778899', lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0', lime: '#00ff00', limegreen: '#32cd32',
  linen: '#faf0e6', magenta: '#ff00ff', maroon: '#800000',
  mediumaquamarine: '#66cdaa', mediumblue: '#0000cd', mediumorchid: '#ba55d3',
  mediumpurple: '#9370db', mediumseagreen: '#3cb371', mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a', mediumturquoise: '#48d1cc', mediumvioletred: '#c71585',
  midnightblue: '#191970', mintcream: '#f5fffa', mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5', navajowhite: '#ffdead', navy: '#000080',
  oldlace: '#fdf5e6', olive: '#808000', olivedrab: '#6b8e23',
  orange: '#ffa500', orangered: '#ff4500', orchid: '#da70d6',
  palegoldenrod: '#eee8aa', palegreen: '#98fb98', paleturquoise: '#afeeee',
  palevioletred: '#db7093', papayawhip: '#ffefd5', peachpuff: '#ffdab9',
  peru: '#cd853f', pink: '#ffc0cb', plum: '#dda0dd',
  powderblue: '#b0e0e6', purple: '#800080', rebeccapurple: '#663399',
  red: '#ff0000', rosybrown: '#bc8f8f', royalblue: '#4169e1',
  saddlebrown: '#8b4513', salmon: '#fa8072', sandybrown: '#f4a460',
  seagreen: '#2e8b57', seashell: '#fff5ee', sienna: '#a0522d',
  silver: '#c0c0c0', skyblue: '#87ceeb', slateblue: '#6a5acd',
  slategray: '#708090', slategrey: '#708090', snow: '#fffafa',
  springgreen: '#00ff7f', steelblue: '#4682b4', tan: '#d2b48c',
  teal: '#008080', thistle: '#d8bfd8', tomato: '#ff6347',
  turquoise: '#40e0d0', violet: '#ee82ee', wheat: '#f5deb3',
  white: '#ffffff', whitesmoke: '#f5f5f5', yellow: '#ffff00',
  yellowgreen: '#9acd32',
};

/**
 * parseColor(input) → Color | null (spec §3).
 * Accepts #rgb #rgba #rrggbb #rrggbbaa; rgb()/rgba() (comma, space, slash, %);
 * hsl()/hsla(); 'transparent'; CSS named colors. Anything else → null.
 */
export function parseColor(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (s === '') return null;
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (s[0] === '#') return parseHex(s);
  const fn = /^([a-z]+)\(([^)]*)\)$/.exec(s);
  if (fn) {
    if (fn[1] === 'rgb' || fn[1] === 'rgba') return parseRgbFn(fn[2]);
    if (fn[1] === 'hsl' || fn[1] === 'hsla') return parseHslFn(fn[2]);
    return null;
  }
  const named = NAMED_COLORS[s];
  if (named) return parseHex(named);
  return null;
}

function parseHex(s) {
  const h = s.slice(1);
  if (!/^[0-9a-f]+$/.test(h)) return null;
  if (h.length === 3 || h.length === 4) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    const a = h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1;
    return { r, g, b, a };
  }
  if (h.length === 6 || h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  return null;
}

// Split a functional-notation body on commas and/or whitespace, honoring
// the `a / b` slash syntax (spec §3).
function splitFnBody(body) {
  const normalized = body.replace(/\//g, ' , ').replace(/,/g, ' , ');
  return normalized.split(/[\s]+/).filter((t) => t !== '' && t !== ',');
}

function parseRgbChannel(token) {
  if (token.endsWith('%')) {
    const n = Number.parseFloat(token.slice(0, -1));
    if (!Number.isFinite(n)) return null;
    return (n / 100) * 255;
  }
  const n = Number.parseFloat(token);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseAlphaChannel(token) {
  if (token == null) return 1;
  if (token.endsWith('%')) {
    const n = Number.parseFloat(token.slice(0, -1));
    if (!Number.isFinite(n)) return null;
    return n / 100;
  }
  const n = Number.parseFloat(token);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseRgbFn(body) {
  const parts = splitFnBody(body);
  if (parts.length < 3 || parts.length > 4) return null;
  const r = parseRgbChannel(parts[0]);
  const g = parseRgbChannel(parts[1]);
  const b = parseRgbChannel(parts[2]);
  const a = parseAlphaChannel(parts[3]);
  if (r == null || g == null || b == null || a == null) return null;
  return { r, g, b, a };
}

function parseHueToken(token) {
  let t = token;
  if (t.endsWith('deg')) t = t.slice(0, -3);
  else if (t.endsWith('grad')) return (Number.parseFloat(t.slice(0, -4)) * 360) / 400;
  else if (t.endsWith('rad')) return (Number.parseFloat(t.slice(0, -3)) * 180) / Math.PI;
  else if (t.endsWith('turn')) return Number.parseFloat(t.slice(0, -4)) * 360;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parsePercentChannel(token) {
  if (!token.endsWith('%')) return null;
  const n = Number.parseFloat(token.slice(0, -1));
  if (!Number.isFinite(n)) return null;
  return n / 100;
}

function parseHslFn(body) {
  const parts = splitFnBody(body);
  if (parts.length < 3 || parts.length > 4) return null;
  const h = parseHueToken(parts[0]);
  const s = parsePercentChannel(parts[1]);
  const l = parsePercentChannel(parts[2]);
  const a = parseAlphaChannel(parts[3]);
  if (h == null || s == null || l == null || a == null) return null;
  const { r, g, b } = hslToRgb(h, s, l);
  return { r, g, b, a };
}

/** formatColor(color) → 'rgba(r, g, b, a)' with ints rounded, a trimmed (spec §3). */
export function formatColor(color) {
  const r = Math.round(color.r);
  const g = Math.round(color.g);
  const b = Math.round(color.b);
  let a = Math.round(color.a * 1000) / 1000;
  if (Object.is(a, -0)) a = 0;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** isTransparent(color) → a === 0 (spec §3). */
export function isTransparent(color) {
  return color.a === 0;
}

/**
 * composite(fg, bg) → source-over compositing (spec §3).
 * result alpha = fg.a + bg.a * (1 - fg.a).
 */
export function composite(fg, bg) {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
    a,
  };
}

function linearizeChannel(v) {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * luminance(color) → WCAG 2.x relative luminance, full sRGB linearization
 * (spec §3 — explicitly NOT getSRGBLightness). Precondition: a === 1
 * (composite first); alpha is ignored.
 */
export function luminance(color) {
  const R = linearizeChannel(color.r);
  const G = linearizeChannel(color.g);
  const B = linearizeChannel(color.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * contrast(fg, bg) → composite(fg, bg) over opaque bg → (L1+.05)/(L2+.05),
 * ≥ 1 (spec §3). Handles translucent fg via source-over compositing.
 */
export function contrast(fg, bg) {
  const c = composite(fg, bg);
  const l1 = luminance(c);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r1;
  let g1;
  let b1;
  if (hue < 60) [r1, g1, b1] = [c, x, 0];
  else if (hue < 120) [r1, g1, b1] = [x, c, 0];
  else if (hue < 180) [r1, g1, b1] = [0, c, x];
  else if (hue < 240) [r1, g1, b1] = [0, x, c];
  else if (hue < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

/** toHsl(color) → { h: 0..360, s: 0..1, l: 0..1 } (spec §3). */
export function toHsl(color) {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  return { h: ((h % 360) + 360) % 360, s, l };
}

/**
 * hueBucket(color) → §8.4 table exactly (spec §3):
 *   S < 0.10 → 'neutral'
 *   [345,360)∪[0,15) → 'red'   [15,45) → 'orange'  [45,70) → 'yellow'
 *   [70,165) → 'green'  [165,260) → 'cyan-blue'  [260,345) → 'purple-magenta'
 */
export function hueBucket(color) {
  const { h, s } = toHsl(color);
  if (s < 0.1) return 'neutral';
  if (h >= 345 || h < 15) return 'red';
  if (h < 45) return 'orange';
  if (h < 70) return 'yellow';
  if (h < 165) return 'green';
  if (h < 260) return 'cyan-blue';
  return 'purple-magenta';
}

// sRGB → CIE Lab (D65), for CIEDE2000.
export function rgbToLab({ r, g, b }) {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const Z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X / 0.95047);
  const fy = f(Y / 1.0);
  const fz = f(Z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const DEG = Math.PI / 180;

function hueAngle(b, a) {
  if (a === 0 && b === 0) return 0;
  const ang = Math.atan2(b, a) / DEG;
  return ang >= 0 ? ang : ang + 360;
}

/**
 * deltaE2000Lab(lab1, lab2) → CIEDE2000 between two [L, a, b] triples
 * (Sharma et al. 2005 metric). Exported so tests can pin the Sharma
 * reference pairs directly; color-level callers use deltaE2000.
 */
export function deltaE2000Lab(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const Cbar7 = Cbar ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = hueAngle(b1, a1p);
  const h2p = hueAngle(b2, a2p);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * DEG) / 2);
  const Lbar = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;
  let hbarp;
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hbarp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hbarp = (h1p + h2p + 360) / 2;
  } else {
    hbarp = (h1p + h2p - 360) / 2;
  }
  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * DEG) +
    0.24 * Math.cos(2 * hbarp * DEG) +
    0.32 * Math.cos((3 * hbarp + 6) * DEG) -
    0.2 * Math.cos((4 * hbarp - 63) * DEG);
  const dTheta = 30 * Math.exp(-(((hbarp - 275) / 25) ** 2));
  const Cbarp7 = Cbarp ** 7;
  const Rc = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbar - 50) ** 2) / Math.sqrt(20 + (Lbar - 50) ** 2);
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(2 * dTheta * DEG) * Rc;
  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh),
  );
}

/** deltaE2000(c1, c2) → CIEDE2000 between two Colors (spec §3). */
export function deltaE2000(c1, c2) {
  return deltaE2000Lab(rgbToLab(c1), rgbToLab(c2));
}

/**
 * thresholdFor({ sizeClass, muted, nonText, prefersMore }) (spec §3):
 * nonText → 3 (design §8.3.2's 3:1 for non-text UI — border/outline
 * emissions; round-3 M1); else prefersMore → 7; else large|muted → 3;
 * else 4.5.
 */
export function thresholdFor({ sizeClass, muted, nonText, prefersMore } = {}) {
  if (nonText) return 3;
  if (prefersMore) return 7;
  if (sizeClass === 'large' || muted) return 3;
  return 4.5;
}

/**
 * sizeClassOf(fontSizePx, fontWeight) → 'large' if px >= 24 ||
 * (px >= 18.66 && weight >= 700) else 'normal' (spec §3, spec-pinned
 * 18.66 WCAG threshold and >= 700 bold reading).
 */
export function sizeClassOf(fontSizePx, fontWeight = 400) {
  const px = Number(fontSizePx);
  const weight = Number(fontWeight);
  if (px >= 24) return 'large';
  if (px >= 18.66 && weight >= 700) return 'large';
  return 'normal';
}

/** sameColor(c1, c2, eps=0.5) → per-channel within eps (spec §3). */
export function sameColor(c1, c2, eps = 0.5) {
  if (!c1 || !c2) return false;
  return (
    Math.abs(c1.r - c2.r) <= eps &&
    Math.abs(c1.g - c2.g) <= eps &&
    Math.abs(c1.b - c2.b) <= eps &&
    Math.abs(c1.a - c2.a) <= eps
  );
}
