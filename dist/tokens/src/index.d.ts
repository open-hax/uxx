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
export { monokai, colors } from './colors.js';
export type { ColorToken, MonokaiColor } from './colors.js';
export { spacing, space } from './spacing.js';
export type { SpacingToken } from './spacing.js';
export { fontFamily, fontSize, fontWeight, lineHeight, typography } from './typography.js';
export type { FontFamilyToken, FontSizeToken, FontWeightToken, LineHeightToken } from './typography.js';
export { duration, easing, motion, transitions } from './motion.js';
export type { DurationToken, EasingToken } from './motion.js';
export { shadow, elevation, zIndex } from './shadows.js';
export type { ShadowToken, ElevationLevel, ZIndexToken } from './shadows.js';
export { defaultChords, modeColors, leaderKey } from './keybindings.js';
export type { ModalMode, ChordBinding } from './keybindings.js';
/**
 * Complete token collection for runtime use
 */
export declare const tokens: {
    readonly colors: {
        readonly background: {
            readonly default: "#272822";
            readonly surface: "#1e1f1c";
            readonly elevated: "#34352f";
            readonly highlight: "#3e3d32";
            readonly overlay: "rgba(0, 0, 0, 0.6)";
        };
        readonly selection: {
            readonly default: "rgba(135, 139, 145, 0.5)";
        };
        readonly text: {
            readonly default: "#f8f8f2";
            readonly bright: "#f8f8f2";
            readonly panel: "#cccccc";
            readonly soft: "#90908a";
            readonly muted: "#75715e";
            readonly subtle: "#464741";
            readonly inverse: "#272822";
            readonly secondary: "#75715e";
        };
        readonly interactive: {
            readonly default: "#a6e22e";
            readonly hover: "#8fce26";
            readonly active: "#7cb824";
            readonly disabled: "#75715e";
        };
        readonly button: {
            readonly primary: {
                readonly bg: "#75715e";
                readonly fg: "#f8f8f2";
                readonly hover: "#8a856e";
                readonly active: "#6a6654";
            };
            readonly secondary: {
                readonly bg: "#414339";
                readonly fg: "#f8f8f2";
                readonly hover: "#505248";
                readonly active: "#3a3c33";
            };
            readonly ghost: {
                readonly bg: "transparent";
                readonly fg: "#f8f8f2";
                readonly hover: "#414339";
                readonly active: "#34352f";
            };
            readonly danger: {
                readonly bg: "#f92672";
                readonly fg: "#f8f8f2";
                readonly hover: "#e61b63";
                readonly active: "#d1155c";
            };
        };
        readonly badge: {
            readonly default: {
                readonly bg: "#75715e";
                readonly fg: "#f8f8f2";
            };
            readonly success: {
                readonly bg: "rgba(166, 226, 46, 0.15)";
                readonly fg: "#a6e22e";
            };
            readonly warning: {
                readonly bg: "rgba(253, 151, 31, 0.15)";
                readonly fg: "#fd971f";
            };
            readonly error: {
                readonly bg: "rgba(249, 38, 114, 0.15)";
                readonly fg: "#f92672";
            };
            readonly info: {
                readonly bg: "rgba(102, 217, 239, 0.15)";
                readonly fg: "#66d9ef";
            };
        };
        readonly border: {
            readonly default: "#34352f";
            readonly subtle: "#464741";
            readonly focus: "#99947c";
            readonly error: "#f92672";
        };
        readonly accent: {
            readonly yellow: "#e6db74";
            readonly orange: "#fd971f";
            readonly red: "#f92672";
            readonly magenta: "#ae81ff";
            readonly blue: "#66d9ef";
            readonly cyan: "#66d9ef";
            readonly green: "#a6e22e";
        };
        readonly status: {
            readonly alive: "#a6e22e";
            readonly dead: "#f92672";
            readonly open: "#a6e22e";
            readonly closed: "#75715e";
            readonly merged: "#ae81ff";
            readonly sleeping: "#66d9ef";
            readonly eating: "#fd971f";
            readonly working: "#e6db74";
        };
        readonly chart: {
            readonly segment0: "#66d9ef";
            readonly segment1: "#a6e22e";
            readonly segment2: "#e6db74";
            readonly segment3: "#fd971f";
            readonly segment4: "#ae81ff";
            readonly segment5: "#7ca3b5";
        };
        readonly fill: {
            readonly good: {
                readonly start: "#a6e22e";
                readonly end: "#78efb7";
            };
            readonly warn: {
                readonly start: "#fd971f";
                readonly end: "#ffd280";
            };
            readonly danger: {
                readonly start: "#f92672";
                readonly end: "#ff9e92";
            };
            readonly neutral: {
                readonly start: "#7aa7bd";
                readonly end: "#98bfd0";
            };
        };
        readonly surface: {
            readonly panel: "rgba(30, 31, 28, 0.82)";
            readonly card: "rgba(52, 53, 47, 0.65)";
            readonly cardAlt: "rgba(62, 61, 50, 0.55)";
            readonly input: "rgba(65, 67, 57, 0.78)";
            readonly nav: "rgba(30, 31, 28, 0.6)";
        };
        readonly alpha: {
            readonly green: {
                readonly _08: "rgba(166, 226, 46, 0.08)";
                readonly _12: "rgba(166, 226, 46, 0.12)";
                readonly _14: "rgba(166, 226, 46, 0.14)";
                readonly _15: "rgba(166, 226, 46, 0.15)";
                readonly _16: "rgba(166, 226, 46, 0.16)";
                readonly _25: "rgba(166, 226, 46, 0.25)";
                readonly _28: "rgba(166, 226, 46, 0.28)";
                readonly _30: "rgba(166, 226, 46, 0.30)";
                readonly _35: "rgba(166, 226, 46, 0.35)";
                readonly _38: "rgba(166, 226, 46, 0.38)";
                readonly _40: "rgba(166, 226, 46, 0.40)";
                readonly _45: "rgba(166, 226, 46, 0.45)";
                readonly _50: "rgba(166, 226, 46, 0.50)";
                readonly _55: "rgba(166, 226, 46, 0.55)";
                readonly _60: "rgba(166, 226, 46, 0.60)";
                readonly _80: "rgba(166, 226, 46, 0.80)";
            };
            readonly red: {
                readonly _12: "rgba(249, 38, 114, 0.12)";
                readonly _14: "rgba(249, 38, 114, 0.14)";
                readonly _15: "rgba(249, 38, 114, 0.15)";
                readonly _25: "rgba(249, 38, 114, 0.25)";
                readonly _30: "rgba(249, 38, 114, 0.30)";
                readonly _38: "rgba(249, 38, 114, 0.38)";
                readonly _40: "rgba(249, 38, 114, 0.40)";
                readonly _45: "rgba(249, 38, 114, 0.45)";
                readonly _46: "rgba(249, 38, 114, 0.46)";
                readonly _50: "rgba(249, 38, 114, 0.50)";
            };
            readonly orange: {
                readonly _12: "rgba(253, 151, 31, 0.12)";
                readonly _15: "rgba(253, 151, 31, 0.15)";
                readonly _32: "rgba(253, 151, 31, 0.32)";
                readonly _35: "rgba(253, 151, 31, 0.35)";
                readonly _40: "rgba(253, 151, 31, 0.40)";
            };
            readonly blue: {
                readonly _15: "rgba(102, 217, 239, 0.15)";
                readonly _20: "rgba(102, 217, 239, 0.20)";
                readonly _35: "rgba(102, 217, 239, 0.35)";
                readonly _45: "rgba(102, 217, 239, 0.45)";
                readonly _80: "rgba(102, 217, 239, 0.80)";
                readonly _95: "rgba(102, 217, 239, 0.95)";
            };
            readonly magenta: {
                readonly _08: "rgba(174, 129, 255, 0.08)";
                readonly _14: "rgba(174, 129, 255, 0.14)";
                readonly _30: "rgba(174, 129, 255, 0.30)";
            };
            readonly yellow: {
                readonly _06: "rgba(230, 219, 116, 0.06)";
            };
            readonly bg: {
                readonly _08: "rgba(73, 72, 62, 0.08)";
                readonly _10: "rgba(73, 72, 62, 0.10)";
                readonly _12: "rgba(73, 72, 62, 0.12)";
                readonly _14: "rgba(73, 72, 62, 0.14)";
                readonly _16: "rgba(73, 72, 62, 0.16)";
                readonly _18: "rgba(73, 72, 62, 0.18)";
                readonly _24: "rgba(62, 61, 50, 0.24)";
                readonly _25: "rgba(73, 72, 62, 0.25)";
                readonly _28: "rgba(73, 72, 62, 0.28)";
                readonly _30: "rgba(73, 72, 62, 0.30)";
                readonly _46: "rgba(30, 31, 28, 0.46)";
                readonly _55: "rgba(73, 72, 62, 0.55)";
                readonly _60: "rgba(30, 31, 28, 0.60)";
                readonly _62: "rgba(30, 31, 28, 0.62)";
                readonly _68: "rgba(30, 31, 28, 0.68)";
                readonly _70: "rgba(73, 72, 62, 0.70)";
                readonly _72: "rgba(30, 31, 28, 0.72)";
                readonly _80: "rgba(30, 31, 28, 0.80)";
                readonly _85: "rgba(62, 61, 50, 0.85)";
                readonly _88: "rgba(62, 61, 50, 0.88)";
                readonly _88b: "rgba(39, 40, 34, 0.88)";
                readonly _90: "rgba(30, 31, 28, 0.90)";
                readonly _95: "rgba(30, 31, 28, 0.95)";
            };
            readonly warningBg: "rgba(58, 41, 16, 0.88)";
            readonly errorBg: "rgba(70, 24, 24, 0.42)";
            readonly errorBgSolid: "rgba(70, 24, 24, 0.90)";
            readonly federationError: "rgba(127, 29, 29, 0.22)";
            readonly white: {
                readonly _08: "rgba(255, 255, 255, 0.08)";
            };
            readonly shadow: "rgba(0, 0, 0, 0.35)";
            readonly shadowLight: "rgba(0, 0, 0, 0.30)";
            readonly shadowDeep: "rgba(15, 23, 42, 0.22)";
        };
    };
    readonly monokai: {
        readonly bg: {
            readonly default: "#272822";
            readonly darker: "#1e1f1c";
            readonly lighter: "#3e3d32";
            readonly selection: "#414339";
            readonly tabInactive: "#34352f";
            readonly groupBorder: "#34352f";
        };
        readonly fg: {
            readonly default: "#f8f8f2";
            readonly bright: "#f8f8f2";
            readonly panel: "#cccccc";
            readonly soft: "#90908a";
            readonly muted: "#75715e";
            readonly subtle: "#464741";
        };
        readonly accent: {
            readonly yellow: "#e6db74";
            readonly orange: "#fd971f";
            readonly red: "#f92672";
            readonly magenta: "#ae81ff";
            readonly blue: "#66d9ef";
            readonly cyan: "#66d9ef";
            readonly green: "#a6e22e";
        };
        readonly semantic: {
            readonly error: "#f92672";
            readonly warning: "#fd971f";
            readonly success: "#a6e22e";
            readonly info: "#66d9ef";
        };
    };
    readonly spacing: {
        readonly 0: 0;
        readonly px: 1;
        readonly 0.5: number;
        readonly 1: number;
        readonly 1.5: number;
        readonly 2: number;
        readonly 2.5: number;
        readonly 3: number;
        readonly 3.5: number;
        readonly 4: number;
        readonly 5: number;
        readonly 6: number;
        readonly 7: number;
        readonly 8: number;
        readonly 9: number;
        readonly 10: number;
        readonly 11: number;
        readonly 12: number;
        readonly 14: number;
        readonly 16: number;
        readonly 20: number;
        readonly 24: number;
        readonly 28: number;
        readonly 32: number;
    };
    readonly space: {
        readonly gap: {
            readonly xs: number;
            readonly sm: number;
            readonly md: number;
            readonly lg: number;
            readonly xl: number;
        };
        readonly padding: {
            readonly xs: number;
            readonly sm: number;
            readonly md: number;
            readonly lg: number;
            readonly xl: number;
        };
        readonly margin: {
            readonly xs: number;
            readonly sm: number;
            readonly md: number;
            readonly lg: number;
            readonly xl: number;
        };
        readonly layout: {
            readonly sidebar: 224;
            readonly header: 56;
            readonly footer: 48;
            readonly content: 32;
        };
    };
    readonly fontFamily: {
        readonly sans: string;
        readonly mono: string;
    };
    readonly fontSize: {
        readonly xs: "0.75rem";
        readonly sm: "0.875rem";
        readonly base: "1rem";
        readonly lg: "1.125rem";
        readonly xl: "1.25rem";
        readonly '2xl': "1.5rem";
        readonly '3xl': "1.875rem";
        readonly '4xl': "2.25rem";
        readonly '5xl': "3rem";
    };
    readonly fontWeight: {
        readonly normal: 400;
        readonly medium: 500;
        readonly semibold: 600;
        readonly bold: 700;
    };
    readonly lineHeight: {
        readonly none: 1;
        readonly tight: 1.25;
        readonly snug: 1.375;
        readonly normal: 1.5;
        readonly relaxed: 1.625;
        readonly loose: 2;
    };
    readonly typography: {
        readonly h1: {
            readonly fontSize: "2.25rem";
            readonly fontWeight: 700;
            readonly lineHeight: 1.25;
        };
        readonly h2: {
            readonly fontSize: "1.875rem";
            readonly fontWeight: 700;
            readonly lineHeight: 1.25;
        };
        readonly h3: {
            readonly fontSize: "1.5rem";
            readonly fontWeight: 600;
            readonly lineHeight: 1.375;
        };
        readonly h4: {
            readonly fontSize: "1.25rem";
            readonly fontWeight: 600;
            readonly lineHeight: 1.375;
        };
        readonly h5: {
            readonly fontSize: "1.125rem";
            readonly fontWeight: 500;
            readonly lineHeight: 1.5;
        };
        readonly h6: {
            readonly fontSize: "1rem";
            readonly fontWeight: 500;
            readonly lineHeight: 1.5;
        };
        readonly body: {
            readonly fontSize: "1rem";
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
        };
        readonly bodySm: {
            readonly fontSize: "0.875rem";
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
        };
        readonly label: {
            readonly fontSize: "0.875rem";
            readonly fontWeight: 500;
            readonly lineHeight: 1;
        };
        readonly caption: {
            readonly fontSize: "0.75rem";
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
        };
        readonly code: {
            readonly fontFamily: string;
            readonly fontSize: "0.875rem";
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
        };
        readonly codeInline: {
            readonly fontFamily: string;
            readonly fontSize: "0.875em";
            readonly fontWeight: 400;
        };
    };
    readonly duration: {
        readonly instant: 0;
        readonly fast: "100ms";
        readonly normal: "200ms";
        readonly slow: "300ms";
        readonly slower: "500ms";
        readonly slowest: "700ms";
    };
    readonly easing: {
        readonly linear: "linear";
        readonly easeIn: "cubic-bezier(0.4, 0, 1, 1)";
        readonly easeOut: "cubic-bezier(0, 0, 0.2, 1)";
        readonly easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)";
        readonly standard: "cubic-bezier(0.4, 0, 0.2, 1)";
        readonly decelerate: "cubic-bezier(0, 0, 0.2, 1)";
        readonly accelerate: "cubic-bezier(0.4, 0, 1, 1)";
        readonly sharp: "cubic-bezier(0.4, 0, 0.6, 1)";
        readonly bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
        readonly gentle: "cubic-bezier(0.25, 0.1, 0.25, 1)";
    };
    readonly motion: {
        readonly fade: {
            readonly enter: {
                readonly duration: "100ms";
                readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
            };
            readonly exit: {
                readonly duration: "100ms";
                readonly easing: "cubic-bezier(0.4, 0, 1, 1)";
            };
        };
        readonly slide: {
            readonly enter: {
                readonly duration: "200ms";
                readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
            };
            readonly exit: {
                readonly duration: "200ms";
                readonly easing: "cubic-bezier(0.4, 0, 1, 1)";
            };
        };
        readonly scale: {
            readonly enter: {
                readonly duration: "200ms";
                readonly easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
            };
            readonly exit: {
                readonly duration: "100ms";
                readonly easing: "cubic-bezier(0.4, 0, 1, 1)";
            };
        };
        readonly expand: {
            readonly duration: "200ms";
            readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
        };
        readonly focus: {
            readonly duration: 0;
            readonly easing: "linear";
        };
        readonly press: {
            readonly duration: "100ms";
            readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
        };
        readonly tooltip: {
            readonly enter: {
                readonly duration: "100ms";
                readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
            };
            readonly exit: {
                readonly duration: 0;
                readonly easing: "linear";
            };
        };
    };
    readonly transitions: {
        readonly all: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)";
        readonly colors: "color, background-color, border-color 100ms cubic-bezier(0.4, 0, 0.2, 1)";
        readonly opacity: "opacity 100ms cubic-bezier(0.4, 0, 0.2, 1)";
        readonly transform: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)";
        readonly shadow: "box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)";
    };
    readonly shadow: {
        readonly xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        readonly sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)";
        readonly md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";
        readonly lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)";
        readonly xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
        readonly '2xl': "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
        readonly inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)";
        readonly focus: "0 0 0 2px rgba(166, 226, 46, 0.5)";
        readonly focusError: "0 0 0 2px rgba(249, 38, 114, 0.5)";
        readonly none: "none";
    };
    readonly elevation: {
        readonly 0: {
            readonly shadow: "none";
        };
        readonly 1: {
            readonly shadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)";
        };
        readonly 2: {
            readonly shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";
        };
        readonly 3: {
            readonly shadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)";
        };
        readonly 4: {
            readonly shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
        };
        readonly 5: {
            readonly shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)";
        };
    };
    readonly zIndex: {
        readonly hide: -1;
        readonly base: 0;
        readonly dropdown: 1000;
        readonly sticky: 1100;
        readonly fixed: 1200;
        readonly modalBackdrop: 1300;
        readonly modal: 1400;
        readonly popover: 1500;
        readonly tooltip: 1600;
        readonly toast: 1700;
        readonly top: 9999;
    };
    readonly chords: import("./keybindings.js").ChordBinding[];
    readonly modeColors: Record<import("./keybindings.js").ModalMode, string>;
    readonly leaderKey: " ";
};
export type Tokens = typeof tokens;
//# sourceMappingURL=index.d.ts.map