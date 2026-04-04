import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Progress Component
 *
 * Implements the progress-enhancement.spec.md contract.
 * Enhanced progress indicator with gradients, segments, animations, and more.
 */
import { useMemo, } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
// Size styles
const sizeStyles = {
    xs: { height: '2px' },
    sm: { height: '4px' },
    md: { height: '8px' },
    lg: { height: '12px' },
};
// Variant gradients
const variantGradients = {
    default: `linear-gradient(90deg, ${tokens.colors.accent.cyan}CC, ${tokens.colors.accent.cyan})`,
    success: `linear-gradient(90deg, ${tokens.colors.accent.green}CC, ${tokens.colors.accent.green})`,
    warning: `linear-gradient(90deg, ${tokens.colors.accent.orange}CC, ${tokens.colors.accent.orange})`,
    error: `linear-gradient(90deg, ${tokens.colors.accent.red}CC, ${tokens.colors.accent.red})`,
    info: `linear-gradient(90deg, ${tokens.colors.accent.blue}CC, ${tokens.colors.accent.blue})`,
    pressure: 'linear-gradient(90deg, rgba(102,217,239,0.92), rgba(166,226,46,0.86), rgba(174,129,255,0.72))',
};
// Track styles
const trackStyles = {
    backgroundColor: tokens.colors.background.surface,
    borderRadius: tokens.radius.sm,
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
};
// Bar styles
const baseBarStyles = {
    height: '100%',
    borderRadius: tokens.radius.sm,
};
// Value label styles
const valueLabelStyles = {
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.text.muted,
    marginTop: `${tokens.spacing[1]}px`,
    textAlign: 'right',
};
// Label styles
const labelStyles = {
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.text.muted,
    marginBottom: `${tokens.spacing[1]}px`,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};
// Indeterminate keyframes
const indeterminateKeyframes = `
@keyframes devel-progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
`;
// Striped keyframes
const stripedKeyframes = `
@keyframes devel-progress-striped {
  0% { background-position: 1rem 0; }
  100% { background-position: 0 0; }
}
`;
// Inject keyframes once
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = indeterminateKeyframes + stripedKeyframes;
    document.head.appendChild(styleSheet);
}
/**
 * Convert gradient object to CSS gradient string.
 */
function gradientToCss(gradient) {
    if (typeof gradient === 'string')
        return gradient;
    return `linear-gradient(${gradient.angle || 90}deg, ${gradient.from}, ${gradient.to})`;
}
/**
 * Generate striped background pattern.
 */
function getStripedBackground(color) {
    return `repeating-linear-gradient(
    45deg,
    ${color},
    ${color} 10px,
    ${color}CC 10px,
    ${color}CC 20px
  )`;
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
export function Progress({ value = 0, max = 100, variant = 'default', size = 'md', gradient, indeterminate = false, animated = true, animationDuration = 300, showValue = false, valuePosition = 'right', formatValue, segments, striped = false, stripedAnimated = false, label, ariaLabel, className, }) {
    const percentage = useMemo(() => {
        return Math.min(100, Math.max(0, (value / max) * 100));
    }, [value, max]);
    // Compute gradient CSS
    const gradientCss = useMemo(() => {
        if (gradient)
            return gradientToCss(gradient);
        return variantGradients[variant];
    }, [gradient, variant]);
    // Track style
    const trackStyle = {
        ...trackStyles,
        ...sizeStyles[size],
    };
    // Single bar style
    const barStyle = {
        ...baseBarStyles,
        background: striped ? getStripedBackground(tokens.colors.accent.cyan) : gradientCss,
        width: indeterminate ? '50%' : `${percentage}%`,
        transition: animated ? `width ${animationDuration}ms ease-out` : 'none',
        ...(indeterminate ? {
            position: 'absolute',
            top: 0,
            left: 0,
            animation: 'devel-progress-indeterminate 1.5s infinite ease-in-out',
        } : {}),
        ...(stripedAnimated ? {
            animation: 'devel-progress-striped 1s linear infinite',
        } : {}),
    };
    // Render segments if provided
    const renderSegments = () => {
        if (!segments || segments.length === 0)
            return null;
        return segments.map((segment, index) => {
            const segmentPercent = (segment.value / max) * 100;
            const segmentGradient = segment.gradient
                ? gradientToCss(segment.gradient)
                : segment.color || tokens.colors.accent.cyan;
            return (_jsx("div", { style: {
                    ...baseBarStyles,
                    background: segmentGradient,
                    width: `${segmentPercent}%`,
                    transition: animated ? `width ${animationDuration}ms ease-out` : 'none',
                }, title: segment.label }, segment.label || index));
        });
    };
    // Format value display
    const formattedValue = useMemo(() => {
        if (formatValue)
            return formatValue(value, max);
        return `${Math.round(percentage)}%`;
    }, [formatValue, value, max, percentage]);
    // Value inside bar (only for lg size)
    const shouldShowInside = valuePosition === 'inside' && size === 'lg' && !indeterminate;
    const shouldShowRight = valuePosition === 'right' && showValue && !indeterminate;
    return (_jsxs("div", { className: className, children: [label && _jsx("div", { style: labelStyles, children: label }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: `${tokens.spacing[2]}px` }, children: [_jsxs("div", { role: "progressbar", "data-component": "progress", "data-variant": variant, "data-size": size, "data-indeterminate": indeterminate || undefined, "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": indeterminate ? undefined : value, "aria-label": ariaLabel || label, style: trackStyle, children: [segments ? renderSegments() : _jsx("div", { style: barStyle }), shouldShowInside && percentage > 10 && (_jsx("div", { style: {
                                    position: 'absolute',
                                    top: '50%',
                                    right: `${tokens.spacing[2]}px`,
                                    transform: 'translateY(-50%)',
                                    fontSize: tokens.fontSize.xs,
                                    fontWeight: tokens.fontWeight.medium,
                                    color: tokens.colors.background.default,
                                }, children: formattedValue }))] }), shouldShowRight && (_jsx("span", { style: { fontSize: tokens.fontSize.xs, color: tokens.colors.text.muted }, children: formattedValue }))] }), valuePosition === 'tooltip' && showValue && !indeterminate && (_jsx("div", { style: valueLabelStyles, children: formattedValue }))] }));
}
export default Progress;
//# sourceMappingURL=Progress.js.map