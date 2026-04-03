import type { ReactNode } from 'react';
import { type BadgeVariant } from './Badge.js';
export interface StatusChipItem {
    readonly label: string;
    readonly variant?: BadgeVariant;
    readonly icon?: ReactNode;
}
export interface StatusChipStackProps {
    readonly items: readonly StatusChipItem[];
    readonly size?: 'xs' | 'sm' | 'md';
    readonly separator?: ReactNode;
}
export declare function StatusChipStack({ items, size, separator }: StatusChipStackProps): import("react/jsx-runtime").JSX.Element;
export default StatusChipStack;
//# sourceMappingURL=StatusChipStack.d.ts.map