import {
  createElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import {
  createThemePack,
  getThemeCssVars,
  themePacks,
  type ThemeOverride,
  type ThemePack,
  type ThemePackName,
} from '@open-hax/uxx/tokens';

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
export function UxxThemeProvider({
  as = 'div',
  theme = 'monokai',
  overrides,
  children,
  style,
  ...props
}: UxxThemeProviderProps): JSX.Element {
  const baseTheme = typeof theme === 'string' ? themePacks[theme] : theme;
  const resolvedTheme = overrides ? createThemePack(baseTheme, overrides) : baseTheme;
  const themeVars = getThemeCssVars(resolvedTheme) as unknown as CSSProperties;
  const themeName = typeof theme === 'string' ? theme : 'custom';

  return createElement(
    as,
    {
      ...props,
      'data-uxx-theme': themeName,
      style: {
        ...themeVars,
        ...style,
      },
    },
    children
  );
}

export default UxxThemeProvider;
