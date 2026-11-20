// SPDX-License-Identifier: GPL-3.0-or-later
//
// src/content/diagnose.js — developer diagnostic: "why wasn't this themed?"
//
// COMPILED IN ONLY BY THE DIAGNOSTIC BUILD (`__UXX_DIAG__`); the production
// bundle tree-shakes it out. It answers, for the page the user is looking at,
// which elements the pipeline left unthemed and why, and which rendered
// text/background pairs have unreadable contrast — without needing the user to
// copy anything and without driving the browser (no automation flag).
//
// PRIVACY CONTRACT (pinned by tests/diagnose.test.js):
//   - NEVER reads into the report: text, ids, href/src/alt/title/aria-*/value,
//     data-* values (except our own role markers), or URL path beyond the
//     first segment. Pages like a messaging inbox contain other people's data.
//   - Emits only: tag names, a whitelist-shaped sample of class tokens,
//     computed colour/visibility styles, our own `data-uxx-role` markers, and
//     counts. Own-text is reduced to a boolean.

import { parseColor, composite, contrast, luminance } from '../lib/color.js';
import { ROLE_RULES } from '../theme/roles.js';
import { resolveToken } from '../theme/tokens.js';

import { DIAG_SCHEMA, DIAG_MESSAGE, DIAG_ENDPOINT } from '../diag-constants.js';
// Re-exported so existing importers (tests) keep working; the BACKGROUND must
// import from diag-constants.js directly (see that file for why).
export { DIAG_SCHEMA, DIAG_MESSAGE, DIAG_ENDPOINT };

export const DIAG_MAX_ELEMENTS = 40000;
export const DIAG_BUDGET_MS = 2500;
export const DIAG_MAX_GROUPS = 12;
export const DIAG_LOW_CONTRAST = 3;

export const DIAG_LIGHT_SURFACE = 0.45; // relative luminance of an opaque bg that reads as "light"
const WINNER_SCAN_MAX_ELEMENTS = 6;
const WINNER_SCAN_BUDGET_MS = 1200;
const PROBE_POINTS = [
  ['bottom-right', 0.9, 0.96],
  ['bottom-left', 0.1, 0.96],
  ['top-right', 0.9, 0.08],
  ['center', 0.5, 0.5],
  ['left-rail', 0.12, 0.45],
];
const MEDIA = new Set(['img', 'canvas', 'video']);
// Never rendered: reporting them is pure noise (display:none by default).
const NON_RENDERED = new Set(['head', 'style', 'script', 'meta', 'link', 'title', 'base', 'noscript', 'template']);
const CLASS_TOKEN = /^[A-Za-z_-][A-Za-z0-9_-]{0,47}$/;
const ROLE_TOKEN = /^[a-z][a-z0-9-]{0,40}$/;

function labelOf(el) {
  const tag = el.tagName.toLowerCase();
  const raw = (el.getAttribute && el.getAttribute('class')) || '';
  const classes = raw
    .split(/\s+/)
    .filter((c) => CLASS_TOKEN.test(c))
    .slice(0, 2);
  return classes.length ? `${tag}.${classes.join('.')}` : tag;
}

// Next ancestor, crossing a shadow boundary to the HOST (an element directly
// under a shadow root has no parentElement).
function parentAcross(node) {
  if (node.parentElement) return node.parentElement;
  const root = typeof node.getRootNode === 'function' ? node.getRootNode() : null;
  return root && root.host ? root.host : null;
}

function inShadowRoot(el) {
  const root = typeof el.getRootNode === 'function' ? el.getRootNode() : null;
  return Boolean(root && root.host);
}

function pathOf(el, depth = 3) {
  const parts = [];
  let node = el;
  for (let i = 0; node && node.nodeType === 1 && i <= depth; i += 1) {
    parts.push(labelOf(node));
    node = parentAcross(node);
  }
  return parts.join(' < ');
}

// Open shadow roots (nested ones included) and how many carry OUR sheet. The
// LinkedIn failure was roots>0 with withSheet=0: elements marked, nothing to
// act on the markers, because document styles stop at a shadow boundary.
function shadowStats(doc) {
  let roots = 0;
  let withSheet = 0;
  const seen = new Set();
  const visitRoot = (root) => {
    for (const el of Array.from(root.querySelectorAll('*'))) {
      const shadow = el.shadowRoot;
      if (!shadow || seen.has(shadow)) continue;
      seen.add(shadow);
      roots += 1;
      if (shadow.querySelector('style[data-uxx="shadow"]')) withSheet += 1;
      visitRoot(shadow);
    }
  };
  visitRoot(doc);
  return { roots, withSheet };
}

function rgb(color) {
  if (!color) return null;
  return `rgb(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)})`;
}

function pruneCause(tag, style) {
  if (MEDIA.has(tag)) return 'media';
  if ((style.mixBlendMode || 'normal') !== 'normal') return 'blend';
  if ((style.filter || 'none') !== 'none') return 'filter';
  if ((style.backdropFilter || 'none') !== 'none') return 'backdrop-filter';
  return null;
}

function hasOwnText(el) {
  // Boolean only — the text itself never leaves this function.
  for (const node of Array.from(el.childNodes || [])) {
    if (node.nodeType === 3 && node.nodeValue && node.nodeValue.trim().length > 0) return true;
  }
  return false;
}

// What the role sheet WOULD paint for this element, per property. Mirrors
// apply.js: one rule per role × property in ROLE_RULES order, so for two roles
// that both set a property the later ROLE_RULES entry wins.
function expectedPaint(roleAttr) {
  const roles = new Set(roleAttr.split(/\s+/).filter((r) => ROLE_TOKEN.test(r)));
  const out = {};
  for (const [role, row] of Object.entries(ROLE_RULES)) {
    if (!roles.has(role)) continue;
    for (const [property, path] of Object.entries(row)) {
      if (property !== 'background' && property !== 'color') continue;
      const color = parseColor(resolveToken(path));
      if (color) out[property] = { color, role };
    }
  }
  return out;
}

function sameColor(a, b) {
  return (
    Math.abs(a.r - b.r) <= 2 && Math.abs(a.g - b.g) <= 2 && Math.abs(a.b - b.b) <= 2 && Math.abs(a.a - b.a) <= 0.02
  );
}

function matchesSafe(el, selector) {
  try {
    return el.matches(selector);
  } catch {
    return false; // pseudo-elements / unsupported selectors: not a winner we can name
  }
}

// Which `!important` rules of the SITE's own stylesheets match this element and
// set the property? Selector text comes from the site's static CSS (class
// names), never from page content. Cross-origin sheets that refuse cssRules are
// counted, not guessed at. Our own injected sheets are skipped.
function findWinners(doc, el, props, deadline, now) {
  const found = [];
  let unreadable = 0;
  const visitRules = (rules) => {
    for (const rule of Array.from(rules)) {
      if (now() > deadline) return;
      if (rule.selectorText !== undefined && rule.style) {
        if (!matchesSafe(el, rule.selectorText)) continue;
        for (const prop of props) {
          if (rule.style.getPropertyValue(prop) && rule.style.getPropertyPriority(prop) === 'important') {
            found.push({ selector: String(rule.selectorText).slice(0, 160), prop, value: String(rule.style.getPropertyValue(prop)).slice(0, 60) });
          }
        }
      } else if (rule.cssRules) {
        visitRules(rule.cssRules); // @media / @supports groups
      }
    }
  };
  for (const sheet of Array.from(doc.styleSheets || [])) {
    if (now() > deadline) break;
    const owner = sheet.ownerNode;
    if (owner && owner.hasAttribute && owner.hasAttribute('data-uxx')) continue;
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      unreadable += 1;
      continue;
    }
    if (rules) visitRules(rules);
  }
  const inline = el.style && el.style.getPropertyPriority
    ? props.filter((prop) => el.style.getPropertyPriority(prop) === 'important' && el.style.getPropertyValue(prop))
    : [];
  return { rules: found.slice(0, 6), inlineImportant: inline, unreadableSheets: unreadable };
}

function firstSegment(pathname) {
  const seg = String(pathname || '/').split('/').filter(Boolean)[0];
  return seg && CLASS_TOKEN.test(seg) ? `/${seg}` : seg ? '/…' : '/';
}

/**
 * diagnose({ doc, win, getComputedStyle?, now?, version? }) → report.
 * Read-only: one computed-style read per element, no DOM writes.
 */
export function diagnose({
  doc,
  win,
  getComputedStyle = win.getComputedStyle.bind(win),
  now = () => Date.now(),
  version = 'dev',
  maxElements = DIAG_MAX_ELEMENTS,
  budgetMs = DIAG_BUDGET_MS,
} = {}) {
  const started = now();
  const reasons = {};
  const roles = {};
  let total = 0;
  let marked = 0;
  let truncated = false;

  const add = (reason, key, sample) => {
    const bucket = (reasons[reason] ||= { count: 0, groups: new Map() });
    bucket.count += 1;
    const group = bucket.groups.get(key);
    if (group) group.count += 1;
    else bucket.groups.set(key, { count: 1, sample });
  };

  // Elements whose painted colour disagrees with their role (or that left a
  // light surface on the page): the winner scan names the rule responsible.
  const flagged = [];
  const flag = (el, sample, props) => {
    if (flagged.length < WINNER_SCAN_MAX_ELEMENTS && !flagged.some((f) => f.sample === sample)) {
      flagged.push({ el, sample, props });
    }
  };

  const visit = (el, parent) => {
    if (truncated) return;
    if (total >= maxElements || (total % 256 === 0 && now() - started > budgetMs)) {
      truncated = true;
      return;
    }
    const tag = el.tagName.toLowerCase();
    if (NON_RENDERED.has(tag)) return; // and nothing under it renders either
    total += 1;
    const style = getComputedStyle(el) || {};

    const hidden = parent.hidden || (style.display || '') === 'none';
    const bg = parseColor(style.backgroundColor);
    const bgPainted = Boolean(bg && bg.a > 0);
    const hasImage = (style.backgroundImage || 'none') !== 'none';
    const roleAttr = el.getAttribute('data-uxx-role') || '';
    const isMarked = roleAttr.length > 0;
    if (isMarked) {
      marked += 1;
      for (const r of roleAttr.split(/\s+/)) {
        if (ROLE_TOKEN.test(r)) roles[r] = (roles[r] || 0) + 1;
      }
    }

    // The pipeline prunes the WHOLE subtree under the first such element, so
    // only the outermost one is a prune root; descendants are "inside" it.
    const cause = pruneCause(tag, style);
    const isPruneRoot = Boolean(cause) && !parent.pruned;
    const pruned = parent.pruned || (cause ? { path: pathOf(el, 2), cause } : null);

    // Effective painted background under this element (null = unknown: an
    // image/gradient sits somewhere above, so contrast can't be judged).
    let effBg = parent.effBg;
    if (hasImage) {
      effBg = null;
    } else if (bgPainted) {
      if (bg.a >= 0.99) effBg = { ...bg, a: 1 };
      else if (effBg) effBg = composite(bg, effBg);
      // translucent over an unknown backdrop stays unknown (null)
    }

    const fg = parseColor(style.color);
    const ownText = hasOwnText(el);
    const textShown =
      ownText &&
      !hidden &&
      Boolean(fg && fg.a > 0) &&
      (style.visibility || '') !== 'hidden' &&
      Number.parseFloat(style.opacity || '1') > 0;

    const base = () => ({ path: pathOf(el), depth: parent.depth + 1, hidden, inShadow: inShadowRoot(el) });

    // Screen-reader-only text (clipped to ~1px) is invisible by design: it is
    // not a readability finding.
    const srOnly =
      Number.parseFloat(style.width || '') <= 1 && Number.parseFloat(style.height || '') <= 1;

    // Marked, but did OUR colour actually paint? A site `!important` rule of
    // higher specificity than `[data-uxx-role]` leaves the element in its native
    // colour — readable, so invisible to every other check.
    if (isMarked) {
      const want = expectedPaint(roleAttr);
      const checks = [
        ['background', 'bg', 'background-color', bg],
        ['color', 'color', 'color', fg],
      ];
      for (const [property, short, cssProp, actual] of checks) {
        const expected = want[property];
        if (!expected || !actual || sameColor(expected.color, actual)) continue;
        const sample = {
          ...base(),
          role: expected.role,
          prop: short,
          expected: rgb(expected.color),
          actual: rgb(actual),
        };
        add('role-overridden', `${labelOf(el)}|${short}|${expected.role}`, sample);
        flag(el, sample, [cssProp, ...(cssProp === 'background-color' ? ['background'] : [])]);
      }
    }

    // A light opaque surface still on the page after theming — marked or not.
    if (bg && bg.a >= 0.9 && !hasImage && !hidden && !pruned && luminance(bg) > DIAG_LIGHT_SURFACE) {
      const sample = { ...base(), bg: rgb(bg), marked: isMarked, role: isMarked ? roleAttr : null };
      add('light-surface', labelOf(el), sample);
      flag(el, sample, ['background-color', 'background']);
    }

    if (!isMarked) {
      if (pruned && (bgPainted || ownText)) {
        add(isPruneRoot ? 'pruned-root' : 'pruned-subtree', `${labelOf(el)}|${pruned.cause}`, {
          ...base(),
          cause: pruned.cause,
          prunedAt: pruned.path,
        });
      } else if (hasImage) {
        add('bg-image', labelOf(el), { ...base(), bg: rgb(bg) });
      } else if (bgPainted) {
        add('bg-unmarked', labelOf(el), { ...base(), bg: rgb(bg), alpha: Number(bg.a.toFixed(2)) });
      } else if (ownText && fg && fg.a > 0) {
        add('text-unmarked', labelOf(el), { ...base(), fg: rgb(fg) });
      }
    }

    if (textShown && effBg && !srOnly) {
      const shown = fg.a < 1 ? composite(fg, effBg) : fg;
      const ratio = contrast(shown, effBg);
      if (ratio < DIAG_LOW_CONTRAST) {
        add('low-contrast', labelOf(el), {
          ...base(),
          fg: rgb(shown),
          bg: rgb(effBg),
          ratio: Number(ratio.toFixed(2)),
          marked: isMarked,
          role: isMarked ? roleAttr.split(/\s+/).filter((r) => ROLE_TOKEN.test(r)).join(' ') : null,
          pruned: pruned ? pruned.cause : null,
        });
      }
    }

    const ctx = { hidden, pruned, effBg, depth: parent.depth + 1 };
    for (let child = el.firstElementChild; child; child = child.nextElementSibling) visit(child, ctx);
    if (el.shadowRoot) {
      for (let child = el.shadowRoot.firstElementChild; child; child = child.nextElementSibling) {
        visit(child, ctx);
      }
    }
  };

  const root = doc.documentElement;
  if (root) visit(root, { hidden: false, pruned: null, effBg: { r: 255, g: 255, b: 255, a: 1 }, depth: -1 });

  // Name the site rule that beat us (budgeted; best-effort).
  const deadline = now() + WINNER_SCAN_BUDGET_MS;
  for (const { el, sample, props } of flagged) {
    if (now() > deadline) break;
    const result = findWinners(doc, el, props, deadline, now);
    sample.winners = result.rules;
    sample.inlineImportant = result.inlineImportant;
    sample.unreadableSheets = result.unreadableSheets;
  }

  const out = {};
  for (const [reason, bucket] of Object.entries(reasons)) {
    const groups = Array.from(bucket.groups, ([key, g]) => ({ key, count: g.count, sample: g.sample }))
      .sort((a, b) => b.count - a.count)
      .slice(0, DIAG_MAX_GROUPS);
    out[reason] = { count: bucket.count, groups };
  }

  // "What is painting this pixel?" — the element stack at a few screen points.
  const vw = win.innerWidth || 0;
  const vh = win.innerHeight || 0;
  const points = PROBE_POINTS.map(([name, fx, fy]) => {
    const x = Math.round(vw * fx);
    const y = Math.round(vh * fy);
    let stack = [];
    try {
      const hits = typeof doc.elementsFromPoint === 'function' ? doc.elementsFromPoint(x, y) : [];
      stack = hits.slice(0, 7).map((hit) => {
        const hs = getComputedStyle(hit) || {};
        const hbg = parseColor(hs.backgroundColor);
        const hrole = hit.getAttribute('data-uxx-role');
        return {
          label: labelOf(hit),
          role: hrole && hrole.split(/\s+/).filter((r) => ROLE_TOKEN.test(r)).join(' ') || null,
          bg: hbg && hbg.a > 0 ? rgb(hbg) : null,
          color: rgb(parseColor(hs.color)),
        };
      });
    } catch {
      stack = [];
    }
    return { name, x, y, stack };
  });

  // iframes are separate documents: list them by HOST and size only.
  const frames = Array.from(doc.querySelectorAll('iframe'), (frame) => {
    let host = '';
    try {
      host = new URL(frame.getAttribute('src') || '', win.location && win.location.href).host;
    } catch {
      host = '';
    }
    return { host, w: Number.parseInt(frame.getAttribute('width') || '0', 10) || 0, h: Number.parseInt(frame.getAttribute('height') || '0', 10) || 0 };
  }).slice(0, 20);

  const location = win.location || {};
  const docEl = doc.documentElement;
  return {
    schema: DIAG_SCHEMA,
    at: new Date(now()).toISOString(),
    ext: { version },
    url: { origin: location.origin || '', firstSegment: firstSegment(location.pathname) },
    viewport: { w: win.innerWidth || 0, h: win.innerHeight || 0 },
    degraded: Boolean(docEl && docEl.hasAttribute('data-uxx-degraded')),
    sheets: Array.from(doc.querySelectorAll('style[data-uxx]'), (s) => s.getAttribute('data-uxx')).filter((s) =>
      ROLE_TOKEN.test(s || ''),
    ),
    totals: { elements: total, themed: marked, truncated, ms: now() - started },
    roles,
    reasons: out,
    points,
    frames,
    shadow: shadowStats(doc),
  };
}

export const DIAG_RESCAN_WAIT_MS = 3000;

// Compact view of a report for the "after rescan" comparison.
function summarize(report) {
  const reasons = {};
  for (const [reason, bucket] of Object.entries(report.reasons)) {
    reasons[reason] = { count: bucket.count, top: bucket.groups.slice(0, 5).map((g) => ({ key: g.key, count: g.count })) };
  }
  return { totals: report.totals, reasons };
}

/**
 * registerDiagnose(api, { doc, win, version, stats?, rescan?, idle?, rescanWaitMs? })
 *
 * Answers a `uxx-diagnose` message from the background (top frame only).
 *   - stats():  pipeline state (queue, breaker, errors, cache hit) — attached as `session`.
 *   - rescan(): when the message does not say `rescan:false`, run ONE full
 *     document rescan, wait (bounded) until `idle()`, and attach `afterRescan`.
 *     That experiment separates "the incremental path missed this element" from
 *     "even a full pass cannot theme it" — the two have different fixes.
 * Returns a promise so Firefox delivers it as the sendMessage reply.
 */
export function registerDiagnose(api, { doc, win, version = 'dev', stats, rescan, idle, rescanWaitMs = DIAG_RESCAN_WAIT_MS }) {
  if (!api || !api.runtime || !api.runtime.onMessage) return false;
  api.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== DIAG_MESSAGE) return undefined;
    try {
      if (win.top !== win) return undefined;
    } catch {
      return undefined;
    }
    // Breadcrumb (diagnostic build only): proves the message was DELIVERED, so
    // a missing report can be attributed to the network hop, not the command.
    try {
      doc.documentElement.setAttribute('data-uxx-diag-seen', String(Date.now()));
    } catch {
      /* best-effort only; the report below is what matters */
    }
    return (async () => {
      const report = diagnose({ doc, win, version });
      if (typeof stats === 'function') report.session = stats();
      if (message.rescan !== false && typeof rescan === 'function') {
        rescan();
        const deadline = Date.now() + rescanWaitMs;
        let settled = typeof idle !== 'function';
        while (!settled && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          settled = idle();
        }
        const after = diagnose({ doc, win, version });
        report.afterRescan = { ...summarize(after), settled };
        if (typeof stats === 'function') report.afterRescan.session = stats();
      }
      return report;
    })();
  });
  return true;
}
