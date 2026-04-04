import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { type ThemeDefinition, type ThemeName, type ThemeOverride, type ThemePreference } from '@open-hax/uxx/tokens';
interface UxxThemeContextValue {
    theme: ThemePreference;
    themeName: ThemeName;
    resolvedTheme: ThemeDefinition;
}
export interface ThemeProviderProps extends HTMLAttributes<HTMLElement> {
    theme?: ThemePreference;
    overrides?: ThemeOverride;
    children: ReactNode;
    style?: CSSProperties;
    as?: ElementType;
}
export declare function ThemeProvider({ theme, overrides, children, className, style, as: Component, ...props }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;
export type UxxThemeProviderProps = ThemeProviderProps;
export declare const UxxThemeProvider: typeof ThemeProvider;
export declare function useUxxTheme(): UxxThemeContextValue;
export declare function useResolvedTheme(theme?: ThemePreference): ThemeDefinition;
export declare function useThemeName(theme?: ThemePreference): ThemeName;
export {};
//# sourceMappingURL=theme.d.ts.map