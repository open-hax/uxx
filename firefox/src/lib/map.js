// SPDX-License-Identifier: GPL-3.0-or-later
// Meaning → token color (spec §6). DOM-free; the only import outside src/lib
// is the role → token-path contract (src/theme/roles.js, spec §2 — chunk B).

import { ROLE_RULES, TEXT_RANK_POOL, TEXT_RANK_ROLES } from '../theme/roles.js';
import {
  composite,
  contrast,
  deltaE2000,
  formatColor,
  luminance,
  parseColor,
  thresholdFor,
  toHsl,
} from './color.js';

// design §8.3.6 neutral fallback for sub-threshold accent text (spec §6.3):
// walking it changes the emitted role to text-secondary/text-primary.
const ACCENT_POOL = [
  ['colors', 'text', 'panel'],
  ['colors', 'text', 'default'],
];
const ACCENT_ROLES = new Set(['accent-yellow', 'accent-magenta']);
const DEFAULT_TOKEN_PATH = ['colors', 'text', 'default'];

// design §7.2 contrast exemptions (spec §6.3 isExcepted table).
const E1_ROLES = new Set(['border', 'border-subtle']);
const E2_ROLES = new Set(['semantic-error', 'badge-error']);
const BADGE_COLOR_ROLES = new Set(['badge-success', 'badge-warning', 'badge-error', 'badge-info']);

/**
 * isExcepted(role, property, fg, bg) → implements design §7.2 exactly
 * (E1–E5; silent pairs carry no marker).
 */
export function isExcepted(role, property) {
  if (E1_ROLES.has(role)) return true; // E1: border/border-subtle, any bg
  if (E2_ROLES.has(role) && property === 'color') return true; // E2
  if (role === 'button-danger' && property === 'color') return true; // E3
  if (BADGE_COLOR_ROLES.has(role) && property === 'color') return true; // E4
  if (role === 'text-faint') return true; // E5
  return false;
}

function resolveFrom(tokens, path) {
  let node = tokens;
  for (const key of path) {
    if (node === null || typeof node !== 'object' || !(key in node)) {
      throw new Error(`map.js: unknown token path: ${path.join('.')}`);
    }
    node = node[key];
  }
  if (typeof node !== 'string') {
    throw new Error(`map.js: unknown token path: ${path.join('.')}`);
  }
  return node;
}

function tokenPathFor(role, property) {
  const row = ROLE_RULES[role];
  const path = row && row[property];
  if (!path) {
    throw new Error(`map.js: no ROLE_RULES token path for role "${role}" property "${property}"`);
  }
  return path;
}

// Exact parsed pack-membership (spec §6.3 idempotence — compared parsed with
// alpha, review F5). Memoized per tokens object.
const packValuesCache = new WeakMap();

function packValueSet(tokens) {
  let set = packValuesCache.get(tokens);
  if (set) return set;
  set = [];
  const walk = (node) => {
    if (typeof node === 'string') {
      const parsed = parseColor(node);
      if (parsed) set.push(parsed);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  walk(tokens);
  packValuesCache.set(tokens, set);
  return set;
}

function isInPack(color, tokens) {
  return packValueSet(tokens).some(
    (v) =>
      Math.abs(v.r - color.r) < 1e-6 &&
      Math.abs(v.g - color.g) < 1e-6 &&
      Math.abs(v.b - color.b) < 1e-6 &&
      Math.abs(v.a - color.a) < 1e-6,
  );
}

function poolFor(role) {
  if (TEXT_RANK_ROLES.includes(role)) {
    return TEXT_RANK_POOL.map((path, i) => ({ path, role: TEXT_RANK_ROLES[i], index: i }));
  }
  if (ACCENT_ROLES.has(role)) {
    return ACCENT_POOL.map((path, i) => ({
      path,
      role: i === 0 ? 'text-secondary' : 'text-primary',
      index: i,
    }));
  }
  return null; // single-token pool
}

// Candidate ordering (spec §6.3): rank-adjacent first, brighter-first on
// distance ties; accent text walks text.panel → text.default (§8.3.3).
function orderCandidates(pool, current) {
  if (pool.length > 0 && TEXT_RANK_ROLES.includes(current.role)) {
    return pool
      .filter((c) => c.index !== current.index)
      .sort((a, b) => {
        const da = Math.abs(a.index - current.index);
        const db = Math.abs(b.index - current.index);
        if (da !== db) return da - db;
        return a.index - b.index; // brighter (lower index) first
      });
  }
  return pool; // accent pool order is the spec's walk order
}

const MUTED_ROLES = new Set(['text-muted', 'text-faint']);

function coreMap(assignment, ctx, tokens) {
  const { property, role, sourceColor } = assignment;
  const sizeClass = assignment.sizeClass || 'normal';
  const resolvedBg = ctx.resolvedBgColor;
  if (!resolvedBg) {
    throw new Error('map.js: resolvedContext.resolvedBgColor is required');
  }

  // Idempotence (§10 guard b): pack-in ⇒ pack-out, short-circuiting
  // rank/repair, compared parsed with alpha (spec §6.3).
  if (sourceColor && typeof sourceColor === 'object' && isInPack(sourceColor, tokens)) {
    return { color: sourceColor, role, property };
  }

  // M2: background-property emissions have NO foreground pair — never
  // contrast-checked, never an exception, alpha preserved (spec §6.3).
  if (property === 'background') {
    return { color: resolveFrom(tokens, tokenPathFor(role, 'background')), role, property };
  }

  // Rank resolution (§6.2): ranked text consults the page-wide rank table.
  let finalRole = role;
  if (assignment.ranked && ctx.rankTable instanceof Map) {
    const key = formatColor(sourceColor);
    if (ctx.rankTable.has(key)) finalRole = ctx.rankTable.get(key);
  }

  const emitted = resolveFrom(tokens, tokenPathFor(finalRole, property));
  const emittedColor = parseColor(emitted);

  // M1: nonText channel — border/outline emissions never use 4.5/7.
  const nonText = property === 'border' || property === 'outline';
  const muted = MUTED_ROLES.has(finalRole) || !!assignment.isPlaceholder;
  const threshold = thresholdFor({
    sizeClass,
    muted,
    nonText,
    prefersMore: !!ctx.prefersMore,
  });

  if (contrast(emittedColor, resolvedBg) >= threshold) {
    return { color: emitted, role: finalRole, property };
  }

  // Multi-token pool walk (design §8.3.3, spec §6.3).
  const pool = poolFor(finalRole);
  if (pool) {
    const current = {
      index: pool.findIndex((c) => resolveFrom(tokens, c.path) === emitted),
      role: finalRole,
    };
    for (const cand of orderCandidates(pool, current)) {
      const candColor = parseColor(resolveFrom(tokens, cand.path));
      if (contrast(candColor, resolvedBg) >= threshold) {
        return { color: resolveFrom(tokens, cand.path), role: cand.role, property };
      }
    }
    // Pool exhausted (design §7.2 multi-token residual, review F1): keep
    // colors.text.default — the pool's outermost token — and set exception.
    return {
      color: resolveFrom(tokens, DEFAULT_TOKEN_PATH),
      role: 'text-primary',
      property,
      exception: true,
    };
  }

  // Single-token pool (design §8.3.4): silent if excepted, else keep the
  // pack value and mark the exception.
  if (isExcepted(finalRole, property)) {
    return { color: emitted, role: finalRole, property };
  }
  return { color: emitted, role: finalRole, property, exception: true };
}

/**
 * map(fact, resolvedContext, palette, tokens) → { color, role, property, exception? }
 * (spec §6.1; pure core, design §8.0). `palette` is accepted for signature
 * compliance (appearance + idempotence checks live at the content layer).
 */
export function map(fact, resolvedContext, palette, tokens) {
  return coreMap(fact, resolvedContext, tokens);
}

/**
 * buildRankTable(assignments) → Map<colorKey, finalRole> (spec §6.2).
 * Run once per pass over all ranked: true text assignments: dedup distinct
 * sources (exact RGB or ΔE2000 ≤ 1, keeping the highest-confidence
 * representative), sort by luminance descending (hue ascending as tiebreak),
 * rank → TEXT_RANK_ROLES with clamping at text-faint.
 */
export function buildRankTable(assignments = []) {
  const groups = [];
  for (const a of assignments) {
    if (!a || a.ranked !== true || a.property !== 'color' || !a.sourceColor) continue;
    const c = a.sourceColor;
    const confidence = a.confidence == null ? 0 : a.confidence;
    let g = groups.find(
      (grp) =>
        (grp.rep.r === c.r && grp.rep.g === c.g && grp.rep.b === c.b) ||
        deltaE2000(grp.rep, c) <= 1,
    );
    if (!g) {
      groups.push({ rep: c, confidence, members: [c] });
    } else {
      g.members.push(c);
      if (confidence > g.confidence) {
        g.rep = c;
        g.confidence = confidence;
      }
    }
  }
  groups.sort((g1, g2) => {
    // Page text colors are opaque in practice; luminance computes on RGB.
    const d = luminance(g2.rep) - luminance(g1.rep);
    if (Math.abs(d) > 1e-12) return d;
    return toHsl(g1.rep).h - toHsl(g2.rep).h; // hue ascending tiebreak
  });
  const table = new Map();
  groups.forEach((g, rank) => {
    const role = TEXT_RANK_ROLES[Math.min(rank, TEXT_RANK_ROLES.length - 1)];
    for (const m of g.members) table.set(formatColor(m), role);
  });
  return table;
}

function cacheKey(assignment, ctx) {
  return [
    formatColor(assignment.sourceColor),
    assignment.role,
    assignment.property,
    formatColor(ctx.resolvedBgColor),
    assignment.sizeClass || 'normal',
  ].join('|');
}

/**
 * createMapper({ tokens, palette, prefersMore }) → cached page-level wrapper
 * (spec §6.1): { buildRankTable, map, stats, clear }.
 */
export function createMapper({ tokens, palette, prefersMore = false }) {
  if (!tokens) throw new Error('createMapper: tokens are required');
  let rankTable = new Map();
  const cache = new Map();
  let hits = 0;
  let misses = 0;
  let exceptions = 0;
  return {
    buildRankTable(assignments) {
      rankTable = buildRankTable(assignments);
      cache.clear();
      return rankTable;
    },
    map(assignment, resolvedContext) {
      const ctx = {
        ...resolvedContext,
        rankTable: resolvedContext && resolvedContext.rankTable ? resolvedContext.rankTable : rankTable,
        prefersMore:
          resolvedContext && resolvedContext.prefersMore != null
            ? resolvedContext.prefersMore
            : prefersMore,
      };
      const key = cacheKey(assignment, ctx);
      if (cache.has(key)) {
        hits += 1;
        const r = cache.get(key);
        if (r.exception) exceptions += 1;
        return r;
      }
      misses += 1;
      const result = coreMap(assignment, ctx, tokens);
      if (result.exception) exceptions += 1;
      cache.set(key, result);
      return result;
    },
    stats() {
      return { hits, misses, exceptions };
    },
    clear() {
      cache.clear();
      hits = 0;
      misses = 0;
      exceptions = 0;
    },
  };
}

// composite is re-exported for callers that build resolvedBgColor chains
// locally (§8.5); kept import-used above via contrast's internals.
export { composite };
