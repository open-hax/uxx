import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Input Component
 *
 * Implements the input.edn contract.
 * Text input field with validation states, icons, and sizing.
 */
import { forwardRef, useState } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
// Size styles
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
// Variant styles
const variantStyles = {
    default: {
        backgroundColor: tokens.colors.background.default,
        border: `1px solid ${tokens.colors.border.default}`,
    },
    filled: {
        backgroundColor: tokens.colors.background.surface,
        border: '1px solid transparent',
    },
    unstyled: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: 0,
    },
};
// Base input styles
const baseStyles = {
    width: '100%',
    fontFamily: tokens.fontFamily.sans,
    color: tokens.colors.text.default,
    borderRadius: `${tokens.spacing[1]}px`,
    outline: 'none',
    transition: tokens.transitions.colors,
};
// Error styles
const errorStyles = {
    borderColor: tokens.colors.border.error,
};
// Disabled styles
const disabledStyles = {
    backgroundColor: tokens.colors.background.surface,
    color: tokens.colors.text.muted,
    cursor: 'not-allowed',
    opacity: 0.7,
};
// Focus styles
const focusStyles = {
    borderColor: tokens.colors.border.focus,
    boxShadow: `0 0 0 2px ${tokens.colors.border.focus}33`,
};
// Icon wrapper styles
const iconWrapperStyles = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colors.text.muted,
    pointerEvents: 'none',
};
// Error message styles
const errorMessageStyles = {
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.border.error,
    marginTop: `${tokens.spacing[1]}px`,
};
/**
 * Text input field with validation states, icons, and sizing.
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter your name" />
 *
 * <Input
 *   type="email"
 *   placeholder="Email"
 *   leftIcon={<EmailIcon />}
 *   error
 *   errorMessage="Invalid email format"
 * />
 * ```
 */
export const Input = forwardRef(({ type = 'text', value, defaultValue, placeholder, size = 'md', variant = 'default', disabled = false, readonly = false, required = false, error = false, errorMessage, leftIcon, rightIcon, onChange, onFocus, onBlur, name, id, autoFocus, autoComplete, maxLength, minLength, pattern, }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const handleFocus = (e) => {
        setIsFocused(true);
        onFocus?.(e);
    };
    const handleBlur = (e) => {
        setIsFocused(false);
        onBlur?.(e);
    };
    const inputStyles = {
        ...baseStyles,
        ...variantStyles[variant],
        ...(variant !== 'unstyled' ? sizeStyles[size] : {}),
        ...(error ? errorStyles : {}),
        ...(disabled ? disabledStyles : {}),
        ...(isFocused && !disabled && variant !== 'unstyled' ? focusStyles : {}),
        paddingLeft: leftIcon && variant !== 'unstyled' ? '32px' : undefined,
        paddingRight: rightIcon && variant !== 'unstyled' ? '32px' : undefined,
    };
    const wrapperStyles = {
        position: 'relative',
        width: '100%',
    };
    return (_jsxs("div", { style: wrapperStyles, children: [leftIcon && variant !== 'unstyled' && (_jsx("div", { style: { ...iconWrapperStyles, left: `${tokens.spacing[2]}px` }, children: leftIcon })), _jsx("input", { ref: ref, "data-component": "input", "data-size": size, "data-variant": variant, "data-error": error || undefined, "data-disabled": disabled || undefined, type: type, value: value, defaultValue: defaultValue, placeholder: placeholder, disabled: disabled, readOnly: readonly, required: required, name: name, id: id, autoFocus: autoFocus, autoComplete: autoComplete, maxLength: maxLength, minLength: minLength, pattern: pattern, style: inputStyles, onChange: onChange, onFocus: handleFocus, onBlur: handleBlur, "aria-invalid": error, "aria-describedby": error && errorMessage ? `${id}-error` : undefined }), rightIcon && variant !== 'unstyled' && (_jsx("div", { style: { ...iconWrapperStyles, right: `${tokens.spacing[2]}px` }, children: rightIcon })), error && errorMessage && (_jsx("div", { id: `${id}-error`, style: errorMessageStyles, role: "alert", children: errorMessage }))] }));
});
Input.displayName = 'Input';
export default Input;
//# sourceMappingURL=Input.js.map