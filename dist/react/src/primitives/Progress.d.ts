/**
 * Progress Component
 *
 * Implements the progress-enhancement.spec.md contract.
 * Enhanced progress indicator with gradients, segments, animations, and more.
 */
export type ProgressVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'pressure';
export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';
export type ProgressValuePosition = 'inside' | 'right' | 'tooltip';
export interface ProgressGradient {
    /** Start color */
    from: string;
    /** End color */
    to: string;
    /** Gradient angle in degrees (default 90) */
    angle?: number;
}
export interface ProgressSegment {
    /** Segment value */
    value: number;
    /** Segment color */
    color?: string;
    /** Segment gradient (overrides color) */
    gradient?: string | ProgressGradient;
    /** Optional label for segment */
    label?: string;
}
export interface ProgressProps {
    /** Current progress value (0-100 or value/max) */
    value?: number;
    /** Maximum value */
    max?: number;
    /** Color variant */
    variant?: ProgressVariant;
    /** Height of the progress bar */
    size?: ProgressSize;
    /** Custom gradient fill (overrides variant color) */
    gradient?: string | ProgressGradient;
    /** Whether progress is indeterminate (loading) */
    indeterminate?: boolean;
    /** Whether to animate progress changes */
    animated?: boolean;
    /** Animation duration in ms */
    animationDuration?: number;
    /** Whether to show the percentage/value */
    showValue?: boolean;
    /** Position of value label */
    valuePosition?: ProgressValuePosition;
    /** Custom value formatter */
    formatValue?: (value: number, max: number) => string;
    /** Multi-segment progress */
    segments?: ProgressSegment[];
    /** Whether to stripe the fill */
    striped?: boolean;
    /** Whether stripes animate */
    stripedAnimated?: boolean;
    /** Label above/below bar */
    label?: string;
    /** Accessible label */
    ariaLabel?: string;
    /** Custom class name */
    className?: string;
}
/**
 * Progress indicator with gradients, segments, and animations.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Progress value={60} />
 *
 * // With gradient
 * <Progress
 *   value={75}
 *   gradient={{ from: '#66d9ef', to: '#a6e22e' }}
 * />
 *
 * // Multi-segment
 * <Progress
 *   segments={[
 *     { value: 30, color: '#66d9ef', label: 'continuity' },
 *     { value: 25, color: '#ae81ff', label: 'click pressure' },
 *   ]}
 * />
 *
 * // Striped and animated
 * <Progress value={60} striped stripedAnimated />
 * ```
 */
export declare function Progress({ value, max, variant, size, gradient, indeterminate, animated, animationDuration, showValue, valuePosition, formatValue, segments, striped, stripedAnimated, label, ariaLabel, className, }: ProgressProps): import("react/jsx-runtime").JSX.Element;
export default Progress;
//# sourceMappingURL=Progress.d.ts.map