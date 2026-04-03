import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Textarea Component
 *
 * Styled multi-line text input matching the Input component's visual style.
 */
import { forwardRef, } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
const sizeStyles = {
    sm: {
        padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
        fontSize: tokens.fontSize.sm,
    },
    md: {
        padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
        fontSize: tokens.fontSize.base,
    },
    lg: {
        padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
        fontSize: tokens.fontSize.lg,
    },
};
const variantStyles = {
    default: {
        backgroundColor: 'transparent',
    },
    filled: {
        backgroundColor: tokens.colors.background.surface,
    },
    unstyled: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: 0,
    },
};
const baseStyles = {
    display: 'block',
    width: '100%',
    borderRadius: `${tokens.spacing[2]}px`,
    border: `1px solid ${tokens.colors.border.default}`,
    color: tokens.colors.text.default,
    fontFamily: tokens.fontFamily.sans,
    lineHeight: tokens.lineHeight.normal,
    resize: 'vertical',
    transition: tokens.transitions.colors,
};
const errorBorderStyles = {
    borderColor: tokens.colors.border.error,
};
const disabledStyles = {
    opacity: 0.5,
    cursor: 'not-allowed',
};
export const Textarea = forwardRef(({ size = 'md', variant = 'default', error = false, errorMessage, className, disabled, style, ...rest }, ref) => {
    const combinedStyles = {
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...(error ? errorBorderStyles : {}),
        ...(disabled ? disabledStyles : {}),
        ...style,
    };
    return (_jsxs("div", { "data-component": "textarea-wrapper", style: { display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[1]}px` }, children: [_jsx("textarea", { ref: ref, "data-component": "textarea", "data-size": size, "data-variant": variant, "data-error": error || undefined, disabled: disabled, style: combinedStyles, className: className, ...rest }), error && errorMessage && (_jsx("span", { style: {
                    fontSize: tokens.fontSize.xs,
                    color: tokens.colors.accent.red,
                }, children: errorMessage }))] }));
});
Textarea.displayName = 'Textarea';
export default Textarea;
//# sourceMappingURL=Textarea.js.map