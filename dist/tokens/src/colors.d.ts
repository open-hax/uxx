/**
 * Design Tokens - Colors
 *
 * Official Monokai Classic palette from VS Code theme.
 * Source: github.com/brayevalerien/cb94ac685ebc186f359deae113b6710c
 *
 * Key principle: surfaces are DARKER than the editor bg (#272822),
 * matching VS Code's sidebar (#1e1f1c) and panel model.
 */
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
export declare const colors: {
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
export type ColorToken = keyof typeof colors;
export type MonokaiColor = typeof monokai;
//# sourceMappingURL=colors.d.ts.map