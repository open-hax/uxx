// SPDX-License-Identifier: GPL-3.0-or-later
// tests/map.test.js — spec §6.4 three-state property + universe enumeration
// (opaque × translucent pairs) + pack membership + monotonicity +
// idempotence + clamp + M1 nonText + M2 no-background-exception (design §12).

import { describe, expect, it } from 'vitest';
import { buildRankTable, createMapper, isExcepted, map } from '../src/lib/map.js';
import { pack, resolveToken } from '../src/theme/tokens.js';
import { ROLE_RULES, TEXT_RANK_ROLES } from '../src/theme/roles.js';
import {
  composite,
  contrast,
  deltaE2000,
  formatColor,
  luminance,
  parseColor,
  thresholdFor,
} from '../src/lib/color.js';

const C = (hex) => parseColor(hex);
const DEFAULT_TOKEN = resolveToken(['colors', 'text', 'default']);
const TEXT_POOL = TEXT_RANK_ROLES.map((role) => parseColor(resolveToken(ROLE_RULES[role].color)));
const DUMMY_PALETTE = { appearance: 'dark', backgrounds: [] };

const PAGE_BG = C(resolveToken(['colors', 'background', 'default'])); // #272822

// A source color that is NOT in the pack (idempotence must not fire).
const PAGE_SOURCE = C('#ffffff');

function run(assignment, resolvedBg, extraCtx = {}) {
  return map(assignment, { resolvedBgColor: resolvedBg, prefersMore: false, ...extraCtx }, DUMMY_PALETTE, pack);
}

const multiTokenRoles = new Set([...TEXT_RANK_ROLES, 'accent-yellow', 'accent-magenta']);

// ---- the §6.3 background universe -----------------------------------------

function opaqueBgRoles() {
  const roles = [
    'page-background',
    'surface',
    'surface-recessed',
    'elevated',
    'input-surface',
    'code-surface',
    'button-primary',
    'button-secondary',
    'button-danger',
  ];
  return roles.map((role) => {
    const color = parseColor(resolveToken(ROLE_RULES[role].background));
    expect(color.a, `${role} bg must be opaque`).toBe(1);
    return { role, color };
  });
}

function translucentBgRoles() {
  const roles = ['overlay', 'selection', 'badge-success', 'badge-warning', 'badge-error', 'badge-info'];
  return roles.map((role) => {
    const color = parseColor(resolveToken(ROLE_RULES[role].background));
    expect(color.a, `${role} bg must be translucent`).toBeLessThan(1);
    expect(color.a).toBeGreaterThan(0);
    return { role, color };
  });
}

// Every background ROLE_RULES can emit: opaque directly, translucent
// composited over every opaque one (spec §6.3 universe).
function universeBackgrounds() {
  const opaque = opaqueBgRoles();
  const out = opaque.map(({ role, color }) => ({ label: role, color }));
  for (const { role: tRole, color: tColor } of translucentBgRoles()) {
    for (const { role: oRole, color: oColor } of opaque) {
      out.push({ label: `${tRole} over ${oRole}`, color: composite(tColor, oColor) });
    }
  }
  return out;
}

// ---- the three-state assertion (spec §6.4) --------------------------------

function assertThreeState(result, { role: originalRole, property, bg, sizeClass, mutedFlag, prefersMore }) {
  const emitted = parseColor(result.color);
  expect(emitted, 'emitted color must parse').toBeTruthy();
  // §0 invariant: every emitted color ∈ pack (parsed comparison).
  expect(
    Object.values(flattenStrings(pack)).some((v) => sameParsed(v, emitted)),
    `emitted ${result.color} must be a pack value`,
  ).toBe(true);

  const nonText = property === 'border' || property === 'outline';
  // Threshold follows the ASSIGNMENT's text class, exactly as map.js computes
  // it (MUTED_ROLES.has(finalRole) || isPlaceholder; finalRole === originalRole
  // in these runs — no rank table). Recomputing from result.role LOSES the
  // signal after a successful repair (text-muted → text-secondary would flip
  // 3.0 back to 4.5 and misreport a legal repair as a silent failure).
  const muted = mutedFlag || originalRole === 'text-muted' || originalRole === 'text-faint';
  const threshold = thresholdFor({ sizeClass, muted, nonText, prefersMore });
  const c = contrast(emitted, bg);

  if (c >= threshold) {
    // State 1: meets threshold — an exception flag here would be a defect.
    expect(result.exception, `unexpected exception for ${originalRole}/${property}`).toBeUndefined();
    return;
  }
  // Not state 1 ⇒ state 2 (silent E1–E5) or state 3-legal.
  if (isExcepted(result.role, property)) return; // state 2 (silent or marker, both fine)
  expect(result.exception, `failure without exception for ${originalRole}/${property} on ${formatColor(bg)}`).toBe(true);
  // Marker legality (design §7.2 / §8.3.4):
  if (multiTokenRoles.has(originalRole)) {
    // multi-token pool ⇒ legal ONLY if repair exhausted to text.default
    expect(result.color, `multi-token marker must be ${DEFAULT_TOKEN}`).toBe(DEFAULT_TOKEN);
  }
  // single-token pools are always legal (§8.3.4)
}

function flattenStrings(obj, out = []) {
  for (const v of Object.values(obj)) {
    if (typeof v === 'string') out.push(v);
    else if (v && typeof v === 'object') flattenStrings(v, out);
  }
  return out;
}

function sameParsed(a, b) {
  const pa = parseColor(a);
  return (
    pa &&
    Math.abs(pa.r - b.r) < 1e-6 &&
    Math.abs(pa.g - b.g) < 1e-6 &&
    Math.abs(pa.b - b.b) < 1e-6 &&
    Math.abs(pa.a - b.a) < 1e-6
  );
}

// ---- arithmetic pins -------------------------------------------------------

describe('map — arithmetic pins (fail loudly if a token moves)', () => {
  const bgPrimary = C(resolveToken(['colors', 'button', 'primary', 'bg']));
  const bgDanger = C(resolveToken(['colors', 'button', 'danger', 'bg']));
  const bgInput = C(resolveToken(['palette', 'bg', 'selection']));
  const selComposite = composite(C(resolveToken(['colors', 'selection', 'default'])), bgInput);

  it('text.default vs button-primary.bg = 4.60:1 — passes normal, fails prefersMore', () => {
    const normal = run({ property: 'color', role: 'text-primary', sourceColor: PAGE_SOURCE }, bgPrimary);
    expect(normal.color).toBe(DEFAULT_TOKEN);
    expect(normal.exception).toBeUndefined();
    const more = run({ property: 'color', role: 'text-primary', sourceColor: PAGE_SOURCE }, bgPrimary, { prefersMore: true });
    expect(more.color).toBe(DEFAULT_TOKEN);
    expect(more.exception).toBe(true); // pool exhaustion → default+marker
  });

  it('text.default vs button-danger.bg = 3.55:1 — normal exhaustion → default+marker; muted passes 3:1', () => {
    const normal = run({ property: 'color', role: 'text-primary', sourceColor: PAGE_SOURCE }, bgDanger);
    expect(normal.color).toBe(DEFAULT_TOKEN);
    expect(normal.exception).toBe(true);
    // muted threshold is 3:1 → 3.55 passes at the outermost token:
    const mutedRun = run({ property: 'color', role: 'text-faint', sourceColor: PAGE_SOURCE }, bgDanger);
    expect(mutedRun.color).toBe(DEFAULT_TOKEN);
    expect(mutedRun.role).toBe('text-primary');
    expect(mutedRun.exception).toBeUndefined();
  });

  it('muted 3:1 bar repairs text-muted → text.panel (3.055) over button-primary.bg; prefersMore exhausts', () => {
    // Regression pin: text.muted (1.23) and text.soft (1.23) fail 3:1 vs
    // #75715e; text.panel #cccccc = 3.055 clears the MUTED bar (but not 4.5).
    // The repair is legal only because the assignment class is muted — a test
    // that re-derives the threshold from the repaired role would misread it.
    const r = run({ property: 'color', role: 'text-muted', sourceColor: PAGE_SOURCE }, bgPrimary);
    expect(r.color).toBe(resolveToken(['colors', 'text', 'panel']));
    expect(r.role).toBe('text-secondary');
    expect(r.exception).toBeUndefined();
    expect(contrast(C(r.color), bgPrimary)).toBeCloseTo(3.055, 3);
    // Same pair under prefers-contrast: more — every pool token fails 7:1,
    // so repair exhausts to text.default with the marker.
    const more = run({ property: 'color', role: 'text-muted', sourceColor: PAGE_SOURCE }, bgPrimary, { prefersMore: true });
    expect(more.color).toBe(DEFAULT_TOKEN);
    expect(more.exception).toBe(true);
  });

  it('selection.default over input-surface = 5.37:1 — passes normal, default+marker under prefersMore only', () => {
    expect(contrast(C(DEFAULT_TOKEN), selComposite)).toBeCloseTo(5.37, 1);
    const normal = run({ property: 'color', role: 'text-primary', sourceColor: PAGE_SOURCE }, selComposite);
    expect(normal.color).toBe(DEFAULT_TOKEN);
    expect(normal.exception).toBeUndefined();
    const more = run({ property: 'color', role: 'text-primary', sourceColor: PAGE_SOURCE }, selComposite, { prefersMore: true });
    expect(more.color).toBe(DEFAULT_TOKEN);
    expect(more.exception).toBe(true);
  });

  it('M1: border-focus and focus pass the 3:1 nonText threshold vs surface and elevated (they fail 4.5)', () => {
    const surface = C(resolveToken(['colors', 'background', 'elevated']));
    const elevated = C(resolveToken(['colors', 'background', 'highlight']));
    for (const bg of [surface, elevated]) {
      expect(contrast(C(resolveToken(['colors', 'border', 'focus'])), bg)).toBeLessThan(4.5);
      for (const [role, property] of [['border-focus', 'border'], ['focus', 'outline']]) {
        for (const prefersMore of [false, true]) {
          const r = run({ property, role, sourceColor: PAGE_SOURCE }, bg, { prefersMore });
          expect(r.exception, `${role}/${property} vs ${formatColor(bg)} (prefersMore=${prefersMore})`).toBeUndefined();
          expect(r.color).toBe(resolveToken(['colors', 'border', 'focus']));
        }
      }
    }
  });
});

describe('map — M2: background emissions are surfaces, never pairs', () => {
  it('emitting every background role over every opaque role-bg sets exception on none', () => {
    const opaque = opaqueBgRoles();
    const bgRoles = [...opaque.map((o) => o.role), ...translucentBgRoles().map((t) => t.role)];
    let checked = 0;
    for (const role of bgRoles) {
      for (const { color: bg } of opaque) {
        const r = run({ property: 'background', role, sourceColor: PAGE_SOURCE }, bg);
        expect(r.exception, `background ${role} must never set exception`).toBeUndefined();
        expect(r.color).toBe(resolveToken(ROLE_RULES[role].background));
        // alpha is preserved (no opaque-ization):
        expect(parseColor(r.color).a).toBe(parseColor(resolveToken(ROLE_RULES[role].background)).a);
        checked += 1;
      }
    }
    expect(checked).toBe(15 * opaque.length);
  });
});

describe('map — universe enumeration, three-state property (spec §6.4)', () => {
  const bgUniverse = universeBackgrounds();
  const colorRoles = [
    ...TEXT_RANK_ROLES,
    'accent-yellow',
    'accent-magenta',
    'link',
    'text-inverse',
    'semantic-error',
    'semantic-warning',
    'semantic-success',
    'semantic-info',
    'badge-warning',
    'badge-error',
    'button-primary',
    'button-secondary',
    'button-danger',
  ];
  const lineRoles = ['border', 'border-subtle', 'border-focus']; // property: border
  const outlineRoles = ['focus']; // property: outline

  it('opaque × translucent pairs × sizeClass × muted × prefersMore × pools', () => {
    let cases = 0;
    for (const { label, color: bg } of bgUniverse) {
      for (const sizeClass of ['normal', 'large']) {
        for (const mutedFlag of [false, true]) {
          for (const prefersMore of [false, true]) {
            for (const role of colorRoles) {
              const result = run(
                { property: 'color', role, sourceColor: PAGE_SOURCE, sizeClass, isPlaceholder: mutedFlag },
                bg,
                { prefersMore },
              );
              assertThreeState(result, { role, property: 'color', bg, sizeClass, mutedFlag, prefersMore });
              cases += 1;
            }
            for (const role of lineRoles) {
              const result = run({ property: 'border', role, sourceColor: PAGE_SOURCE, sizeClass }, bg, { prefersMore });
              assertThreeState(result, { role, property: 'border', bg, sizeClass, mutedFlag, prefersMore });
              cases += 1;
            }
            for (const role of outlineRoles) {
              const result = run({ property: 'outline', role, sourceColor: PAGE_SOURCE, sizeClass }, bg, { prefersMore });
              assertThreeState(result, { role, property: 'outline', bg, sizeClass, mutedFlag, prefersMore });
              cases += 1;
            }
          }
        }
      }
    }
    // (9 opaque + 6×9 translucent composites) × 2 × 2 × 2 × (14+3+1)
    expect(cases).toBe(bgUniverse.length * 2 * 2 * 2 * (colorRoles.length + lineRoles.length + outlineRoles.length));
  });

  it('any multi-token marker satisfies emitted === colors.text.default', () => {
    for (const { color: bg } of bgUniverse) {
      for (const role of multiTokenRoles) {
        for (const prefersMore of [false, true]) {
          const result = run(
            { property: 'color', role, sourceColor: PAGE_SOURCE, sizeClass: 'normal' },
            bg,
            { prefersMore },
          );
          if (result.exception && multiTokenRoles.has(result.role)) {
            expect(result.color).toBe(DEFAULT_TOKEN);
          }
          if (result.exception) {
            // after the accent walk's role conversion, an exhausted multi-token
            // emission is always the outermost token:
            expect(result.color).toBe(DEFAULT_TOKEN);
          }
        }
      }
    }
  });
});

describe('map — semantic & exception behavior on key surfaces', () => {
  it('semantic-warning keeps hue: silent marker on bright surfaces, no neutral conversion', () => {
    const page = run({ property: 'color', role: 'semantic-warning', sourceColor: PAGE_SOURCE }, PAGE_BG);
    expect(page.color).toBe(resolveToken(['colors', 'semantic', 'warning']));
    expect(page.exception).toBeUndefined();
    const bright = run({ property: 'color', role: 'semantic-warning', sourceColor: PAGE_SOURCE }, C('#ffffff'));
    expect(bright.color).toBe(resolveToken(['colors', 'semantic', 'warning']));
    expect(bright.exception).toBe(true); // single-token pool, not E1–E5
  });

  it('E2/E4 error roles are silent (no marker) on page-derived backgrounds', () => {
    for (const role of ['semantic-error', 'badge-error']) {
      const r = run({ property: 'color', role, sourceColor: PAGE_SOURCE }, PAGE_BG);
      expect(r.color).toBe(resolveToken(role === 'semantic-error' ? ['colors', 'semantic', 'error'] : ['colors', 'badge', 'error', 'fg']));
      expect(r.exception).toBeUndefined();
    }
  });

  it('E1: border/border-subtle are silent against any bg', () => {
    const r = run({ property: 'border', role: 'border', sourceColor: PAGE_SOURCE }, C(resolveToken(['colors', 'background', 'elevated'])));
    expect(r.exception).toBeUndefined();
    expect(r.color).toBe(resolveToken(['colors', 'border', 'default']));
  });

  it('E3: button-danger fg vs its own danger bg is silent', () => {
    const r = run({ property: 'color', role: 'button-danger', sourceColor: PAGE_SOURCE }, C(resolveToken(['colors', 'button', 'danger', 'bg'])));
    expect(r.color).toBe(resolveToken(['colors', 'button', 'danger', 'fg']));
    expect(r.exception).toBeUndefined();
  });

  it('accent text resolution path (hue buckets re-asserted through map)', () => {
    const yellow = run({ property: 'color', role: 'accent-yellow', sourceColor: PAGE_SOURCE }, PAGE_BG);
    expect(yellow.color).toBe(resolveToken(['colors', 'accent', 'yellow']));
    expect(yellow.exception).toBeUndefined();
    const magenta = run({ property: 'color', role: 'accent-magenta', sourceColor: PAGE_SOURCE }, PAGE_BG);
    expect(magenta.color).toBe(resolveToken(['colors', 'accent', 'magenta']));
    expect(magenta.exception).toBeUndefined();
    // sub-threshold accent converts to neutral by design (§8.3.6), never marker:
    const more = run({ property: 'color', role: 'accent-magenta', sourceColor: PAGE_SOURCE }, PAGE_BG, { prefersMore: true });
    expect(more.color).toBe(resolveToken(['colors', 'text', 'panel']));
    expect(more.role).toBe('text-secondary');
    expect(more.exception).toBeUndefined();
    // accent pool exhaustion ends at text.default + marker:
    const exhausted = run({ property: 'color', role: 'accent-yellow', sourceColor: PAGE_SOURCE }, C(resolveToken(['colors', 'button', 'danger', 'bg'])));
    expect(exhausted.color).toBe(DEFAULT_TOKEN);
    expect(exhausted.role).toBe('text-primary');
    expect(exhausted.exception).toBe(true);
  });

  it('isExcepted implements the E1–E5 table exactly', () => {
    expect(isExcepted('border', 'border')).toBe(true);
    expect(isExcepted('border-subtle', 'border')).toBe(true);
    expect(isExcepted('semantic-error', 'color')).toBe(true);
    expect(isExcepted('semantic-error', 'background')).toBe(false);
    expect(isExcepted('badge-error', 'color')).toBe(true);
    expect(isExcepted('button-danger', 'color')).toBe(true);
    expect(isExcepted('button-danger', 'background')).toBe(false);
    expect(isExcepted('badge-warning', 'color')).toBe(true);
    expect(isExcepted('text-faint', 'color')).toBe(true);
    expect(isExcepted('link', 'color')).toBe(false);
    expect(isExcepted('semantic-warning', 'color')).toBe(false);
  });
});

describe('map — idempotence (pack-in ⇒ pack-out, §10 guard b)', () => {
  it('opaque pack source short-circuits repair even where it would fail', () => {
    const src = C(DEFAULT_TOKEN);
    const r = run({ property: 'color', role: 'text-primary', sourceColor: src }, C(resolveToken(['colors', 'button', 'danger', 'bg'])));
    expect(r.color).toEqual(src);
    expect(r.exception).toBeUndefined();
  });

  it('translucent pack values (selection 0.5, badge 0.15, overlay 0.6) short-circuit too', () => {
    const cases = [
      ['colors', 'selection', 'default'],
      ['colors', 'badge', 'error', 'bg'],
      ['colors', 'background', 'overlay'],
    ];
    for (const path of cases) {
      const src = parseColor(resolveToken(path));
      const r = run({ property: 'color', role: 'link', sourceColor: src }, PAGE_BG);
      expect(r.color, path.join('.')).toEqual(src);
      expect(r.exception).toBeUndefined();
    }
  });

  it('a color merely NEAR a pack value does not short-circuit', () => {
    const src = C('#f7f7f1'); // ΔE ≤ 1 from #f8f8f2 but not exact
    expect(deltaE2000(src, C(DEFAULT_TOKEN))).toBeLessThanOrEqual(1);
    const r = run({ property: 'color', role: 'text-primary', sourceColor: src }, C(resolveToken(['colors', 'button', 'danger', 'bg'])));
    expect(r.color).toBe(DEFAULT_TOKEN); // repair ran
    expect(r.exception).toBe(true);
  });
});

describe('buildRankTable (spec §6.2)', () => {
  const gray = (L) => {
    const c = L <= 0.0031308 ? 12.92 * L : 1.055 * L ** (1 / 2.4) - 0.055;
    const v = c * 255;
    return { r: v, g: v, b: v, a: 1 };
  };

  it('dedup: exact-equal and ΔE≤1 collapse, keeping the highest-confidence rep', () => {
    const a = C('#f8f8f2');
    const aNear = C('#f7f7f1');
    const b = C('#cccccc');
    const table = buildRankTable([
      { property: 'color', role: 'text-primary', sourceColor: a, confidence: 0.5, ranked: true },
      { property: 'color', role: 'text-primary', sourceColor: a, confidence: 0.5, ranked: true },
      { property: 'color', role: 'text-primary', sourceColor: aNear, confidence: 0.9, ranked: true },
      { property: 'color', role: 'text-primary', sourceColor: b, confidence: 0.5, ranked: true },
    ]);
    // The table holds one key per distinct MEMBER color (a, aNear, b — the
    // highest-confidence rep only picks the group's sort representative), so
    // dedup is proven by the RANKS: had aNear not collapsed into a's ΔE≤1
    // group, b would sit at rank 2 → text-muted instead of rank 1.
    expect(table.size).toBe(3);
    expect(table.get(formatColor(a))).toBe('text-primary');
    expect(table.get(formatColor(aNear))).toBe('text-primary');
    expect(table.get(formatColor(b))).toBe('text-secondary');
  });

  it('sorts by luminance descending; only ranked:true color assignments enter', () => {
    const table = buildRankTable([
      { property: 'color', role: 'text-primary', sourceColor: gray(0.2), confidence: 0.5, ranked: true },
      { property: 'color', role: 'text-primary', sourceColor: gray(0.8), confidence: 0.5, ranked: true },
      { property: 'color', role: 'text-primary', sourceColor: gray(0.5), confidence: 0.5, ranked: true },
      { property: 'background', role: 'text-primary', sourceColor: gray(0.99), confidence: 0.5, ranked: true },
      { property: 'color', role: 'text-primary', sourceColor: gray(0.99), confidence: 0.5 }, // no ranked flag
    ]);
    expect(table.size).toBe(3);
    expect(table.get(formatColor(gray(0.8)))).toBe('text-primary');
    expect(table.get(formatColor(gray(0.5)))).toBe('text-secondary');
    expect(table.get(formatColor(gray(0.2)))).toBe('text-muted');
  });

  it('equal-luminance distinct colors keep distinct ranks, hue ascending', () => {
    // Solve for a yellow-orange with the same WCAG luminance as pure green
    // (0.7152): {255, y, 0} where 0.2126 + 0.7152·lin(y/255) = 0.7152.
    const green = { r: 0, g: 255, b: 0, a: 1 };
    let lo = 0;
    let hi = 255;
    for (let i = 0; i < 80; i += 1) {
      const mid = (lo + hi) / 2;
      if (luminance({ r: 255, g: mid, b: 0, a: 1 }) < luminance(green)) lo = mid;
      else hi = mid;
    }
    const orange = { r: 255, g: (lo + hi) / 2, b: 0, a: 1 };
    expect(Math.abs(luminance(orange) - luminance(green))).toBeLessThan(1e-10);
    const table = buildRankTable([
      { property: 'color', role: 'text-primary', sourceColor: green, confidence: 0.5, ranked: true },
      { property: 'color', role: 'text-primary', sourceColor: orange, confidence: 0.5, ranked: true },
    ]);
    // hue ascending: orange (~45°) before green (~120°)
    expect(table.get(formatColor(orange))).toBe('text-primary');
    expect(table.get(formatColor(green))).toBe('text-secondary');
  });
});

describe('map — rank integration, clamp, and post-repair monotonicity', () => {
  const gray = (L) => {
    const c = L <= 0.0031308 ? 12.92 * L : 1.055 * L ** (1 / 2.4) - 0.055;
    const v = c * 255;
    return { r: v, g: v, b: v, a: 1 };
  };
  const fiveSources = [0.9, 0.6, 0.35, 0.15, 0.05].map(gray);

  it('clamp: 5 distinct sources → 4 tokens, source #5 gets text-faint', () => {
    const mapper = createMapper({ tokens: pack, palette: DUMMY_PALETTE, prefersMore: false });
    const assignments = fiveSources.map((sourceColor) => ({
      property: 'color',
      role: 'text-primary',
      sourceColor,
      confidence: 0.5,
      ranked: true,
    }));
    mapper.buildRankTable(assignments);
    const results = assignments.map((a) => mapper.map(a, { resolvedBgColor: PAGE_BG }));
    expect(results.map((r) => r.role)).toEqual([
      'text-primary',
      'text-secondary',
      'text-muted',
      'text-faint',
      'text-faint',
    ]);
    expect(results.map((r) => r.color)).toEqual([
      DEFAULT_TOKEN,
      resolveToken(['colors', 'text', 'panel']),
      resolveToken(['colors', 'text', 'soft']),
      resolveToken(['colors', 'text', 'muted']),
      resolveToken(['colors', 'text', 'muted']),
    ]);
  });

  it('monotonicity on a dark bg: strictly non-increasing token luminance', () => {
    const mapper = createMapper({ tokens: pack, palette: DUMMY_PALETTE, prefersMore: false });
    const assignments = fiveSources.map((sourceColor) => ({
      property: 'color',
      role: 'text-primary',
      sourceColor,
      confidence: 0.5,
      ranked: true,
    }));
    mapper.buildRankTable(assignments);
    const results = assignments.map((a) => mapper.map(a, { resolvedBgColor: PAGE_BG }));
    for (let i = 1; i < results.length; i += 1) {
      expect(luminance(parseColor(results[i - 1].color))).toBeGreaterThanOrEqual(
        luminance(parseColor(results[i].color)) - 1e-9,
      );
    }
  });

  it('monotonicity after repair over a bright bg: collapse-only, never inverted', () => {
    const mapper = createMapper({ tokens: pack, palette: DUMMY_PALETTE, prefersMore: false });
    const assignments = fiveSources.map((sourceColor) => ({
      property: 'color',
      role: 'text-primary',
      sourceColor,
      confidence: 0.5,
      ranked: true,
    }));
    mapper.buildRankTable(assignments);
    const brightBg = C(resolveToken(['colors', 'button', 'primary', 'bg']));
    const results = assignments.map((a) => mapper.map(a, { resolvedBgColor: brightBg }));
    // brightest source passes 4.60:1 at text.default; every dimmer source
    // repairs upward and collapses — never below its brighter neighbor:
    expect(results[0].color).toBe(DEFAULT_TOKEN);
    for (let i = 1; i < results.length; i += 1) {
      expect(luminance(parseColor(results[i - 1].color))).toBeGreaterThanOrEqual(
        luminance(parseColor(results[i].color)) - 1e-9,
      );
    }
    // and a partial collapse over surface: muted token fails 4.5, walks up
    const surfaceBg = C(resolveToken(['colors', 'background', 'elevated']));
    const surfaceResults = assignments.map((a) => mapper.map(a, { resolvedBgColor: surfaceBg }));
    expect(surfaceResults.map((r) => r.color)).toEqual([
      DEFAULT_TOKEN,
      resolveToken(['colors', 'text', 'panel']),
      resolveToken(['colors', 'text', 'soft']),
      resolveToken(['colors', 'text', 'soft']),
      resolveToken(['colors', 'text', 'soft']),
    ]);
  });
});

describe('createMapper — cache and stats (design §8.0/§10)', () => {
  it('caches by (sourceColor, role, property, resolvedBgColor, sizeClass)', () => {
    const mapper = createMapper({ tokens: pack, palette: DUMMY_PALETTE, prefersMore: false });
    const a = { property: 'color', role: 'link', sourceColor: PAGE_SOURCE };
    const bg = PAGE_BG;
    const r1 = mapper.map(a, { resolvedBgColor: bg });
    const r2 = mapper.map(a, { resolvedBgColor: bg });
    expect(r2).toBe(r1); // same cached object
    expect(mapper.stats()).toEqual({ hits: 1, misses: 1, exceptions: 0 });
    // resolvedBgColor is part of the key:
    mapper.map(a, { resolvedBgColor: C(resolveToken(['colors', 'background', 'elevated'])) });
    expect(mapper.stats()).toEqual({ hits: 1, misses: 2, exceptions: 0 });
    // sizeClass is part of the key:
    mapper.map({ ...a, sizeClass: 'large' }, { resolvedBgColor: bg });
    expect(mapper.stats()).toEqual({ hits: 1, misses: 3, exceptions: 0 });
  });

  it('counts exceptions and honors prefersMore from the constructor', () => {
    const mapper = createMapper({ tokens: pack, palette: DUMMY_PALETTE, prefersMore: true });
    const a = { property: 'color', role: 'semantic-warning', sourceColor: PAGE_SOURCE };
    mapper.map(a, { resolvedBgColor: PAGE_BG });
    expect(mapper.stats().exceptions).toBe(1);
    mapper.clear();
    expect(mapper.stats()).toEqual({ hits: 0, misses: 0, exceptions: 0 });
  });

  it('buildRankTable through the mapper drives ranked assignments', () => {
    const mapper = createMapper({ tokens: pack, palette: DUMMY_PALETTE, prefersMore: false });
    // Neither fixture may be a pack value: pack-in short-circuits (§6.3
    // idempotence) BEFORE rank resolution, which would mask the rank pass.
    const bright = C('#f0efe6'); // L ≈ 0.943 — rank 0 → text-primary
    const dim = C('#26271f'); // L ≈ 0.153 — contrast 2.87 vs PAGE_BG fails 4.5 → rank 1
    mapper.buildRankTable([
      { property: 'color', role: 'text-primary', sourceColor: dim, confidence: 0.5, ranked: true },
      { property: 'color', role: 'text-primary', sourceColor: bright, confidence: 0.5, ranked: true },
    ]);
    const rDim = mapper.map({ property: 'color', role: 'text-primary', sourceColor: dim, ranked: true }, { resolvedBgColor: PAGE_BG });
    expect(rDim.role).toBe('text-secondary');
    expect(rDim.color).toBe(resolveToken(['colors', 'text', 'panel']));
    expect(rDim.exception).toBeUndefined(); // text.panel clears 4.5 over #272822
    const rBright = mapper.map({ property: 'color', role: 'text-primary', sourceColor: bright, ranked: true }, { resolvedBgColor: PAGE_BG });
    expect(rBright.role).toBe('text-primary');
    expect(rBright.color).toBe(resolveToken(['colors', 'text', 'default']));
  });

  it('throws informatively on malformed context and unknown role/property pairs', () => {
    expect(() => run({ property: 'color', role: 'link', sourceColor: PAGE_SOURCE }, undefined)).toThrow(/resolvedBgColor/);
    expect(() => run({ property: 'color', role: 'page-background', sourceColor: PAGE_SOURCE }, PAGE_BG)).toThrow(/no ROLE_RULES token path/);
    expect(() => createMapper({})).toThrow(/tokens/);
  });
});
