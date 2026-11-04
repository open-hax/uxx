// SPDX-License-Identifier: GPL-3.0-or-later
//
// src/theme/roles.js — the role → token-path contract (spec §2, design §7).
//
// Pure data. Token *paths* only — values resolve at sheet-build time via
// `resolveToken` from the generated tokens.js, never here.
//
// Property keys are the four channel names used everywhere:
//   'background' → CSS background-color   'color' → CSS color
//   'border'     → CSS border-color       'outline' → CSS outline-color
//
// Pinned naming traps (design §7, asserted by roles.test.js):
//   - text-secondary → colors.text.panel (NOT colors.text.secondary)
//   - input-surface  → palette.bg.selection (colors.background.selection
//                      does not exist in the pack)
//   - button-primary.bg = colors.button.primary.bg = #75715e (taupe, the
//                      uxx Monokai override — not the cyan base default)
export const ROLE_RULES = {
  // Backgrounds & surfaces
  'page-background': { background: ['colors', 'background', 'default'] },
  'surface': { background: ['colors', 'background', 'elevated'] },
  'surface-recessed': { background: ['colors', 'background', 'surface'] },
  'elevated': { background: ['colors', 'background', 'highlight'] },
  'input-surface': { background: ['palette', 'bg', 'selection'] },
  'overlay': { background: ['colors', 'background', 'overlay'] },

  // Text (rank-assigned pool, design §8.2)
  'text-primary': { color: ['colors', 'text', 'default'] },
  'text-secondary': { color: ['colors', 'text', 'panel'] },
  'text-muted': { color: ['colors', 'text', 'soft'] },
  'text-faint': { color: ['colors', 'text', 'muted'] },
  // spec-refinement (review F20): text-inverse is EXCLUDED from the rank
  // pool — it is a direct role (§8.3.4 single-token): text on a solid
  // accent/button bg must always be the dark inverse token.
  'text-inverse': { color: ['colors', 'text', 'inverse'] },

  // Interactive
  'link': { color: ['colors', 'interactive', 'default'] },
  'button-primary': {
    background: ['colors', 'button', 'primary', 'bg'],
    color: ['colors', 'button', 'primary', 'fg'],
  },
  'button-secondary': {
    background: ['colors', 'button', 'secondary', 'bg'],
    color: ['colors', 'button', 'secondary', 'fg'],
  },
  'button-ghost': {
    background: ['colors', 'button', 'ghost', 'bg'],
    color: ['colors', 'button', 'ghost', 'fg'],
  },
  'button-danger': {
    background: ['colors', 'button', 'danger', 'bg'],
    color: ['colors', 'button', 'danger', 'fg'],
  },
  'focus': { outline: ['colors', 'border', 'focus'] },

  // Borders & structure
  'border': { border: ['colors', 'border', 'default'] },
  'border-subtle': { border: ['colors', 'border', 'subtle'] },
  'border-focus': { border: ['colors', 'border', 'focus'] },
  'selection': { background: ['colors', 'selection', 'default'] },

  // Semantic status
  'semantic-error': { color: ['colors', 'semantic', 'error'] },
  'semantic-warning': { color: ['colors', 'semantic', 'warning'] },
  'semantic-success': { color: ['colors', 'semantic', 'success'] },
  'semantic-info': { color: ['colors', 'semantic', 'info'] },
  'badge-success': {
    background: ['colors', 'badge', 'success', 'bg'],
    color: ['colors', 'badge', 'success', 'fg'],
  },
  'badge-warning': {
    background: ['colors', 'badge', 'warning', 'bg'],
    color: ['colors', 'badge', 'warning', 'fg'],
  },
  'badge-error': {
    background: ['colors', 'badge', 'error', 'bg'],
    color: ['colors', 'badge', 'error', 'fg'],
  },
  'badge-info': {
    background: ['colors', 'badge', 'info', 'bg'],
    color: ['colors', 'badge', 'info', 'fg'],
  },

  // Code & content chrome
  'code-surface': { background: ['colors', 'background', 'surface'] },
  'code-text': { color: ['colors', 'text', 'default'] },

  // spec-refinement (review F3): design §8.4's hue table designates
  // colors.accent.yellow / colors.accent.magenta as the targets for the
  // yellow and purple/magenta buckets, but §7's role table had no row for
  // them. These are the non-semantic accent-text roles; §8.3.6's neutral
  // fallback (text.panel → text.default) applies to them.
  'accent-yellow': { color: ['colors', 'accent', 'yellow'] },
  'accent-magenta': { color: ['colors', 'accent', 'magenta'] },
};

// Rank roles (design §8.2) — parallel to TEXT_RANK_POOL by index.
export const TEXT_RANK_ROLES = [
  'text-primary',
  'text-secondary',
  'text-muted',
  'text-faint',
];

// Token pool ordered by luminance, high → low (design §7 text table).
// text-inverse is deliberately NOT in this pool (review F20, see above).
export const TEXT_RANK_POOL = [
  ['colors', 'text', 'default'],
  ['colors', 'text', 'panel'],
  ['colors', 'text', 'soft'],
  ['colors', 'text', 'muted'],
];

// State-synthesis rows (design §6) — emitted in the role sheet as extra
// rules, not as element markers.
//
// Word-match `~=` — spec-refinement (round-3 B1): an element carries MULTIPLE
// space-separated roles in one `data-uxx-role` attribute (design §5/§6/§9.1
// write/read the attribute as single-valued; this tightening is the spec's),
// so exact-match `[data-uxx-role="x"]` would never fire.
//
// (No `focus` row here: `focus` is a direct ROLE_RULES assignment emitting
// outline-color. STATE_RULES exists for the hover syntheses only.)
export const STATE_RULES = [
  // [selector, property, tokenPath]
  ['[data-uxx-role~="link"]:hover', 'color', ['colors', 'interactive', 'hover']],
  ['[data-uxx-role~="button-primary"]:hover', 'background-color', ['colors', 'button', 'primary', 'hover']],
  ['[data-uxx-role~="button-secondary"]:hover', 'background-color', ['colors', 'button', 'secondary', 'hover']],
  ['[data-uxx-role~="button-ghost"]:hover', 'background-color', ['colors', 'button', 'ghost', 'hover']],
  ['[data-uxx-role~="button-danger"]:hover', 'background-color', ['colors', 'button', 'danger', 'hover']],
];

// Flat list of every token path in ROLE_RULES + TEXT_RANK_POOL + STATE_RULES,
// for roles.test.js (the nonexistent-path gate, design §7/§12). Computed from
// the tables above so it can never drift from them.
export const ROLE_TOKEN_PATHS = Array.from(
  new Set(
    [
      ...Object.values(ROLE_RULES).flatMap((props) => Object.values(props)),
      ...TEXT_RANK_POOL,
      ...STATE_RULES.map(([, , path]) => path),
    ].map((path) => path.join('.')),
  ),
).map((key) => key.split('.'));
