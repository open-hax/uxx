// SPDX-License-Identifier: GPL-3.0-or-later
//
// tests/chrome-theme.test.js — the §10 key/value gate (design §9.2/§12):
// every theme key maps to a pack value; required key coverage enumerated
// from design §9.2 as a literal list — missing key = fail.

import { describe, it, expect } from 'vitest';
import { pack, resolveToken } from '../src/theme/tokens.js';
import { buildChromeTheme, CHROME_THEME_KEYS } from '../src/theme/chrome-theme.js';

// Literal required-key list transcribed from design §9.2's table (34 keys).
const REQUIRED_KEYS = [
  'frame',
  'frame_inactive',
  'toolbar',
  'toolbar_text',
  'bookmark_text',
  'tab_selected',
  'tab_text',
  'tab_background_text',
  'tab_line',
  'toolbar_field',
  'toolbar_field_text',
  'toolbar_field_border',
  'toolbar_field_border_focus',
  'toolbar_field_focus',
  'toolbar_field_highlight',
  'toolbar_field_highlight_text',
  'popup',
  'popup_text',
  'popup_border',
  'popup_highlight',
  'popup_highlight_text',
  'sidebar',
  'sidebar_text',
  'sidebar_border',
  'sidebar_highlight',
  'sidebar_highlight_text',
  'ntp_background',
  'ntp_text',
  'ntp_card_background',
  'icons',
  'icons_attention',
  'toolbar_top_separator',
  'toolbar_bottom_separator',
  'toolbar_vertical_separator',
];

// Expected key → resolved pack value, pinned from design §9.2's table.
const EXPECTED_VALUES = {
  frame: ['palette', 'bg', 'darker'],
  frame_inactive: ['palette', 'bg', 'default'],
  toolbar: ['palette', 'bg', 'default'],
  toolbar_text: ['palette', 'fg', 'default'],
  bookmark_text: ['palette', 'fg', 'default'],
  tab_selected: ['palette', 'bg', 'lighter'],
  tab_text: ['palette', 'fg', 'default'],
  tab_background_text: ['palette', 'fg', 'soft'],
  tab_line: ['colors', 'interactive', 'default'],
  toolbar_field: ['palette', 'bg', 'selection'],
  toolbar_field_text: ['palette', 'fg', 'default'],
  toolbar_field_border: ['palette', 'bg', 'groupBorder'],
  toolbar_field_border_focus: ['colors', 'border', 'focus'],
  toolbar_field_focus: ['palette', 'bg', 'tabInactive'],
  toolbar_field_highlight: ['palette', 'bg', 'selection'],
  toolbar_field_highlight_text: ['palette', 'fg', 'default'],
  popup: ['palette', 'bg', 'lighter'],
  popup_text: ['palette', 'fg', 'default'],
  popup_border: ['palette', 'bg', 'groupBorder'],
  popup_highlight: ['palette', 'bg', 'selection'],
  popup_highlight_text: ['palette', 'fg', 'default'],
  sidebar: ['palette', 'bg', 'darker'],
  sidebar_text: ['palette', 'fg', 'default'],
  sidebar_border: ['palette', 'bg', 'groupBorder'],
  sidebar_highlight: ['palette', 'bg', 'selection'],
  sidebar_highlight_text: ['palette', 'fg', 'default'],
  ntp_background: ['palette', 'bg', 'default'],
  ntp_text: ['palette', 'fg', 'default'],
  ntp_card_background: ['palette', 'bg', 'lighter'],
  icons: ['palette', 'fg', 'default'],
  icons_attention: ['palette', 'accent', 'green'],
  toolbar_top_separator: ['palette', 'bg', 'groupBorder'],
  toolbar_bottom_separator: ['palette', 'bg', 'groupBorder'],
  toolbar_vertical_separator: ['palette', 'bg', 'groupBorder'],
};

const theme = buildChromeTheme(pack);

describe('buildChromeTheme', () => {
  it('carries exactly the required key set — no missing, no extra', () => {
    expect(Object.keys(theme.colors).sort()).toEqual([...REQUIRED_KEYS].sort());
    expect([...CHROME_THEME_KEYS].sort()).toEqual([...REQUIRED_KEYS].sort());
  });

  it('every value equals the resolved pack value (design §7 invariant)', () => {
    for (const [key, path] of Object.entries(EXPECTED_VALUES)) {
      expect(theme.colors[key], key).toBe(resolveToken(path));
    }
  });

  it('pins tab_line to colors.interactive.default (round-2 N2)', () => {
    expect(theme.colors.tab_line).toBe(resolveToken(['colors', 'interactive', 'default']));
    expect(theme.colors.tab_line).toBe('#a6e22e');
  });

  it('pins tab_background_text to palette.fg.soft, not fg.muted (review fix)', () => {
    expect(theme.colors.tab_background_text).toBe('#90908a');
  });

  it('sets both color_scheme and content_color_scheme to dark (Q4)', () => {
    expect(theme.properties.color_scheme).toBe('dark');
    expect(theme.properties.content_color_scheme).toBe('dark');
  });
});
