import { createElement, } from 'react';
import { createThemePack, getThemeCssVars, themePacks, } from '@open-hax/uxx/tokens';
/**
 * Applies a named UXX theme pack and optional token overrides to a subtree.
 */
export function UxxThemeProvider({ as = 'div', theme = 'monokai', overrides, children, style, ...props }) {
    const baseTheme = typeof theme === 'string' ? themePacks[theme] : theme;
    const resolvedTheme = overrides ? createThemePack(baseTheme, overrides) : baseTheme;
    const themeVars = getThemeCssVars(resolvedTheme);
    const themeName = typeof theme === 'string' ? theme : 'custom';
    return createElement(as, {
        ...props,
        'data-uxx-theme': themeName,
        style: {
            ...themeVars,
            ...style,
        },
    }, children);
}
export default UxxThemeProvider;
//# sourceMappingURL=UxxThemeProvider.js.map