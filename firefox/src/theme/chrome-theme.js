// SPDX-License-Identifier: GPL-3.0-or-later
//
// src/theme/chrome-theme.js — builds the browser.theme Theme object from the
// uxx theme pack (spec §10, design §9.2).
//
// Window-scoped; applied via theme.update() by the background script (content
// scripts cannot call the theme API). Transcribed design §9.2's key table
// row-for-row; the paths below are the spec §10 transcription.

// Theme key → token path within the generated pack.
const KEY_TOKEN_PATHS = {
  frame: ['palette', 'bg', 'darker'],
  frame_inactive: ['palette', 'bg', 'default'],
  toolbar: ['palette', 'bg', 'default'],
  toolbar_text: ['palette', 'fg', 'default'],
  // design §9.2 marks bookmark_text as the toolbar_text alias (review F13);
  // it is still a distinct required key in chrome-theme.test.js's literal list.
  bookmark_text: ['palette', 'fg', 'default'],
  tab_selected: ['palette', 'bg', 'lighter'],
  tab_text: ['palette', 'fg', 'default'],
  tab_background_text: ['palette', 'fg', 'soft'],
  // round-2 N2: colors.interactive.default (design §9.2 pins #a6e22e) — NOT
  // palette.accent.green, even though the two coincide in the Monokai pack.
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

// The exact required key set (design §9.2 table, enumerated for the test gate).
export const CHROME_THEME_KEYS = Object.freeze(Object.keys(KEY_TOKEN_PATHS));

function resolvePath(pack, path) {
  let node = pack;
  for (const key of path) {
    if (node === null || typeof node !== 'object' || !(key in node)) {
      throw new Error(`unknown chrome-theme token path: ${path.join('.')}`);
    }
    node = node[key];
  }
  if (typeof node !== 'string') {
    throw new Error(`unknown chrome-theme token path: ${path.join('.')}`);
  }
  return node;
}

/**
 * buildChromeTheme(pack) → { colors: { …exact §9.2 key table… },
 *                            properties: { color_scheme: 'dark',
 *                                         content_color_scheme: 'dark' } }
 *
 * Every value is resolved from the pack (design §7 invariant: emitted colors
 * are pack tokens). Both color-scheme properties are set explicitly (design
 * §9.2 Q4 resolution — explicit beats auto, cost is zero).
 */
export function buildChromeTheme(pack) {
  const colors = {};
  for (const [key, path] of Object.entries(KEY_TOKEN_PATHS)) {
    colors[key] = resolvePath(pack, path);
  }
  return {
    colors,
    properties: {
      color_scheme: 'dark',
      content_color_scheme: 'dark',
    },
  };
}
