import { monokai, themes } from './colors.js';
import { radius } from './radius.js';
import { shadow } from './shadows.js';
import { fontFamily, fontSize } from './typography.js';
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
type WidenLiterals<T> = T extends string ? string : T extends number ? number : T extends object ? {
    [K in keyof T]: WidenLiterals<T[K]>;
} : T;
export type ThemePack = {
    colors: WidenLiterals<typeof themes.monokai.colors>;
    monokai: WidenLiterals<typeof monokai>;
    fontFamily: WidenLiterals<typeof fontFamily>;
    fontSize: WidenLiterals<typeof fontSize>;
    shadow: WidenLiterals<typeof shadow>;
    radius: WidenLiterals<typeof radius>;
};
export type ThemeOverride = DeepPartial<ThemePack>;
export declare function createThemePack(base: ThemePack, override?: ThemeOverride): ThemePack;
export type ThemePackName = 'monokai' | 'night-owl' | 'proxy-console';
export declare const defaultThemePack: ThemePack;
export declare const themePacks: Record<ThemePackName, ThemePack>;
export declare function getThemeCssVarName(path: ReadonlyArray<string>): `--uxx-${string}`;
export declare function getThemeCssVars(theme: ThemePack): Record<`--uxx-${string}`, string>;
export declare function createThemeCssVarRefs<T extends Record<string, unknown>>(theme: T, path?: string[]): T;
export {};
//# sourceMappingURL=theme.d.ts.map