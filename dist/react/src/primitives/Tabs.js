import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Tabs Component
 *
 * Implements the tabs.edn contract.
 * Tabbed content organization with keyboard navigation.
 */
import { useState, useCallback } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
// Size styles
const sizeStyles = {
    sm: {
        padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
        fontSize: tokens.fontSize.sm,
    },
    md: {
        padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
        fontSize: tokens.fontSize.base,
    },
    lg: {
        padding: `${tokens.spacing[3]}px ${tokens.spacing[5]}px`,
        fontSize: tokens.fontSize.lg,
    },
};
// Tab list styles by variant and orientation
const getTabListStyles = (variant, orientation) => {
    const base = {
        display: 'flex',
        gap: `${tokens.spacing[1]}px`,
        fontFamily: tokens.fontFamily.sans,
    };
    const orientationStyles = orientation === 'vertical'
        ? { flexDirection: 'column' }
        : { flexDirection: 'row' };
    const underlineStyles = variant === 'underline'
        ? { borderBottom: `1px solid ${tokens.colors.border.default}`, marginBottom: '-1px' }
        : {};
    return { ...base, ...orientationStyles, ...underlineStyles };
};
// Tab styles by variant
const getTabStyles = (variant, size, isActive, disabled) => {
    const base = {
        display: 'flex',
        alignItems: 'center',
        gap: `${tokens.spacing[2]}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: tokens.transitions.colors,
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        border: 'none',
        background: 'transparent',
        fontFamily: tokens.fontFamily.sans,
        ...sizeStyles[size],
    };
    if (variant === 'pills') {
        return {
            ...base,
            borderRadius: tokens.radius.full,
            backgroundColor: isActive ? tokens.colors.accent.cyan : 'transparent',
            color: isActive ? tokens.colors.background.default : tokens.colors.text.muted,
        };
    }
    if (variant === 'underline') {
        return {
            ...base,
            borderBottom: isActive ? `2px solid ${tokens.colors.accent.cyan}` : '2px solid transparent',
            marginBottom: '-1px',
            color: isActive ? tokens.colors.text.default : tokens.colors.text.muted,
        };
    }
    if (variant === 'enclosed') {
        return {
            ...base,
            borderRadius: `${tokens.radius.sm} ${tokens.radius.sm} 0 0`,
            backgroundColor: isActive ? tokens.colors.background.elevated : 'transparent',
            border: `1px solid ${tokens.colors.border.default}`,
            borderBottom: isActive ? 'none' : `1px solid ${tokens.colors.border.default}`,
            marginBottom: '-1px',
            color: isActive ? tokens.colors.text.default : tokens.colors.text.muted,
        };
    }
    // default variant
    return {
        ...base,
        borderRadius: tokens.radius.sm,
        backgroundColor: isActive ? tokens.colors.background.elevated : 'transparent',
        color: isActive ? tokens.colors.text.default : tokens.colors.text.muted,
    };
};
// Panel styles
const panelStyles = {
    flex: 1,
    overflow: 'auto',
};
// Close button styles
const closeButtonStyles = {
    marginLeft: `${tokens.spacing[2]}px`,
    padding: '2px 4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
    color: tokens.colors.text.muted,
    borderRadius: '3px',
};
// Add button styles
const addButtonStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${tokens.spacing[1]}px ${tokens.spacing[3]}px`,
    background: 'none',
    border: `1px dashed ${tokens.colors.border.default}`,
    borderRadius: tokens.radius.sm,
    cursor: 'pointer',
    color: tokens.colors.text.muted,
    fontFamily: tokens.fontFamily.sans,
    fontSize: tokens.fontSize.sm,
    transition: tokens.transitions.colors,
};
/**
 * Tabbed content organization.
 *
 * @example
 * ```tsx
 * const tabs = [
 *   { id: 'tab1', label: 'Overview', content: <div>Overview content</div> },
 *   { id: 'tab2', label: 'Settings', content: <div>Settings content</div> },
 * ];
 *
 * <Tabs items={tabs} />
 * ```
 */
export function Tabs({ value: controlledValue, defaultValue, onChange, items, variant = 'default', size = 'md', orientation = 'horizontal', lazy = true, keepMounted = false, showClose = false, onClose, addable = false, onAdd, }) {
    const [internalValue, setInternalValue] = useState(defaultValue || items[0]?.id || '');
    const activeValue = controlledValue ?? internalValue;
    const handleTabClick = useCallback((id, disabled) => {
        if (disabled)
            return;
        if (!controlledValue) {
            setInternalValue(id);
        }
        onChange?.(id);
    }, [controlledValue, onChange]);
    const handleKeyDown = useCallback((e) => {
        const enabledItems = items.filter(item => !item.disabled);
        const enabledIndex = enabledItems.findIndex(item => item.id === activeValue);
        let nextIndex = enabledIndex;
        if (orientation === 'horizontal') {
            if (e.key === 'ArrowRight') {
                nextIndex = (enabledIndex + 1) % enabledItems.length;
            }
            else if (e.key === 'ArrowLeft') {
                nextIndex = (enabledIndex - 1 + enabledItems.length) % enabledItems.length;
            }
        }
        else {
            if (e.key === 'ArrowDown') {
                nextIndex = (enabledIndex + 1) % enabledItems.length;
            }
            else if (e.key === 'ArrowUp') {
                nextIndex = (enabledIndex - 1 + enabledItems.length) % enabledItems.length;
            }
        }
        if (nextIndex !== enabledIndex) {
            e.preventDefault();
            handleTabClick(enabledItems[nextIndex].id, false);
            e.currentTarget.parentElement?.querySelector(`[data-tab-id="${enabledItems[nextIndex].id}"]`)?.focus();
        }
    }, [items, activeValue, orientation, handleTabClick]);
    const renderTab = (item) => {
        const isActive = item.id === activeValue;
        const isDisabled = item.disabled || false;
        const isClosable = item.closable !== false && showClose;
        return (_jsxs("button", { "data-tab-id": item.id, role: "tab", "aria-selected": isActive, "aria-controls": `panel-${item.id}`, "aria-disabled": isDisabled, tabIndex: isActive ? 0 : -1, "data-component": "tab", "data-active": isActive || undefined, "data-disabled": isDisabled || undefined, style: getTabStyles(variant, size, isActive, isDisabled), onClick: () => handleTabClick(item.id, isDisabled), onKeyDown: handleKeyDown, children: [item.icon && _jsx("span", { children: item.icon }), _jsx("span", { children: item.label }), item.badge && (_jsx("span", { style: {
                        padding: '1px 6px',
                        backgroundColor: tokens.colors.background.surface,
                        borderRadius: tokens.radius.full,
                        fontSize: tokens.fontSize.xs,
                    }, children: item.badge })), isClosable && (_jsx("span", { role: "button", "aria-label": "Close tab", style: closeButtonStyles, onClick: (e) => {
                        e.stopPropagation();
                        onClose?.(item.id);
                    }, onMouseEnter: (e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(249, 38, 114, 0.2)';
                    }, onMouseLeave: (e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }, children: "\u00D7" }))] }, item.id));
    };
    return (_jsxs("div", { "data-component": "tabs", "data-variant": variant, "data-orientation": orientation, style: {
            display: 'flex',
            flexDirection: orientation === 'vertical' ? 'row' : 'column',
            flex: 1,
            minHeight: 0,
        }, children: [_jsxs("div", { role: "tablist", "aria-orientation": orientation, style: getTabListStyles(variant, orientation), children: [items.map(renderTab), addable && (_jsx("button", { style: addButtonStyles, onClick: onAdd, onMouseEnter: (e) => {
                            e.currentTarget.style.borderColor = tokens.colors.accent.cyan;
                            e.currentTarget.style.color = tokens.colors.text.default;
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.borderColor = tokens.colors.border.default;
                            e.currentTarget.style.color = tokens.colors.text.muted;
                        }, children: "+ Add" }))] }), _jsx("div", { style: panelStyles, children: items.map((item) => {
                    const isActive = item.id === activeValue;
                    if (lazy && !isActive && !keepMounted) {
                        return null;
                    }
                    return (_jsx("div", { id: `panel-${item.id}`, role: "tabpanel", "aria-labelledby": item.id, hidden: !isActive, style: { display: isActive ? 'block' : 'none' }, children: item.content }, item.id));
                }) })] }));
}
export default Tabs;
//# sourceMappingURL=Tabs.js.map