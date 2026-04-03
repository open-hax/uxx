import { jsx as _jsx } from "react/jsx-runtime";
// Size values in pixels
const sizeValues = {
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
};
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
export function Spinner({ size = 'md', color = 'currentColor', thickness = 2.5, label = 'Loading', }) {
    const dimension = sizeValues[size];
    return (_jsx("svg", { "data-component": "spinner", "data-size": size, role: "status", "aria-busy": "true", "aria-label": label, width: dimension, height: dimension, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: thickness, strokeLinecap: "round", style: {
            animation: 'devel-ui-spin 1s linear infinite',
        }, children: _jsx("path", { d: "M21 12a9 9 0 11-6.219-8.56" }) }));
}
export default Spinner;
//# sourceMappingURL=Spinner.js.map