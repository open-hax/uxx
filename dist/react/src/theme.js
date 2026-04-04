import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { createThemePack, defaultThemeName, getThemeCssVariables, getThemeCssVars, resolveTheme, resolveThemeTokens, themePacks, } from '@open-hax/uxx/tokens';
const UxxThemeContext = createContext({
    theme: defaultThemeName,
    themeName: defaultThemeName,
    resolvedTheme: resolveThemeTokens(defaultThemeName),
});
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
function themePackForName(themeName) {
    return themePacks[themeName] ?? themePacks[defaultThemeName];
}
export function ThemeProvider({ theme = defaultThemeName, overrides, children, className, style, as: Component = 'div', ...props }) {
    const themeName = useMemo(() => resolveTheme(theme), [theme]);
    const baseResolvedTheme = useMemo(() => resolveThemeTokens(themeName), [themeName]);
    const resolvedThemePack = useMemo(() => createThemePack(themePackForName(themeName), overrides), [themeName, overrides]);
    const resolvedTheme = useMemo(() => {
        if (!overrides?.colors) {
            return baseResolvedTheme;
        }
        return {
            ...baseResolvedTheme,
            colors: deepMerge(baseResolvedTheme.colors, overrides.colors),
        };
    }, [baseResolvedTheme, overrides?.colors]);
    const cssVariables = useMemo(() => ({
        ...getThemeCssVars(resolvedThemePack),
        ...getThemeCssVariables(resolvedTheme),
    }), [resolvedThemePack, resolvedTheme]);
    const value = useMemo(() => ({ theme, themeName, resolvedTheme }), [theme, themeName, resolvedTheme]);
    return (_jsx(UxxThemeContext.Provider, { value: value, children: _jsx(Component, { ...props, "data-theme": themeName, "data-uxx-theme": themeName, className: className ? `theme-${themeName} ${className}` : `theme-${themeName}`, style: {
                ...cssVariables,
                ...style,
            }, children: children }) }));
}
export const UxxThemeProvider = ThemeProvider;
export function useUxxTheme() {
    return useContext(UxxThemeContext);
}
export function useResolvedTheme(theme) {
    const context = useUxxTheme();
    return useMemo(() => {
        if (theme === undefined) {
            return context.resolvedTheme;
        }
        return resolveThemeTokens(theme);
    }, [context.resolvedTheme, theme]);
}
export function useThemeName(theme) {
    return useResolvedTheme(theme).name;
}
//# sourceMappingURL=theme.js.map