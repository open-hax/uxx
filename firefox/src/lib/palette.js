// SPDX-License-Identifier: GPL-3.0-or-later
// Sample aggregation (spec §5). DOM-free: no DOM, only color.js imports.

import { composite, deltaE2000, luminance, parseColor } from './color.js';

/**
 * isOurs(color, injectedValues) → boolean.
 * Self-contamination helper (spec §5): exact parsed comparison (with alpha)
 * against the known injected values. Exposed for tests; NOT in the hot path
 * — the element flag (fact.hasOurs) is authoritative (spec-refinement).
 */
export function isOurs(color, injectedValues = []) {
  if (!color) return false;
  return injectedValues.some((v) => {
    const parsed = typeof v === 'string' ? parseColor(v) : v;
    if (!parsed) return false;
    return (
      Math.abs(parsed.r - color.r) < 1e-6 &&
      Math.abs(parsed.g - color.g) < 1e-6 &&
      Math.abs(parsed.b - color.b) < 1e-6 &&
      Math.abs(parsed.a - color.a) < 1e-6
    );
  });
}

// Distinctness dedup: ΔE2000 ≤ 1 collapses (design §8.2 metric).
function dedupe(colors = []) {
  const out = [];
  for (const c of colors) {
    if (!c) continue;
    if (!out.some((o) => deltaE2000(o, c) <= 1)) out.push(c);
  }
  return out;
}

// Median luminance (spec §5 appearance rule). Even counts average the two
// middle values.
function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * aggregate(gridSamples, harvested, cssVars) → PagePalette (spec §5).
 *
 * gridSamples: [{ x, y, color: Color|null, skipped }] — null color (miss /
 * off-viewport / img hit) is dropped. Sample colors composite over what is
 * beneath them in the sample stack (top-down); only opaque composites become
 * background samples.
 *
 * harvested: { textColors, borderColors, linkColors, accents, backgrounds }
 * — already deduped by probe; re-deduped defensively here.
 *
 * PagePalette = { appearance, backgrounds, textColors, borderColors,
 * linkColors, accents, cssVars } — backgrounds dominant first.
 */
export function aggregate(gridSamples = [], harvested = {}, cssVars = {}) {
  const bgCounts = [];
  const bgFirstSeen = [];
  let beneath = null;

  const addBg = (color) => {
    const key = bgCounts.findIndex((e) => deltaE2000(e.color, color) <= 1);
    if (key >= 0) {
      bgCounts[key].count += 1;
    } else {
      bgCounts.push({ color, count: 1 });
      bgFirstSeen.push(bgCounts.length - 1);
    }
  };

  for (const sample of gridSamples || []) {
    if (!sample || sample.skipped || !sample.color) continue;
    const c = beneath ? composite(sample.color, beneath) : { ...sample.color };
    if (c.a >= 1) {
      const opaque = { ...c, a: 1 };
      addBg(opaque);
      beneath = opaque;
    } else {
      // translucent chain kept as the new "beneath"; not a background
      // sample until something opaque lands under (or over) it.
      beneath = c;
    }
  }

  for (const c of dedupe((harvested && harvested.backgrounds) || [])) addBg(c);

  // Dominant first: highest count wins; ties keep first-seen order.
  const ranked = [...bgCounts].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return bgFirstSeen.indexOf(bgCounts.indexOf(a)) - bgFirstSeen.indexOf(bgCounts.indexOf(b));
  });
  const backgrounds = ranked.map((e) => e.color);

  // Appearance: median luminance of composite backgrounds < 0.5 → dark
  // else light (spec-pinned 0.5). Empty list → 'dark' (Monokai pack default;
  // §4.1 round-4 N3 handles the empty-harvest pageLuminance fallback in the
  // content layer).
  const med = median(backgrounds.map((c) => luminance(c)));
  const appearance = med == null ? 'dark' : med < 0.5 ? 'dark' : 'light';

  return {
    appearance,
    backgrounds,
    textColors: dedupe((harvested && harvested.textColors) || []),
    borderColors: dedupe((harvested && harvested.borderColors) || []),
    linkColors: dedupe((harvested && harvested.linkColors) || []),
    accents: dedupe((harvested && harvested.accents) || []),
    cssVars: { ...(cssVars || {}) },
  };
}
