/**
 * @open-hax/uxx/tokens
 *
 * Design tokens for the Open Hax UXX component library.
 */
export { monokai, nightOwl, proxyConsole, themes, colors, withAlpha, createThemeDefinition, defaultThemeName, getTheme, getThemeCssVariables, resolveTheme, resolveThemeTokens, } from './colors.js';
export type { ColorToken, MonokaiColor, NightOwlColor, ProxyConsoleColor, ThemeColors, ThemeCssVariables, ThemeDefinition, ThemeName, ThemePalette, ThemePreference, } from './colors.js';
export { spacing, space } from './spacing.js';
export type { SpacingToken } from './spacing.js';
export { fontFamily, fontSize, fontWeight, lineHeight, typography, } from './typography.js';
export type { FontFamilyToken, FontSizeToken, FontWeightToken, LineHeightToken, } from './typography.js';
export { duration, easing, motion, transitions } from './motion.js';
export type { DurationToken, EasingToken } from './motion.js';
export { shadow, elevation, zIndex } from './shadows.js';
export type { ShadowToken, ElevationLevel, ZIndexToken } from './shadows.js';
export { radius } from './radius.js';
export type { RadiusToken } from './radius.js';
export { createThemeCssVarRefs, createThemePack, defaultThemePack, getThemeCssVarName, getThemeCssVars, themePacks, } from './theme.js';
export type { DeepPartial, ThemePack, ThemeOverride, ThemePackName } from './theme.js';
export { defaultChords, modeColors, leaderKey } from './keybindings.js';
export type { ModalMode, ChordBinding } from './keybindings.js';
/**
 * Complete raw token collection for non-runtime uses such as docs generation.
 */
export declare const tokenValues: {
    readonly colors: {
        readonly background: {
            readonly default: `#${string}`;
            readonly surface: `#${string}`;
            readonly elevated: `#${string}`;
            readonly highlight: `#${string}`;
            readonly overlay: "rgba(0, 0, 0, 0.6)";
        };
        readonly selection: {
            readonly default: string;
        };
        readonly text: {
            readonly default: `#${string}`;
            readonly bright: `#${string}`;
            readonly panel: `#${string}`;
            readonly soft: `#${string}`;
            readonly muted: `#${string}`;
            readonly subtle: `#${string}`;
            readonly inverse: `#${string}`;
            readonly secondary: `#${string}`;
        };
        readonly interactive: {
            readonly default: `#${string}`;
            readonly hover: string;
            readonly active: string;
            readonly disabled: `#${string}`;
        };
        readonly button: {
            readonly primary: {
                readonly bg: `#${string}`;
                readonly fg: `#${string}`;
                readonly hover: string;
                readonly active: string;
            };
            readonly secondary: {
                readonly bg: `#${string}`;
                readonly fg: `#${string}`;
                readonly hover: string;
                readonly active: string;
            };
            readonly ghost: {
                readonly bg: "transparent";
                readonly fg: `#${string}`;
                readonly hover: string;
                readonly active: string;
            };
            readonly danger: {
                readonly bg: `#${string}`;
                readonly fg: `#${string}`;
                readonly hover: string;
                readonly active: string;
            };
        };
        readonly badge: {
            readonly default: {
                readonly bg: `#${string}`;
                readonly fg: `#${string}`;
            };
            readonly success: {
                readonly bg: string;
                readonly fg: `#${string}`;
            };
            readonly warning: {
                readonly bg: string;
                readonly fg: `#${string}`;
            };
            readonly error: {
                readonly bg: string;
                readonly fg: `#${string}`;
            };
            readonly info: {
                readonly bg: string;
                readonly fg: `#${string}`;
            };
        };
        readonly border: {
            readonly default: `#${string}`;
            readonly subtle: `#${string}`;
            readonly focus: `#${string}`;
            readonly error: `#${string}`;
        };
        readonly accent: {
            yellow: `#${string}`;
            orange: `#${string}`;
            red: `#${string}`;
            magenta: `#${string}`;
            blue: `#${string}`;
            cyan: `#${string}`;
            green: `#${string}`;
        };
        readonly semantic: {
            readonly error: `#${string}`;
            readonly warning: `#${string}`;
            readonly success: `#${string}`;
            readonly info: `#${string}`;
        };
        readonly status: {
            readonly alive: `#${string}`;
            readonly dead: `#${string}`;
            readonly open: `#${string}`;
            readonly closed: `#${string}`;
            readonly merged: `#${string}`;
            readonly sleeping: `#${string}`;
            readonly eating: `#${string}`;
            readonly working: `#${string}`;
        };
        readonly chart: {
            readonly segment0: `#${string}`;
            readonly segment1: `#${string}`;
            readonly segment2: `#${string}`;
            readonly segment3: `#${string}`;
            readonly segment4: `#${string}`;
            readonly segment5: `#${string}`;
        };
        readonly fill: {
            readonly good: {
                readonly start: `#${string}`;
                readonly end: string;
            };
            readonly warn: {
                readonly start: `#${string}`;
                readonly end: string;
            };
            readonly danger: {
                readonly start: `#${string}`;
                readonly end: string;
            };
            readonly neutral: {
                readonly start: `#${string}`;
                readonly end: string;
            };
        };
        readonly surface: {
            readonly panel: string;
            readonly card: string;
            readonly cardAlt: string;
            readonly input: string;
            readonly nav: string;
        };
        readonly alpha: {
            readonly green: {
                readonly _08: string;
                readonly _12: string;
                readonly _14: string;
                readonly _15: string;
                readonly _16: string;
                readonly _25: string;
                readonly _28: string;
                readonly _30: string;
                readonly _35: string;
                readonly _38: string;
                readonly _40: string;
                readonly _45: string;
                readonly _50: string;
                readonly _55: string;
                readonly _60: string;
                readonly _80: string;
            };
            readonly red: {
                readonly _12: string;
                readonly _14: string;
                readonly _15: string;
                readonly _25: string;
                readonly _30: string;
                readonly _38: string;
                readonly _40: string;
                readonly _45: string;
                readonly _46: string;
                readonly _50: string;
            };
            readonly orange: {
                readonly _12: string;
                readonly _15: string;
                readonly _32: string;
                readonly _35: string;
                readonly _40: string;
            };
            readonly blue: {
                readonly _15: string;
                readonly _20: string;
                readonly _35: string;
                readonly _45: string;
                readonly _80: string;
                readonly _95: string;
            };
            readonly magenta: {
                readonly _08: string;
                readonly _14: string;
                readonly _30: string;
            };
            readonly yellow: {
                readonly _06: string;
            };
            readonly bg: {
                readonly _08: string;
                readonly _10: string;
                readonly _12: string;
                readonly _14: string;
                readonly _16: string;
                readonly _18: string;
                readonly _24: string;
                readonly _25: string;
                readonly _28: string;
                readonly _30: string;
                readonly _46: string;
                readonly _55: string;
                readonly _60: string;
                readonly _62: string;
                readonly _68: string;
                readonly _70: string;
                readonly _72: string;
                readonly _80: string;
                readonly _85: string;
                readonly _88: string;
                readonly _88b: string;
                readonly _90: string;
                readonly _95: string;
            };
            readonly warningBg: string;
            readonly errorBg: string;
            readonly errorBgSolid: string;
            readonly federationError: string;
            readonly white: {
                readonly _08: "rgba(255, 255, 255, 0.08)";
            };
            readonly shadow: "rgba(0, 0, 0, 0.35)";
            readonly shadowLight: "rgba(0, 0, 0, 0.3)";
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
    readonly nightOwl: {
        readonly bg: {
            readonly default: "#011627";
            readonly darker: "#01111d";
            readonly lighter: "#0b2942";
            readonly selection: "#1d3b53";
            readonly tabInactive: "#0b253a";
            readonly groupBorder: "#5f7e97";
        };
        readonly fg: {
            readonly default: "#d6deeb";
            readonly bright: "#ffffff";
            readonly panel: "#d2dee7";
            readonly soft: "#89a4bb";
            readonly muted: "#5f7e97";
            readonly subtle: "#4b6479";
        };
        readonly accent: {
            readonly yellow: "#ffeb95";
            readonly orange: "#F78C6C";
            readonly red: "#EF5350";
            readonly magenta: "#c792ea";
            readonly blue: "#82AAFF";
            readonly cyan: "#80CBC4";
            readonly green: "#c5e478";
        };
        readonly semantic: {
            readonly error: "#EF5350";
            readonly warning: "#FFCA28";
            readonly success: "#c5e478";
            readonly info: "#82AAFF";
        };
    };
    readonly proxyConsole: {
        readonly bg: {
            readonly default: "#0A0C0F";
            readonly darker: "#0F1318";
            readonly lighter: "#1E2530";
            readonly selection: "#131820";
            readonly tabInactive: "#131820";
            readonly groupBorder: "#1E2530";
        };
        readonly fg: {
            readonly default: "#E8ECF1";
            readonly bright: "#F4F7FB";
            readonly panel: "#D6DCE6";
            readonly soft: "#A6B1C2";
            readonly muted: "#8A94A6";
            readonly subtle: "#5A6478";
        };
        readonly accent: {
            readonly yellow: "#F5A623";
            readonly orange: "#F5A623";
            readonly red: "#FF4C4C";
            readonly magenta: "#9B8CFF";
            readonly blue: "#00D4FF";
            readonly cyan: "#00D4FF";
            readonly green: "#00E5A0";
        };
        readonly semantic: {
            readonly error: "#FF4C4C";
            readonly warning: "#F5A623";
            readonly success: "#00E5A0";
            readonly info: "#00D4FF";
        };
    };
    readonly themes: {
        readonly monokai: import("./colors.js").ThemeDefinition;
        readonly 'night-owl': import("./colors.js").ThemeDefinition;
        readonly 'proxy-console': import("./colors.js").ThemeDefinition;
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
    readonly radius: {
        readonly none: "0px";
        readonly xs: "2px";
        readonly sm: "4px";
        readonly md: "6px";
        readonly lg: "8px";
        readonly xl: "12px";
        readonly full: "9999px";
    };
    readonly chords: import("./keybindings.js").ChordBinding[];
    readonly modeColors: Record<import("./keybindings.js").ModalMode, string>;
    readonly leaderKey: " ";
};
/**
 * Runtime token collection used by React components.
 * Themeable visual categories resolve through CSS variables with Monokai fallbacks.
 */
export declare const tokens: {
    readonly colors: {
        readonly background: {
            readonly default: string;
            readonly surface: string;
            readonly elevated: string;
            readonly highlight: string;
            readonly overlay: string;
        };
        readonly selection: {
            readonly default: string;
        };
        readonly text: {
            readonly default: string;
            readonly bright: string;
            readonly panel: string;
            readonly soft: string;
            readonly muted: string;
            readonly subtle: string;
            readonly inverse: string;
            readonly secondary: string;
        };
        readonly interactive: {
            readonly default: string;
            readonly hover: string;
            readonly active: string;
            readonly disabled: string;
        };
        readonly button: {
            readonly primary: {
                readonly bg: string;
                readonly fg: string;
                readonly hover: string;
                readonly active: string;
            };
            readonly secondary: {
                readonly bg: string;
                readonly fg: string;
                readonly hover: string;
                readonly active: string;
            };
            readonly ghost: {
                readonly bg: string;
                readonly fg: string;
                readonly hover: string;
                readonly active: string;
            };
            readonly danger: {
                readonly bg: string;
                readonly fg: string;
                readonly hover: string;
                readonly active: string;
            };
        };
        readonly badge: {
            readonly default: {
                readonly bg: string;
                readonly fg: string;
            };
            readonly success: {
                readonly bg: string;
                readonly fg: string;
            };
            readonly warning: {
                readonly bg: string;
                readonly fg: string;
            };
            readonly error: {
                readonly bg: string;
                readonly fg: string;
            };
            readonly info: {
                readonly bg: string;
                readonly fg: string;
            };
        };
        readonly border: {
            readonly default: string;
            readonly subtle: string;
            readonly focus: string;
            readonly error: string;
        };
        readonly accent: {
            yellow: string;
            orange: string;
            red: string;
            magenta: string;
            blue: string;
            cyan: string;
            green: string;
        };
        readonly semantic: {
            readonly error: string;
            readonly warning: string;
            readonly success: string;
            readonly info: string;
        };
        readonly status: {
            readonly alive: string;
            readonly dead: string;
            readonly open: string;
            readonly closed: string;
            readonly merged: string;
            readonly sleeping: string;
            readonly eating: string;
            readonly working: string;
        };
        readonly chart: {
            readonly segment0: string;
            readonly segment1: string;
            readonly segment2: string;
            readonly segment3: string;
            readonly segment4: string;
            readonly segment5: string;
        };
        readonly fill: {
            readonly good: {
                readonly start: string;
                readonly end: string;
            };
            readonly warn: {
                readonly start: string;
                readonly end: string;
            };
            readonly danger: {
                readonly start: string;
                readonly end: string;
            };
            readonly neutral: {
                readonly start: string;
                readonly end: string;
            };
        };
        readonly surface: {
            readonly panel: string;
            readonly card: string;
            readonly cardAlt: string;
            readonly input: string;
            readonly nav: string;
        };
        readonly alpha: {
            readonly green: {
                readonly _08: string;
                readonly _12: string;
                readonly _14: string;
                readonly _15: string;
                readonly _16: string;
                readonly _25: string;
                readonly _28: string;
                readonly _30: string;
                readonly _35: string;
                readonly _38: string;
                readonly _40: string;
                readonly _45: string;
                readonly _50: string;
                readonly _55: string;
                readonly _60: string;
                readonly _80: string;
            };
            readonly red: {
                readonly _12: string;
                readonly _14: string;
                readonly _15: string;
                readonly _25: string;
                readonly _30: string;
                readonly _38: string;
                readonly _40: string;
                readonly _45: string;
                readonly _46: string;
                readonly _50: string;
            };
            readonly orange: {
                readonly _12: string;
                readonly _15: string;
                readonly _32: string;
                readonly _35: string;
                readonly _40: string;
            };
            readonly blue: {
                readonly _15: string;
                readonly _20: string;
                readonly _35: string;
                readonly _45: string;
                readonly _80: string;
                readonly _95: string;
            };
            readonly magenta: {
                readonly _08: string;
                readonly _14: string;
                readonly _30: string;
            };
            readonly yellow: {
                readonly _06: string;
            };
            readonly bg: {
                readonly _08: string;
                readonly _10: string;
                readonly _12: string;
                readonly _14: string;
                readonly _16: string;
                readonly _18: string;
                readonly _24: string;
                readonly _25: string;
                readonly _28: string;
                readonly _30: string;
                readonly _46: string;
                readonly _55: string;
                readonly _60: string;
                readonly _62: string;
                readonly _68: string;
                readonly _70: string;
                readonly _72: string;
                readonly _80: string;
                readonly _85: string;
                readonly _88: string;
                readonly _88b: string;
                readonly _90: string;
                readonly _95: string;
            };
            readonly warningBg: string;
            readonly errorBg: string;
            readonly errorBgSolid: string;
            readonly federationError: string;
            readonly white: {
                readonly _08: string;
            };
            readonly shadow: string;
            readonly shadowLight: string;
            readonly shadowDeep: string;
        };
    };
    readonly monokai: {
        readonly bg: {
            readonly default: string;
            readonly darker: string;
            readonly lighter: string;
            readonly selection: string;
            readonly tabInactive: string;
            readonly groupBorder: string;
        };
        readonly fg: {
            readonly default: string;
            readonly bright: string;
            readonly panel: string;
            readonly soft: string;
            readonly muted: string;
            readonly subtle: string;
        };
        readonly accent: {
            readonly yellow: string;
            readonly orange: string;
            readonly red: string;
            readonly magenta: string;
            readonly blue: string;
            readonly cyan: string;
            readonly green: string;
        };
        readonly semantic: {
            readonly error: string;
            readonly warning: string;
            readonly success: string;
            readonly info: string;
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
        readonly xs: string;
        readonly sm: string;
        readonly base: string;
        readonly lg: string;
        readonly xl: string;
        readonly '2xl': string;
        readonly '3xl': string;
        readonly '4xl': string;
        readonly '5xl': string;
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
            readonly fontSize: string;
            readonly fontWeight: 700;
            readonly lineHeight: 1.25;
        };
        readonly h2: {
            readonly fontSize: string;
            readonly fontWeight: 700;
            readonly lineHeight: 1.25;
        };
        readonly h3: {
            readonly fontSize: string;
            readonly fontWeight: 600;
            readonly lineHeight: 1.375;
        };
        readonly h4: {
            readonly fontSize: string;
            readonly fontWeight: 600;
            readonly lineHeight: 1.375;
        };
        readonly h5: {
            readonly fontSize: string;
            readonly fontWeight: 500;
            readonly lineHeight: 1.5;
        };
        readonly h6: {
            readonly fontSize: string;
            readonly fontWeight: 500;
            readonly lineHeight: 1.5;
        };
        readonly body: {
            readonly fontSize: string;
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
        };
        readonly bodySm: {
            readonly fontSize: string;
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
        };
        readonly label: {
            readonly fontSize: string;
            readonly fontWeight: 500;
            readonly lineHeight: 1;
        };
        readonly caption: {
            readonly fontSize: string;
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
        };
        readonly code: {
            readonly fontFamily: string;
            readonly fontSize: string;
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
        readonly xs: string;
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
        readonly xl: string;
        readonly '2xl': string;
        readonly inner: string;
        readonly focus: string;
        readonly focusError: string;
        readonly none: string;
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
    readonly radius: {
        readonly none: string;
        readonly xs: string;
        readonly sm: string;
        readonly md: string;
        readonly lg: string;
        readonly xl: string;
        readonly full: string;
    };
    readonly chords: import("./keybindings.js").ChordBinding[];
    readonly modeColors: Record<import("./keybindings.js").ModalMode, string>;
    readonly leaderKey: " ";
};
export type Tokens = typeof tokens;
export type TokenValues = typeof tokenValues;
//# sourceMappingURL=index.d.ts.map