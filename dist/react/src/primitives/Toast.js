import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Toast Component
 *
 * Implements the toast.edn contract.
 * Non-blocking notification toasts with auto-dismiss and action support.
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { tokens } from '@open-hax/uxx/tokens';
const ToastContext = createContext(null);
// Type colors
const typeColors = {
    info: {
        bg: tokens.colors.badge.info.bg,
        border: tokens.colors.badge.info.fg,
    },
    success: {
        bg: tokens.colors.badge.success.bg,
        border: tokens.colors.badge.success.fg,
    },
    warning: {
        bg: tokens.colors.badge.warning.bg,
        border: tokens.colors.badge.warning.fg,
    },
    error: {
        bg: tokens.colors.badge.error.bg,
        border: tokens.colors.badge.error.fg,
    },
};
// Type icons
const typeIcons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠',
    error: '✕',
};
// Toast container styles by position
const containerPositionStyles = {
    'top-right': { top: '16px', right: '16px' },
    'top-left': { top: '16px', left: '16px' },
    'bottom-right': { bottom: '16px', right: '16px' },
    'bottom-left': { bottom: '16px', left: '16px' },
    'top-center': { top: '16px', left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: '16px', left: '50%', transform: 'translateX(-50%)' },
};
// Toast container base styles
const containerStyles = {
    position: 'fixed',
    zIndex: tokens.zIndex.toast,
    display: 'flex',
    flexDirection: 'column',
    gap: `${tokens.spacing[2]}px`,
    maxWidth: '400px',
    width: 'calc(100vw - 32px)',
};
// Individual toast styles
const toastStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: `${tokens.spacing[3]}px`,
    padding: `${tokens.spacing[4]}px`,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadow.lg,
    borderLeft: '4px solid',
    fontFamily: tokens.fontFamily.sans,
    animation: 'slideIn 0.2s ease-out',
};
// Dismiss button styles
const dismissButtonStyles = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    fontSize: '16px',
    lineHeight: 1,
    color: tokens.colors.text.muted,
    flexShrink: 0,
};
// Action button styles
const actionButtonStyles = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: tokens.colors.accent.cyan,
    textDecoration: 'underline',
};
/**
 * Individual toast notification.
 */
function ToastItem({ id, type = 'info', title, message, duration = 5000, dismissible = true, action, icon, onDismiss, }) {
    const [paused, setPaused] = useState(false);
    const colors = typeColors[type];
    const displayIcon = icon || typeIcons[type];
    useEffect(() => {
        if (duration === 0 || paused)
            return;
        const timer = setTimeout(() => {
            onDismiss(id);
        }, duration);
        return () => clearTimeout(timer);
    }, [id, duration, paused, onDismiss]);
    return (_jsxs("div", { "data-component": "toast", "data-type": type, role: "alert", "aria-live": "polite", style: {
            ...toastStyles,
            backgroundColor: colors.bg,
            borderLeftColor: colors.border,
        }, onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), children: [_jsx("span", { style: { fontSize: '18px' }, children: displayIcon }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [title && (_jsx("div", { style: {
                            fontWeight: tokens.fontWeight.semibold,
                            marginBottom: tokens.spacing[1],
                            color: tokens.colors.text.default,
                        }, children: title })), _jsx("div", { style: {
                            fontSize: tokens.fontSize.sm,
                            color: tokens.colors.text.default,
                        }, children: message }), action && (_jsx("button", { style: { ...actionButtonStyles, marginTop: `${tokens.spacing[2]}px` }, onClick: () => {
                            action.onClick();
                            onDismiss(id);
                        }, children: action.label }))] }), dismissible && (_jsx("button", { style: dismissButtonStyles, onClick: () => onDismiss(id), "aria-label": "Dismiss", children: "\u00D7" }))] }));
}
/**
 * Toast container that manages multiple toasts.
 */
export function ToastContainer({ position = 'bottom-right', children }) {
    return createPortal(_jsxs("div", { style: {
            ...containerStyles,
            ...containerPositionStyles[position],
        }, children: [children, _jsx("style", { children: `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      ` })] }), document.body);
}
/**
 * Toast provider for managing toast state.
 */
export function ToastProvider({ children, position = 'bottom-right', }) {
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        setToasts(prev => [...prev, { ...toast, id }]);
        return id;
    }, []);
    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);
    const updateToast = useCallback((id, updates) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, []);
    return (_jsxs(ToastContext.Provider, { value: { toasts, addToast, dismissToast, updateToast }, children: [children, toasts.length > 0 && (_jsx(ToastContainer, { position: position, children: toasts.map(toast => (_jsx(ToastItem, { ...toast, onDismiss: dismissToast }, toast.id))) }))] }));
}
/**
 * Hook for toast management.
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
// Re-export ToastItem as Toast for direct use
export const Toast = ToastItem;
export default Toast;
//# sourceMappingURL=Toast.js.map