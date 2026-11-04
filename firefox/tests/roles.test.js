// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/roles.test.js — the §2 path-resolution gate (design §7/§12):
// every token path in roles.js resolves to a defined value in tokens.js —
// a nonexistent path is a test failure, not a runtime `undefined`.

import { describe, it, expect } from 'vitest';
import { resolveToken } from '../src/theme/tokens.js';
import {
  ROLE_RULES,
  TEXT_RANK_ROLES,
  TEXT_RANK_POOL,
  STATE_RULES,
  ROLE_TOKEN_PATHS,
} from '../src/theme/roles.js';

// The complete §2 role table — an exact-copy gate: a missing or extra role
// fails. 33 roles.
const EXPECTED_ROLES = [
  'page-background',
  'surface',
  'surface-recessed',
  'elevated',
  'input-surface',
  'overlay',
  'text-primary',
  'text-secondary',
  'text-muted',
  'text-faint',
  'text-inverse',
  'link',
  'button-primary',
  'button-secondary',
  'button-ghost',
  'button-danger',
  'focus',
  'border',
  'border-subtle',
  'border-focus',
  'selection',
  'semantic-error',
  'semantic-warning',
  'semantic-success',
  'semantic-info',
  'badge-success',
  'badge-warning',
  'badge-error',
  'badge-info',
  'code-surface',
  'code-text',
  'accent-yellow',
  'accent-magenta',
];

const VALID_PROPERTIES = new Set(['background', 'color', 'border', 'outline']);

function allRulePaths() {
  const paths = [];
  for (const properties of Object.values(ROLE_RULES)) {
    for (const path of Object.values(properties)) paths.push(path);
  }
  return paths;
}

describe('ROLE_RULES', () => {
  it('carries exactly the spec §2 role set (no extras, none missing)', () => {
    expect(Object.keys(ROLE_RULES).sort()).toEqual([...EXPECTED_ROLES].sort());
  });

  it('uses only the four channel property keys', () => {
    for (const [role, properties] of Object.entries(ROLE_RULES)) {
      expect(Object.keys(properties), `role ${role}`).not.toHaveLength(0);
      for (const property of Object.keys(properties)) {
        expect(VALID_PROPERTIES.has(property), `role ${role} property ${property}`).toBe(true);
      }
    }
  });

  it('every token path resolves in tokens.js (nonexistent-path gate)', () => {
    for (const path of allRulePaths()) {
      const value = resolveToken(path); // throws on miss
      expect(typeof value, path.join('.')).toBe('string');
    }
  });

  it('pins the design §7 naming traps', () => {
    // text-secondary → colors.text.panel, NOT colors.text.secondary.
    expect(ROLE_RULES['text-secondary'].color).toEqual(['colors', 'text', 'panel']);
    expect(resolveToken(['colors', 'text', 'secondary'])).toBe('#75715e');
    expect(resolveToken(['colors', 'text', 'panel'])).toBe('#cccccc');
    // input-surface → palette.bg.selection (colors.background.selection
    // does not exist in the pack).
    expect(ROLE_RULES['input-surface'].background).toEqual(['palette', 'bg', 'selection']);
    expect(() => resolveToken(['colors', 'background', 'selection'])).toThrow();
    // button-primary.bg = colors.button.primary.bg = #75715e (taupe).
    expect(ROLE_RULES['button-primary'].background).toEqual([
      'colors',
      'button',
      'primary',
      'bg',
    ]);
    expect(resolveToken(['colors', 'button', 'primary', 'bg'])).toBe('#75715e');
  });

  it('focus emits outline → colors.border.focus (its only assignment path)', () => {
    expect(ROLE_RULES.focus).toEqual({ outline: ['colors', 'border', 'focus'] });
  });

  it('selection is a background row (becomes the ::selection pseudo rule)', () => {
    expect(ROLE_RULES.selection).toEqual({
      background: ['colors', 'selection', 'default'],
    });
  });
});

describe('TEXT_RANK_POOL / TEXT_RANK_ROLES', () => {
  it('pool is ordered luminance high → low (design §7 text table)', () => {
    expect(TEXT_RANK_POOL).toEqual([
      ['colors', 'text', 'default'],
      ['colors', 'text', 'panel'],
      ['colors', 'text', 'soft'],
      ['colors', 'text', 'muted'],
    ]);
    expect(TEXT_RANK_ROLES).toEqual([
      'text-primary',
      'text-secondary',
      'text-muted',
      'text-faint',
    ]);
  });

  it('excludes text-inverse (review F20 — direct single-token role)', () => {
    const flat = TEXT_RANK_POOL.map((p) => p.join('.'));
    expect(flat).not.toContain('colors.text.inverse');
    expect(TEXT_RANK_ROLES).not.toContain('text-inverse');
  });

  it('pool paths resolve', () => {
    for (const path of TEXT_RANK_POOL) {
      expect(typeof resolveToken(path)).toBe('string');
    }
  });
});

describe('STATE_RULES', () => {
  it('has exactly the five hover-synthesis rows of §2', () => {
    expect(STATE_RULES).toEqual([
      ['[data-uxx-role~="link"]:hover', 'color', ['colors', 'interactive', 'hover']],
      ['[data-uxx-role~="button-primary"]:hover', 'background-color', ['colors', 'button', 'primary', 'hover']],
      ['[data-uxx-role~="button-secondary"]:hover', 'background-color', ['colors', 'button', 'secondary', 'hover']],
      ['[data-uxx-role~="button-ghost"]:hover', 'background-color', ['colors', 'button', 'ghost', 'hover']],
      ['[data-uxx-role~="button-danger"]:hover', 'background-color', ['colors', 'button', 'danger', 'hover']],
    ]);
  });

  it('uses word-match ~= selectors (round-3 B1 — multi-role attributes)', () => {
    for (const [selector] of STATE_RULES) {
      expect(selector, selector).toContain('[data-uxx-role~="');
      // Exact-match selectors would never fire on a union attribute.
      expect(selector.includes('[data-uxx-role="')).toBe(false);
    }
  });

  it('every token path resolves', () => {
    for (const [, , path] of STATE_RULES) {
      expect(typeof resolveToken(path)).toBe('string');
    }
  });
});

describe('ROLE_TOKEN_PATHS', () => {
  it('is the exact union of ROLE_RULES + TEXT_RANK_POOL + STATE_RULES paths', () => {
    const expected = new Set([
      ...allRulePaths().map((p) => p.join('.')),
      ...TEXT_RANK_POOL.map((p) => p.join('.')),
      ...STATE_RULES.map(([, , p]) => p.join('.')),
    ]);
    const actual = new Set(ROLE_TOKEN_PATHS.map((p) => p.join('.')));
    expect(actual).toEqual(expected);
  });

  it('every path resolves through resolveToken (the nonexistent-path gate)', () => {
    for (const path of ROLE_TOKEN_PATHS) {
      const value = resolveToken(path); // throws on miss
      expect(typeof value, path.join('.')).toBe('string');
    }
  });
});
