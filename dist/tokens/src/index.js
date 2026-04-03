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
// Core palette
export { monokai, colors } from './colors.js';
// Spacing
export { spacing, space } from './spacing.js';
// Typography
export { fontFamily, fontSize, fontWeight, lineHeight, typography } from './typography.js';
// Motion
export { duration, easing, motion, transitions } from './motion.js';
// Shadows & Elevation
export { shadow, elevation, zIndex } from './shadows.js';
// Keybindings
export { defaultChords, modeColors, leaderKey } from './keybindings.js';
// Re-export everything for convenience
import { colors, monokai } from './colors.js';
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
};
//# sourceMappingURL=index.js.map