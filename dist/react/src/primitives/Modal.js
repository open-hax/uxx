import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Modal Component
 *
 * Implements the modal.edn contract.
 * Modal dialog overlay with backdrop, focus trap, and keyboard dismissal.
 */
import { forwardRef, useEffect, useCallback, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { tokens } from '@open-hax/uxx/tokens';
// Size styles from contract
const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '600px' },
    lg: { maxWidth: '800px' },
    xl: { maxWidth: '1000px' },
    full: {
        maxWidth: 'calc(100vw - 64px)',
        maxHeight: 'calc(100vh - 64px)'
    },
};
// Backdrop styles
const backdropStyles = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: tokens.zIndex.modal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
};
// Modal container styles
const modalStyles = {
    backgroundColor: tokens.colors.background.elevated,
    borderRadius: `${tokens.spacing[3]}px`,
    boxShadow: tokens.shadow['2xl'],
    border: `1px solid ${tokens.colors.border.subtle}`,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxHeight: 'calc(100vh - 64px)',
    fontFamily: tokens.fontFamily.sans,
};
// Header styles
const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing[4]}px ${tokens.spacing[5]}px`,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
    fontWeight: tokens.fontWeight.semibold,
    fontSize: tokens.fontSize.lg,
};
// Body styles
const bodyStyles = {
    flex: 1,
    padding: `${tokens.spacing[4]}px ${tokens.spacing[5]}px`,
    overflowY: 'auto',
};
// Footer styles
const footerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: `${tokens.spacing[2]}px`,
    padding: `${tokens.spacing[3]}px ${tokens.spacing[5]}px`,
    borderTop: `1px solid ${tokens.colors.border.default}`,
};
// Close button styles
const closeButtonStyles = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: `${tokens.spacing[1]}px`,
    fontSize: '20px',
    lineHeight: 1,
    color: tokens.colors.text.muted,
    transition: tokens.transitions.colors,
};
/**
 * Modal dialog overlay with backdrop, focus trap, and keyboard dismissal.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Modal open={open} onClose={() => setOpen(false)} title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 *   <Button onClick={() => setOpen(false)}>Cancel</Button>
 *   <Button variant="primary">Confirm</Button>
 * </Modal>
 * ```
 */
export const Modal = forwardRef(({ open = false, onClose, size = 'md', closable = true, closeOnBackdrop = true, closeOnEscape = true, centered = true, scrollBehavior = 'inside', header, title, children, footer, }, ref) => {
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);
    const titleId = useId();
    const descriptionId = useId();
    // Store the previously focused element and restore on close
    useEffect(() => {
        if (open) {
            previousActiveElement.current = document.activeElement;
            // Focus the modal
            modalRef.current?.focus();
            // Lock body scroll
            document.body.style.overflow = 'hidden';
            return () => {
                // Restore scroll
                document.body.style.overflow = '';
                // Restore focus
                previousActiveElement.current?.focus();
            };
        }
    }, [open]);
    // Handle Escape key
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape' && closable && closeOnEscape) {
            onClose();
        }
    }, [closable, closeOnEscape, onClose]);
    // Handle backdrop click
    const handleBackdropClick = useCallback((event) => {
        if (closeOnBackdrop &&
            closable &&
            event.target === event.currentTarget) {
            onClose();
        }
    }, [closeOnBackdrop, closable, onClose]);
    // Focus trap
    const handleModalKeyDown = useCallback((event) => {
        if (event.key === 'Tab') {
            const focusableElements = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (!focusableElements || focusableElements.length === 0)
                return;
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
            else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }, []);
    if (!open)
        return null;
    const modalContent = (_jsx("div", { "data-component": "modal", "data-size": size, "data-open": open, style: backdropStyles, onClick: handleBackdropClick, onKeyDown: handleKeyDown, children: _jsxs("div", { ref: (node) => {
                // Handle both refs
                modalRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                }
                else if (ref) {
                    ref.current = node;
                }
            }, role: "dialog", "aria-modal": "true", "aria-labelledby": title ? titleId : undefined, tabIndex: -1, style: { ...modalStyles, ...sizeStyles[size] }, onKeyDown: handleModalKeyDown, children: [(header !== undefined || title !== undefined) && (_jsxs("div", { style: headerStyles, children: [_jsxs("div", { id: titleId, style: { display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }, children: [header, title && !header && _jsx("span", { children: title })] }), closable && (_jsx("button", { type: "button", style: closeButtonStyles, onClick: onClose, "aria-label": "Close modal", children: "\u00D7" }))] })), _jsx("div", { id: descriptionId, style: bodyStyles, children: children }), footer !== undefined && (_jsx("div", { style: footerStyles, children: footer }))] }) }));
    // Render in portal
    return createPortal(modalContent, document.body);
});
Modal.displayName = 'Modal';
export default Modal;
//# sourceMappingURL=Modal.js.map