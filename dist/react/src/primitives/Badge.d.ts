/**
 * Badge Component
 *
 * Implements the badge-enhancement.spec.md contract.
 * Enhanced compact status or category indicator with variants, pulse, and icons.
 */
import { type ReactNode } from 'react';
export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'open' | 'closed' | 'merged' | 'alive' | 'dead' | 'running' | 'stopped';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export interface BadgeProps {
    /** Visual style variant */
    variant?: BadgeVariant;
    /** Size of the badge */
    size?: BadgeSize;
    /** Whether to show a status dot before the content */
    dot?: boolean;
    /** Whether dot should pulse (live/active state) */
    pulse?: boolean;
    /** Whether to use fully rounded (pill) corners */
    rounded?: boolean;
    /** Whether to use outline style instead of filled */
    outline?: boolean;
    /** Custom dot color (overrides variant) */
    dotColor?: string;
    /** Badge content */
    children?: ReactNode;
    /** Optional icon before text */
    iconStart?: ReactNode;
    /** Optional icon after text */
    iconEnd?: ReactNode;
    /** Custom class name */
    className?: string;
}
/**
 * Badge component for status and category indicators.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Badge variant="success">Active</Badge>
 *
 * // With dot indicator
 * <Badge variant="warning" dot>Running</Badge>
 *
 * // Pulsing dot for live states
 * <Badge variant="success" dot pulse>Live</Badge>
 *
 * // Semantic variants
 * <Badge variant="open">Open</Badge>
 * <Badge variant="merged">Merged</Badge>
 * <Badge variant="alive">Alive</Badge>
 *
 * // With icons
 * <Badge variant="success" iconStart={<CheckIcon />}>Verified</Badge>
 * ```
 */
export declare function Badge({ variant, size, dot, pulse, rounded, outline, dotColor, children, iconStart, iconEnd, className, }: BadgeProps): import("react/jsx-runtime").JSX.Element;
export default Badge;
//# sourceMappingURL=Badge.d.ts.map