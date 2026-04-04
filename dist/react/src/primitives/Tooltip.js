import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Tooltip Component
 *
 * Implements the tooltip.edn contract.
 * Tooltip overlay that appears on hover or focus, with configurable positioning.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { tokens } from '@open-hax/uxx/tokens';
// Tooltip container styles
const tooltipStyles = {
    position: 'fixed',
    backgroundColor: tokens.colors.background.surface,
    color: tokens.colors.text.default,
    fontSize: tokens.fontSize.xs,
    lineHeight: 1.4,
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    borderRadius: `${tokens.spacing[1]}px`,
    boxShadow: tokens.shadow.md,
    zIndex: tokens.zIndex.tooltip,
    pointerEvents: 'none',
    maxWidth: '250px',
    wordWrap: 'break-word',
};
// Arrow styles
const arrowStyles = {
    position: 'absolute',
    width: 0,
    height: 0,
    border: '4px solid transparent',
};
// Calculate position based on placement
const calculatePosition = (placement, triggerRect, tooltipRect, offset) => {
    let top = 0;
    let left = 0;
    const arrowStyle = { ...arrowStyles };
    switch (placement) {
        case 'top':
            top = triggerRect.top - tooltipRect.height - offset;
            left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
            arrowStyle.top = '100%';
            arrowStyle.left = '50%';
            arrowStyle.marginLeft = '-4px';
            arrowStyle.borderTopColor = tokens.colors.background.surface;
            break;
        case 'bottom':
            top = triggerRect.bottom + offset;
            left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
            arrowStyle.bottom = '100%';
            arrowStyle.left = '50%';
            arrowStyle.marginLeft = '-4px';
            arrowStyle.borderBottomColor = tokens.colors.background.surface;
            break;
        case 'left':
            top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
            left = triggerRect.left - tooltipRect.width - offset;
            arrowStyle.left = '100%';
            arrowStyle.top = '50%';
            arrowStyle.marginTop = '-4px';
            arrowStyle.borderLeftColor = tokens.colors.background.surface;
            break;
        case 'right':
            top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
            left = triggerRect.right + offset;
            arrowStyle.right = '100%';
            arrowStyle.top = '50%';
            arrowStyle.marginTop = '-4px';
            arrowStyle.borderRightColor = tokens.colors.background.surface;
            break;
        case 'top-start':
            top = triggerRect.top - tooltipRect.height - offset;
            left = triggerRect.left;
            arrowStyle.top = '100%';
            arrowStyle.left = '8px';
            arrowStyle.borderTopColor = tokens.colors.background.surface;
            break;
        case 'top-end':
            top = triggerRect.top - tooltipRect.height - offset;
            left = triggerRect.right - tooltipRect.width;
            arrowStyle.top = '100%';
            arrowStyle.right = '8px';
            arrowStyle.borderTopColor = tokens.colors.background.surface;
            break;
        case 'bottom-start':
            top = triggerRect.bottom + offset;
            left = triggerRect.left;
            arrowStyle.bottom = '100%';
            arrowStyle.left = '8px';
            arrowStyle.borderBottomColor = tokens.colors.background.surface;
            break;
        case 'bottom-end':
            top = triggerRect.bottom + offset;
            left = triggerRect.right - tooltipRect.width;
            arrowStyle.bottom = '100%';
            arrowStyle.right = '8px';
            arrowStyle.borderBottomColor = tokens.colors.background.surface;
            break;
    }
    return { top, left, arrowStyle };
};
/**
 * Tooltip overlay that appears on hover or focus.
 *
 * @example
 * ```tsx
 * <Tooltip content="This is a tooltip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * <Tooltip content="Helpful info" placement="right">
 *   <span>?</span>
 * </Tooltip>
 * ```
 */
export function Tooltip({ content, placement = 'top', trigger = 'hover', delay = 200, hideDelay = 0, disabled = false, offset = 8, arrow = true, interactive = false, children, }) {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, arrowStyle: {} });
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const showTimeoutRef = useRef();
    const hideTimeoutRef = useRef();
    const showTooltip = useCallback(() => {
        if (disabled)
            return;
        clearTimeout(hideTimeoutRef.current);
        showTimeoutRef.current = setTimeout(() => {
            setVisible(true);
        }, delay);
    }, [disabled, delay]);
    const hideTooltip = useCallback(() => {
        clearTimeout(showTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
            setVisible(false);
        }, hideDelay);
    }, [hideDelay]);
    // Update position when tooltip becomes visible
    useEffect(() => {
        if (visible && triggerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const newPos = calculatePosition(placement, triggerRect, tooltipRect, offset);
            setPosition(newPos);
        }
    }, [visible, placement, offset]);
    // Cleanup timeouts
    useEffect(() => {
        return () => {
            clearTimeout(showTimeoutRef.current);
            clearTimeout(hideTimeoutRef.current);
        };
    }, []);
    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && visible) {
                hideTooltip();
            }
        };
        if (visible) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [visible, hideTooltip]);
    if (disabled) {
        return _jsx(_Fragment, { children: children });
    }
    const triggerProps = {};
    if (trigger === 'hover' || trigger === 'hover-focus') {
        triggerProps.onMouseEnter = showTooltip;
        triggerProps.onMouseLeave = hideTooltip;
    }
    if (trigger === 'focus' || trigger === 'hover-focus') {
        triggerProps.onFocus = showTooltip;
        triggerProps.onBlur = hideTooltip;
    }
    if (trigger === 'click') {
        triggerProps.onClick = () => setVisible(v => !v);
    }
    const tooltipContent = visible && (_jsxs("div", { ref: tooltipRef, role: "tooltip", "data-component": "tooltip", "data-placement": placement, "data-visible": visible, style: {
            ...tooltipStyles,
            top: position.top,
            left: position.left,
            pointerEvents: interactive ? 'auto' : 'none',
        }, onMouseEnter: interactive ? showTooltip : undefined, onMouseLeave: interactive ? hideTooltip : undefined, children: [content, arrow && _jsx("div", { style: position.arrowStyle })] }));
    return (_jsxs(_Fragment, { children: [_jsx("div", { ref: triggerRef, style: { display: 'inline-block' }, ...triggerProps, children: children }), tooltipContent && createPortal(tooltipContent, document.body)] }));
}
export default Tooltip;
//# sourceMappingURL=Tooltip.js.map