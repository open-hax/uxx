/**
 * Spinner Component
 *
 * Implements the spinner.edn contract.
 * Loading indicator with customizable size and color.
 */
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export interface SpinnerProps {
    /** Size of the spinner */
    size?: SpinnerSize;
    /** Color of the spinner (CSS color value) */
    color?: string;
    /** Stroke thickness of the spinner ring */
    thickness?: number;
    /** Accessible label for screen readers */
    label?: string;
}
/**
 * Spinner component for loading states.
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" label="Loading content..." />
 * <Spinner size="sm" color={tokens.colors.accent.cyan} />
 * ```
 */
export declare function Spinner({ size, color, thickness, label, }: SpinnerProps): import("react/jsx-runtime").JSX.Element;
export default Spinner;
//# sourceMappingURL=Spinner.d.ts.map