import { colors, monokai } from './colors.js';
import { radius } from './radius.js';
import { shadow } from './shadows.js';
import { fontFamily, fontSize } from './typography.js';
export const defaultThemePack = {
    colors,
    monokai,
    fontFamily,
    fontSize,
    shadow,
    radius,
};
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function deepMerge(base, override) {
    if (!override) {
        return structuredClone(base);
    }
    const output = structuredClone(base);
    for (const [key, value] of Object.entries(override)) {
        if (value === undefined) {
            continue;
        }
        const current = output[key];
        if (isRecord(current) && isRecord(value)) {
            output[key] = deepMerge(current, value);
            continue;
        }
        output[key] = value;
    }
    return output;
}
export function createThemePack(base, override) {
    return deepMerge(base, override);
}
export const themePacks = {
    monokai: defaultThemePack,
    proxyConsole: createThemePack(defaultThemePack, {
        colors: {
            background: {
                default: '#0A0C0F',
                surface: '#0F1318',
                elevated: '#131820',
                highlight: '#1E2530',
                overlay: 'rgba(0, 0, 0, 0.6)',
            },
            text: {
                default: '#E8ECF1',
                bright: '#F4F7FB',
                panel: '#D6DCE6',
                soft: '#A6B1C2',
                muted: '#8A94A6',
                subtle: '#5A6478',
                inverse: '#0A0C0F',
                secondary: '#8A94A6',
            },
            interactive: {
                default: '#00D4FF',
                hover: '#34DEFF',
                active: '#00B8DE',
                disabled: '#5A6478',
            },
            button: {
                primary: {
                    bg: '#00D4FF',
                    fg: '#0A0C0F',
                    hover: '#34DEFF',
                    active: '#00B8DE',
                },
                secondary: {
                    bg: '#0F1318',
                    fg: '#E8ECF1',
                    hover: '#131820',
                    active: '#1A212C',
                },
                ghost: {
                    bg: 'transparent',
                    fg: '#E8ECF1',
                    hover: 'rgba(0, 212, 255, 0.12)',
                    active: 'rgba(0, 212, 255, 0.18)',
                },
                danger: {
                    bg: '#FF4C4C',
                    fg: '#FDFEFF',
                    hover: '#FF6666',
                    active: '#E64545',
                },
            },
            badge: {
                default: {
                    bg: 'rgba(90, 100, 120, 0.2)',
                    fg: '#E8ECF1',
                },
                success: {
                    bg: 'rgba(0, 229, 160, 0.12)',
                    fg: '#00E5A0',
                },
                warning: {
                    bg: 'rgba(245, 166, 35, 0.12)',
                    fg: '#F5A623',
                },
                error: {
                    bg: 'rgba(255, 76, 76, 0.12)',
                    fg: '#FF4C4C',
                },
                info: {
                    bg: 'rgba(0, 212, 255, 0.12)',
                    fg: '#00D4FF',
                },
            },
            border: {
                default: '#1E2530',
                subtle: '#171C25',
                focus: '#00D4FF',
                error: '#FF4C4C',
            },
            accent: {
                yellow: '#F5A623',
                orange: '#F5A623',
                red: '#FF4C4C',
                magenta: '#9B8CFF',
                blue: '#00D4FF',
                cyan: '#00D4FF',
                green: '#00E5A0',
            },
            status: {
                alive: '#00E5A0',
                dead: '#FF4C4C',
                open: '#00E5A0',
                closed: '#8A94A6',
                merged: '#9B8CFF',
                sleeping: '#00D4FF',
                eating: '#F5A623',
                working: '#00D4FF',
            },
            chart: {
                segment0: '#00D4FF',
                segment1: '#00E5A0',
                segment2: '#F5A623',
                segment3: '#FF4C4C',
                segment4: '#9B8CFF',
                segment5: '#7A90AA',
            },
            fill: {
                good: { start: '#00E5A0', end: '#57F0C0' },
                warn: { start: '#F5A623', end: '#FFD07A' },
                danger: { start: '#FF4C4C', end: '#FF8C8C' },
                neutral: { start: '#00D4FF', end: '#8EEBFF' },
            },
            surface: {
                panel: 'rgba(15, 19, 24, 0.92)',
                card: 'rgba(19, 24, 32, 0.82)',
                cardAlt: 'rgba(30, 37, 48, 0.62)',
                input: 'rgba(10, 13, 17, 0.95)',
                nav: 'rgba(10, 12, 15, 0.88)',
            },
            alpha: {
                green: {
                    _08: 'rgba(0, 229, 160, 0.08)',
                    _12: 'rgba(0, 229, 160, 0.12)',
                    _14: 'rgba(0, 229, 160, 0.14)',
                    _15: 'rgba(0, 229, 160, 0.15)',
                    _16: 'rgba(0, 229, 160, 0.16)',
                    _25: 'rgba(0, 229, 160, 0.25)',
                    _28: 'rgba(0, 229, 160, 0.28)',
                    _30: 'rgba(0, 229, 160, 0.30)',
                    _35: 'rgba(0, 229, 160, 0.35)',
                    _38: 'rgba(0, 229, 160, 0.38)',
                    _40: 'rgba(0, 229, 160, 0.40)',
                    _45: 'rgba(0, 229, 160, 0.45)',
                    _50: 'rgba(0, 229, 160, 0.50)',
                    _55: 'rgba(0, 229, 160, 0.55)',
                    _60: 'rgba(0, 229, 160, 0.60)',
                    _80: 'rgba(0, 229, 160, 0.80)',
                },
                red: {
                    _12: 'rgba(255, 76, 76, 0.12)',
                    _14: 'rgba(255, 76, 76, 0.14)',
                    _15: 'rgba(255, 76, 76, 0.15)',
                    _25: 'rgba(255, 76, 76, 0.25)',
                    _30: 'rgba(255, 76, 76, 0.30)',
                    _38: 'rgba(255, 76, 76, 0.38)',
                    _40: 'rgba(255, 76, 76, 0.40)',
                    _45: 'rgba(255, 76, 76, 0.45)',
                    _46: 'rgba(255, 76, 76, 0.46)',
                    _50: 'rgba(255, 76, 76, 0.50)',
                },
                orange: {
                    _12: 'rgba(245, 166, 35, 0.12)',
                    _15: 'rgba(245, 166, 35, 0.15)',
                    _32: 'rgba(245, 166, 35, 0.32)',
                    _35: 'rgba(245, 166, 35, 0.35)',
                    _40: 'rgba(245, 166, 35, 0.40)',
                },
                blue: {
                    _15: 'rgba(0, 212, 255, 0.15)',
                    _20: 'rgba(0, 212, 255, 0.20)',
                    _35: 'rgba(0, 212, 255, 0.35)',
                    _45: 'rgba(0, 212, 255, 0.45)',
                    _80: 'rgba(0, 212, 255, 0.80)',
                    _95: 'rgba(0, 212, 255, 0.95)',
                },
                magenta: {
                    _08: 'rgba(155, 140, 255, 0.08)',
                    _14: 'rgba(155, 140, 255, 0.14)',
                    _30: 'rgba(155, 140, 255, 0.30)',
                },
                yellow: {
                    _06: 'rgba(245, 166, 35, 0.06)',
                },
                bg: {
                    _08: 'rgba(19, 24, 32, 0.08)',
                    _10: 'rgba(19, 24, 32, 0.10)',
                    _12: 'rgba(19, 24, 32, 0.12)',
                    _14: 'rgba(19, 24, 32, 0.14)',
                    _16: 'rgba(19, 24, 32, 0.16)',
                    _18: 'rgba(19, 24, 32, 0.18)',
                    _24: 'rgba(19, 24, 32, 0.24)',
                    _25: 'rgba(19, 24, 32, 0.25)',
                    _28: 'rgba(19, 24, 32, 0.28)',
                    _30: 'rgba(19, 24, 32, 0.30)',
                    _46: 'rgba(10, 12, 15, 0.46)',
                    _55: 'rgba(19, 24, 32, 0.55)',
                    _60: 'rgba(10, 12, 15, 0.60)',
                    _62: 'rgba(10, 12, 15, 0.62)',
                    _68: 'rgba(10, 12, 15, 0.68)',
                    _70: 'rgba(19, 24, 32, 0.70)',
                    _72: 'rgba(10, 12, 15, 0.72)',
                    _80: 'rgba(10, 12, 15, 0.80)',
                    _85: 'rgba(19, 24, 32, 0.85)',
                    _88: 'rgba(19, 24, 32, 0.88)',
                    _88b: 'rgba(10, 12, 15, 0.88)',
                    _90: 'rgba(10, 12, 15, 0.90)',
                    _95: 'rgba(10, 12, 15, 0.95)',
                },
                warningBg: 'rgba(68, 46, 12, 0.88)',
                errorBg: 'rgba(90, 28, 28, 0.42)',
                errorBgSolid: 'rgba(90, 28, 28, 0.90)',
                federationError: 'rgba(127, 29, 29, 0.22)',
                white: {
                    _08: 'rgba(255, 255, 255, 0.08)',
                },
                shadow: 'rgba(0, 0, 0, 0.40)',
                shadowLight: 'rgba(0, 0, 0, 0.30)',
                shadowDeep: 'rgba(0, 0, 0, 0.50)',
            },
        },
        monokai: {
            bg: {
                default: '#0A0C0F',
                darker: '#0F1318',
                lighter: '#1E2530',
                selection: '#131820',
                tabInactive: '#131820',
                groupBorder: '#1E2530',
            },
            fg: {
                default: '#E8ECF1',
                bright: '#F4F7FB',
                panel: '#D6DCE6',
                soft: '#A6B1C2',
                muted: '#8A94A6',
                subtle: '#5A6478',
            },
            accent: {
                yellow: '#F5A623',
                orange: '#F5A623',
                red: '#FF4C4C',
                magenta: '#9B8CFF',
                blue: '#00D4FF',
                cyan: '#00D4FF',
                green: '#00E5A0',
            },
            semantic: {
                error: '#FF4C4C',
                warning: '#F5A623',
                success: '#00E5A0',
                info: '#00D4FF',
            },
        },
        fontFamily: {
            sans: [
                'IBM Plex Sans',
                'Segoe UI',
                'system-ui',
                'sans-serif',
            ].join(', '),
            mono: [
                'JetBrains Mono',
                'Fira Code',
                'monospace',
            ].join(', '),
        },
        shadow: {
            xs: '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
            sm: '0 1px 3px rgba(0, 0, 0, 0.4)',
            md: '0 4px 12px rgba(0, 0, 0, 0.5)',
            lg: '0 10px 24px rgba(0, 0, 0, 0.55)',
            xl: '0 20px 36px rgba(0, 0, 0, 0.6)',
            '2xl': '0 28px 64px rgba(0, 0, 0, 0.65)',
            inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.28)',
            focus: '0 0 0 2px rgba(0, 212, 255, 0.35)',
            focusError: '0 0 0 2px rgba(255, 76, 76, 0.35)',
            none: 'none',
        },
        radius: {
            none: '0px',
            xs: '2px',
            sm: '4px',
            md: '4px',
            lg: '6px',
            xl: '8px',
            full: '9999px',
        },
    }),
};
export function getThemeCssVarName(path) {
    return `--uxx-${path.join('-')}`;
}
function flattenThemeObject(value, path = []) {
    const flattened = {};
    for (const [key, entry] of Object.entries(value)) {
        const nextPath = [...path, key];
        if (isRecord(entry)) {
            Object.assign(flattened, flattenThemeObject(entry, nextPath));
            continue;
        }
        flattened[getThemeCssVarName(nextPath)] = String(entry);
    }
    return flattened;
}
export function getThemeCssVars(theme) {
    return flattenThemeObject(theme);
}
export function createThemeCssVarRefs(theme, path = []) {
    const output = {};
    for (const [key, value] of Object.entries(theme)) {
        const nextPath = [...path, key];
        if (isRecord(value)) {
            output[key] = createThemeCssVarRefs(value, nextPath);
            continue;
        }
        output[key] = `var(${getThemeCssVarName(nextPath)}, ${String(value)})`;
    }
    return output;
}
//# sourceMappingURL=theme.js.map