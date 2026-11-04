// SPDX-License-Identifier: GPL-3.0-or-later
// Fact → role classification, DOM-free (spec §4). No DOM, no imports.

import { contrast, isTransparent, luminance, toHsl } from './color.js';

// Tags whose elements get no marker at all (spec §4.3 background rule 1 —
// "no marker at all"): raster/plugin content and frames.
const MEDIA_TAGS = new Set(['img', 'canvas', 'video', 'iframe', 'frame', 'object', 'embed']);
const BUTTON_INPUT_TYPES = new Set(['button', 'submit', 'reset']);
const ELEVATED_ARIA_ROLES = new Set(['dialog', 'menu', 'menubar', 'listbox', 'tooltip', 'combobox']);
const SEMANTIC_ROLES = new Set(['semantic-error', 'semantic-warning', 'semantic-success', 'semantic-info']);

// class-token cues (spec §4.3 color rule 5) — the only roles that may use
// class names. The Fact record carries the cue string in attrs.dataSemantic.
const CLASS_CUES = [
  [/(^|[\s_-])(error|danger|invalid|failed|destructive)([\s_-]|$)/i, 'semantic-error'],
  [/(^|[\s_-])(warn|warning|caution)([\s_-]|$)/i, 'semantic-warning'],
  [/(^|[\s_-])(success|succeed|valid|confirmed|ok)([\s_-]|$)/i, 'semantic-success'],
  [/(^|[\s_-])(info|note|hint)([\s_-]|$)/i, 'semantic-info'],
];

// §8.4 hue-cue targets (spec §4.3 color rule 5) — every bucket handled
// (review F3); yellow and purple/magenta land on the accent-* roles.
const HUE_ROLE = {
  red: 'semantic-error',
  orange: 'semantic-warning',
  green: 'semantic-success',
  'cyan-blue': 'semantic-info',
  yellow: 'accent-yellow',
  'purple-magenta': 'accent-magenta',
};

const BADGE_KIND = {
  'semantic-error': 'badge-error',
  'semantic-warning': 'badge-warning',
  'semantic-success': 'badge-success',
  'semantic-info': 'badge-info',
};

/**
 * detectButton(fact, ctx) → button-* role | null (spec §4.3 button table).
 * Fires for tag==='button', input[type ∈ {button,submit,reset}], or
 * ariaRole==='button'; classifies the element's OWN bg color.
 */
export function detectButton(fact, ctx) {
  const buttonish =
    fact.tag === 'button' ||
    (fact.tag === 'input' && BUTTON_INPUT_TYPES.has(fact.type)) ||
    fact.ariaRole === 'button';
  if (!buttonish) return null;
  const bg = fact.background && fact.background.color;
  if (!bg || isTransparent(bg) || bg.a === 0) return 'button-ghost';
  const hsl = toHsl(bg);
  // red/pink, covers Monokai #f92672 at 338° (spec-pinned thresholds).
  if (hsl.s >= 0.35 && (hsl.h >= 330 || hsl.h < 20)) return 'button-danger';
  const opaque = bg.a === 1;
  const fg = fact.color;
  const fgOk = fg != null && contrast(fg, bg) >= 3;
  if (hsl.s < 0.1 && opaque) {
    const delta = Math.abs(luminance(bg) - ctx.pageLuminance);
    if (delta <= 0.06 && fgOk) return 'button-secondary';
    if (fgOk) return 'button-primary';
  }
  return null;
}

function isButtonish(fact) {
  return (
    fact.tag === 'button' ||
    (fact.tag === 'input' && BUTTON_INPUT_TYPES.has(fact.type)) ||
    fact.ariaRole === 'button'
  );
}

// Color (text) channel — spec §4.3 color rules. Returns
// { role, confidence, ranked? } | null. Link runs before the hue cue
// (spec-pinned: "accent-hued non-link text" must hold).
function classifyColor(fact, ctx, buttonRole) {
  const fg = fact.color;
  if (!fg || isTransparent(fg)) return null; // alpha 0
  if (fact.hasOurs) return null;
  if (!fact.visible && !fact.isPlaceholder) return null;
  if (fact.isPlaceholder) return { role: 'text-muted', confidence: 1.0 }; // forced
  if (buttonRole) return { role: buttonRole, confidence: 0.8 };
  if (ctx.onAccentSurface) return { role: 'text-inverse', confidence: 0.9 };
  if (fact.attrs && fact.attrs.ariaInvalid === 'true') {
    return { role: 'semantic-error', confidence: 0.9 };
  }
  const ariaRole = fact.ariaRole;
  if (ariaRole === 'alert' || ariaRole === 'alertdialog') {
    return { role: 'semantic-error', confidence: 0.8 };
  }
  if (ariaRole === 'status' || ariaRole === 'log') {
    return { role: 'semantic-info', confidence: 0.8 };
  }
  const cueSource = (fact.attrs && fact.attrs.dataSemantic) || '';
  for (const [re, role] of CLASS_CUES) {
    if (re.test(cueSource)) return { role, confidence: 0.7 };
  }
  // Link detector (spec §4.3 color rule 6) — before the hue cue.
  if ((fact.attrs && fact.attrs.href) || ariaRole === 'link') {
    return { role: 'link', confidence: 0.85 };
  }
  // Hue cue (§8.4): non-link chromatic text maps by bucket; neutral does
  // not promote (it reaches text.secondary through the rank pass).
  const hsl = toHsl(fg);
  if (hsl.s >= 0.35) {
    const bucket = bucketOf(hsl.h, hsl.s);
    const role = HUE_ROLE[bucket];
    if (role) return { role, confidence: 0.6 };
  }
  if (fact.tag === 'code' || fact.tag === 'pre') {
    return { role: 'code-text', confidence: 0.9 };
  }
  // Ranked fallback (spec §4.3 color rule 8): provisional text-primary,
  // final role decided by the page-wide rank pass (§6.2).
  return { role: 'text-primary', confidence: 0.5, ranked: true };
}

// Same bucket logic as color.js hueBucket, but s is already known (avoids
// recomputing and keeps the s >= 0.35 floor in one place).
function bucketOf(h, s) {
  if (s < 0.1) return 'neutral';
  if (h >= 345 || h < 15) return 'red';
  if (h < 45) return 'orange';
  if (h < 70) return 'yellow';
  if (h < 165) return 'green';
  if (h < 260) return 'cyan-blue';
  return 'purple-magenta';
}

// Background channel — spec §4.3 background rules. Returns
// { role, confidence, colorRole? } | null; colorRole rewrites the color
// assignment (badge cross-rule 4b).
function classifyBackground(fact, ctx, colorA, buttonRole) {
  const bg = fact.background && fact.background.color;
  if (!fact.visible) return null;
  if (!bg || isTransparent(bg)) return null;
  if (fact.background.hasImage || fact.background.isGradient) return null;
  if (fact.hasOurs) return null;
  if (fact.isRoot) return { role: 'page-background', confidence: 1.0 };
  // Buttons are NOT backgrounds here (spec §4.3 rule 8): button-ish tags
  // route through detectButton before rules 3–7; null ⇒ no bg assignment.
  if (isButtonish(fact)) {
    return buttonRole ? { role: buttonRole, confidence: 0.8 } : null;
  }
  // spec-refinement (review F19): input[type ∈ {button,submit,reset}] is
  // caught by isButtonish above; remaining input/select/textarea are fields.
  if (fact.tag === 'input' || fact.tag === 'select' || fact.tag === 'textarea') {
    return { role: 'input-surface', confidence: 0.9 };
  }
  const vp = ctx.viewport || fact.viewport || { w: 0, h: 0 };
  const rect = fact.rect || { w: 0, h: 0 };
  const coversViewport = vp.w > 0 && vp.h > 0 && rect.w * rect.h >= 0.9 * vp.w * vp.h;
  if (
    fact.position === 'fixed' &&
    coversViewport &&
    bg.a > 0 &&
    bg.a < 1 &&
    fact.isTopmost
  ) {
    return { role: 'overlay', confidence: 0.7 };
  }
  // 4b badge cross-rule: semantic color + tinted bg ⇒ badge-* both channels.
  if (colorA && SEMANTIC_ROLES.has(colorA.role) && bg.a > 0 && bg.a <= 0.45) {
    const badge = BADGE_KIND[colorA.role];
    return { role: badge, confidence: 0.7, colorRole: badge };
  }
  if (
    fact.tag === 'dialog' ||
    (fact.attrs && fact.attrs.popover) ||
    (fact.ariaRole && ELEVATED_ARIA_ROLES.has(fact.ariaRole))
  ) {
    return { role: 'elevated', confidence: 0.8 };
  }
  if (fact.tag === 'pre' || (fact.tag === 'code' && fact.display !== 'inline')) {
    return { role: 'code-surface', confidence: 0.8 };
  }
  // Fallback (evaluated last — design §7.1).
  return {
    role: luminance(bg) < ctx.pageLuminance ? 'surface-recessed' : 'surface',
    confidence: 0.6,
  };
}

// Outline channel (spec §4.3 outline rule 1).
function classifyOutline(fact) {
  if (!fact.hasOutlineFocus) return null;
  return { role: 'focus', confidence: 0.9 };
}

// Border channel (spec §4.3 border rules).
function classifyBorder(fact, ctx) {
  const border = fact.border || {};
  const color = border.color;
  if (!(border.widthPx >= 1)) return null;
  if (!color || isTransparent(color) || fact.hasOurs) return null;
  if (fact.isFocused) return { role: 'border-focus', confidence: 0.9 };
  const lb = luminance(color);
  const lp = ctx.pageLuminance;
  const ratio = (Math.max(lb, lp) + 0.05) / (Math.min(lb, lp) + 0.05);
  return { role: ratio < 2.0 ? 'border-subtle' : 'border', confidence: 0.7 };
}

/**
 * classify(fact, ctx) → Assignment[] (spec §4.2).
 * Assignment = { property, role, sourceColor, confidence, ranked? }.
 * Returns [] when the fact contributes nothing (skip list, design §6).
 * Color rules run before background rules (badge cross-rule 4b consults
 * the color assignment).
 */
export function classify(fact, ctx) {
  if (!fact || !ctx) return [];
  // Media/plugin tags: no marker at all (spec §4.3 background rule 1).
  if (MEDIA_TAGS.has(fact.tag)) return [];
  if (fact.tag === 'input' && fact.type === 'image') return [];
  if (fact.hasOurs) return [];
  const buttonRole = detectButton(fact, ctx);
  const colorA = classifyColor(fact, ctx, buttonRole);
  const bgA = classifyBackground(fact, ctx, colorA, buttonRole);
  const outlineA = classifyOutline(fact);
  const borderA = classifyBorder(fact, ctx);
  const out = [];
  if (bgA) {
    out.push({
      property: 'background',
      role: bgA.role,
      sourceColor: fact.background.color,
      confidence: bgA.confidence,
    });
  }
  if (colorA) {
    out.push({
      property: 'color',
      role: bgA && bgA.colorRole ? bgA.colorRole : colorA.role,
      sourceColor: fact.color,
      confidence: colorA.confidence,
      ...(colorA.ranked ? { ranked: true } : {}),
    });
  }
  if (borderA) {
    out.push({
      property: 'border',
      role: borderA.role,
      sourceColor: fact.border.color,
      confidence: borderA.confidence,
    });
  }
  if (outlineA) {
    out.push({
      property: 'outline',
      role: outlineA.role,
      sourceColor: (fact.border && fact.border.color) || fact.color || { r: 0, g: 0, b: 0, a: 0 },
      confidence: outlineA.confidence,
    });
  }
  return out;
}
