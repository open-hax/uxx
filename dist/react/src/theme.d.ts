import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { type ThemeDefinition, type ThemeName, type ThemeOverride, type ThemePack, type ThemePreference } from '@open-hax/uxx/tokens';
export type ResolvedTheme = Omit<ThemeDefinition, 'palette' | 'colors'> & Pick<ThemePack, 'fontFamily' | 'fontSize' | 'shadow' | 'radius'> & {
    palette: ThemeDefinition['palette'];
    colors: ThemeDefinition['colors'];
};
interface UxxThemeContextValue {
    theme: ThemePreference;
    themeName: ThemeName;
    resolvedTheme: ResolvedTheme;
}
export interface ThemeProviderProps extends HTMLAttributes<HTMLElement> {
    theme?: ThemePreference;
    overrides?: ThemeOverride;
    children: ReactNode;
    style?: CSSProperties;
    as?: ElementType;
}
export declare function ThemeProvider({ theme, overrides, children, className, style, as: Component, ...props }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useUxxTheme(): UxxThemeContextValue;
export declare function useResolvedTheme(theme?: ThemePreference): ResolvedTheme;
export declare function useThemeName(theme?: ThemePreference): ThemeName;
export {};
//# sourceMappingURL=theme.d.ts.map