/**
 * Design Tokens - Colors
 * 
 * Official Monokai Classic palette from VS Code theme.
 * Source: github.com/brayevalerien/cb94ac685ebc186f359deae113b6710c
 * 
 * Key principle: surfaces are DARKER than the editor bg (#272822),
 * matching VS Code's sidebar (#1e1f1c) and panel model.
 */

// Monokai Classic Base Palette (from official VS Code theme)
export const monokai = {
  // Background tones
  bg: {
    default: '#272822',   // Editor Background
    darker: '#1e1f1c',    // Sidebar, Menu, Widget Background
    lighter: '#3e3d32',   // Editor Line Highlight, List Hover
    selection: '#414339', // Input, List Inactive Selection, Panel Border
    tabInactive: '#34352f', // Tab Inactive Background
    groupBorder: '#34352f', // Editor Group Border
  },
  
  // Foreground tones
  fg: {
    default: '#f8f8f2',   // Editor Foreground
    bright: '#f8f8f2',    // Brightest text
    panel: '#cccccc',     // Panel/menu foreground
    soft: '#90908a',      // Secondary body text
    muted: '#75715e',     // Badge Background, Panel Title Inactive
    subtle: '#464741',    // Indent Guide, Whitespace
  },
  
  // Accent colors (classic Monokai syntax highlighting)
  accent: {
    yellow: '#e6db74',    // strings
    orange: '#fd971f',    // functions, params
    red: '#f92672',       // keywords, tags
    magenta: '#ae81ff',   // numbers, attributes
    blue: '#66d9ef',      // types, params
    cyan: '#66d9ef',      // alias used by components
    green: '#a6e22e',     // strings (alternate)
  },
  
  // Semantic colors
  semantic: {
    error: '#f92672',
    warning: '#fd971f',
    success: '#a6e22e',
    info: '#66d9ef',
  },
} as const;

// Semantic color aliases for components
export const colors = {
  // Backgrounds — surfaces are DARKER or same as bg, never lighter
  background: {
    default: monokai.bg.default,      // #272822 — editor bg
    surface: monokai.bg.darker,       // #1e1f1c — sidebar/panel bg (darker)
    elevated: monokai.bg.tabInactive, // #34352f — tab/card surface
    highlight: monokai.bg.lighter,    // #3e3d32 — line highlight
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  
  // Selection/highlight colors
  selection: {
    default: 'rgba(135, 139, 145, 0.5)', // #878b9180 — Editor Selection
  },
  
  // Text
  text: {
    default: monokai.fg.default,    // #f8f8f2
    bright: monokai.fg.bright,
    panel: monokai.fg.panel,
    soft: monokai.fg.soft,
    muted: monokai.fg.muted,        // #75715e
    subtle: monokai.fg.subtle,      // #464741
    inverse: monokai.bg.default,
    secondary: monokai.fg.muted,
  },
  
  // Interactive states
  interactive: {
    default: monokai.accent.green,
    hover: '#8fce26',
    active: '#7cb824',
    disabled: monokai.fg.muted,
  },
  
  // Component-specific
  button: {
    primary: {
      bg: monokai.fg.muted,         // #75715e — VS Code Button Background
      fg: monokai.fg.default,
      hover: '#8a856e',
      active: '#6a6654',
    },
    secondary: {
      bg: monokai.bg.selection,     // #414339
      fg: monokai.fg.default,
      hover: '#505248',
      active: '#3a3c33',
    },
    ghost: {
      bg: 'transparent',
      fg: monokai.fg.default,
      hover: monokai.bg.selection,
      active: monokai.bg.tabInactive,
    },
    danger: {
      bg: monokai.accent.red,
      fg: monokai.fg.default,
      hover: '#e61b63',
      active: '#d1155c',
    },
  },
  
  badge: {
    default: {
      bg: monokai.fg.muted,         // #75715e — VS Code Badge Background
      fg: monokai.fg.default,
    },
    success: {
      bg: 'rgba(166, 226, 46, 0.15)',
      fg: monokai.accent.green,
    },
    warning: {
      bg: 'rgba(253, 151, 31, 0.15)',
      fg: monokai.accent.orange,
    },
    error: {
      bg: 'rgba(249, 38, 114, 0.15)',
      fg: monokai.accent.red,
    },
    info: {
      bg: 'rgba(102, 217, 239, 0.15)',
      fg: monokai.accent.blue,
    },
  },
  
  border: {
    default: monokai.bg.groupBorder, // #34352f — Editor Group Border
    subtle: monokai.fg.subtle,       // #464741 — Indent Guide
    focus: '#99947c',                // VS Code Focus Border
    error: monokai.accent.red,
  },
  
  // Accent colors (direct access)
  accent: monokai.accent,
  
  // Status colors
  status: {
    alive: monokai.accent.green,
    dead: monokai.accent.red,
    open: monokai.accent.green,
    closed: monokai.fg.muted,
    merged: monokai.accent.magenta,
    sleeping: monokai.accent.blue,
    eating: monokai.accent.orange,
    working: monokai.accent.yellow,
  },

  // Chart/data-viz palette
  chart: {
    segment0: monokai.accent.blue,
    segment1: monokai.accent.green,
    segment2: monokai.accent.yellow,
    segment3: monokai.accent.orange,
    segment4: monokai.accent.magenta,
    segment5: '#7ca3b5',
  },

  // Fill gradients
  fill: {
    good: { start: monokai.accent.green, end: '#78efb7' },
    warn: { start: monokai.accent.orange, end: '#ffd280' },
    danger: { start: monokai.accent.red, end: '#ff9e92' },
    neutral: { start: '#7aa7bd', end: '#98bfd0' },
  },

  // Surface tints — rgba overlays that sit on top of the background.
  // These are NOT solid colors; they're translucent layers that let the
  // body gradient show through for the glassmorphism effect.
  // Derived from official VS Code Monokai Classic values.
  surface: {
    panel: 'rgba(30, 31, 28, 0.82)',    // Sidebar #1e1f1c at 82% opacity
    card: 'rgba(52, 53, 47, 0.65)',     // Tab inactive #34352f at 65%
    cardAlt: 'rgba(62, 61, 50, 0.55)',  // Line highlight #3e3d32 at 55%
    input: 'rgba(65, 67, 57, 0.78)',    // Input #414339 at 78%
    nav: 'rgba(30, 31, 28, 0.6)',       // Menu #1e1f1c at 60%
  },

  // Alpha overlays — reusable rgba values for borders, backgrounds, and accents.
  // Every rgba in proxx CSS must map to one of these. No hardcoded colors allowed.
  alpha: {
    green: {
      _08: 'rgba(166, 226, 46, 0.08)',
      _12: 'rgba(166, 226, 46, 0.12)',
      _14: 'rgba(166, 226, 46, 0.14)',
      _15: 'rgba(166, 226, 46, 0.15)',
      _16: 'rgba(166, 226, 46, 0.16)',
      _25: 'rgba(166, 226, 46, 0.25)',
      _28: 'rgba(166, 226, 46, 0.28)',
      _30: 'rgba(166, 226, 46, 0.30)',
      _35: 'rgba(166, 226, 46, 0.35)',
      _38: 'rgba(166, 226, 46, 0.38)',
      _40: 'rgba(166, 226, 46, 0.40)',
      _45: 'rgba(166, 226, 46, 0.45)',
      _50: 'rgba(166, 226, 46, 0.50)',
      _55: 'rgba(166, 226, 46, 0.55)',
      _60: 'rgba(166, 226, 46, 0.60)',
      _80: 'rgba(166, 226, 46, 0.80)',
    },
    red: {
      _12: 'rgba(249, 38, 114, 0.12)',
      _14: 'rgba(249, 38, 114, 0.14)',
      _15: 'rgba(249, 38, 114, 0.15)',
      _25: 'rgba(249, 38, 114, 0.25)',
      _30: 'rgba(249, 38, 114, 0.30)',
      _38: 'rgba(249, 38, 114, 0.38)',
      _40: 'rgba(249, 38, 114, 0.40)',
      _45: 'rgba(249, 38, 114, 0.45)',
      _46: 'rgba(249, 38, 114, 0.46)',
      _50: 'rgba(249, 38, 114, 0.50)',
    },
    orange: {
      _12: 'rgba(253, 151, 31, 0.12)',
      _15: 'rgba(253, 151, 31, 0.15)',
      _32: 'rgba(253, 151, 31, 0.32)',
      _35: 'rgba(253, 151, 31, 0.35)',
      _40: 'rgba(253, 151, 31, 0.40)',
    },
    blue: {
      _15: 'rgba(102, 217, 239, 0.15)',
      _20: 'rgba(102, 217, 239, 0.20)',
      _35: 'rgba(102, 217, 239, 0.35)',
      _45: 'rgba(102, 217, 239, 0.45)',
      _80: 'rgba(102, 217, 239, 0.80)',
      _95: 'rgba(102, 217, 239, 0.95)',
    },
    magenta: {
      _08: 'rgba(174, 129, 255, 0.08)',
      _14: 'rgba(174, 129, 255, 0.14)',
      _30: 'rgba(174, 129, 255, 0.30)',
    },
    yellow: {
      _06: 'rgba(230, 219, 116, 0.06)',
    },
    bg: {
      _08: 'rgba(73, 72, 62, 0.08)',
      _10: 'rgba(73, 72, 62, 0.10)',
      _12: 'rgba(73, 72, 62, 0.12)',
      _14: 'rgba(73, 72, 62, 0.14)',
      _16: 'rgba(73, 72, 62, 0.16)',
      _18: 'rgba(73, 72, 62, 0.18)',
      _24: 'rgba(62, 61, 50, 0.24)',
      _25: 'rgba(73, 72, 62, 0.25)',
      _28: 'rgba(73, 72, 62, 0.28)',
      _30: 'rgba(73, 72, 62, 0.30)',
      _46: 'rgba(30, 31, 28, 0.46)',
      _55: 'rgba(73, 72, 62, 0.55)',
      _60: 'rgba(30, 31, 28, 0.60)',
      _62: 'rgba(30, 31, 28, 0.62)',
      _68: 'rgba(30, 31, 28, 0.68)',
      _70: 'rgba(73, 72, 62, 0.70)',
      _72: 'rgba(30, 31, 28, 0.72)',
      _80: 'rgba(30, 31, 28, 0.80)',
      _85: 'rgba(62, 61, 50, 0.85)',
      _88: 'rgba(62, 61, 50, 0.88)',
      _88b: 'rgba(39, 40, 34, 0.88)',
      _90: 'rgba(30, 31, 28, 0.90)',
      _95: 'rgba(30, 31, 28, 0.95)',
    },
    warningBg: 'rgba(58, 41, 16, 0.88)',
    errorBg: 'rgba(70, 24, 24, 0.42)',
    errorBgSolid: 'rgba(70, 24, 24, 0.90)',
    federationError: 'rgba(127, 29, 29, 0.22)',
    white: {
      _08: 'rgba(255, 255, 255, 0.08)',
    },
    shadow: 'rgba(0, 0, 0, 0.35)',
    shadowLight: 'rgba(0, 0, 0, 0.30)',
    shadowDeep: 'rgba(15, 23, 42, 0.22)',
  },
} as const;

export type ColorToken = keyof typeof colors;
export type MonokaiColor = typeof monokai;
