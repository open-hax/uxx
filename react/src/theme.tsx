import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import {
  createThemePack,
  defaultThemeName,
  getThemeCssVariables,
  getThemeCssVars,
  resolveTheme,
  resolveThemeTokens,
  themePacks,
  type ThemeDefinition,
  type ThemeName,
  type ThemeOverride,
  type ThemePackName,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(base: T, override?: Record<string, unknown>): T {
  if (!override) {
    return structuredClone(base);
  }

  const output: Record<string, unknown> = structuredClone(base);

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

  return output as T;
}

function themePackForName(themeName: ThemeName) {
  return themePacks[themeName as ThemePackName] ?? themePacks[defaultThemeName as ThemePackName];
}

export interface ThemeProviderProps extends HTMLAttributes<HTMLElement> {
  theme?: ThemePreference;
  overrides?: ThemeOverride;
  children: ReactNode;
  style?: CSSProperties;
  as?: ElementType;
}

export function ThemeProvider({
  theme = defaultThemeName,
  overrides,
  children,
  className,
  style,
  as: Component = 'div',
  ...props
}: ThemeProviderProps) {
  const themeName = useMemo(() => resolveTheme(theme), [theme]);
  const baseResolvedTheme = useMemo(() => resolveThemeTokens(themeName), [themeName]);
  const resolvedThemePack = useMemo(
    () => createThemePack(themePackForName(themeName), overrides),
    [themeName, overrides],
  );
  const resolvedTheme = useMemo<ThemeDefinition>(() => {
    if (!overrides?.colors) {
      return baseResolvedTheme;
    }

    return {
      ...baseResolvedTheme,
      colors: deepMerge(baseResolvedTheme.colors, overrides.colors as Record<string, unknown>),
    };
  }, [baseResolvedTheme, overrides?.colors]);
  const cssVariables = useMemo(
    () => ({
      ...getThemeCssVars(resolvedThemePack),
      ...getThemeCssVariables(resolvedTheme),
    }) as CSSProperties,
    [resolvedThemePack, resolvedTheme],
  );

  const value = useMemo<UxxThemeContextValue>(
    () => ({ theme, themeName, resolvedTheme }),
    [theme, themeName, resolvedTheme],
  );

  return (
    <UxxThemeContext.Provider value={value}>
      <Component
        {...props}
        data-theme={themeName}
        data-uxx-theme={themeName}
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

export type UxxThemeProviderProps = ThemeProviderProps;
export const UxxThemeProvider = ThemeProvider;

export function useUxxTheme(): UxxThemeContextValue {
  return useContext(UxxThemeContext);
}

export function useResolvedTheme(theme?: ThemePreference): ThemeDefinition {
  const context = useUxxTheme();
  return useMemo(() => {
    if (theme === undefined) {
      return context.resolvedTheme;
    }
    return resolveThemeTokens(theme);
  }, [context.resolvedTheme, theme]);
}

export function useThemeName(theme?: ThemePreference): ThemeName {
  return useResolvedTheme(theme).name as ThemeName;
}
