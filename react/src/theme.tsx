import type { CSSProperties, ElementType, ReactNode } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import {
  defaultThemeName,
  getThemeCssVariables,
  resolveTheme,
  resolveThemeTokens,
  type ThemeDefinition,
  type ThemeName,
  type ThemePreference,
} from '@open-hax/uxx/tokens';

interface UxxThemeContextValue {
  theme: ThemePreference;
  themeName: ThemeName;
  resolvedTheme: ThemeDefinition;
}

const UxxThemeContext = createContext<UxxThemeContextValue>({
  theme: defaultThemeName,
  themeName: defaultThemeName,
  resolvedTheme: resolveThemeTokens(defaultThemeName),
});

export interface ThemeProviderProps {
  theme?: ThemePreference;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
}

export function ThemeProvider({
  theme = defaultThemeName,
  children,
  className,
  style,
  as: Component = 'div',
}: ThemeProviderProps) {
  const themeName = useMemo(() => resolveTheme(theme), [theme]);
  const resolvedTheme = useMemo(() => resolveThemeTokens(themeName), [themeName]);
  const cssVariables = useMemo(
    () => getThemeCssVariables(resolvedTheme) as CSSProperties,
    [resolvedTheme],
  );

  const value = useMemo<UxxThemeContextValue>(
    () => ({ theme, themeName, resolvedTheme }),
    [theme, themeName, resolvedTheme],
  );

  return (
    <UxxThemeContext.Provider value={value}>
      <Component
        data-theme={themeName}
        className={className ? `theme-${themeName} ${className}` : `theme-${themeName}`}
        style={{
          ...cssVariables,
          ...style,
        }}
      >
        {children}
      </Component>
    </UxxThemeContext.Provider>
  );
}

export function useUxxTheme(): UxxThemeContextValue {
  return useContext(UxxThemeContext);
}

export function useResolvedTheme(theme?: ThemePreference): ThemeDefinition {
  const context = useUxxTheme();
  const preference = theme ?? context.themeName;
  return useMemo(() => resolveThemeTokens(preference), [preference]);
}

export function useThemeName(theme?: ThemePreference): ThemeName {
  return useResolvedTheme(theme).name as ThemeName;
}
