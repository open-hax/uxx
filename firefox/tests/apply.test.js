// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/apply.test.js — §8 coverage (design §9.1/§6): marker write/teardown
// round-trip INCLUDING the multi-role union (round-3 B1), inline-redirect
// restoration (value + !important priority), teardown removes all data-uxx*,
// role sheet contains exactly the §2 rules with !important inside the
// forced-colors: none wrapper, boot sheet has no no-preference anywhere.

import { describe, it, expect, beforeEach } from 'vitest';
import * as tokens from '../src/theme/tokens.js';
import * as roles from '../src/theme/roles.js';
import { createApply } from '../src/content/apply.js';

function freshDoc() {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  for (const attr of Array.from(document.documentElement.attributes)) {
    document.documentElement.removeAttribute(attr.name);
  }
}

function makeApply() {
  return createApply({ doc: document, tokens, roles });
}

beforeEach(freshDoc);

describe('injectBoot', () => {
  it('emits the §8 boot shape with the four pack literals, forced-colors: none, no no-preference', () => {
    const apply = makeApply();
    const styleEl = apply.injectBoot();
    const css = styleEl.textContent;

    expect(styleEl.getAttribute('data-uxx')).toBe('boot');
    expect(styleEl.parentNode).toBeTruthy();

    // Shape literal, values resolved from tokens.
    expect(css).toContain('@media screen and (forced-colors: none)');
    expect(css).toContain('color-scheme: dark !important');
    expect(css).toContain('background-color: #272822 !important');
    expect(css).toContain('color: #f8f8f2 !important');
    expect(css).toContain('::selection { background-color: rgba(135, 139, 145, 0.5) !important; }');
    expect(css).toContain('::placeholder { color: #90908a !important; }');

    // The review blocker: no-preference is invalid and would kill the rules.
    expect(css).not.toContain('no-preference');
  });

  it('resolves values from the tokens module, not literals (value change flows through)', () => {
    const fakeTokens = {
      resolveToken: (path) => {
        const map = {
          'colors.background.default': '#010203',
          'colors.text.default': '#040506',
          'colors.selection.default': 'rgba(1, 2, 3, 0.5)',
          'colors.text.soft': '#070809',
        };
        return map[path.join('.')];
      },
    };
    const apply = createApply({ doc: document, tokens: fakeTokens, roles });
    const css = apply.injectBoot().textContent;
    expect(css).toContain('background-color: #010203 !important');
    expect(css).toContain('color: #040506 !important');
    expect(css).not.toContain('#272822');
  });
});

describe('ensureRoleSheet', () => {
  it('contains exactly the §2 role rules + STATE_RULES + ::selection, all !important, forced-colors: none', () => {
    const apply = makeApply();
    const styleEl = apply.ensureRoleSheet();
    const css = styleEl.textContent;

    expect(styleEl.getAttribute('data-uxx')).toBe('role');
    expect(css).toContain('@media screen and (forced-colors: none)');
    expect(css).not.toContain('no-preference');

    // One rule per role × property, skipping `selection` (pseudo rule).
    let rolePropertyCount = 0;
    for (const [role, properties] of Object.entries(roles.ROLE_RULES)) {
      if (role === 'selection') continue;
      for (const [property, path] of Object.entries(properties)) {
        rolePropertyCount += 1;
        const cssProperty = {
          background: 'background-color',
          color: 'color',
          border: 'border-color',
          outline: 'outline-color',
        }[property];
        expect(css, `${role} ${property}`).toContain(
          `[data-uxx-role~="${role}"]{${cssProperty}:${tokens.resolveToken(path)}!important}`,
        );
      }
    }
    // selection is skipped above (pseudo rule), so 32 roles × properties:
    // 8 two-property roles (buttons + badges) × 2 + 24 single = 40.
    expect(rolePropertyCount).toBe(40);

    // STATE_RULES rows verbatim.
    for (const [selector, property, path] of roles.STATE_RULES) {
      expect(css, selector).toContain(
        `${selector}{${property}:${tokens.resolveToken(path)}!important}`,
      );
    }

    // ::selection rule (duplicated from boot — harmless, both important).
    expect(css).toContain('::selection{background-color:rgba(135, 139, 145, 0.5)!important}');

    // Word-match selectors only (B1): an exact-match selector would never
    // fire on a multi-role union attribute.
    expect(css).not.toContain('[data-uxx-role="');

    // Rule accounting: 40 role rules + 5 state rules carry ~= selectors.
    const wordMatchCount = (css.match(/\[data-uxx-role~="/g) || []).length;
    expect(wordMatchCount).toBe(40 + 5);
  });
});

describe('ensureInlineSheet', () => {
  it('emits the redirect family inside forced-colors: none', () => {
    const apply = makeApply();
    const css = apply.ensureInlineSheet().textContent;
    expect(css).toContain('@media screen and (forced-colors: none)');
    expect(css).not.toContain('no-preference');
    expect(css).toContain('[data-uxx-inline-color]{color:var(--uxx-inline-color)!important}');
    expect(css).toContain(
      '[data-uxx-inline-background-color]{background-color:var(--uxx-inline-background-color)!important}',
    );
  });
});

describe('mark (multi-role union, round-3 B1)', () => {
  it('accumulates a space-separated union into one attribute, order-stable, no dupes', () => {
    const apply = makeApply();
    const el = document.createElement('div');
    document.body.appendChild(el);

    apply.mark(el, 'surface');
    expect(el.getAttribute('data-uxx-role')).toBe('surface');

    apply.mark(el, 'text-primary');
    expect(el.getAttribute('data-uxx-role')).toBe('surface text-primary');

    // Repeat call: no duplicate, order preserved by first write.
    apply.mark(el, 'surface');
    expect(el.getAttribute('data-uxx-role')).toBe('surface text-primary');

    // All four channels participate.
    apply.mark(el, 'border-subtle');
    apply.mark(el, 'focus');
    expect(el.getAttribute('data-uxx-role')).toBe('surface text-primary border-subtle focus');
  });

  it('never marks img/canvas/video', () => {
    const apply = makeApply();
    for (const tag of ['img', 'canvas', 'video']) {
      const el = document.createElement(tag);
      document.body.appendChild(el);
      apply.mark(el, 'surface');
      expect(el.hasAttribute('data-uxx-role'), tag).toBe(false);
    }
  });
});

describe('redirectInline (design §6 protocol)', () => {
  it('captures the inline declaration, moves it to --uxx-inline-*, sets the marker', () => {
    const apply = makeApply();
    apply.ensureInlineSheet();
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('color', 'red', 'important');

    apply.redirectInline(el, 'color', '#f8f8f2');

    // Inline declaration removed; mapped token in the custom property.
    expect(el.style.getPropertyValue('color')).toBe('');
    expect(el.style.getPropertyValue('--uxx-inline-color')).toBe('#f8f8f2');
    expect(el.getAttribute('data-uxx-inline-color')).toBe('');
    // The style attribute (which our redirect rule beats) carries --uxx-.
    expect(el.getAttribute('style')).toContain('--uxx-inline-color');
  });

  it('teardown restores value AND priority (!important survives)', () => {
    const apply = makeApply();
    apply.ensureInlineSheet();
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('background-color', 'blue', 'important');
    el.style.setProperty('color', 'lime');

    apply.redirectInline(el, 'background-color', '#34352f');
    apply.redirectInline(el, 'color', '#f8f8f2');
    apply.teardown();

    expect(el.style.getPropertyValue('background-color')).toBe('blue');
    expect(el.style.getPropertyPriority('background-color')).toBe('important');
    // Non-important original restores without priority.
    expect(el.style.getPropertyValue('color')).toBe('lime');
    expect(el.style.getPropertyPriority('color')).toBe('');
    // Custom properties and markers gone.
    expect(el.style.getPropertyValue('--uxx-inline-background-color')).toBe('');
    expect(el.style.getPropertyValue('--uxx-inline-color')).toBe('');
    expect(el.hasAttribute('data-uxx-inline-background-color')).toBe(false);
    expect(el.hasAttribute('data-uxx-inline-color')).toBe(false);
  });
});

describe('setException / setDegraded', () => {
  it('write the pinned attributes', () => {
    const apply = makeApply();
    const el = document.createElement('div');
    document.body.appendChild(el);
    apply.setException(el);
    expect(el.getAttribute('data-uxx-contrast')).toBe('exception');
    apply.setDegraded();
    expect(document.documentElement.getAttribute('data-uxx-degraded')).toBe('');
  });
});

describe('teardown', () => {
  it('removes the three sheets, every data-uxx* attribute document-wide, and clears the registry', () => {
    const apply = makeApply();
    apply.injectBoot();
    apply.ensureRoleSheet();
    apply.ensureInlineSheet();
    expect(apply.sheets).toHaveLength(3);

    const el = document.createElement('div');
    document.body.appendChild(el);
    apply.mark(el, 'surface');
    apply.mark(el, 'text-primary');
    apply.setException(el);
    apply.setDegraded();
    expect(el.hasAttribute('data-uxx-role')).toBe(true);

    apply.teardown();

    for (const marker of ['boot', 'role', 'inline']) {
      expect(document.querySelector(`style[data-uxx="${marker}"]`), marker).toBeNull();
    }
    expect(el.hasAttribute('data-uxx-role')).toBe(false);
    expect(el.hasAttribute('data-uxx-contrast')).toBe(false);
    expect(document.documentElement.hasAttribute('data-uxx-degraded')).toBe(false);
    expect(apply.sheets).toHaveLength(0);

    // Second teardown is a no-op (registry cleared).
    apply.teardown();
    expect(apply.sheets).toHaveLength(0);
  });

  it('purges data-uxx* inside open shadow roots', () => {
    const apply = makeApply();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('span');
    shadow.appendChild(inner);
    apply.mark(inner, 'text-primary');

    apply.teardown();
    expect(inner.hasAttribute('data-uxx-role')).toBe(false);
  });
});

describe('sheets getter', () => {
  it('lists injected style elements for withSheetsDisabled', () => {
    const apply = makeApply();
    const boot = apply.injectBoot();
    const role = apply.ensureRoleSheet();
    expect(apply.sheets).toEqual([boot, role]);
  });
});

// REGRESSION (LinkedIn Messaging widget): elements were MARKED with role
// `surface` yet painted `rgb(255,255,255)` — our `!important` rule was losing
// the cascade to the site's own CSS (cross-origin, so the rule could not even
// be read). For !important declarations the cascade is REVERSED across layers:
// an `!important` rule in an EARLIER cascade layer beats `!important` rules in
// later layers AND in unlayered CSS, whatever their selector specificity. So
// all three of our sheets live in one layer, declared FIRST (the boot sheet
// is injected at document_start, before any page stylesheet parses).
describe('cascade layer: our !important rules must beat the site’s', () => {
  const LAYER = 'uxx-monokai';

  // Split a stylesheet into its top-level blocks/statements (brace-depth aware).
  function topLevel(css) {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < css.length; i += 1) {
      const ch = css[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          parts.push(css.slice(start, i + 1).trim());
          start = i + 1;
        }
      } else if (ch === ';' && depth === 0) {
        parts.push(css.slice(start, i + 1).trim());
        start = i + 1;
      }
    }
    const rest = css.slice(start).trim();
    if (rest) parts.push(rest);
    return parts;
  }

  it('boot sheet DECLARES the layer first, then puts every rule inside it', () => {
    const parts = topLevel(makeApply().injectBoot().textContent);
    expect(parts[0]).toBe(`@layer ${LAYER};`); // first thing in the sheet → first layer
    const blocks = parts.slice(1);
    expect(blocks).toHaveLength(1); // nothing unlayered (it would lose to layered page CSS)
    expect(blocks[0].startsWith(`@layer ${LAYER} {`)).toBe(true);
    expect(blocks[0]).toContain('@media screen and (forced-colors: none)');
  });

  it('role sheet is a single block inside the layer — no unlayered rule escapes', () => {
    const apply = makeApply();
    const parts = topLevel(apply.ensureRoleSheet().textContent);
    expect(parts).toHaveLength(1);
    expect(parts[0].startsWith(`@layer ${LAYER} {`)).toBe(true);
    // Every rule still carries !important and the forced-colors guard.
    expect(parts[0]).toContain('@media screen and (forced-colors: none)');
    expect(parts[0]).toContain('[data-uxx-role~="surface"]');
  });

  it('inline-redirect sheet is a single block inside the layer', () => {
    const parts = topLevel(makeApply().ensureInlineSheet().textContent);
    expect(parts).toHaveLength(1);
    expect(parts[0].startsWith(`@layer ${LAYER} {`)).toBe(true);
    expect(parts[0]).toContain('[data-uxx-inline-color]');
  });

  it('no sheet contains a rule outside the layer (counts braces, not substrings)', () => {
    const apply = makeApply();
    for (const css of [apply.injectBoot().textContent, apply.ensureRoleSheet().textContent, apply.ensureInlineSheet().textContent]) {
      const unlayeredBlocks = topLevel(css).filter((p) => p.includes('{') && !p.startsWith('@layer'));
      expect(unlayeredBlocks).toEqual([]);
    }
  });
});

// REGRESSION (LinkedIn Messaging widget, confirmed in the live console probe):
// the widget lives in an OPEN SHADOW ROOT (host DIV#interop-outlet). Our markers
// were written onto its elements, but our stylesheets only existed in the
// DOCUMENT — document styles never cross a shadow boundary — so the marked
// elements kept their native colours (probe: shadow:true, uxxSheetInRoot:false,
// computed background rgb(255,255,255)). Every open shadow root needs its own
// copy of the sheet, placed FIRST so it is also the first cascade layer there.
describe('shadow roots: document-level styles do not pierce them', () => {
  const shadowHost = () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    return { host, root: host.attachShadow({ mode: 'open' }) };
  };

  it('ensureShadowSheet puts our layered role + inline rules as the FIRST child of the root', () => {
    const apply = makeApply();
    const { root } = shadowHost();
    const site = document.createElement('style');
    site.textContent = '.card { background-color: white !important; }';
    root.appendChild(site); // the site's own sheet is already there

    expect(apply.ensureShadowSheet(root)).toBe(true);
    const ours = root.firstElementChild;
    expect(ours.tagName).toBe('STYLE');
    expect(ours.getAttribute('data-uxx')).toBe('shadow');
    expect(root.children[1]).toBe(site); // we are BEFORE the site's CSS
    const css = ours.textContent;
    expect(css.startsWith(`@layer ${'uxx-monokai'};`)).toBe(true);
    expect(css).toContain('@layer uxx-monokai {');
    expect(css).toContain('[data-uxx-role~="surface"]');
    expect(css).toContain('[data-uxx-inline-color]');
    expect(css).toContain('!important');
  });

  it('is idempotent, and re-injects after the page wipes the shadow root', () => {
    const apply = makeApply();
    const { root } = shadowHost();
    expect(apply.ensureShadowSheet(root)).toBe(true);
    expect(apply.ensureShadowSheet(root)).toBe(false); // still there: no duplicate
    expect(root.querySelectorAll('style[data-uxx="shadow"]')).toHaveLength(1);

    root.replaceChildren(); // a framework re-render clears the root
    expect(apply.ensureShadowSheet(root)).toBe(true);
    expect(root.querySelectorAll('style[data-uxx="shadow"]')).toHaveLength(1);
  });

  it('teardown removes the shadow sheets too (page is left exactly as found)', () => {
    const apply = makeApply();
    const { root } = shadowHost();
    apply.ensureShadowSheet(root);
    const child = document.createElement('p');
    child.setAttribute('data-uxx-role', 'surface');
    root.appendChild(child);
    apply.teardown();
    expect(root.querySelector('style[data-uxx="shadow"]')).toBeNull();
    expect(child.hasAttribute('data-uxx-role')).toBe(false);
  });

  it('ignores things that are not shadow roots', () => {
    const apply = makeApply();
    expect(apply.ensureShadowSheet(null)).toBe(false);
    expect(apply.ensureShadowSheet({})).toBe(false);
  });
});
