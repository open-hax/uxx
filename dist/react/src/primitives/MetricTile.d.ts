import type { ReactNode } from 'react';
export type MetricTileVariant = 'default' | 'info' | 'success' | 'warning' | 'error';
export interface MetricTileSparkPoint {
    readonly value: number;
    readonly label?: string;
}
export interface MetricTileProps {
    readonly label: string;
    readonly value: string | number | ReactNode;
    readonly detail?: string | ReactNode;
    readonly loading?: boolean;
    readonly variant?: MetricTileVariant;
    readonly sparkbar?: readonly MetricTileSparkPoint[];
}
export declare function MetricTile({ label, value, detail, loading, variant, sparkbar, }: MetricTileProps): import("react/jsx-runtime").JSX.Element;
export default MetricTile;
//# sourceMappingURL=MetricTile.d.ts.map