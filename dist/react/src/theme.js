import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { createThemePack, defaultThemeName, getThemeCssVariables, getThemeCssVars, resolveTheme, resolveThemeTokens, themePacks, } from '@open-hax/uxx/tokens';
function themePackForName(themeName) {
    return themePacks[themeName] ?? themePacks[defaultThemeName];
}
function createResolvedTheme(themeName, overrides) {
    const baseResolvedTheme = resolveThemeTokens(themeName);
    const resolvedThemePack = createThemePack(themePackForName(themeName), overrides);
    return {
        ...baseResolvedTheme,
        palette: resolvedThemePack.palette,
        colors: resolvedThemePack.colors,
        fontFamily: resolvedThemePack.fontFamily,
        fontSize: resolvedThemePack.fontSize,
        shadow: resolvedThemePack.shadow,
        radius: resolvedThemePack.radius,
    };
}
const UxxThemeContext = createContext({
    theme: defaultThemeName,
    themeName: defaultThemeName,
    resolvedTheme: createResolvedTheme(defaultThemeName),
});
export function ThemeProvider({ theme = defaultThemeName, overrides, children, className, style, as: Component = 'div', ...props }) {
    const themeName = useMemo(() => resolveTheme(theme), [theme]);
    const resolvedTheme = useMemo(() => createResolvedTheme(themeName, overrides), [themeName, overrides]);
    const resolvedThemePack = useMemo(() => createThemePack(themePackForName(themeName), overrides), [themeName, overrides]);
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
export function useUxxTheme() {
    return useContext(UxxThemeContext);
}
export function useResolvedTheme(theme) {
    const context = useUxxTheme();
    return useMemo(() => {
        if (theme === undefined) {
            return context.resolvedTheme;
        }
        return createResolvedTheme(resolveTheme(theme));
    }, [context.resolvedTheme, theme]);
}
export function useThemeName(theme) {
    return useResolvedTheme(theme).name;
}
//# sourceMappingURL=theme.js.map