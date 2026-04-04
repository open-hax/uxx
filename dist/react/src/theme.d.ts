import type { CSSProperties, ElementType, ReactNode } from 'react';
import { type ThemeDefinition, type ThemeName, type ThemePreference } from '@open-hax/uxx/tokens';
interface UxxThemeContextValue {
    theme: ThemePreference;
    themeName: ThemeName;
    resolvedTheme: ThemeDefinition;
}
export interface ThemeProviderProps {
    theme?: ThemePreference;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    as?: ElementType;
}
export declare function ThemeProvider({ theme, children, className, style, as: Component, }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useUxxTheme(): UxxThemeContextValue;
export declare function useResolvedTheme(theme?: ThemePreference): ThemeDefinition;
export declare function useThemeName(theme?: ThemePreference): ThemeName;
export {};
//# sourceMappingURL=theme.d.ts.map