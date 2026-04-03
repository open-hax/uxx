import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
// Variant styles
const variantStyles = {
    default: {
        bg: tokens.colors.badge.default.bg,
        fg: tokens.colors.badge.default.fg,
    },
    success: {
        bg: tokens.colors.badge.success.bg,
        fg: tokens.colors.badge.success.fg,
    },
    warning: {
        bg: tokens.colors.badge.warning.bg,
        fg: tokens.colors.badge.warning.fg,
    },
    error: {
        bg: tokens.colors.badge.error.bg,
        fg: tokens.colors.badge.error.fg,
    },
    info: {
        bg: tokens.colors.badge.info.bg,
        fg: tokens.colors.badge.info.fg,
    },
    // Semantic variants
    open: {
        bg: tokens.colors.badge.success.bg,
        fg: tokens.colors.badge.success.fg,
    },
    closed: {
        bg: tokens.colors.badge.default.bg,
        fg: tokens.colors.badge.default.fg,
    },
    merged: {
        bg: 'rgba(174, 129, 255, 0.15)',
        fg: tokens.colors.accent.magenta,
    },
    alive: {
        bg: 'rgba(166, 226, 46, 0.1)',
        fg: '#2e7d32',
    },
    dead: {
        bg: 'rgba(249, 38, 114, 0.1)',
        fg: '#c62828',
    },
    running: {
        bg: 'rgba(102, 217, 239, 0.15)',
        fg: tokens.colors.accent.blue,
    },
    stopped: {
        bg: tokens.colors.badge.default.bg,
        fg: tokens.colors.text.muted,
    },
};
// Size styles
const sizeStyles = {
    xs: {
        padding: '1px 4px',
        fontSize: '10px',
        gap: '2px',
    },
    sm: {
        padding: `${tokens.spacing[0.5]}px ${tokens.spacing[1.5]}px`,
        fontSize: tokens.fontSize.xs,
        gap: `${tokens.spacing[0.5]}px`,
    },
    md: {
        padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
        fontSize: tokens.fontSize.xs,
        gap: `${tokens.spacing[0.5]}px`,
    },
    lg: {
        padding: `${tokens.spacing[1.5]}px ${tokens.spacing[3]}px`,
        fontSize: tokens.fontSize.sm,
        gap: `${tokens.spacing[1]}px`,
    },
};
// Base styles
const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.fontWeight.medium,
    lineHeight: tokens.lineHeight.none,
    borderRadius: `${tokens.spacing[1]}px`,
    fontFamily: tokens.fontFamily.sans,
    whiteSpace: 'nowrap',
};
// Pulse keyframes
const pulseKeyframes = `
@keyframes devel-badge-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}
`;
// Inject keyframes once
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = pulseKeyframes;
    document.head.appendChild(styleSheet);
}
/**
 * Status dot indicator.
 */
function StatusDot({ color, size, pulse, }) {
    const dotSize = size === 'xs' ? 4 : size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
    return (_jsx("span", { style: {
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
            animation: pulse ? 'devel-badge-pulse 2s ease-in-out infinite' : undefined,
        } }));
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
export function Badge({ variant = 'default', size = 'md', dot = false, pulse = false, rounded = false, outline = false, dotColor, children, iconStart, iconEnd, className, }) {
    const { bg, fg } = variantStyles[variant];
    const styles = {
        ...baseStyles,
        ...sizeStyles[size],
        backgroundColor: outline ? 'transparent' : bg,
        color: outline ? bg : fg,
        border: outline ? `1px solid ${bg}` : 'none',
        borderRadius: rounded ? '9999px' : `${tokens.spacing[1]}px`,
    };
    const dotFg = dotColor || (outline ? bg : fg);
    return (_jsxs("span", { "data-component": "badge", "data-variant": variant, "data-size": size, "data-dot": dot || undefined, "data-pulse": pulse || undefined, "data-rounded": rounded || undefined, "data-outline": outline || undefined, role: "status", "aria-label": variant, style: styles, className: className, children: [dot && _jsx(StatusDot, { color: dotFg, size: size, pulse: pulse }), iconStart, children, iconEnd] }));
}
export default Badge;
//# sourceMappingURL=Badge.js.map