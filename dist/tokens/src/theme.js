import { monokai, nightOwl, proxyConsole, themes } from './colors.js';
import { radius } from './radius.js';
import { shadow } from './shadows.js';
import { fontFamily, fontSize } from './typography.js';
function clone(value) {
    return structuredClone(value);
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function deepMerge(base, override) {
    if (!override) {
        return clone(base);
    }
    const output = clone(base);
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
export const defaultThemePack = {
    colors: clone(themes.monokai.colors),
    monokai: clone(monokai),
    fontFamily,
    fontSize,
    shadow,
    radius,
};
export const themePacks = {
    monokai: defaultThemePack,
    'night-owl': createThemePack(defaultThemePack, {
        colors: clone(themes['night-owl'].colors),
        monokai: clone(nightOwl),
        shadow: {
            focus: '0 0 0 2px rgba(130, 170, 255, 0.35)',
            focusError: '0 0 0 2px rgba(239, 83, 80, 0.35)',
        },
    }),
    'proxy-console': createThemePack(defaultThemePack, {
        colors: clone(themes['proxy-console'].colors),
        monokai: clone(proxyConsole),
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