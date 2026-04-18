/**
 * @open-hax/uxx/tokens
 *
 * Design tokens for the Open Hax UXX component library.
 */

import { themePacks } from './theme.js';
import { fontFamily, fontSize, fontWeight, lineHeight, typography } from './typography.js';
import { spacing, space } from './spacing.js';
import { duration, easing, motion, transitions } from './motion.js';
import { shadow, elevation, zIndex } from './shadows.js';
import { radius } from './radius.js';
import { defaultChords, modeColors, leaderKey } from './keybindings.js';

// Core palette + theme registry
export {
  monokai,
  nightOwl,
  proxyConsole,
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
  ProxyConsoleColor,
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
  typography,
  fontFamily as fonts,
  fontSize as sizes,
  fontWeight as weights,
} from './typography.js';
export type {
  FontFamilyToken,
  FontSizeToken,
  FontWeightToken,
  LineHeightToken,
} from './typography.js';

// Motion
export { duration, easing, motion, transitions } from './motion.js';
export type { DurationToken, EasingToken } from './motion.js';

// Shadows & Elevation
export { shadow, elevation, zIndex } from './shadows.js';
export type { ShadowToken, ElevationLevel, ZIndexToken } from './shadows.js';

// Radius
export { radius } from './radius.js';
export type { RadiusToken } from './radius.js';

// Themes
export {
  createThemeCssVarRefs,
  createThemePack,
  defaultThemePack,
  deepMerge,
  getThemeCssVarName,
  getThemeCssVars,
  themePacks,
} from './theme.js';
export type { DeepPartial, ThemePack, ThemeOverride, ThemePackName } from './theme.js';

// Keybindings
export { defaultChords, modeColors, leaderKey } from './keybindings.js';
export type { ModalMode, ChordBinding } from './keybindings.js';

export const tokens = {
  colors: themePacks.monokai.colors,
  background: themePacks.monokai.colors.background,
  text: {
    ...themePacks.monokai.colors.text,
    accent: themePacks.monokai.colors.accent.cyan,
  },
  interactive: themePacks.monokai.colors.interactive,
  button: themePacks.monokai.colors.button,
  badge: themePacks.monokai.colors.badge,
  border: themePacks.monokai.colors.border,
  accent: themePacks.monokai.colors.accent,
  semantic: themePacks.monokai.colors.semantic,
  palette: themePacks.monokai.palette,
  monokai: themePacks.monokai.palette,
  spacing, space, fontFamily, fontSize, fontWeight, lineHeight, typography,
  duration, easing, motion, transitions, shadow, elevation, zIndex, radius,
  chords: defaultChords, modeColors, leaderKey,
} as const;

/**
 * Runtime token collection used by React components.
 * Themeable visual categories resolve through CSS variables with Monokai fallbacks.
 */
export const tokens = {
  colors: runtimeColors,
  palette: runtimePalette,
  monokai: runtimePalette,
  spacing,
  space,
  fontFamily: runtimeFontFamily,
  fontSize: runtimeFontSize,
  fontWeight,
  lineHeight,
  typography: runtimeTypography,
  duration,
  easing,
  motion,
  transitions,
  shadow: runtimeShadow,
  elevation,
  zIndex,
  radius: runtimeRadius,
  chords: defaultChords,
  modeColors,
  leaderKey,
} as const;

export type Tokens = typeof tokens;
export type TokenValues = typeof tokens;