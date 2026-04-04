/**
 * @open-hax/uxx/tokens
 *
 * Design tokens for the Open Hax UXX component library.
 */
// Core palette
export { monokai, colors } from './colors.js';
// Spacing
export { spacing, space } from './spacing.js';
// Typography
export { fontFamily, fontSize, fontWeight, lineHeight, typography, } from './typography.js';
// Motion
export { duration, easing, motion, transitions } from './motion.js';
// Shadows & Elevation
export { shadow, elevation, zIndex } from './shadows.js';
// Radius
export { radius } from './radius.js';
// Themes
export { createThemeCssVarRefs, createThemePack, defaultThemePack, getThemeCssVarName, getThemeCssVars, themePacks, } from './theme.js';
// Keybindings
export { defaultChords, modeColors, leaderKey } from './keybindings.js';
// Re-export everything for convenience
import { colors, monokai } from './colors.js';
import { spacing, space } from './spacing.js';
import { fontFamily, fontSize, fontWeight, lineHeight, typography } from './typography.js';
import { duration, easing, motion, transitions } from './motion.js';
import { shadow, elevation, zIndex } from './shadows.js';
import { radius } from './radius.js';
import { createThemeCssVarRefs, themePacks } from './theme.js';
import { defaultChords, modeColors, leaderKey } from './keybindings.js';
const runtimeColors = createThemeCssVarRefs(themePacks.monokai.colors, ['colors']);
const runtimeMonokai = createThemeCssVarRefs(themePacks.monokai.monokai, ['monokai']);
const runtimeFontFamily = createThemeCssVarRefs(themePacks.monokai.fontFamily, ['fontFamily']);
const runtimeFontSize = createThemeCssVarRefs(themePacks.monokai.fontSize, ['fontSize']);
const runtimeShadow = createThemeCssVarRefs(themePacks.monokai.shadow, ['shadow']);
const runtimeRadius = createThemeCssVarRefs(themePacks.monokai.radius, ['radius']);
const runtimeTypography = {
    h1: {
        fontSize: runtimeFontSize['4xl'],
        fontWeight: fontWeight.bold,
        lineHeight: lineHeight.tight,
    },
    h2: {
        fontSize: runtimeFontSize['3xl'],
        fontWeight: fontWeight.bold,
        lineHeight: lineHeight.tight,
    },
    h3: {
        fontSize: runtimeFontSize['2xl'],
        fontWeight: fontWeight.semibold,
        lineHeight: lineHeight.snug,
    },
    h4: {
        fontSize: runtimeFontSize.xl,
        fontWeight: fontWeight.semibold,
        lineHeight: lineHeight.snug,
    },
    h5: {
        fontSize: runtimeFontSize.lg,
        fontWeight: fontWeight.medium,
        lineHeight: lineHeight.normal,
    },
    h6: {
        fontSize: runtimeFontSize.base,
        fontWeight: fontWeight.medium,
        lineHeight: lineHeight.normal,
    },
    body: {
        fontSize: runtimeFontSize.base,
        fontWeight: fontWeight.normal,
        lineHeight: lineHeight.normal,
    },
    bodySm: {
        fontSize: runtimeFontSize.sm,
        fontWeight: fontWeight.normal,
        lineHeight: lineHeight.normal,
    },
    label: {
        fontSize: runtimeFontSize.sm,
        fontWeight: fontWeight.medium,
        lineHeight: lineHeight.none,
    },
    caption: {
        fontSize: runtimeFontSize.xs,
        fontWeight: fontWeight.normal,
        lineHeight: lineHeight.normal,
    },
    code: {
        fontFamily: runtimeFontFamily.mono,
        fontSize: runtimeFontSize.sm,
        fontWeight: fontWeight.normal,
        lineHeight: lineHeight.normal,
    },
    codeInline: {
        fontFamily: runtimeFontFamily.mono,
        fontSize: '0.875em',
        fontWeight: fontWeight.normal,
    },
};
/**
 * Complete raw token collection for non-runtime uses such as docs generation.
 */
export const tokenValues = {
    colors,
    monokai,
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
    radius,
    chords: defaultChords,
    modeColors,
    leaderKey,
};
/**
 * Runtime token collection used by React components.
 * Themeable visual categories resolve through CSS variables with Monokai fallbacks.
 */
export const tokens = {
    colors: runtimeColors,
    monokai: runtimeMonokai,
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
};
//# sourceMappingURL=index.js.map