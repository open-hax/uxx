import type { ReactNode } from 'react';
export type SurfaceHeroTone = 'default' | 'info' | 'success' | 'warning' | 'error';
export interface SurfaceHeroStat {
    readonly label: string;
    readonly value: string | number;
    readonly tone?: SurfaceHeroTone;
}
export interface SurfaceHeroProps {
    readonly kicker?: string;
    readonly title: string;
    readonly description?: string;
    readonly stats?: readonly SurfaceHeroStat[];
    readonly actions?: ReactNode;
    readonly variant?: 'default' | 'elevated';
}
export declare function SurfaceHero({ kicker, title, description, stats, actions, variant, }: SurfaceHeroProps): import("react/jsx-runtime").JSX.Element;
export default SurfaceHero;
//# sourceMappingURL=SurfaceHero.d.ts.map