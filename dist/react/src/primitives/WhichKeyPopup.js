import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * WhichKeyPopup Component
 *
 * Implements the which-key-popup.edn contract.
 * A popup that displays available keybindings when a prefix key is pressed,
 * following Emacs which-key conventions.
 */
import { useState, useEffect, useMemo } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
/**
 * Sort bindings by the specified key.
 */
function sortBindings(bindings, sortKey) {
    switch (sortKey) {
        case 'key':
            return [...bindings].sort((a, b) => a.key.localeCompare(b.key));
        case 'description':
            return [...bindings].sort((a, b) => a.description.localeCompare(b.description));
        case 'none':
        default:
            return bindings;
    }
}
/**
 * Group bindings by category.
 */
function groupByCategory(bindings, showCategory) {
    const groups = new Map();
    if (!showCategory) {
        groups.set(null, bindings);
        return groups;
    }
    for (const binding of bindings) {
        const category = binding.category || null;
        const existing = groups.get(category) || [];
        existing.push(binding);
        groups.set(category, existing);
    }
    return groups;
}
/**
 * Compute position styles based on position prop.
 */
function computePositionStyle(position) {
    switch (position) {
        case 'top':
            return { top: '30px', bottom: 'auto' };
        case 'bottom':
        case 'auto':
        default:
            return { bottom: '30px', top: 'auto' };
    }
}
/**
 * Render a single binding entry.
 */
function BindingRow({ binding, onSelect, }) {
    const keyStyle = {
        fontFamily: tokens.fontFamily.mono,
        fontSize: tokens.typography.code.fontSize,
        color: binding.destructive ? tokens.colors.accent.red : tokens.colors.accent.cyan,
        background: tokens.colors.background.surface,
        padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
        borderRadius: `${tokens.spacing[0.5]}px`,
        minWidth: '40px',
        textAlign: 'center',
    };
    const descStyle = {
        color: tokens.colors.text.muted,
        fontSize: tokens.typography.bodySm.fontSize,
    };
    return (_jsxs("div", { className: "binding-row", style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${tokens.spacing[1]}px 0`,
            cursor: onSelect ? 'pointer' : undefined,
            gap: `${tokens.spacing[3]}px`,
        }, onClick: () => onSelect?.(binding), children: [_jsx("span", { className: "key", style: keyStyle, children: binding.key }), _jsx("span", { className: "description", style: descStyle, children: binding.description })] }));
}
/**
 * Render a category group with header.
 */
function CategoryGroup({ category, bindings, onSelect, }) {
    return (_jsxs("div", { className: "category-group", style: { marginBottom: `${tokens.spacing[3]}px` }, children: [category && (_jsx("div", { className: "category-header", style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    fontWeight: tokens.fontWeight.medium,
                    color: tokens.colors.text.subtle,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: `${tokens.spacing[1]}px`,
                }, children: category })), _jsx("div", { className: "bindings", children: bindings.map((binding) => (_jsx(BindingRow, { binding: binding, onSelect: onSelect }, binding.key))) })] }));
}
/**
 * Popup component displaying available keybindings.
 *
 * @example
 * ```tsx
 * <WhichKeyPopup
 *   active={showPopup}
 *   prefix={["SPC", "f"]}
 *   bindings={[
 *     { key: "f", description: "Find file", category: "File" },
 *     { key: "s", description: "Save file", category: "File" },
 *     { key: "d", description: "Delete file", category: "File", destructive: true },
 *   ]}
 *   position="bottom"
 * />
 * ```
 */
export function WhichKeyPopup({ active = false, prefix = [], bindings, position = 'bottom', maxColumns = 3, sortKey = 'key', showCategory = true, timeoutMs = 0, onSelect, }) {
    // Auto-dismiss timer
    const [timerId, setTimerId] = useState(null);
    // Handle auto-dismiss timeout
    useEffect(() => {
        if (timerId) {
            clearTimeout(timerId);
            setTimerId(null);
        }
        if (active && timeoutMs > 0 && onSelect) {
            const id = setTimeout(() => onSelect(null), timeoutMs);
            setTimerId(id);
        }
        return () => {
            if (timerId) {
                clearTimeout(timerId);
            }
        };
    }, [active, timeoutMs, onSelect]);
    // Sorted and grouped bindings
    const sorted = useMemo(() => sortBindings(bindings, sortKey), [bindings, sortKey]);
    const grouped = useMemo(() => groupByCategory(sorted, showCategory), [sorted, showCategory]);
    // Position styles
    const positionStyle = computePositionStyle(position);
    // Container styles
    const containerStyle = {
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: tokens.colors.background.elevated,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: `${tokens.spacing[1]}px`,
        padding: `${tokens.spacing[3]}px`,
        boxShadow: tokens.shadow.lg,
        zIndex: tokens.zIndex.tooltip,
        maxWidth: '800px',
        maxHeight: '60vh',
        overflowY: 'auto',
        fontFamily: tokens.fontFamily.sans,
        opacity: active ? 1 : 0,
        visibility: active ? 'visible' : 'hidden',
        transition: `opacity ${tokens.duration.fast} ${tokens.easing.easeInOut}, visibility ${tokens.duration.fast} ${tokens.easing.easeInOut}`,
        ...positionStyle,
    };
    // Title style
    const titleStyle = {
        margin: `0 0 ${tokens.spacing[2]}px 0`,
        fontSize: tokens.typography.body.fontSize,
        fontWeight: tokens.fontWeight.medium,
        color: tokens.colors.text.default,
    };
    // Grid style for columns
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
        gap: `${tokens.spacing[4]}px`,
    };
    return (_jsxs("div", { "data-component": "which-key-popup", "data-active": active || undefined, "data-position": position, style: containerStyle, children: [_jsxs("div", { className: "which-key-title", style: titleStyle, children: ["Prefix: ", prefix.join(' ')] }), _jsx("div", { className: "which-key-bindings", style: gridStyle, children: Array.from(grouped.entries()).map(([category, categoryBindings]) => (_jsx(CategoryGroup, { category: category, bindings: categoryBindings, onSelect: onSelect }, category || 'uncategorized'))) })] }));
}
export default WhichKeyPopup;
//# sourceMappingURL=WhichKeyPopup.js.map