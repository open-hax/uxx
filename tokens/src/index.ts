/**
 * @open-hax/uxx/tokens
 * 
 * Design tokens for the devel UI component library.
 * 
 * Usage:
 * ```ts
 * import { colors, spacing, typography, motion, shadow } from '@open-hax/uxx/tokens';
 * 
 * const buttonStyle = {
 *   backgroundColor: colors.button.primary.bg,
 *   padding: `${spacing[2]} ${spacing[4]}`,
 *   fontSize: typography.bodySm.fontSize,
 *   transition: motion.fade.enter.duration,
 *   boxShadow: shadow.sm,
 * };
 * ```
 */

// Core palette + theme registry
export {
  monokai,
  nightOwl,
  themes,
  colors,
  withAlpha,
  createThemeDefinition,
  defaultThemeName,
  getTheme,
  getThemeCssVariables,
  resolveTheme,
  resolveThemeTokens,
} from './colors.js';
export type {
  ColorToken,
  MonokaiColor,
  NightOwlColor,
  ThemeColors,
  ThemeCssVariables,
  ThemeDefinition,
  ThemeName,
  ThemePalette,
  ThemePreference,
} from './colors.js';

// Spacing
export { spacing, space } from './spacing.js';
export type { SpacingToken } from './spacing.js';

// Typography
export { 
  fontFamily, 
  fontSize, 
  fontWeight, 
  lineHeight, 
  typography 
} from './typography.js';
export type { 
  FontFamilyToken, 
  FontSizeToken, 
  FontWeightToken, 
  LineHeightToken 
} from './typography.js';

// Motion
export { duration, easing, motion, transitions } from './motion.js';
export type { DurationToken, EasingToken } from './motion.js';

// Shadows & Elevation
export { shadow, elevation, zIndex } from './shadows.js';
export type { ShadowToken, ElevationLevel, ZIndexToken } from './shadows.js';

// Keybindings
export { defaultChords, modeColors, leaderKey } from './keybindings.js';
export type { ModalMode, ChordBinding } from './keybindings.js';

// Re-export everything for convenience
import { colors, monokai, nightOwl, themes } from './colors.js';
import { spacing, space } from './spacing.js';
import { fontFamily, fontSize, fontWeight, lineHeight, typography } from './typography.js';
import { duration, easing, motion, transitions } from './motion.js';
import { shadow, elevation, zIndex } from './shadows.js';
import { defaultChords, modeColors, leaderKey } from './keybindings.js';

/**
 * Complete token collection for runtime use
 */
export const tokens = {
  colors,
  monokai,
  nightOwl,
  themes,
  spacing,
  space,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  typography,
  duration,
  easing,
  motion,
  transitions,
  shadow,
  elevation,
  zIndex,
  chords: defaultChords,
  modeColors,
  leaderKey,
} as const;

export type Tokens = typeof tokens;
