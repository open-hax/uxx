// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/generate.test.js — the generated tokens.js gate (spec §11):
// imports; resolveToken hits + throws on bad path; themeId === 'monokai'.
// Token source of truth: tokens/src/colors.ts (themes.monokai + monokai
// palette), consumed only through this generated file.

import { describe, it, expect } from 'vitest';
import { themeId, pack, cssVars, resolveToken } from '../src/theme/tokens.js';

describe('generated tokens.js', () => {
  it('themeId is monokai', () => {
    expect(themeId).toBe('monokai');
  });

  it('pack carries the structured Monokai pack (colors + palette)', () => {
    expect(typeof pack).toBe('object');
    expect(pack.colors).toBeTypeOf('object');
    expect(pack.palette).toBeTypeOf('object');
  });

  it('resolveToken hits the pinned token values', () => {
    expect(resolveToken(['colors', 'background', 'default'])).toBe('#272822');
    expect(resolveToken(['colors', 'text', 'default'])).toBe('#f8f8f2');
    expect(resolveToken(['colors', 'selection', 'default'])).toBe('rgba(135, 139, 145, 0.5)');
    expect(resolveToken(['colors', 'text', 'soft'])).toBe('#90908a');
    expect(resolveToken(['palette', 'bg', 'selection'])).toBe('#414339');
    expect(resolveToken(['palette', 'bg', 'darker'])).toBe('#1e1f1c');
    expect(resolveToken(['colors', 'interactive', 'default'])).toBe('#a6e22e');
    expect(resolveToken(['colors', 'button', 'primary', 'bg'])).toBe('#75715e');
    expect(resolveToken(['colors', 'border', 'focus'])).toBe('#99947c');
  });

  it('resolveToken throws on an unknown path', () => {
    expect(() => resolveToken(['colors', 'nope', 'nope'])).toThrow(
      'unknown token path: colors.nope.nope',
    );
    // Root walk lands on the pack object (non-string) → throws.
    expect(() => resolveToken([])).toThrow('unknown token path: ');
  });

  it('resolveToken throws when the path lands on a non-string', () => {
    expect(() => resolveToken(['colors', 'background'])).toThrow(
      'unknown token path: colors.background',
    );
  });

  it('cssVars exposes the --uxx-* mirror with the pinned values', () => {
    expect(cssVars['--uxx-colors-background-default']).toBe('#272822');
    expect(cssVars['--uxx-colors-text-default']).toBe('#f8f8f2');
    expect(cssVars['--uxx-palette-bg-selection']).toBe('#414339');
  });

  it('pins the boot-sheet literals (spec §8 invariant)', () => {
    // The boot sheet's four literal values are the pack's.
    const bootValues = [
      resolveToken(['colors', 'background', 'default']),
      resolveToken(['colors', 'text', 'default']),
      resolveToken(['colors', 'selection', 'default']),
      resolveToken(['colors', 'text', 'soft']),
    ];
    expect(bootValues).toEqual(['#272822', '#f8f8f2', 'rgba(135, 139, 145, 0.5)', '#90908a']);
  });
});
