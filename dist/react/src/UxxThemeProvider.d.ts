import { type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { type ThemeOverride, type ThemePack, type ThemePackName } from '@open-hax/uxx/tokens';
export interface UxxThemeProviderProps extends HTMLAttributes<HTMLElement> {
    as?: keyof JSX.IntrinsicElements;
    theme?: ThemePackName | ThemePack;
    overrides?: ThemeOverride;
    children?: ReactNode;
    style?: CSSProperties;
}
/**
 * Applies a named UXX theme pack and optional token overrides to a subtree.
 */
export declare function UxxThemeProvider({ as, theme, overrides, children, style, ...props }: UxxThemeProviderProps): JSX.Element;
export default UxxThemeProvider;
//# sourceMappingURL=UxxThemeProvider.d.ts.map