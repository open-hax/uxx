// SPDX-License-Identifier: GPL-3.0-or-later
//
// src/content/cache.js — style cache: key, hashes, canonical walk, storage
// (spec §14, design §15).
//
// Purpose: on a repeat visit whose stylesheet source AND DOM structure are
// unchanged, replay the previous visit's per-element effects with ZERO
// getComputedStyle/getBoundingClientRect calls.
//
// Two design invariants this module exists to enforce:
//
//  1. SINGLE-POINT HASHES (design §15.3, review B1). The storage key is
//     deliberately COARSE (no hashes); `styleHash` and `domSig` are computed
//     ONCE — after `storage.local.get` resolves, before any DOM work — and
//     validated against the entry. Keying on a hash taken *before* the
//     storage await would let page script interleave and produce an entry
//     whose signature and recorded effects disagree.
//
//  2. NO INDEX KEY (design §15.5, review R5). Every entry is self-describing
//     via its `t` timestamp. An index key would let a lost concurrent update
//     strand a still-hittable entry, and a quota sweep would then delete
//     valid data. Without an index, orphans cannot exist.
//
// Every storage path fails OPEN: timeout, SecurityError, quota, malformed
// entry, absent API → miss → the full pipeline runs. The cache can only ever
// be skipped, never trusted.

import { ROLE_RULES } from '../theme/roles.js';

// ── Constants (spec §14.1, design §15.1/§15.5) ─────────────────────────────
export const CACHE_SCHEMA = 'uxx-sc-v1';
export const CACHE_KEY_PREFIX = 'sc:';
export const CACHE_BUDGET_BYTES = 8 * 1024 * 1024; // under the 10 MB default quota
export const CACHE_MAX_ENTRIES = 100;
export const CACHE_MAX_ENTRY_BYTES = 2 * 1024 * 1024;
export const CACHE_HASH_MAX_CHARS = 4_000_000;
export const CACHE_LOOKUP_TIMEOUT_MS = 250;
export const VIEWPORT_BUCKET_PX = 256;

// ROLE_RULES key order → small ints (33 roles → 0..32). Encoding roles as
// ints keeps a 15k-element entry well under CACHE_MAX_ENTRY_BYTES.
export const ROLE_KEYS = Object.keys(ROLE_RULES);
export const ROLE_INDEX = new Map(ROLE_KEYS.map((name, i) => [name, i]));

// Only these two properties are redirectable (main.js MAP+APPLY inlineProperty).
export const PROP_INDEX = { 'background-color': 0, 'color': 1 };
export const PROP_KEYS = ['background-color', 'color'];

// ── Hashing (design §15.2) ────────────────────────────────────────────────
// Synchronous FNV-1a. NOT crypto.subtle: that is `undefined` on plain
// `http://` pages and this extension is `<all_urls>`.

export function fnv1a32(str, seed = 0x811c9dc5) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// Two independently-seeded 32-bit FNV-1a passes folded into 16 hex chars.
export function hash64(str) {
  const a = fnv1a32(str, 0x811c9dc5);
  const b = fnv1a32(str, 0x9dc5811c);
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

// Length-prefixed part accumulator. Every part is written as `len:content`
// so no concatenation ambiguity can forge a match, and the total hashed
// character count is hard-capped (design §15.2, residual C2).
function makePartSink(limit) {
  const parts = [];
  let budget = limit;
  let truncated = false;
  return {
    push(value) {
      if (budget <= 0) {
        truncated = true;
        return;
      }
      const s = String(value);
      const take = s.length > budget ? s.slice(0, budget) : s;
      budget -= take.length;
      if (take.length < s.length) truncated = true;
      parts.push(`${take.length}:${take}`);
    },
    digest() {
      return hash64(parts.join('|') + (truncated ? '|<truncated>' : ''));
    },
  };
}

// Read a sheet's cssRules text. Returns null on SecurityError (cross-origin)
// so the caller can fall back to the href alone; never throws.
function readRulesText(sheet) {
  let rules;
  try {
    rules = sheet.cssRules;
  } catch {
    return null; // SecurityError — cross-origin stylesheet
  }
  if (!rules) return '';
  let out = '';
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    out += rule && rule.cssText ? rule.cssText : '';
    out += '\n';
  }
  return out;
}

/**
 * styleSourceHash(doc) → 16-hex string.
 *
 * Walks `doc.styleSheets` in order (design §15.2):
 *   - skip a sheet iff its ownerNode carries `data-uxx` (our own injected
 *     boot/role/inline sheets must never influence the hash — otherwise the
 *     first load's hash differs from every subsequent load's);
 *   - ownerNode == null (constructed / adoptedStyleSheets): hash the href and
 *     readable rule text, else a 'constructed' marker — never deref null;
 *   - inline sheet (href == null): hash the ownerNode's textContent, the exact
 *     source, immune to CSSOM re-serialization drift;
 *   - external readable sheet: href + '\n' + each rule's cssText;
 *   - external sheet throwing SecurityError: href only (residual C1).
 * Then the documentElement's inline style attribute.
 */
export function styleSourceHash(doc) {
  const sink = makePartSink(CACHE_HASH_MAX_CHARS);
  let sheets = [];
  try {
    sheets = Array.from((doc && doc.styleSheets) || []);
  } catch {
    sheets = [];
  }

  for (const sheet of sheets) {
    if (!sheet) continue;
    let ownerNode = null;
    try {
      ownerNode = sheet.ownerNode || null;
    } catch {
      ownerNode = null;
    }
    let ours = false;
    try {
      ours = !!ownerNode && typeof ownerNode.hasAttribute === 'function' && ownerNode.hasAttribute('data-uxx');
    } catch {
      ours = false;
    }
    if (ours) {
      continue; // ours — excluded
    }

    let href = null;
    try {
      href = sheet.href || null;
    } catch {
      href = null;
    }

    if (!ownerNode) {
      // Constructed / adopted sheet: no owner node to read text from.
      sink.push(href || '');
      const rules = readRulesText(sheet);
      sink.push(rules === null ? 'constructed' : rules);
      continue;
    }

    if (!href) {
      // Inline <style> — hash the literal source text.
      let text = '';
      try {
        text = ownerNode.textContent || '';
      } catch {
        text = ''; // exotic page redefined the accessor — treat as empty
      }
      sink.push(text);
      continue;
    }

    sink.push(href);
    const rules = readRulesText(sheet);
    if (rules !== null) sink.push(rules);
    // rules === null (SecurityError) → href alone is the known source.
  }

  try {
    const de = doc && doc.documentElement;
    sink.push(de && typeof de.getAttribute === 'function' ? de.getAttribute('style') || '' : '');
  } catch {
    sink.push('');
  }

  return sink.digest();
}

// ── Canonical walk (design §15.3, review R7/R1) ───────────────────────────

/**
 * canonicalWalk(doc) → { elements, indexOf, signature }
 *
 * Pre-order traversal in EXACTLY the order `forEachElement` uses
 * (main.js:92-110): documentElement is index 0; for each element emit it,
 * recurse its LIGHT children in document order, THEN its open shadowRoot,
 * THEN the next sibling. Per-element pre-order, not level-order.
 *
 * Unlike `forEachElement` this does NOT prune and never calls `readFact`, so
 * it costs attribute reads only — no layout, no style recalc.
 *
 * The pipeline's pruned walk is a SUBSEQUENCE of this one (pruning skips
 * subtrees but preserves order), so every themed element has a well-defined
 * canonical index; pruned elements simply receive no cache entry.
 *
 * The signature reads RAW attributes only — `el.className` on an SVG element
 * is an SVGAnimatedString that coerces to "[object SVGAnimatedString]",
 * which would make SVG class changes invisible (review R1).
 */
export function canonicalWalk(doc) {
  const elements = [];
  const indexOf = new Map();
  const sink = makePartSink(CACHE_HASH_MAX_CHARS);

  const emit = (el) => {
    indexOf.set(el, elements.length);
    elements.push(el);
    const tag = typeof el.tagName === 'string' ? el.tagName.toLowerCase() : '';
    const id = typeof el.getAttribute === 'function' ? el.getAttribute('id') || '' : '';
    const cls = typeof el.getAttribute === 'function' ? el.getAttribute('class') || '' : '';
    const style = typeof el.getAttribute === 'function' ? el.getAttribute('style') || '' : '';
    sink.push(`${tag}#${id}.${cls}!${style}`);
  };

  const root = doc && doc.documentElement;
  if (!root) return { elements, indexOf, signature: sink.digest() };

  const walk = (node) => {
    let child = node.firstElementChild;
    while (child) {
      emit(child);
      walk(child); // light children first …
      if (child.shadowRoot) walk(child.shadowRoot); // … then this host's shadow
      child = child.nextElementSibling;
    }
  };

  emit(root);
  walk(root); // root's light subtree …
  if (root.shadowRoot) walk(root.shadowRoot); // … then root's shadow

  return { elements, indexOf, signature: sink.digest() };
}

// ── Key (design §15.1) ────────────────────────────────────────────────────

/**
 * computeKey(...) → coarse storage key. Carries NO hashes — they are
 * validated fields (design §15.1, review B1). `url` is length-prefixed so
 * field boundaries cannot be forged by a crafted URL.
 */
export function computeKey({
  url,
  vw,
  vh,
  prefersMore,
  prefersColorScheme,
  forcedColors,
  isTopFrame,
  version,
}) {
  return [
    CACHE_SCHEMA,
    version,
    `${url.length}:${url}`,
    Math.round(vw / VIEWPORT_BUCKET_PX),
    Math.round(vh / VIEWPORT_BUCKET_PX),
    prefersMore ? 1 : 0,
    prefersColorScheme,
    forcedColors,
    isTopFrame ? 1 : 0,
  ].join('|');
}

// ── Effect encoding (spec §14.4) ──────────────────────────────────────────

/**
 * encodeEffects(records) → entry.e
 * records: [{ idx, roles: string[], exception: boolean, inline: [[prop, color]] }]
 * Elements with no role/exception/inline effect are OMITTED (replay skips
 * them — identical to never marking them).
 */
export function encodeEffects(records) {
  const out = [];
  for (const rec of records || []) {
    if (!rec || typeof rec.idx !== 'number') continue;
    const roleIds = [];
    for (const name of rec.roles || []) {
      const id = ROLE_INDEX.get(name);
      if (typeof id === 'number' && !roleIds.includes(id)) roleIds.push(id);
    }
    const inline = [];
    for (const pair of rec.inline || []) {
      if (!Array.isArray(pair) || pair.length !== 2) continue;
      const propId = PROP_INDEX[pair[0]];
      if (typeof propId === 'number') inline.push([propId, pair[1]]);
    }
    if (roleIds.length === 0 && !rec.exception && inline.length === 0) continue;
    out.push([rec.idx, roleIds, rec.exception === true, inline]);
  }
  return out;
}

/** decodeEffects(entry) → records (inverse of encodeEffects). */
export function decodeEffects(entry) {
  const out = [];
  for (const rec of (entry && entry.e) || []) {
    if (!Array.isArray(rec) || rec.length !== 4) continue;
    const [idx, roleIds, ex, inline] = rec;
    if (typeof idx !== 'number' || !Array.isArray(roleIds)) continue;
    out.push({
      idx,
      roles: roleIds.map((id) => ROLE_KEYS[id]).filter(Boolean),
      exception: ex === true,
      inline: (Array.isArray(inline) ? inline : [])
        .map((pair) => (Array.isArray(pair) && pair.length === 2 ? [PROP_KEYS[pair[0]], pair[1]] : null))
        .filter((pair) => pair && typeof pair[0] === 'string'),
    });
  }
  return out;
}

/**
 * validateEntry(entry, { lookupKey, version, styleHash, domSig }) → boolean.
 *
 * Full-field validation BEFORE any replay (design §15.6 step 2, review R4):
 * any failure returns false with ZERO side effects, so the full pipeline runs
 * on a pristine DOM and its harvest is not skewed by half-applied markers.
 */
export function validateEntry(entry, { lookupKey, version, styleHash, domSig }) {
  if (!entry || typeof entry !== 'object') return false;
  if (entry.s !== CACHE_SCHEMA) return false;
  if (entry.k !== lookupKey) return false;
  if (entry.v !== version) return false;
  if (entry.degraded === true) return false; // degraded loads are never cached
  if (entry.sh !== styleHash) return false;
  if (entry.ds !== domSig) return false;
  if (!entry.pal || typeof entry.pal !== 'object') return false;
  if (!Array.isArray(entry.rt)) return false;
  if (!entry.bg || typeof entry.bg !== 'object') return false;
  if (typeof entry.lum !== 'number') return false;
  if (!Array.isArray(entry.e)) return false;
  for (const rec of entry.e) {
    if (!Array.isArray(rec) || rec.length !== 4) return false;
    const [idx, roleIds, ex, inline] = rec;
    if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0) return false;
    if (!Array.isArray(roleIds)) return false;
    if (typeof ex !== 'boolean') return false;
    if (!Array.isArray(inline)) return false;
    for (const pair of inline) {
      if (!Array.isArray(pair) || pair.length !== 2) return false;
      if (typeof pair[0] !== 'number' || typeof pair[1] !== 'string') return false;
    }
  }
  return true;
}

// ── Storage (spec §14.4, design §15.5/§15.6) ──────────────────────────────

function storageOf(api) {
  try {
    const sl = api && api.storage && api.storage.local;
    if (!sl || typeof sl.get !== 'function') return null;
    return sl;
  } catch {
    return null;
  }
}

// UTF-16 code units — always ≥ the byte length of the ASCII payload, so this
// is a deliberate over-estimate for the CACHE_MAX_ENTRY_BYTES guard.
function estimateBytes(value) {
  try {
    const json = JSON.stringify(value);
    return json ? json.length : 0;
  } catch {
    return Number.POSITIVE_INFINITY; // unserializable → treat as oversized
  }
}

/**
 * lookup(api, lookupKey, timeoutMs?) → entry | null.
 *
 * Single-key read raced against CACHE_LOOKUP_TIMEOUT_MS with a SETTLED flag:
 * a resolution arriving after the timeout is DISCARDED, never applied late
 * (review R6 — a late hit double-applied over a full run would corrupt
 * markers). Timeout, error, or absent key → null.
 */
export async function lookup(api, lookupKey, timeoutMs = CACHE_LOOKUP_TIMEOUT_MS) {
  const sl = storageOf(api);
  if (!sl) return null;
  const key = CACHE_KEY_PREFIX + lookupKey;
  return new Promise((resolve) => {
    let settled = false;
    let timer = null;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      resolve(value);
    };
    timer = setTimeout(() => finish(null), timeoutMs);
    try {
      Promise.resolve(sl.get(key)).then(
        (got) => {
          if (settled) return; // late resolution — discarded
          finish(got && typeof got === 'object' ? got[key] || null : null);
        },
        () => finish(null),
      );
    } catch {
      finish(null);
    }
  });
}

function listCacheEntries(all) {
  const entries = [];
  if (!all || typeof all !== 'object') return entries;
  for (const k of Object.keys(all)) {
    if (!k.startsWith(CACHE_KEY_PREFIX)) continue;
    const v = all[k];
    const t = v && typeof v === 'object' && typeof v.t === 'number' ? v.t : 0;
    entries.push({ k, b: estimateBytes(v), t });
  }
  // Oldest first — eviction takes from the front.
  entries.sort((a, b) => a.t - b.t);
  return entries;
}

/**
 * store(api, lookupKey, entry) → void. Never rejects (fire-and-forget from
 * the caller's perspective).
 *
 * No index key: enumerate via get(null), evict the OLDEST `t` entries until
 * the new entry fits the budget and entry-count, then set. On rejection
 * (quota) evict the LRU tail once more and retry once, then give up.
 */
export async function store(api, lookupKey, entry) {
  try {
    const sl = storageOf(api);
    if (!sl) return;
    if (!entry || typeof entry !== 'object') return;
    if (entry.degraded === true) return; // never cache a partial result

    const key = CACHE_KEY_PREFIX + lookupKey;
    const bytes = estimateBytes(entry);
    if (bytes > CACHE_MAX_ENTRY_BYTES) return; // one page must not eat the budget

    let all = null;
    try {
      all = await sl.get(null);
    } catch {
      all = null;
    }

    if (all && typeof all === 'object') {
      let total = 0;
      let count = 0;
      const others = [];
      for (const e of listCacheEntries(all)) {
        if (e.k === key) continue; // will be overwritten, not additional
        total += e.b;
        count += 1;
        others.push(e);
      }
      const evict = [];
      let totalWithNew = total + bytes;
      let countWithNew = count + 1;
      for (const e of others) {
        if (totalWithNew <= CACHE_BUDGET_BYTES && countWithNew <= CACHE_MAX_ENTRIES) break;
        evict.push(e.k);
        totalWithNew -= e.b;
        countWithNew -= 1;
      }
      if (evict.length > 0 && typeof sl.remove === 'function') {
        try {
          await sl.remove(evict);
        } catch {
          /* best effort — eviction is an optimization, not a correctness need */
        }
      }
    }

    try {
      await sl.set({ [key]: entry });
      return;
    } catch {
      // Quota: evict the LRU half of what remains and retry once, then give up.
      try {
        if (!all || typeof sl.remove !== 'function') return;
        const remaining = listCacheEntries(all).filter((e) => e.k !== key);
        const tail = remaining.slice(0, Math.ceil(remaining.length / 2)).map((e) => e.k);
        if (tail.length > 0) await sl.remove(tail);
        await sl.set({ [key]: entry });
      } catch {
        /* fail open — no caching this load */
      }
    }
  } catch {
    /* fail open — a cache write must never delay or break theming */
  }
}

/** touch(api, lookupKey, entry) → refresh `t` so LRU keeps hot pages. */
export async function touch(api, lookupKey, entry) {
  try {
    const sl = storageOf(api);
    if (!sl || !entry || typeof entry !== 'object') return;
    await sl.set({ [CACHE_KEY_PREFIX + lookupKey]: { ...entry, t: Date.now() } });
  } catch {
    /* fire-and-forget */
  }
}
