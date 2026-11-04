// SPDX-License-Identifier: GPL-3.0-or-later
//
// src/content/probe.js — DOM adapter (spec §7, design §5/§6/§10).
//
// Reads computed styles and emits Fact records + viewport samples + harvests.
// Module is import-safe in jsdom: no top-level DOM access, everything goes
// through the injected { doc, win, getComputedStyle } seam.
//
// Skip-list discipline (design §6/§10): readFact returns null for
// img/canvas/video and for mix-blend-mode/backdrop-filter/filter subtrees —
// WITHOUT reading descendants' styles (the walk does not descend into a null
// fact, so no style reads happen inside a skipped subtree).

import { parseColor, toHsl } from '../lib/color.js';

// Constants (spec-pinned from design §5/§10).
export const GRID_CELL_PX = 256;
export const GRID_MAX_CELLS = 16;

const SKIP_TAGS = new Set(['img', 'canvas', 'video']);
const SVG_NS = 'http://www.w3.org/2000/svg';

// Inline-!important properties the fact records (drives redirectInline,
// design §6). The redirect sheet implements the color and background-color
// twins (spec §8); border/outline inline importances are recorded but not
// redirectable in v1.
const INLINE_IMPORTANT_PROPERTIES = ['color', 'background-color', 'border-color', 'outline-color'];

function isElement(node) {
  return Boolean(node) && node.nodeType === 1;
}

function styleNumber(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function fontWeightOf(raw) {
  if (raw === 'normal') return 400;
  if (raw === 'bold') return 700;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 400;
}

function colorKey(color) {
  return `${color.r},${color.g},${color.b},${color.a}`;
}

export function createProbe({ doc, win, getComputedStyle = win.getComputedStyle.bind(win) }) {
  // Harvest accumulator — `harvest(fact)` returns only NEW colors (already
  // deduped across calls; exact-equality dedup here, ΔE2000 dedup belongs to
  // palette.js).
  const seen = {
    textColors: new Set(),
    borderColors: new Set(),
    linkColors: new Set(),
    accents: new Set(),
    backgrounds: new Set(),
  };

  function styleOf(el) {
    return getComputedStyle(el);
  }

  function readFact(el) {
    if (!isElement(el)) return null;
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return null;

    // Single computed-style read per element per pass (design §10).
    const style = styleOf(el);

    const blendMode = style.mixBlendMode || 'normal';
    const filter = style.filter || 'none';
    const backdropFilter = style.backdropFilter || 'none';
    if (blendMode !== 'normal' || filter !== 'none' || backdropFilter !== 'none') {
      // Whole subtree skipped by the caller — no descendant style reads.
      return null;
    }

    const isSvgNs = el.namespaceURI === SVG_NS;
    const position = style.position || 'static';
    const viewport = { w: win.innerWidth || 0, h: win.innerHeight || 0 };
    const rawRect = el.getBoundingClientRect
      ? el.getBoundingClientRect()
      : { left: 0, top: 0, width: 0, height: 0 };
    const rect = {
      x: rawRect.left || 0,
      y: rawRect.top || 0,
      w: rawRect.width || 0,
      h: rawRect.height || 0,
    };

    // Background — SVG elements paint fill (spec §7: probe parses fill/stroke
    // into background.color/color; classify decides by bbox < 32×32).
    let background;
    if (isSvgNs) {
      background = { color: parseColor(style.fill), hasImage: false, isGradient: false };
    } else {
      const backgroundImage = style.backgroundImage || 'none';
      const hasImage = backgroundImage !== 'none';
      background = {
        color: parseColor(style.backgroundColor),
        hasImage,
        isGradient: hasImage && /gradient\(/i.test(backgroundImage),
      };
    }

    // Border — widest visible side.
    let border = { widthPx: 0, color: null };
    if (!isSvgNs) {
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        const widthPx = styleNumber(style[`border${side}Width`]);
        if (widthPx > border.widthPx) {
          border = { widthPx, color: parseColor(style[`border${side}Color`]) };
        }
      }
    }

    // Text color — SVG elements paint stroke.
    const color = isSvgNs ? parseColor(style.stroke) : parseColor(style.color);

    const fontSizePx = styleNumber(style.fontSize);
    const fontWeight = fontWeightOf(style.fontWeight);

    // isTopmost overlay-stacking proxy (review F18): probe sets it when
    // doc.elementFromPoint(center) returns the element or a descendant.
    // Only computed for fixed-position elements — the only rule consuming it
    // (classify §4.3 bg rule 4) requires `position: fixed` anyway, and
    // elementFromPoint forces layout on real pages.
    let isTopmost = false;
    if (position === 'fixed' && rect.w > 0 && rect.h > 0 && typeof doc.elementFromPoint === 'function') {
      const cx = Math.round(rect.x + rect.w / 2);
      const cy = Math.round(rect.y + rect.h / 2);
      const hit = doc.elementFromPoint(cx, cy);
      isTopmost = hit === el || (isElement(hit) && el.contains(hit));
    }

    const type = el.getAttribute('type');
    const ariaInvalidRaw = el.getAttribute('aria-invalid');

    const attrs = {
      popover: el.hasAttribute('popover'),
      ariaModal: el.getAttribute('aria-modal') === 'true',
      ariaInvalid: ariaInvalidRaw === null ? null : ariaInvalidRaw === 'false' ? 'false' : 'true',
      ariaDisabled: el.hasAttribute('aria-disabled') && el.getAttribute('aria-disabled') !== 'false',
      ariaCurrent: el.getAttribute('aria-current'),
      dataSemantic: el.getAttribute('data-semantic'),
      href: el.hasAttribute('href'),
    };

    // Self-contamination guard (design §10): any data-uxx* attribute.
    let hasOurs = false;
    for (const attr of Array.from(el.attributes || [])) {
      if (attr.name.startsWith('data-uxx')) {
        hasOurs = true;
        break;
      }
    }

    const visible =
      (style.display || '') !== 'none' &&
      (style.visibility || '') !== 'hidden' &&
      rect.w > 0 &&
      rect.h > 0;

    const hasOutlineFocus =
      (style.outlineStyle || 'none') !== 'none' && styleNumber(style.outlineWidth) > 0;

    const active = doc.activeElement;
    const isFocused = active === el || (isElement(active) && typeof active.contains === 'function' && active.contains(el));

    // Inline-!important properties (design §6, drives redirectInline).
    const inlineImportant = [];
    if (el.style && typeof el.style.getPropertyPriority === 'function') {
      for (const prop of INLINE_IMPORTANT_PROPERTIES) {
        if (
          el.style.getPropertyPriority(prop) === 'important' &&
          el.style.getPropertyValue(prop) !== ''
        ) {
          inlineImportant.push(prop);
        }
      }
    }

    let isSvg = false;
    let svgBBox = null;
    if (isSvgNs) {
      isSvg = true;
      if (typeof el.getBBox === 'function') {
        try {
          const bbox = el.getBBox();
          svgBBox = { w: bbox.width, h: bbox.height };
        } catch {
          svgBBox = null;
        }
      }
    }

    return {
      // Caller (main.js) flips isRoot to false in child frames (design §6).
      isRoot: el === doc.documentElement || el === doc.body,
      tag,
      type: type === null ? null : type.toLowerCase(),
      ariaRole: el.getAttribute('role'),
      display: style.display || 'block',
      attrs,
      background,
      border,
      color,
      fontSizePx,
      fontWeight,
      rect,
      viewport,
      position,
      blendMode,
      filter,
      backdropFilter,
      isSvg,
      svgBBox,
      hasOurs,
      visible,
      // ::placeholder facts are special-cased (spec §8 boot sheet handles the
      // global placeholder token); element facts are never placeholders.
      isPlaceholder: false,
      hasOutlineFocus,
      isFocused,
      inlineImportant,
      isTopmost,
    };
  }

  // 256px cells, capped at 4×4 = 16 samples (spec-pinned geometry, round-3
  // m5): cols = min(4, ceil(vw/256)), rows = min(4, ceil(vh/256)); each cell
  // sampled at its center. The cap is met by shrinking the grid — every page
  // gets equal cell areas. Misses / off-viewport / <img> hits / transparent
  // colors are emitted with color: null, skipped: true (palette.js drops
  // them, design §5).
  function sampleViewportGrid() {
    const samples = [];
    const vw = win.innerWidth || 0;
    const vh = win.innerHeight || 0;
    if (vw <= 0 || vh <= 0 || typeof doc.elementFromPoint !== 'function') {
      return samples;
    }
    const cols = Math.max(1, Math.min(4, Math.ceil(vw / GRID_CELL_PX)));
    const rows = Math.max(1, Math.min(4, Math.ceil(vh / GRID_CELL_PX)));
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const x = Math.round((i + 0.5) * (vw / cols));
        const y = Math.round((j + 0.5) * (vh / rows));
        if (x >= vw || y >= vh) {
          samples.push({ x, y, color: null, skipped: true });
          continue;
        }
        const hit = doc.elementFromPoint(x, y);
        if (!isElement(hit) || hit.tagName.toLowerCase() === 'img') {
          samples.push({ x, y, color: null, skipped: true });
          continue;
        }
        let color = null;
        try {
          color = parseColor(styleOf(hit).backgroundColor);
        } catch {
          color = null;
        }
        samples.push({ x, y, color, skipped: color === null });
      }
    }
    return samples;
  }

  // Harvest distinct fg/border/link/accent/bg colors from a fact (design
  // §5(c)). Skips hasOurs (self-contamination guard — the element flag is
  // authoritative, spec §5). Returns only NEW colors since the previous call;
  // the caller merges the buckets into the `harvested` record.
  function harvest(fact) {
    const out = {
      textColors: [],
      borderColors: [],
      linkColors: [],
      accents: [],
      backgrounds: [],
    };
    if (!fact || fact.hasOurs) return out;
    const pushNew = (bucket, color) => {
      if (!color) return;
      const key = colorKey(color);
      if (seen[bucket].has(key)) return;
      seen[bucket].add(key);
      out[bucket].push(color);
    };
    pushNew('textColors', fact.color);
    pushNew('borderColors', fact.border ? fact.border.color : null);
    if (fact.attrs && fact.attrs.href) {
      pushNew('linkColors', fact.color);
    }
    if (fact.color) {
      // Accents: chromatic harvested text (saturation floor matches the
      // §8.4 hue-cue floor, spec §4.3 color rule 5).
      if (toHsl(fact.color).s >= 0.35) {
        pushNew('accents', fact.color);
      }
    }
    pushNew('backgrounds', fact.background ? fact.background.color : null);
    return out;
  }

  function collectVarRules(rules, out) {
    for (const rule of rules) {
      if (rule.style && typeof rule.style.item === 'function') {
        for (let i = 0; i < rule.style.length; i += 1) {
          const name = rule.style.item(i);
          if (name && name.startsWith('--')) {
            const color = parseColor(String(rule.style.getPropertyValue(name)).trim());
            if (color) out[name] = color;
          }
        }
      }
      if (rule.cssRules) {
        try {
          collectVarRules(rule.cssRules, out);
        } catch {
          // Nested cross-origin sheet — dropped, not fatal.
        }
      }
    }
  }

  // Walk EVERY rule of every accessible stylesheet (design §5(d), review F8 —
  // no :root restriction) collecting custom properties whose values parse as
  // colors; cross-origin sheets raise SecurityError on cssRules access and
  // are dropped, not fatal. Plus documentElement's inline custom properties.
  // (cssVars are collected but unconsumed in v1 — round-3 m3.)
  function collectCssVars(root = doc.documentElement) {
    const out = {};
    const sheets = doc.styleSheets ? Array.from(doc.styleSheets) : [];
    for (const sheet of sheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // SecurityError — dropped, not fatal.
      }
      if (!rules) continue;
      try {
        collectVarRules(rules, out);
      } catch {
        // Malformed sheet — dropped, not fatal.
      }
    }
    if (root && root.style && typeof root.style.item === 'function') {
      for (let i = 0; i < root.style.length; i += 1) {
        const name = root.style.item(i);
        if (name && name.startsWith('--')) {
          const color = parseColor(String(root.style.getPropertyValue(name)).trim());
          if (color) out[name] = color;
        }
      }
    }
    return out;
  }

  // WCAG large-text boundary (spec §3 sizeClassOf): ≥24px, or ≥18.66px bold.
  function measureSizeClass(fact) {
    return fact.fontSizePx >= 24 || (fact.fontSizePx >= 18.66 && fact.fontWeight >= 700)
      ? 'large'
      : 'normal';
  }

  function prefersContrastMore() {
    if (typeof win.matchMedia !== 'function') return false;
    const mq = win.matchMedia('(prefers-contrast: more)');
    return Boolean(mq && mq.matches);
  }

  return {
    readFact,
    sampleViewportGrid,
    harvest,
    collectCssVars,
    measureSizeClass,
    prefersContrastMore,
  };
}
