// SPDX-License-Identifier: GPL-3.0-or-later
//
// src/theme/sheet-css.js — the ONE place our injected CSS is generated.
// Used by the content script (author-level sheets + every open shadow root)
// and by scripts/generate-user-css.mjs (the user-origin stylesheet registered
// through browser.scripting with cssOrigin:'user'). Keeping both on the same
// builder is what stops them drifting apart.

export const LAYER = 'uxx-monokai';

export const layered = (css) => `@layer ${LAYER} {\n${css}\n}`;

// One rule per role × property, plus STATE_RULES and ::selection.
export function roleRuleLines(roles, resolveToken) {
  const { ROLE_RULES, STATE_RULES } = roles;
  const PROPERTY_CSS = {
    background: 'background-color',
    color: 'color',
    border: 'border-color',
    outline: 'outline-color',
  };
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
  return lines;
}

export function roleSheetCss(roles, resolveToken) {
  return layered(`@media screen and (forced-colors: none) {\n${roleRuleLines(roles, resolveToken).join('\n')}\n}`);
}

export function inlineSheetCss() {
  return layered(`@media screen and (forced-colors: none) {
[data-uxx-inline-color]{color:var(--uxx-inline-color)!important}
[data-uxx-inline-background-color]{background-color:var(--uxx-inline-background-color)!important}
}`);
}

// The user-origin sheet: role + state + inline-redirect rules. Also exactly
// what each open shadow root needs (document/user styles never pierce one).
export function userCss(roles, resolveToken) {
  return `@layer ${LAYER};\n${roleSheetCss(roles, resolveToken)}\n${inlineSheetCss()}\n`;
}
