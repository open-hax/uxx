// SPDX-License-Identifier: GPL-3.0-or-later
// tests/classify.test.js — spec §4.3 tables + skip list (design §12).

import { describe, expect, it } from 'vitest';
import { classify, detectButton } from '../src/lib/classify.js';
import { luminance, parseColor } from '../src/lib/color.js';

const C = (hex) => parseColor(hex);

const PAGE_LUM = luminance(C('#272822')); // ≈ 0.0206

function ctx(overrides = {}) {
  return {
    pageLuminance: PAGE_LUM,
    viewport: { w: 1024, h: 768 },
    prefersMore: false,
    onAccentSurface: false,
    ...overrides,
  };
}

// Inverse WCAG linearization: an opaque gray with the given relative
// luminance (for the button table's |ΔL| edges).
function grayWithLuminance(L) {
  const lin = L;
  const c = lin <= 0.0031308 ? 12.92 * lin : 1.055 * lin ** (1 / 2.4) - 0.055;
  const v = c * 255;
  return { r: v, g: v, b: v, a: 1 };
}

function fact(overrides = {}) {
  return {
    isRoot: false,
    tag: 'div',
    type: null,
    ariaRole: null,
    display: 'block',
    attrs: {
      popover: false,
      ariaModal: false,
      ariaInvalid: null,
      ariaDisabled: false,
      ariaCurrent: null,
      dataSemantic: null,
      href: false,
    },
    background: { color: null, hasImage: false, isGradient: false },
    border: { widthPx: 0, color: null },
    color: null,
    fontSizePx: 16,
    fontWeight: 400,
    rect: { x: 0, y: 0, w: 100, h: 100 },
    viewport: { w: 1024, h: 768 },
    position: 'static',
    blendMode: 'normal',
    filter: 'none',
    backdropFilter: 'none',
    isSvg: false,
    svgBBox: null,
    hasOurs: false,
    visible: true,
    isPlaceholder: false,
    hasOutlineFocus: false,
    isFocused: false,
    inlineImportant: [],
    isTopmost: false,
    ...overrides,
  };
}

const rolesOf = (assignments) => assignments.map((a) => `${a.property}:${a.role}`);
const byProp = (assignments, prop) => assignments.find((a) => a.property === prop);

describe('classify — background rules (first match wins)', () => {
  it('root → page-background', () => {
    const f = fact({ isRoot: true, background: { color: C('#ffffff'), hasImage: false, isGradient: false } });
    expect(byProp(classify(f, ctx()), 'background').role).toBe('page-background');
  });

  it('input/select/textarea → input-surface (bg property only)', () => {
    for (const tag of ['input', 'select', 'textarea']) {
      const f = fact({ tag, type: tag === 'input' ? 'text' : null, background: { color: C('#ffffff'), hasImage: false, isGradient: false } });
      expect(byProp(classify(f, ctx()), 'background').role).toBe('input-surface');
    }
  });

  it('F19 carve-out: input[type=submit] routes to button detection, not input-surface', () => {
    const f = fact({
      tag: 'input',
      type: 'submit',
      background: { color: C('#414339'), hasImage: false, isGradient: false },
      color: C('#f8f8f2'),
    });
    const bg = byProp(classify(f, ctx()), 'background');
    expect(bg.role).toBe('button-secondary');
  });

  it('overlay requires position fixed + ≥90% viewport + translucent + isTopmost', () => {
    const base = {
      position: 'fixed',
      rect: { x: 0, y: 0, w: 1024, h: 768 },
      background: { color: { r: 0, g: 0, b: 0, a: 0.6 }, hasImage: false, isGradient: false },
    };
    expect(byProp(classify(fact({ ...base, isTopmost: true }), ctx()), 'background').role).toBe('overlay');
    // without isTopmost → falls through to the surface fallback (dark bg)
    expect(byProp(classify(fact(base), ctx()), 'background').role).toBe('surface-recessed');
    // opaque fixed → not overlay (alpha ∈ (0,1) required)
    const opaque = fact({ ...base, isTopmost: true, background: { color: C('#000000'), hasImage: false, isGradient: false } });
    expect(byProp(classify(opaque, ctx()), 'background').role).toBe('surface-recessed');
    // <90% coverage → not overlay
    const small = fact({ ...base, isTopmost: true, rect: { x: 0, y: 0, w: 500, h: 500 } });
    expect(byProp(classify(small, ctx()), 'background').role).toBe('surface-recessed');
  });

  it('badge cross-rule 4b: semantic color + tint (0, 0.45] rewrites BOTH properties', () => {
    const f = fact({
      background: { color: { r: 249, g: 38, b: 114, a: 0.15 }, hasImage: false, isGradient: false },
      color: C('#f92672'),
      attrs: { ...fact().attrs, ariaInvalid: 'true' },
    });
    const a = classify(f, ctx());
    expect(byProp(a, 'background').role).toBe('badge-error');
    expect(byProp(a, 'color').role).toBe('badge-error');
    expect(byProp(a, 'background').sourceColor).toEqual(f.background.color);
  });

  it('badge tint band edges: alpha 0.45 → badge, 0.46 → surface fallback', () => {
    const mk = (a) =>
      fact({
        background: { color: { r: 249, g: 38, b: 114, a }, hasImage: false, isGradient: false },
        color: C('#f92672'),
        attrs: { ...fact().attrs, ariaInvalid: 'true' },
      });
    expect(byProp(classify(mk(0.45), ctx()), 'background').role).toBe('badge-error');
    // 0.46: outside the band → fallback; raw luminance of the pink is above
    // the page → 'surface'.
    expect(byProp(classify(mk(0.46), ctx()), 'background').role).toBe('surface');
  });

  it('elevated: dialog tag, [popover], ARIA menu-family roles', () => {
    const bg = { color: C('#ffffff'), hasImage: false, isGradient: false };
    expect(byProp(classify(fact({ tag: 'dialog', background: bg }), ctx()), 'background').role).toBe('elevated');
    expect(byProp(classify(fact({ attrs: { ...fact().attrs, popover: true }, background: bg }), ctx()), 'background').role).toBe('elevated');
    for (const role of ['dialog', 'menu', 'menubar', 'listbox', 'tooltip', 'combobox']) {
      expect(byProp(classify(fact({ ariaRole: role, background: bg }), ctx()), 'background').role).toBe('elevated');
    }
  });

  it('code-surface: pre, block-level code; inline code falls through', () => {
    const bg = { color: C('#ffffff'), hasImage: false, isGradient: false };
    expect(byProp(classify(fact({ tag: 'pre', background: bg }), ctx()), 'background').role).toBe('code-surface');
    expect(byProp(classify(fact({ tag: 'code', display: 'block', background: bg }), ctx()), 'background').role).toBe('code-surface');
    expect(byProp(classify(fact({ tag: 'code', display: 'inline', background: bg }), ctx()), 'background').role).toBe('surface');
  });

  it('surface fallback: luminance below page → surface-recessed, else surface', () => {
    const dark = fact({ background: { color: C('#111111'), hasImage: false, isGradient: false } });
    expect(byProp(classify(dark, ctx()), 'background').role).toBe('surface-recessed');
    const light = fact({ background: { color: C('#eeeeee'), hasImage: false, isGradient: false } });
    expect(byProp(classify(light, ctx()), 'background').role).toBe('surface');
    // just above the page luminance is NOT below → surface
    const same = fact({ background: { color: grayWithLuminance(PAGE_LUM + 0.001), hasImage: false, isGradient: false } });
    expect(byProp(classify(same, ctx()), 'background').role).toBe('surface');
  });
});

describe('classify — button detection table', () => {
  const btn = (bg, color = C('#f8f8f2'), overrides = {}) =>
    fact({ tag: 'button', background: { color: bg, hasImage: false, isGradient: false }, color, ...overrides });

  it('transparent bg → button-ghost on the color channel (bg rule 1 skips transparent)', () => {
    const a = classify(btn({ r: 0, g: 0, b: 0, a: 0 }), ctx());
    expect(byProp(a, 'background')).toBeUndefined(); // rule 1 skip precedes button detection
    expect(byProp(a, 'color').role).toBe('button-ghost');
  });

  it('red/pink chromatic → button-danger; hue 329.9/330 and s 0.34/0.35 edges', () => {
    expect(detectButton(btn(C('#f92672')), ctx())).toBe('button-danger'); // 338°, s=1
    // hue edge at s=0.5
    expect(detectButton(btn(parseColor('hsl(329.9 50% 50%)')), ctx())).toBeNull();
    expect(detectButton(btn(parseColor('hsl(330 50% 50%)')), ctx())).toBe('button-danger');
    expect(detectButton(btn(parseColor('hsl(359.9 50% 50%)')), ctx())).toBe('button-danger');
    expect(detectButton(btn(parseColor('hsl(19.9 50% 50%)')), ctx())).toBe('button-danger');
    expect(detectButton(btn(parseColor('hsl(20 50% 50%)')), ctx())).toBeNull();
    // saturation floor at hue 340
    expect(detectButton(btn(parseColor('hsl(340 34% 50%)')), ctx())).toBeNull();
    expect(detectButton(btn(parseColor('hsl(340 35% 50%)')), ctx())).toBe('button-danger');
  });

  it('neutral + page-adjacent luminance (|ΔL| ≤ 0.06) + fg contrast ≥ 3 → secondary', () => {
    const near = grayWithLuminance(PAGE_LUM + 0.059);
    const far = grayWithLuminance(PAGE_LUM + 0.061);
    expect(detectButton(btn(near), ctx())).toBe('button-secondary');
    expect(detectButton(btn(far), ctx())).toBe('button-primary');
  });

  it('neutral opaque with fg contrast ≥ 3 → button-primary', () => {
    // A truly neutral (s=0) opaque bg further than 0.06 in luminance from
    // the page: note the pack's own #75715e has HSL s≈0.109 and would NOT
    // pass the s<0.10 row — the detector targets PAGE buttons, not pack
    // colors (design §7: matches opacity + neutral hue + contrast).
    expect(detectButton(btn(grayWithLuminance(0.2)), ctx())).toBe('button-primary');
    // fg contrast < 3 → no assignment (never worse than the page)
    expect(detectButton(btn(grayWithLuminance(0.2), grayWithLuminance(0.15)), ctx())).toBeNull();
    // neutral but translucent → no assignment (rows 3/4 require opaque)
    expect(detectButton(btn({ r: 65, g: 67, b: 57, a: 0.5 }), ctx())).toBeNull();
  });

  it('chromatic non-red bg → no bg assignment; color channel falls through', () => {
    const green = parseColor('hsl(120 80% 40%)');
    const greenBtn = btn(green, green);
    expect(detectButton(greenBtn, ctx())).toBeNull();
    const a = classify(greenBtn, ctx());
    expect(byProp(a, 'background')).toBeUndefined();
    // green text on the button → hue cue (button role was null)
    expect(byProp(a, 'color').role).toBe('semantic-success');
  });

  it('ariaRole=button and input[type=button] are button-ish', () => {
    expect(detectButton(fact({ ariaRole: 'button', background: { color: C('#414339'), hasImage: false, isGradient: false }, color: C('#f8f8f2') }), ctx())).toBe('button-secondary');
    expect(detectButton(fact({ tag: 'input', type: 'button', background: { color: grayWithLuminance(0.1), hasImage: false, isGradient: false }, color: C('#ffffff') }), ctx())).toBe('button-primary');
    expect(detectButton(fact({ tag: 'input', type: 'checkbox', background: { color: C('#000000'), hasImage: false, isGradient: false }, color: C('#ffffff') }), ctx())).toBeNull();
  });
});

describe('classify — color (text) rules', () => {
  it('placeholder forcing: isPlaceholder → text-muted regardless of hue', () => {
    const f = fact({ isPlaceholder: true, color: C('#ff0000') });
    expect(byProp(classify(f, ctx()), 'color').role).toBe('text-muted');
    expect(byProp(classify(f, ctx()), 'background')).toBeUndefined();
  });

  it('onAccentSurface → text-inverse, before semantic/hue detectors', () => {
    const f = fact({ color: C('#ffffff'), attrs: { ...fact().attrs, ariaInvalid: 'true' } });
    expect(byProp(classify(f, ctx({ onAccentSurface: true })), 'color').role).toBe('text-inverse');
    const chromatic = fact({ color: parseColor('hsl(120 80% 50%)') });
    expect(byProp(classify(chromatic, ctx({ onAccentSurface: true })), 'color').role).toBe('text-inverse');
  });

  it('semantic detector precedence: aria-invalid beats class cue', () => {
    const f = fact({ color: C('#ff0000'), attrs: { ...fact().attrs, ariaInvalid: 'true', dataSemantic: 'success-banner' } });
    const a = byProp(classify(f, ctx()), 'color');
    expect(a.role).toBe('semantic-error');
    expect(a.confidence).toBeCloseTo(0.9, 5);
  });

  it('ARIA roles: alert/alertdialog → error, status/log → info (conf 0.8)', () => {
    for (const role of ['alert', 'alertdialog']) {
      const a = byProp(classify(fact({ ariaRole: role, color: C('#ffffff') }), ctx()), 'color');
      expect(a.role).toBe('semantic-error');
      expect(a.confidence).toBeCloseTo(0.8, 5);
    }
    for (const role of ['status', 'log']) {
      const a = byProp(classify(fact({ ariaRole: role, color: C('#ffffff') }), ctx()), 'color');
      expect(a.role).toBe('semantic-info');
      expect(a.confidence).toBeCloseTo(0.8, 5);
    }
  });

  it('class cues via attrs.dataSemantic (conf 0.7) with word boundaries', () => {
    const cue = (dataSemantic) =>
      byProp(classify(fact({ color: C('#ffffff'), attrs: { ...fact().attrs, dataSemantic } }), ctx()), 'color').role;
    expect(cue('btn-error')).toBe('semantic-error');
    expect(cue('is-invalid-field')).toBe('semantic-error');
    expect(cue('warning-box')).toBe('semantic-warning');
    expect(cue('status_ok')).toBe('semantic-success');
    expect(cue('note-hint')).toBe('semantic-info');
    // no word boundary → no promotion
    expect(cue('errors')).toBe('text-primary');
    expect(cue('orange')).toBe('text-primary');
  });

  it('link detector runs BEFORE the hue cue (accent-hued non-link text holds)', () => {
    const linkFact = fact({ tag: 'a', color: parseColor('hsl(120 80% 50%)'), attrs: { ...fact().attrs, href: true } });
    const a = byProp(classify(linkFact, ctx()), 'color');
    expect(a.role).toBe('link');
    expect(a.confidence).toBeCloseTo(0.85, 5);
    const roleLink = fact({ ariaRole: 'link', color: parseColor('hsl(30 90% 50%)') });
    expect(byProp(classify(roleLink, ctx()), 'color').role).toBe('link');
    // same hue without href → hue cue
    const nonLink = fact({ tag: 'span', color: parseColor('hsl(120 80% 50%)') });
    expect(byProp(classify(nonLink, ctx()), 'color').role).toBe('semantic-success');
  });

  it('hue cue: all six buckets incl. yellow → accent-yellow, purple/magenta → accent-magenta', () => {
    const hueRole = (h) => byProp(classify(fact({ color: parseColor(`hsl(${h} 90% 50%)`) }), ctx()), 'color').role;
    expect(hueRole(350)).toBe('semantic-error'); // red
    expect(hueRole(30)).toBe('semantic-warning'); // orange
    expect(hueRole(55)).toBe('accent-yellow'); // yellow
    expect(hueRole(120)).toBe('semantic-success'); // green
    expect(hueRole(200)).toBe('semantic-info'); // cyan-blue
    expect(hueRole(300)).toBe('accent-magenta'); // purple-magenta
  });

  it('s = 0.34 does not promote (floor is 0.35); neutral → ranked text', () => {
    const near = fact({ color: parseColor('hsl(200 34% 50%)') });
    const a = byProp(classify(near, ctx()), 'color');
    expect(a.role).toBe('text-primary');
    expect(a.ranked).toBe(true);
    const floor = fact({ color: parseColor('hsl(200 35% 50%)') });
    expect(byProp(classify(floor, ctx()), 'color').role).toBe('semantic-info');
  });

  it('tag code/pre → code-text (chromatic code text is taken by the hue cue first)', () => {
    const plain = fact({ tag: 'code', color: C('#f8f8f2') });
    expect(byProp(classify(plain, ctx()), 'color').role).toBe('code-text');
    const chromatic = fact({ tag: 'code', color: parseColor('hsl(120 90% 50%)') });
    expect(byProp(classify(chromatic, ctx()), 'color').role).toBe('semantic-success');
    const pre = fact({ tag: 'pre', color: C('#f8f8f2') });
    expect(byProp(classify(pre, ctx()), 'color').role).toBe('code-text');
  });

  it('ranked fallback: plain text → provisional text-primary with ranked: true', () => {
    const a = byProp(classify(fact({ color: C('#333333') }), ctx()), 'color');
    expect(a.role).toBe('text-primary');
    expect(a.ranked).toBe(true);
  });
});

describe('classify — outline & border channels', () => {
  it('hasOutlineFocus → focus (its only assignment path)', () => {
    const a = classify(fact({ hasOutlineFocus: true, color: C('#ffffff') }), ctx());
    expect(byProp(a, 'outline').role).toBe('focus');
    expect(classify(fact({ hasOutlineFocus: false, color: C('#ffffff') }), ctx()).some((x) => x.property === 'outline')).toBe(false);
  });

  it('focused element with visible border → border-focus', () => {
    const f = fact({ isFocused: true, border: { widthPx: 2, color: C('#888888') } });
    expect(byProp(classify(f, ctx()), 'border').role).toBe('border-focus');
  });

  it('border contrast vs page: < 2.0 → border-subtle, else border', () => {
    const faint = fact({ border: { widthPx: 1, color: C('#2c2d28') } });
    expect(byProp(classify(faint, ctx()), 'border').role).toBe('border-subtle');
    const strong = fact({ border: { widthPx: 1, color: C('#cccccc') } });
    expect(byProp(classify(strong, ctx()), 'border').role).toBe('border');
  });

  it('border skips: width < 1, null/transparent color, hasOurs', () => {
    expect(classify(fact({ border: { widthPx: 0.5, color: C('#cccccc') } }), ctx()).some((a) => a.property === 'border')).toBe(false);
    expect(classify(fact({ border: { widthPx: 1, color: null } }), ctx()).some((a) => a.property === 'border')).toBe(false);
    expect(classify(fact({ border: { widthPx: 1, color: { r: 0, g: 0, b: 0, a: 0 } } }), ctx()).some((a) => a.property === 'border')).toBe(false);
  });
});

describe('classify — skip list (design §6)', () => {
  it('img/canvas/video/iframe/frame/object/embed and input[type=image] yield []', () => {
    for (const tag of ['img', 'canvas', 'video', 'iframe', 'frame', 'object', 'embed']) {
      const f = fact({
        tag,
        color: C('#ffffff'),
        background: { color: C('#ffffff'), hasImage: false, isGradient: false },
        border: { widthPx: 1, color: C('#cccccc') },
        hasOutlineFocus: true,
      });
      expect(classify(f, ctx()), tag).toEqual([]);
    }
    const imgInput = fact({
      tag: 'input',
      type: 'image',
      color: C('#ffffff'),
      background: { color: C('#ffffff'), hasImage: false, isGradient: false },
    });
    expect(classify(imgInput, ctx())).toEqual([]);
  });

  it('gradient/image bg skips background but keeps text and border', () => {
    const f = fact({
      color: C('#333333'),
      background: { color: C('#ffffff'), hasImage: true, isGradient: true },
      border: { widthPx: 1, color: C('#cccccc') },
    });
    const a = classify(f, ctx());
    expect(byProp(a, 'background')).toBeUndefined();
    expect(byProp(a, 'color').role).toBe('text-primary');
    expect(byProp(a, 'border').role).toBe('border');
  });

  it('transparent bg skips background but keeps text', () => {
    const f = fact({
      color: C('#333333'),
      background: { color: { r: 0, g: 0, b: 0, a: 0 }, hasImage: false, isGradient: false },
    });
    const a = classify(f, ctx());
    expect(byProp(a, 'background')).toBeUndefined();
    expect(byProp(a, 'color').role).toBe('text-primary');
  });

  it('hasOurs (contamination guard) yields []', () => {
    const f = fact({
      hasOurs: true,
      color: C('#ffffff'),
      background: { color: C('#ffffff'), hasImage: false, isGradient: false },
      border: { widthPx: 1, color: C('#cccccc') },
    });
    expect(classify(f, ctx())).toEqual([]);
  });

  it('non-visible facts contribute nothing (placeholder excepted)', () => {
    const f = fact({
      visible: false,
      color: C('#ffffff'),
      background: { color: C('#ffffff'), hasImage: false, isGradient: false },
    });
    expect(classify(f, ctx())).toEqual([]);
    const ph = fact({ visible: false, isPlaceholder: true, color: C('#ffffff') });
    expect(rolesOf(classify(ph, ctx()))).toEqual(['color:text-muted']);
  });

  it('null background color and alpha-0 text skip their channels', () => {
    const f = fact({ color: { r: 1, g: 2, b: 3, a: 0 }, background: { color: null, hasImage: false, isGradient: false } });
    expect(classify(f, ctx())).toEqual([]);
  });
});

describe('classify — output shape', () => {
  it('a rich element yields up to four assignments with the §4.2 shape', () => {
    const f = fact({
      tag: 'input',
      type: 'text',
      color: C('#ffffff'),
      background: { color: C('#eeeeee'), hasImage: false, isGradient: false },
      border: { widthPx: 1, color: C('#cccccc') },
      hasOutlineFocus: true,
    });
    const a = classify(f, ctx());
    expect(a.length).toBe(4);
    for (const as of a) {
      expect(['background', 'color', 'border', 'outline']).toContain(as.property);
      expect(typeof as.role).toBe('string');
      expect(as.sourceColor).toBeTruthy();
      expect(as.confidence).toBeGreaterThanOrEqual(0);
      expect(as.confidence).toBeLessThanOrEqual(1);
    }
    expect(rolesOf(a)).toEqual([
      'background:input-surface',
      'color:text-primary',
      'border:border',
      'outline:focus',
    ]);
    // ranked flag only on the provisional text assignment
    expect(a.find((x) => x.property === 'color').ranked).toBe(true);
    expect(a.find((x) => x.property === 'background').ranked).toBeUndefined();
  });
});
