import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { defaultThemeName, getThemeCssVariables, resolveTheme, resolveThemeTokens, } from '@open-hax/uxx/tokens';
const UxxThemeContext = createContext({
    theme: defaultThemeName,
    themeName: defaultThemeName,
    resolvedTheme: resolveThemeTokens(defaultThemeName),
});
export function ThemeProvider({ theme = defaultThemeName, children, className, style, as: Component = 'div', }) {
    const themeName = useMemo(() => resolveTheme(theme), [theme]);
    const resolvedTheme = useMemo(() => resolveThemeTokens(themeName), [themeName]);
    const cssVariables = useMemo(() => getThemeCssVariables(resolvedTheme), [resolvedTheme]);
    const value = useMemo(() => ({ theme, themeName, resolvedTheme }), [theme, themeName, resolvedTheme]);
    return (_jsx(UxxThemeContext.Provider, { value: value, children: _jsx(Component, { "data-theme": themeName, className: className ? `theme-${themeName} ${className}` : `theme-${themeName}`, style: {
                ...cssVariables,
                ...style,
            }, children: children }) }));
}
export function useUxxTheme() {
    return useContext(UxxThemeContext);
}
export function useResolvedTheme(theme) {
    const context = useUxxTheme();
    const preference = theme ?? context.themeName;
    return useMemo(() => resolveThemeTokens(preference), [preference]);
}
export function useThemeName(theme) {
    return useResolvedTheme(theme).name;
}
//# sourceMappingURL=theme.js.map