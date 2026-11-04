// SPDX-License-Identifier: GPL-3.0-or-later
//
// src/content/main.js — orchestrator (spec §9, design §5/§9.3/§10).
//
// Pipeline: sync boot at document_start → state handshake (2000ms fail-open)
// → DOMContentLoaded + layout gate → DETECT (sheets disabled) → CLASSIFY →
// RANK → MAP+APPLY (top-down, multi-role union markers) → steady state
// (rAF-batched MutationObserver with breaker/backoff/teardown-loop guards).
//
// Module side effects are limited to a single guarded autostart at the bottom.

import { createProbe } from './probe.js';
import { createApply } from './apply.js';
import * as tokensModule from '../theme/tokens.js';
import * as rolesModule from '../theme/roles.js';

const { pack, resolveToken } = tokensModule;
import { classify } from '../lib/classify.js';
import { aggregate } from '../lib/palette.js';
import { createMapper } from '../lib/map.js';
import { luminance, composite, parseColor, toHsl, hueBucket } from '../lib/color.js';
import * as cache from './cache.js';

// ── Constants (design §10 — all named) ────────────────────────────────────
export const MAX_ELEMENTS = 15000;
export const TIME_TRIP_MS = 3000;
export const FRAME_MAX_ELEMENTS = 500;
export const FRAME_BUDGET_MS = 5;
export const RESCAN_THRESHOLD = 1000;
export const BREAKER_MUTATIONS = 50;
export const BREAKER_WINDOW_MS = 10000;
export const BREAKER_BACKOFF_MS = 2000;
export const TEARDOWN_LIMIT = 10; // per-container, per 10s (design §6)
export const TEARDOWN_WINDOW_MS = 10000;
export const HANDSHAKE_TIMEOUT_MS = 2000;
export const LAYOUT_MIN_PX = 32; // body.scrollHeight/clientHeight gate
export const LAYOUT_POLL_MS = 50; // spec-pinned (review F7)
export const LAYOUT_TIMEOUT_MS = 5000; // spec-pinned (review F7)

const PROPERTY_ORDER = { background: 0, color: 1, border: 2, outline: 3 };

// ── Messaging API resolution (spec §9.4) ──────────────────────────────────
export function getApi() {
  return globalThis.browser ?? globalThis.chrome ?? null;
}

// DETECT protocol (design §5 DETECT (a), research B §1.2): our injected
// sheets are disabled during sampling so they cannot contaminate the
// measurement, re-enabled in `finally`.
export function withSheetsDisabled(sheets, fn) {
  const disabled = [];
  try {
    for (const el of sheets || []) {
      const sheet = el && el.sheet;
      if (sheet) {
        sheet.disabled = true;
        disabled.push(sheet);
      }
    }
    return fn();
  } finally {
    for (const sheet of disabled) {
      sheet.disabled = false;
    }
  }
}

// onAccentSurface predicate (spec §4.1, review F1/F6) — the content layer
// computes it against the *mapped* ancestor chain, excluding the element
// itself. True iff the nearest opaque mapped ancestor background role is
// button-danger, OR the composited resolved background is chromatic
// (s ≥ 0.35, non-neutral bucket) with luminance ≥ 0.20.
export function isOnAccentSurface(chain, resolvedBg) {
  let nearestOpaqueRole = null;
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    if (chain[i].opaque) {
      nearestOpaqueRole = chain[i].role;
      break;
    }
  }
  if (nearestOpaqueRole === 'button-danger') return true;
  if (!resolvedBg) return false;
  const { s } = toHsl(resolvedBg);
  return s >= 0.35 && hueBucket(resolvedBg) !== 'neutral' && luminance(resolvedBg) >= 0.20;
}

// Pre-order DOM walk over documentElement + open shadow roots.
// `visit(el, depth)` returns false to prune the subtree (skip list: no style
// reads inside blended/filtered/raster subtrees, design §6/§10).
// EXPORTED (spec §14.3): `cache.canonicalWalk` must be order-identical to
// this traversal, and the order-parity test compares them directly.
export function forEachElement(doc, visit) {
  const walk = (root, depth) => {
    let child = root.firstElementChild;
    while (child) {
      const descend = visit(child, depth);
      if (descend !== false) {
        walk(child, depth + 1);
        if (child.shadowRoot) walk(child.shadowRoot, depth + 1);
      }
      child = child.nextElementSibling;
    }
  };
  const root = doc.documentElement;
  if (!root) return;
  if (visit(root, 0) !== false) {
    walk(root, 1);
    if (root.shadowRoot) walk(root.shadowRoot, 1);
  }
}

// Layout-readiness gate (design §5, research B §1.2 canCheckForStyle).
// spec-pinned (review F7): poll every 50ms, cap 5000ms; on cap, resolve
// false — the caller proceeds WITHOUT the degraded marker (`data-uxx-degraded`
// is reserved for the MAX_ELEMENTS/TIME_TRIP conditions).
function waitUntilReady(doc, win, timeoutMs = LAYOUT_TIMEOUT_MS, pollMs = LAYOUT_POLL_MS) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const check = () => {
      const body = doc.body;
      const ready = doc.readyState !== 'loading';
      const laidOut =
        Boolean(body) &&
        body.scrollHeight >= LAYOUT_MIN_PX &&
        body.clientHeight >= LAYOUT_MIN_PX &&
        body.childElementCount > 0;
      if (ready && laidOut) {
        resolve(true);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }
      win.setTimeout(check, pollMs);
    };
    check();
  });
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('handshake timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Guarded media-query read for the cache key (design §15.1, review round-2
// (a)). No `matchMedia` (or it throws) → the neutral default. Matches the
// guard `probe.prefersContrastMore` already uses.
export function mediaState(win, query, whenMatches, whenNoMatch) {
  try {
    if (!win || typeof win.matchMedia !== 'function') return whenNoMatch;
    const mq = win.matchMedia(query);
    return mq && mq.matches ? whenMatches : whenNoMatch;
  } catch {
    return whenNoMatch;
  }
}

// Extension version for the cache key (design §15.1). Pack/role/classify
// changes must not replay, so a version bump invalidates every entry.
function cacheVersion(api) {
  try {
    if (api && api.runtime && typeof api.runtime.getManifest === 'function') {
      const manifest = api.runtime.getManifest();
      if (manifest && typeof manifest.version === 'string' && manifest.version) return manifest.version;
    }
  } catch {
    /* fall through */
  }
  return 'dev'; // jsdom / no manifest — stable across runs, so tests still hit
}

function sortAssignments(assignments) {
  return [...assignments].sort(
    (a, b) => (PROPERTY_ORDER[a.property] ?? 99) - (PROPERTY_ORDER[b.property] ?? 99),
  );
}

// ── Observer self-ignore (spec §9.3 step 8, review F9) ────────────────────
export function isIgnoredMutation(record) {
  const attr = record.attributeName || null;
  if (attr && attr.startsWith('data-uxx')) return true;
  const targets = [];
  if (record.target && record.target.nodeType === 1) targets.push(record.target);
  for (const node of Array.from(record.addedNodes || [])) {
    if (node && node.nodeType === 1) targets.push(node);
  }
  for (const target of targets) {
    let ours = false;
    for (const a of Array.from(target.attributes || [])) {
      if (a.name.startsWith('data-uxx')) {
        ours = true;
        break;
      }
    }
    if (ours) return true;
    // F9 correctness check: our --uxx-* custom-prop writes go through
    // el.style.setProperty, which mutates the style *attribute* and IS
    // observed — a style-attribute record is skipped when the attribute
    // contains `--uxx-`, without which a --uxx- write with no co-located
    // marker would retrigger the loop.
    if (attr === 'style' && typeof target.getAttribute === 'function') {
      const styleAttr = target.getAttribute('style');
      if (styleAttr && styleAttr.includes('--uxx-')) return true;
    }
  }
  return false;
}

function noteTeardown(session, container) {
  if (!container) return;
  const now = Date.now();
  let stamps = session.teardowns.get(container);
  if (!stamps) {
    stamps = [];
    session.teardowns.set(container, stamps);
  }
  const recent = stamps.filter((t) => now - t <= TEARDOWN_WINDOW_MS);
  recent.push(now);
  stamps.length = 0;
  stamps.push(...recent);
  // Teardown-loop guard (design §6): frameworks that re-render on any
  // attribute write → stop writing to that container.
  if (recent.length >= TEARDOWN_LIMIT) session.suspended.add(container);
}

export function handleMutations(records, session) {
  const now = Date.now();
  session.burst = (session.burst || []).filter((t) => now - t < BREAKER_WINDOW_MS);
  if (session.burst.length >= BREAKER_MUTATIONS) {
    session.backoffUntil = now + BREAKER_BACKOFF_MS;
    session.burst = [];
    return { accepted: 0, rescan: false, breaker: true };
  }
  if (session.backoffUntil && now < session.backoffUntil) {
    return { accepted: 0, rescan: false, backoff: true };
  }
  if (session.doc.hidden) {
    deferUntilVisible(session);
    return { accepted: 0, rescan: false, deferred: true };
  }
  let accepted = 0;
  for (const record of records) {
    if (isIgnoredMutation(record)) continue;
    accepted += 1;
    session.burst.push(now); // BREAKER_MUTATIONS counts records, not batches
    session.queue.push(record);
    if (record.type === 'childList') {
      for (const node of Array.from(record.addedNodes || [])) {
        if (node.nodeType === 1) session.pending.add(node);
      }
      for (const node of Array.from(record.removedNodes || [])) {
        if (
          node.nodeType === 1 &&
          typeof node.hasAttribute === 'function' &&
          node.hasAttribute('data-uxx-role')
        ) {
          noteTeardown(session, record.target);
        }
      }
    } else if (record.type === 'attributes' && record.target && record.target.nodeType === 1) {
      session.pending.add(record.target);
    }
  }
  const rescan = session.queue.length > RESCAN_THRESHOLD;
  scheduleFrame(session);
  return { accepted, rescan };
}

function deferUntilVisible(session) {
  if (session.visibilityHooked) return;
  session.visibilityHooked = true;
  const onVisible = () => {
    if (!session.doc.hidden) {
      session.doc.removeEventListener('visibilitychange', onVisible);
      session.visibilityHooked = false;
      scheduleFrame(session);
    }
  };
  session.doc.addEventListener('visibilitychange', onVisible);
}

function scheduleFrame(session) {
  if (session.frameScheduled || session.pending.size === 0) return;
  session.frameScheduled = true;
  const win = session.win;
  const schedule =
    typeof win.requestAnimationFrame === 'function'
      ? (cb) => win.requestAnimationFrame(cb)
      : (cb) => setTimeout(cb, 16);
  schedule(() => {
    session.frameScheduled = false;
    processFrame(session);
  });
}

// rAF-batch: process ≤ FRAME_MAX_ELEMENTS or FRAME_BUDGET_MS per frame,
// remainder queued to the next frame.
export function processFrame(session) {
  const started = Date.now();
  if (session.queue.length > RESCAN_THRESHOLD) {
    session.queue.length = 0;
    session.pending.clear();
    if (typeof session.rescanAll === 'function') session.rescanAll();
    return { processed: 0, rescan: true };
  }
  session.queue.length = 0;
  const targets = Array.from(session.pending);
  session.pending.clear();
  let processed = 0;
  for (const target of targets) {
    if (processed >= FRAME_MAX_ELEMENTS || Date.now() - started >= FRAME_BUDGET_MS) {
      session.pending.add(target); // remainder queued to next frame
      continue;
    }
    if (session.suspended.has(target)) continue;
    if (typeof session.applyElement === 'function') session.applyElement(target);
    processed += 1;
  }
  if (session.pending.size > 0) scheduleFrame(session);
  return { processed, rescan: false };
}

export function stopSession(session) {
  if (session.observer) {
    session.observer.disconnect();
    session.observer = null;
  }
  session.pending.clear();
  session.queue.length = 0;
}

/**
 * buildSession({...}) — the shared steady-state constructor (spec §14.5,
 * review R8). Extracted from runPipeline's tail so the cache-hit path and
 * the full path build a byte-identical session: same field set, same
 * `applyElement` closure (rankTable passed PER CALL, which is what makes a
 * restored `new Map(entry.rt)` reproduce ranked-text behaviour), same
 * `rescanAll`, same observer config.
 */
export function buildSession({
  doc,
  win,
  api,
  apply,
  probe,
  mapper,
  rankTable,
  palette,
  degraded,
  pageBg,
  pageLuminance,
  viewport,
  prefersMore,
}) {
  const session = {
    doc,
    win,
    api,
    apply,
    probe,
    mapper,
    rankTable,
    palette,
    degraded,
    pageBg,
    pageLuminance,
    viewport,
    prefersMore,
    queue: [],
    pending: new Set(),
    burst: [],
    frameScheduled: false,
    backoffUntil: 0,
    visibilityHooked: false,
    suspended: new WeakSet(),
    teardowns: new WeakMap(),
    observer: null,
    messageListener: null,
    tornDown: false,
  };

  // Incremental re-apply (v1 approximation: single-element pass reusing the
  // page-level mapper + rank table; the full chain is recomputed only by a
  // whole-root rescan).
  session.applyElement = (el) => {
    if (!el || el.nodeType !== 1 || session.suspended.has(el)) return;
    const fact = probe.readFact(el);
    if (!fact) return;
    const sizeClass = probe.measureSizeClass(fact);
    const assignments = classify(fact, {
      pageLuminance,
      viewport,
      prefersMore,
      onAccentSurface: false,
    }).map((a) => ({ ...a, sizeClass }));
    for (const assignment of sortAssignments(assignments)) {
      const mapped = mapper.map(assignment, {
        resolvedBgColor: pageBg,
        ancestorChain: [],
        rankTable,
        prefersMore,
      });
      if (mapped.role) apply.mark(el, mapped.role);
      if (mapped.exception) apply.setException(el);
    }
  };
  session.rescanAll = () => {
    forEachElement(doc, (el) => {
      session.applyElement(el);
      return true;
    });
  };

  session.observer = new win.MutationObserver((records) => handleMutations(records, session));
  session.observe = () =>
    session.observer.observe(doc.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  session.observe();
  return session;
}

/**
 * applyCached(entry, ctx) — the cache-REPLAY path (design §15.6). Replays
 * final per-element effects from `entry.e` via the canonical walk's element
 * array. No readFact, no getComputedStyle, no getBoundingClientRect.
 *
 * Throws are the CALLER's responsibility: spec §9.3 step 3.5 wraps this in
 * try/catch → apply.teardown() + injectBoot() + fall through to the full
 * pipeline (teardown restores the root inline style and purges every
 * data-uxx*, so the subsequent harvest is clean).
 */
export function applyCached(entry, { doc, win, api, apply, probe, walk, lookupKey, prefersMore, viewport }) {
  apply.ensureRoleSheet();
  apply.ensureInlineSheet();

  for (const rec of cache.decodeEffects(entry)) {
    const el = walk.elements[rec.idx];
    if (!el) continue; // DOM shrank since the cached load — skip
    for (const role of rec.roles) apply.mark(el, role);
    if (rec.exception) apply.setException(el);
    for (const [property, color] of rec.inline) apply.redirectInline(el, property, color);
  }

  // Restore the aggregates so the MutationObserver session behaves exactly
  // as after a full run (createMapper starts with an EMPTY internal table;
  // applyElement passes rankTable per call, so the restored Map is what
  // ranked text uses). `pal`/`rt`/`bg`/`lum` come from the entry;
  // `prefersMore`/`viewport` are the hoisted key inputs — the entry shape
  // (design §15.4) deliberately does NOT carry them (they are key
  // components, already validated by `lookupKey` equality).
  const palette = entry.pal;
  const rankTable = new Map(entry.rt);
  const mapper = createMapper({ tokens: pack, palette, prefersMore });

  const session = buildSession({
    doc,
    win,
    api,
    apply,
    probe,
    mapper,
    rankTable,
    palette,
    degraded: false,
    pageBg: entry.bg,
    pageLuminance: entry.lum,
    viewport,
    prefersMore,
  });

  // Touch `t` so LRU keeps hot pages (entry-only write; no index to race).
  cache.touch(api, lookupKey, entry);
  return session;
}

/**
 * runPipeline({ doc, win, api?, apply?, probe? }) → session
 *
 * DETECT → CLASSIFY → RANK → MAP+APPLY → steady state. The handshake and
 * boot sheet belong to start(); tests may call runPipeline directly with
 * injected fakes.
 */
export async function runPipeline({ doc, win, api = null, apply = null, probe = null } = {}) {
  const activeApply = apply || createApply({ doc, tokens: tokensModule, roles: rolesModule });
  const activeProbe = probe || createProbe({ doc, win });

  // Step 2: DOMContentLoaded + layout gate.
  await waitUntilReady(doc, win);

  const isTopFrame = (() => {
    try {
      return win.top === win;
    } catch {
      return false;
    }
  })();

  // Step 3: style cache lookup (design §15, spec §14.5) — EXACTLY §14.5's
  // order. All six steps below are in the pipeline's only cache-touching
  // region; everything else is the same code that ran before the cache.
  //
  // 3.1 Hoist the key inputs BEFORE any hash or walk. All cheap, none depends
  //     on DETECT. Every media read is neutral-defaulted on failure so a page
  //     with a broken/absent `matchMedia` can never kill the pipeline (review
  //     round-2 (a)) — no matchMedia → 'light'/'none'/false, the same guard
  //     probe.prefersContrastMore uses, now wrapped so a THROWING matchMedia
  //     is also neutral rather than fatal.
  const viewport = { w: win.innerWidth || 0, h: win.innerHeight || 0 };
  let prefersMore = false;
  try {
    prefersMore = activeProbe.prefersContrastMore() === true;
  } catch {
    prefersMore = false;
  }
  const prefersColorScheme = mediaState(win, '(prefers-color-scheme: dark)', 'dark', 'light');
  const forcedColors = mediaState(win, '(forced-colors: active)', 'active', 'none');
  const version = cacheVersion(api);

  // 3.2 Coarse key — carries NO hashes (review B1: hashes are validated
  //     fields, not key components).
  const url = ((win.location && win.location.origin) || '') + ((win.location && win.location.pathname) || '');
  const lookupKey = cache.computeKey({
    url,
    vw: viewport.w,
    vh: viewport.h,
    prefersMore,
    prefersColorScheme,
    forcedColors,
    isTopFrame,
    version,
  });

  // 3.3 The pipeline's ONLY new await. Timeout inside lookup().
  const cachedEntry = await cache.lookup(api, lookupKey);

  // 3.4 AFTER the await: take both hashes at this single point so signature
  //     and effects describe one DOM/CSS state (design §15.3). canonicalWalk
  //     does no readFact and no style reads.
  const walk = cache.canonicalWalk(doc);
  const domSig = walk.signature;
  const styleHash = cache.styleSourceHash(doc);

  // 3.5 HIT — full validateEntry BEFORE any replay; replay in try/catch so a
  //     throw restores a clean page and falls through to the full pipeline.
  if (
    cachedEntry &&
    cache.validateEntry(cachedEntry, { lookupKey, version, styleHash, domSig })
  ) {
    try {
      const cachedSession = applyCached(cachedEntry, {
        doc,
        win,
        api,
        apply: activeApply,
        probe: activeProbe,
        walk,
        lookupKey,
        prefersMore,
        viewport,
      });
      return cachedSession;
    } catch {
      // Any throw mid-replay: teardown restores the root inline style and
      // purges every data-uxx* (including the boot sheet), so re-inject the
      // boot and fall through — the subsequent harvest must be clean.
      //
      // This recovery is itself guarded (review): if teardown()/injectBoot()
      // throws (e.g. page script redefined an element's `style` accessor),
      // an unguarded throw here would escape runPipeline, be swallowed by the
      // autostart .catch, and leave the page boot-only — violating design
      // §15.7's "can never leave a page unthemed or half-themed". Swallow it
      // and still fall through: the full pipeline below is what guarantees
      // theming, and worst case it re-marks over a partially purged DOM.
      try {
        activeApply.teardown();
        activeApply.injectBoot();
      } catch {
        /* fall through to the full pipeline regardless */
      }
    }
  }

  // 3.6 MISS / timeout / error / failed validation / replay-throw: continue
  //     with steps 4–7 below as today, recording effects for a cache write.

  // Step 4: DETECT — sheets disabled, grid sample, harvest, css vars.
  const gridSamples0 = { current: [] };
  const harvested = {
    textColors: [],
    borderColors: [],
    linkColors: [],
    accents: [],
    backgrounds: [],
  };
  let cssVars = {};
  withSheetsDisabled(activeApply.sheets, () => {
    gridSamples0.current = activeProbe.sampleViewportGrid();
    forEachElement(doc, (el) => {
      const fact = activeProbe.readFact(el);
      if (!fact) return false;
      const buckets = activeProbe.harvest(fact);
      for (const key of Object.keys(buckets)) harvested[key].push(...buckets[key]);
      return true;
    });
    cssVars = activeProbe.collectCssVars();
  });
  const palette = aggregate(gridSamples0.current, harvested, cssVars);

  // pageLuminance (spec §4.1 round-3 M3 + empty-harvest fallback N3).
  const pageBg = parseColor(resolveToken(['colors', 'background', 'default']));
  const pageLuminance =
    palette.backgrounds && palette.backgrounds.length > 0
      ? luminance(palette.backgrounds[0])
      : luminance(pageBg);
  // `prefersMore` and `viewport` are computed in step 3 (cache key hoist) —
  // do not recompute here.
  // Child frames start with a transparent base and skip the page-background
  // root override (design §6 iframe row).
  const baseColor = isTopFrame ? pageBg : { r: 0, g: 0, b: 0, a: 0 };

  // Step 5: CLASSIFY — bounded walk (MAX_ELEMENTS + TIME_TRIP → degraded:
  // root + direct children only, data-uxx-degraded marker).
  const collected = [];
  let degraded = false;
  const passStart = Date.now();
  forEachElement(doc, (el, depth) => {
    if (collected.length >= MAX_ELEMENTS || Date.now() - passStart >= TIME_TRIP_MS) {
      degraded = true;
      return false;
    }
    const fact = activeProbe.readFact(el);
    if (!fact) return false; // prune subtree: img/canvas/video, blend/filter
    if (!isTopFrame && fact.isRoot) fact.isRoot = false; // caller flip (design §6)
    collected.push({ el, fact, depth });
    return true;
  });
  const themed = degraded ? collected.filter((c) => c.depth <= 1) : collected;

  // CLASSIFY pass over facts (top-down: parents before children), computing
  // onAccentSurface against the direct-resolved mapped ancestor chain
  // (background emissions are direct — M2 — so the direct token IS the
  // mapped color; classify stays DOM-free, spec §4.1).
  const chain = [];
  const allAssignments = [];
  const entriesByEl = new Map();
  for (const { el, fact, depth } of themed) {
    while (chain.length && chain[chain.length - 1].depth >= depth) chain.pop();
    const resolvedAncestorBg = chain.reduce((acc, entry) => composite(entry.color, acc), baseColor);
    const onAccentSurface = isOnAccentSurface(chain, resolvedAncestorBg);
    const sizeClass = activeProbe.measureSizeClass(fact);
    const assignments = classify(fact, {
      pageLuminance,
      viewport,
      prefersMore,
      onAccentSurface,
    }).map((a) => ({ ...a, sizeClass }));
    allAssignments.push(...assignments);
    entriesByEl.set(el, { fact, depth, assignments });
    const bg = assignments.find((a) => a.property === 'background');
    if (bg) {
      const path = rolesModule.ROLE_RULES[bg.role] ? rolesModule.ROLE_RULES[bg.role].background : null;
      const color = path ? parseColor(resolveToken(path)) : null;
      if (color) chain.push({ depth, role: bg.role, color, opaque: color.a === 1 });
    }
  }

  // Step 6: RANK — once per pass over all ranked text assignments.
  const mapper = createMapper({ tokens: pack, palette, prefersMore });
  const rankTable = mapper.buildRankTable(allAssignments);

  // Step 7: MAP + APPLY, top-down (ancestors before descendants).
  // Effect recording (design §15.4): accumulate per-element final effects so
  // a cache write can replay them. Recorded ONLY on this miss path — a hit
  // never reaches here. Canonical idx comes from walk.indexOf (the pruned
  // CLASSIFY walk is a subsequence of the un-pruned canonical walk, so every
  // themed element has an index).
  activeApply.ensureRoleSheet();
  activeApply.ensureInlineSheet();
  const effectByEl = new Map();
  const recordEffect = (el, mutate) => {
    let rec = effectByEl.get(el);
    if (!rec) {
      rec = { roles: [], exception: false, inline: [] };
      effectByEl.set(el, rec);
    }
    mutate(rec);
  };
  const mapChain = [];
  for (const { el, fact, depth } of themed) {
    while (mapChain.length && mapChain[mapChain.length - 1].depth >= depth) mapChain.pop();
    let resolvedBg = mapChain.reduce((acc, entry) => composite(entry.color, acc), baseColor);
    const entry = entriesByEl.get(el);
    for (const assignment of sortAssignments(entry.assignments)) {
      const ancestorChain = mapChain.map((e) => ({ role: e.role, color: e.color, opaque: e.opaque }));
      const mapped = mapper.map(assignment, {
        resolvedBgColor: resolvedBg,
        ancestorChain,
        rankTable,
        prefersMore,
      });
      if (mapped.role) {
        activeApply.mark(el, mapped.role);
        recordEffect(el, (r) => {
          if (!r.roles.includes(mapped.role)) r.roles.push(mapped.role);
        });
      }
      if (mapped.exception) {
        activeApply.setException(el);
        recordEffect(el, (r) => {
          r.exception = true;
        });
      }
      const inlineProperty =
        assignment.property === 'background'
          ? 'background-color'
          : assignment.property === 'color'
            ? 'color'
            : null;
      if (
        inlineProperty &&
        Array.isArray(fact.inlineImportant) &&
        fact.inlineImportant.includes(inlineProperty) &&
        mapped.color
      ) {
        activeApply.redirectInline(el, inlineProperty, mapped.color);
        recordEffect(el, (r) => {
          r.inline.push([inlineProperty, mapped.color]);
        });
      }
      if (assignment.property === 'background' && mapped.color) {
        const mappedBg = parseColor(mapped.color);
        if (mappedBg) {
          mapChain.push({ depth, role: mapped.role || assignment.role, color: mappedBg, opaque: mappedBg.a === 1 });
          resolvedBg = composite(mappedBg, resolvedBg);
        }
      }
    }
  }

  // Step 7b: cache write (fire-and-forget; design §15.5). Same styleHash /
  // domSig taken in 3.4 — signature and effects describe one DOM/CSS state.
  // Degraded loads are never cached (design §15.7 non-goal): their effects
  // only cover depth ≤ 1 and would replay as a silently-partial theme.
  if (!degraded) {
    const effectRecords = [];
    for (const [el, rec] of effectByEl) {
      const idx = walk.indexOf.get(el);
      if (typeof idx !== 'number') continue;
      effectRecords.push({ idx, roles: rec.roles, exception: rec.exception, inline: rec.inline });
    }
    const cacheEntry = {
      s: cache.CACHE_SCHEMA,
      v: version,
      k: lookupKey,
      t: Date.now(),
      sh: styleHash,
      ds: domSig,
      degraded: false,
      pal: palette,
      rt: Array.from(rankTable),
      bg: pageBg,
      lum: pageLuminance,
      e: cache.encodeEffects(effectRecords),
    };
    cache.store(api, lookupKey, cacheEntry); // never rejects; do not await
  }

  // Step 8: steady state — MutationObserver, rAF-batched, self-ignoring.
  if (degraded) activeApply.setDegraded();

  return buildSession({
    doc,
    win,
    api,
    apply: activeApply,
    probe: activeProbe,
    mapper,
    rankTable,
    palette,
    degraded,
    pageBg,
    pageLuminance,
    viewport,
    prefersMore,
  });
}

/**
 * start({ doc?, win?, api? }) — full entry: boot sheet, state handshake
 * (2000ms, fail open), pipeline, toggle-broadcast teardown.
 */
export async function start({ doc = globalThis.document, win = globalThis.window, api = getApi() } = {}) {
  if (!doc || !win) return { status: 'no-dom' };
  const apply = createApply({ doc, tokens: tokensModule, roles: rolesModule });
  apply.injectBoot();

  if (!api || !api.runtime || typeof api.runtime.sendMessage !== 'function') {
    // No messaging API → fail open (design §9.3: a dead background must
    // never leave a foreign color scheme on a page).
    apply.teardown();
    return { status: 'fail-open' };
  }

  let state;
  try {
    state = await withTimeout(
      api.runtime.sendMessage({
        type: 'state',
        origin: (win.location && win.location.origin) || '',
      }),
      HANDSHAKE_TIMEOUT_MS,
    );
  } catch {
    apply.teardown();
    return { status: 'fail-open' };
  }

  if (!state || state.enabled === false || state.siteDisabled === true) {
    apply.teardown();
    return { status: 'disabled' };
  }

  const session = await runPipeline({ doc, win, api, apply });

  // Broadcast toggle (design §9.3): disable → full teardown + observer
  // disconnect; re-enable on the same page → theme again.
  if (api.runtime.onMessage && typeof api.runtime.onMessage.addListener === 'function') {
    session.messageListener = (message) => {
      if (!message || message.type !== 'state') return;
      if (message.enabled === false || message.siteDisabled === true) {
        stopSession(session);
        apply.teardown();
        session.tornDown = true;
      }
    };
    api.runtime.onMessage.addListener(session.messageListener);
  }
  return session;
}

// Guarded autostart (spec §9.2): tests set globalThis.__UXX_TEST__ so jsdom
// never auto-starts; they import named exports and drive them explicitly.
if (typeof document !== 'undefined' && !globalThis.__UXX_TEST__) {
  start().catch(() => {
    // Fail open silently — never leave a half-themed page.
  });
}
