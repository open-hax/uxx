/**
 * Design Tokens - Colors
 *
 * Multi-theme token registry for UXX.
 *
 * Monokai remains the default theme for backward compatibility.
 * Add new themes by defining a base palette and registering it with
 * `createThemeDefinition(...)`.
 */
type HexColor = `#${string}`;
export interface ThemePalette {
    bg: {
        default: HexColor;
        darker: HexColor;
        lighter: HexColor;
        selection: HexColor;
        tabInactive: HexColor;
        groupBorder: HexColor;
    };
    fg: {
        default: HexColor;
        bright: HexColor;
        panel: HexColor;
        soft: HexColor;
        muted: HexColor;
        subtle: HexColor;
    };
    accent: {
        yellow: HexColor;
        orange: HexColor;
        red: HexColor;
        magenta: HexColor;
        blue: HexColor;
        cyan: HexColor;
        green: HexColor;
    };
    semantic: {
        error: HexColor;
        warning: HexColor;
        success: HexColor;
        info: HexColor;
    };
}
export declare function withAlpha(hex: string, alpha: number): string;
declare function createThemeColors(palette: ThemePalette, overrides?: Record<string, unknown>): {
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
        yellow: HexColor;
        orange: HexColor;
        red: HexColor;
        magenta: HexColor;
        blue: HexColor;
        cyan: HexColor;
        green: HexColor;
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
export type ThemeColors = ReturnType<typeof createThemeColors>;
export type ThemeCssVariables = Record<string, string>;
export interface ThemeDefinition {
    name: string;
    label: string;
    appearance: 'dark' | 'light';
    palette: ThemePalette;
    colors: ThemeColors;
}
export declare function createThemeDefinition(name: string, label: string, palette: ThemePalette, options?: {
    appearance?: 'dark' | 'light';
    colorOverrides?: Record<string, unknown>;
}): ThemeDefinition;
export declare const monokai: {
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
export declare const nightOwl: {
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
export declare const themes: {
    readonly monokai: ThemeDefinition;
    readonly 'night-owl': ThemeDefinition;
};
export type ThemeName = keyof typeof themes;
export type ThemePreference = ThemeName | 'dark' | 'light' | 'auto';
export declare const defaultThemeName: ThemeName;
export declare function resolveTheme(theme?: ThemePreference): ThemeName;
export declare function getTheme(themeName?: ThemeName): ThemeDefinition;
export declare function resolveThemeTokens(theme?: ThemePreference): ThemeDefinition;
export declare function getThemeCssVariables(theme?: ThemePreference | ThemeName | ThemeDefinition): ThemeCssVariables;
export declare const colors: {
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
        yellow: HexColor;
        orange: HexColor;
        red: HexColor;
        magenta: HexColor;
        blue: HexColor;
        cyan: HexColor;
        green: HexColor;
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
export type ColorToken = keyof typeof colors;
export type MonokaiColor = typeof monokai;
export type NightOwlColor = typeof nightOwl;
export {};
//# sourceMappingURL=colors.d.ts.map