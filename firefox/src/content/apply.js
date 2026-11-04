// SPDX-License-Identifier: GPL-3.0-or-later
//
// src/content/apply.js — role sheet builder, markers, inline redirect,
// teardown (spec §8, design §6/§9.1).
//
// Three injected channels, all wrapped in `@media screen and (forced-colors:
// none)` — NEVER `no-preference` (an invalid value that would make every rule
// dead, design §6 review blocker).
//
// B1 (round-3 blocker): `mark(el, role)` accumulates a space-separated union
// into ONE `data-uxx-role` attribute; role-sheet selectors and STATE_RULES
// use `[data-uxx-role~="x"]` word-match, so all of an element's channels
// (bg, color, border, outline) fire simultaneously — no dominant-role
// arbitration exists.

// role-sheet property key → CSS property name.
const PROPERTY_CSS = {
  background: 'background-color',
  color: 'color',
  border: 'border-color',
  outline: 'outline-color',
};

// Never marked (design §6: raster targets are never touched).
const MARK_SKIP_TAGS = new Set(['img', 'canvas', 'video']);

const SHOW_ELEMENT = 1; // NodeFilter.SHOW_ELEMENT

/**
 * createApply({ doc, tokens, roles })
 *
 * tokens: the generated tokens module namespace (must expose resolveToken).
 * roles:  the roles module namespace (ROLE_RULES, STATE_RULES).
 */
export function createApply({ doc, tokens, roles }) {
  const { resolveToken } = tokens;
  const { ROLE_RULES, STATE_RULES } = roles;

  const sheets = [];
  // Redirect registry: el → { cssProperty: { value, priority } }. A WeakMap
  // alone cannot be enumerated for teardown, so elements are also recorded in
  // a Set (spec-refinement for implementability).
  const redirected = new Map();
  const redirectedEls = new Set();

  function makeStyle(marker, cssText) {
    const el = doc.createElement('style');
    el.setAttribute('data-uxx', marker);
    el.textContent = cssText;
    (doc.head || doc.documentElement).appendChild(el);
    sheets.push(el);
    return el;
  }

  // Boot sheet (design §9.1 channel 1): CSS *shape* literal, *values*
  // resolved from tokens at build-of-sheet time (spec §8).
  function injectBoot() {
    const bg = resolveToken(['colors', 'background', 'default']);
    const fg = resolveToken(['colors', 'text', 'default']);
    const selection = resolveToken(['colors', 'selection', 'default']);
    const placeholder = resolveToken(['colors', 'text', 'soft']);
    const css = `@media screen and (forced-colors: none) {
  :root { color-scheme: dark !important;
          background-color: ${bg} !important; color: ${fg} !important; }
  ::selection { background-color: ${selection} !important; }
  ::placeholder { color: ${placeholder} !important; }
}`;
    return makeStyle('boot', css);
  }

  // Role sheet (design §9.1 channel 2): built at RUNTIME from roles.js +
  // tokens.js (keeps the multi-pack extension point honest, §11). One rule
  // per role × property in ROLE_RULES (skipping `selection`, which becomes a
  // `::selection` rule), plus STATE_RULES rows, plus the `::selection` rule
  // duplicated from the boot sheet (harmless, both important).
  function ensureRoleSheet() {
    const lines = [];
    for (const [role, properties] of Object.entries(ROLE_RULES)) {
      if (role === 'selection') continue;
      for (const [property, path] of Object.entries(properties)) {
        const cssProperty = PROPERTY_CSS[property];
        lines.push(`[data-uxx-role~="${role}"]{${cssProperty}:${resolveToken(path)}!important}`);
      }
    }
    for (const [selector, property, path] of STATE_RULES) {
      lines.push(`${selector}{${property}:${resolveToken(path)}!important}`);
    }
    lines.push(`::selection{background-color:${resolveToken(ROLE_RULES.selection.background)}!important}`);
    const css = `@media screen and (forced-colors: none) {\n${lines.join('\n')}\n}`;
    return makeStyle('role', css);
  }

  // Inline-redirect sheet (design §9.1 channel 3): `screen` included, same
  // as the other two channels (design §6 print row; review F12).
  function ensureInlineSheet() {
    const css = `@media screen and (forced-colors: none) {
[data-uxx-inline-color]{color:var(--uxx-inline-color)!important}
[data-uxx-inline-background-color]{background-color:var(--uxx-inline-background-color)!important}
}`;
    return makeStyle('inline', css);
  }

  // MULTI-ROLE marker (round-3 B1): one space-separated data-uxx-role attr —
  // set-union merge on repeat calls (no duplicates, no order significance;
  // order-stable by first write). Never on img/canvas/video.
  function mark(el, role) {
    if (!el || el.nodeType !== 1) return;
    if (MARK_SKIP_TAGS.has(el.tagName.toLowerCase())) return;
    const current = el.getAttribute('data-uxx-role');
    const list = current ? current.split(/\s+/).filter(Boolean) : [];
    if (list.includes(role)) return;
    list.push(role);
    el.setAttribute('data-uxx-role', list.join(' '));
  }

  // Inline-!important protocol (design §6, corrected version, spec §8):
  // capture the original declaration (value + priority), remove it from the
  // inline style, move the mapped token into --uxx-inline-*, set the
  // data-uxx-inline-* marker; the redirect sheet then applies it with
  // !important (there is no longer a competing inline declaration).
  function redirectInline(el, property, mappedValue) {
    const prev = {
      value: el.style.getPropertyValue(property),
      priority: el.style.getPropertyPriority(property),
    };
    let record = redirected.get(el);
    if (!record) {
      record = {};
      redirected.set(el, record);
    }
    record[property] = prev;
    redirectedEls.add(el);
    el.style.removeProperty(property);
    el.style.setProperty(`--uxx-inline-${property}`, mappedValue);
    el.setAttribute(`data-uxx-inline-${property}`, '');
  }

  function setException(el) {
    el.setAttribute('data-uxx-contrast', 'exception');
  }

  function setDegraded() {
    doc.documentElement.setAttribute('data-uxx-degraded', '');
  }

  // Strip every data-uxx* attribute under rootNode, traversing open shadow
  // roots (TreeWalker over the light tree; recursion into shadowRoot —
  // closed roots untouched, documented limitation).
  function purgeAttributes(rootNode) {
    if (!rootNode) return;
    const owner = rootNode.ownerDocument || doc;
    const walker = owner.createTreeWalker(rootNode, SHOW_ELEMENT);
    const shadowRoots = [];
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === 1) {
        for (const attr of Array.from(node.attributes || [])) {
          if (attr.name.startsWith('data-uxx')) node.removeAttribute(attr.name);
        }
        if (node.shadowRoot) shadowRoots.push(node.shadowRoot);
      }
      node = walker.nextNode();
    }
    if (rootNode.nodeType === 1) {
      for (const attr of Array.from(rootNode.attributes || [])) {
        if (attr.name.startsWith('data-uxx')) rootNode.removeAttribute(attr.name);
      }
    }
    for (const shadowRoot of shadowRoots) purgeAttributes(shadowRoot);
  }

  // Full restore (spec §8 step 3): remove the three style elements; restore
  // every redirected inline declaration (value AND original priority —
  // !important survives); remove --uxx-inline-* and data-uxx-inline-*; then
  // remove every data-uxx* attribute document-wide; clear the registry.
  function teardown() {
    for (const sheet of sheets.splice(0)) {
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
    }
    for (const el of redirectedEls) {
      const record = redirected.get(el) || {};
      for (const [property, prev] of Object.entries(record)) {
        el.style.removeProperty(`--uxx-inline-${property}`);
        el.removeAttribute(`data-uxx-inline-${property}`);
        if (prev.value) {
          el.style.setProperty(property, prev.value, prev.priority);
        } else {
          el.style.removeProperty(property);
        }
      }
    }
    redirected.clear();
    redirectedEls.clear();
    purgeAttributes(doc.documentElement || doc);
  }

  return {
    injectBoot,
    ensureRoleSheet,
    ensureInlineSheet,
    mark,
    redirectInline,
    setException,
    setDegraded,
    get sheets() {
      return sheets.slice();
    },
    teardown,
  };
}
