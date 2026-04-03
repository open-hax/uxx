import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Card Component
 *
 * Implements the card.edn contract.
 * Versatile card container with optional header, title, and footer sections.
 */
import { forwardRef } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
// Variant styles using tokens
const variantStyles = {
    default: {
        backgroundColor: tokens.colors.background.surface,
        border: `1px solid ${tokens.colors.border.default}`,
        boxShadow: tokens.shadow.sm,
    },
    outlined: {
        backgroundColor: 'transparent',
        border: `1px solid ${tokens.colors.border.default}`,
        boxShadow: tokens.shadow.none,
    },
    elevated: {
        backgroundColor: tokens.colors.background.elevated,
        border: `1px solid ${tokens.colors.border.subtle}`,
        boxShadow: tokens.shadow.md,
    },
};
// Padding styles using tokens
const paddingStyles = {
    none: { padding: 0 },
    sm: { padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px` },
    md: { padding: `${tokens.spacing[4]}px ${tokens.spacing[5]}px` },
    lg: { padding: `${tokens.spacing[6]}px ${tokens.spacing[8]}px` },
};
// Radius styles using tokens
const radiusStyles = {
    none: 0,
    sm: tokens.spacing[1],
    md: tokens.spacing[2],
    lg: tokens.spacing[3],
    full: '9999px',
};
// Base styles
const baseStyles = {
    display: 'flex',
    flexDirection: 'column',
    transition: tokens.transitions.colors,
    fontFamily: tokens.fontFamily.sans,
    overflow: 'hidden',
};
// Header styles
const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
    fontWeight: tokens.fontWeight.semibold,
    fontSize: tokens.fontSize.lg,
};
// Body styles
const bodyStyles = {
    flex: 1,
    minHeight: 0,
};
// Footer styles
const footerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: `${tokens.spacing[2]}px`,
    padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
    borderTop: `1px solid ${tokens.colors.border.default}`,
};
/**
 * Card component for containing content with optional header and footer.
 *
 * @example
 * ```tsx
 * <Card variant="elevated" title="Card Title">
 *   Main content goes here
 * </Card>
 *
 * <Card interactive onClick={() => console.log('clicked')}>
 *   <Badge variant="success">Active</Badge>
 *   Card body
 * </Card>
 * ```
 */
export const Card = forwardRef(({ variant = 'default', interactive = false, padding = 'md', radius = 'md', header, title, extra, children, footer, onClick, style: overrideStyle, }, ref) => {
    const isInteractive = interactive || typeof onClick === 'function';
    const paddingValue = paddingStyles[padding].padding;
    const styles = {
        ...baseStyles,
        ...variantStyles[variant],
        padding: header || footer ? undefined : paddingValue,
        borderRadius: radiusStyles[radius],
        cursor: isInteractive ? 'pointer' : 'default',
    };
    const handleKeyDown = (event) => {
        if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClick?.({
                ...event,
                currentTarget: event.currentTarget,
            });
        }
    };
    const hasHeader = header !== undefined || title !== undefined || extra !== undefined;
    const bodyPadding = hasHeader || footer ? paddingStyles[padding].padding : undefined;
    return (_jsxs("div", { ref: ref, "data-component": "card", "data-variant": variant, "data-interactive": isInteractive || undefined, role: isInteractive ? 'button' : 'region', tabIndex: isInteractive ? 0 : undefined, onClick: isInteractive ? onClick : undefined, onKeyDown: isInteractive ? handleKeyDown : undefined, style: { ...styles, ...overrideStyle }, children: [hasHeader && (_jsxs("div", { style: headerStyles, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }, children: [header, title && !header && _jsx("span", { children: title })] }), extra && _jsx("div", { children: extra })] })), _jsx("div", { style: { ...bodyStyles, padding: bodyPadding }, children: children }), footer !== undefined && (_jsx("div", { style: footerStyles, children: footer }))] }));
});
Card.displayName = 'Card';
export default Card;
//# sourceMappingURL=Card.js.map