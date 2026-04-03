import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * CollapsiblePanel Component
 *
 * Implements the collapsible-panel.spec.md contract.
 * Expandable/collapsible content section with animated header.
 */
import { useState, useCallback, } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
// Variant styles
const variantStyles = {
    default: {
        backgroundColor: tokens.colors.background.surface,
        border: 'none',
    },
    outlined: {
        backgroundColor: tokens.colors.background.surface,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: `${tokens.spacing[1.5]}px`,
    },
    elevated: {
        backgroundColor: tokens.colors.background.elevated,
        border: 'none',
        borderRadius: `${tokens.spacing[1.5]}px`,
        boxShadow: tokens.shadow.sm,
    },
};
// Base styles
const containerStyles = {
    width: '100%',
    fontFamily: tokens.fontFamily.sans,
    overflow: 'hidden',
};
const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    width: '100%',
    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
    backgroundColor: 'transparent',
    border: 'none',
    textAlign: 'left',
    transition: tokens.transitions.colors,
    outline: 'none',
};
const headerFocusStyles = {
    backgroundColor: tokens.colors.background.surface,
};
const titleRowStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: `${tokens.spacing[2]}px`,
    flex: 1,
    minWidth: 0,
};
const titleStyles = {
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.default,
    margin: 0,
};
const countStyles = {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: tokens.colors.text.muted,
    marginLeft: `${tokens.spacing[1]}px`,
};
const statsStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: `${tokens.spacing[3]}px`,
    marginRight: `${tokens.spacing[3]}px`,
};
const statItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: `${tokens.spacing[1]}px`,
    fontSize: tokens.fontSize.sm,
};
const statLabelStyles = {
    color: tokens.colors.text.muted,
};
const statValueStyles = {
    fontWeight: tokens.fontWeight.medium,
    color: tokens.colors.text.default,
};
const chevronStyles = {
    fontSize: '12px',
    color: tokens.colors.text.muted,
    transition: 'transform 0.2s ease',
    flexShrink: 0,
};
const contentStyles = {
    overflowY: 'auto',
    overflowX: 'hidden',
};
const contentInnerStyles = {
    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
};
/**
 * CollapsiblePanel - expandable/collapsible content section.
 *
 * @example
 * ```tsx
 * <CollapsiblePanel title="Events" count={events.length}>
 *   <EventList events={events} />
 * </CollapsiblePanel>
 *
 * <CollapsiblePanel
 *   title="Statistics"
 *   stats={[
 *     { label: 'Total', value: 42 },
 *     { label: 'Active', value: 17 },
 *   ]}
 *   variant="outlined"
 * >
 *   <StatsDetail />
 * </CollapsiblePanel>
 * ```
 */
export function CollapsiblePanel({ title, count, defaultCollapsed = false, collapsed: controlledCollapsed, onCollapseChange, children, headerContent, extraHeaderContent, stats, maxHeight = 300, variant = 'default', animate = true, className, headerClassName, contentClassName, }) {
    // State management (controlled vs uncontrolled)
    const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
    const isCollapsed = controlledCollapsed !== undefined
        ? controlledCollapsed
        : uncontrolledCollapsed;
    const handleToggle = useCallback(() => {
        const newCollapsed = !isCollapsed;
        if (controlledCollapsed === undefined) {
            setUncontrolledCollapsed(newCollapsed);
        }
        onCollapseChange?.(newCollapsed);
    }, [isCollapsed, controlledCollapsed, onCollapseChange]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
    }, [handleToggle]);
    // Compute styles
    const computedContainerStyles = {
        ...containerStyles,
        ...variantStyles[variant],
    };
    const computedChevronStyles = {
        ...chevronStyles,
        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
    };
    const computedContentStyles = {
        ...contentStyles,
        maxHeight: isCollapsed ? 0 : maxHeight,
    };
    return (_jsxs("div", { style: computedContainerStyles, className: className, "data-component": "collapsible-panel", "data-variant": variant, "data-collapsed": isCollapsed, children: [_jsx("button", { type: "button", style: headerStyles, className: headerClassName, onClick: handleToggle, onKeyDown: handleKeyDown, "aria-expanded": !isCollapsed, "aria-controls": `${title.toLowerCase().replace(/\s+/g, '-')}-content`, children: headerContent ? (headerContent) : (_jsxs(_Fragment, { children: [_jsxs("div", { style: titleRowStyles, children: [_jsx("strong", { style: titleStyles, children: title }), count !== undefined && (_jsxs("span", { style: countStyles, children: ["(", count, ")"] })), stats && stats.length > 0 && (_jsx("div", { style: statsStyles, children: stats.map((stat, index) => (_jsxs("div", { style: statItemStyles, children: [_jsxs("span", { style: statLabelStyles, children: [stat.label, ":"] }), _jsx("span", { style: { ...statValueStyles, color: stat.color }, children: stat.value })] }, index))) })), extraHeaderContent] }), _jsx("span", { style: computedChevronStyles, "aria-hidden": "true", children: "\u25BC" })] })) }), _jsx("div", { id: `${title.toLowerCase().replace(/\s+/g, '-')}-content`, style: computedContentStyles, className: contentClassName, hidden: isCollapsed, children: _jsx("div", { style: contentInnerStyles, children: children }) })] }));
}
export default CollapsiblePanel;
//# sourceMappingURL=CollapsiblePanel.js.map