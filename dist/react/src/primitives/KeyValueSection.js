import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * KeyValueSection Component
 *
 * Implements the key-value-section.spec.md contract.
 * Displays key-value pairs in structured layouts with consistent formatting.
 */
import { useMemo, } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
// Gap sizes
const gapSizes = {
    sm: tokens.spacing[2],
    md: tokens.spacing[4],
    lg: tokens.spacing[6],
};
// Title sizes
const titleSizes = {
    sm: {
        fontSize: tokens.fontSize.sm,
        marginBottom: `${tokens.spacing[2]}px`,
    },
    md: {
        fontSize: tokens.fontSize.base,
        marginBottom: `${tokens.spacing[3]}px`,
    },
    lg: {
        fontSize: tokens.fontSize.lg,
        marginBottom: `${tokens.spacing[4]}px`,
    },
};
// Base styles
const containerStyles = {
    width: '100%',
    fontFamily: tokens.fontFamily.sans,
};
const titleStyles = {
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.default,
    margin: 0,
};
const entriesContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
};
const entryStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${tokens.spacing[1]}px`,
};
const entryInlineStyles = {
    display: 'flex',
    alignItems: 'baseline',
};
const entryRowStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: `${tokens.spacing[2]}px`,
};
const labelStyles = {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: tokens.colors.text.muted,
};
const valueStyles = {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.default,
};
const badgeStyles = {
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
    color: tokens.colors.text.muted,
    padding: `${tokens.spacing[0.5]}px ${tokens.spacing[1]}px`,
    backgroundColor: tokens.colors.background.surface,
    borderRadius: `${tokens.spacing[0.5]}px`,
    marginLeft: `${tokens.spacing[2]}px`,
};
const dividerStyles = {
    borderBottom: `1px solid ${tokens.colors.border.default}`,
    marginBottom: `${tokens.spacing[2]}px`,
    paddingBottom: `${tokens.spacing[2]}px`,
};
const emptyStyles = {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.muted,
    fontStyle: 'italic',
};
/**
 * Check if a value is considered empty.
 */
function isEmptyValue(value) {
    if (value === null || value === undefined)
        return true;
    if (typeof value === 'string' && value.trim() === '')
        return true;
    return false;
}
/**
 * KeyValueSection - displays key-value pairs in structured layouts.
 *
 * @example
 * ```tsx
 * <KeyValueSection
 *   title="Actor Information"
 *   entries={[
 *     { label: "ID", value: actor.id },
 *     { label: "Status", value: actor.status },
 *     { label: "Uptime", value: "2d 4h" },
 *   ]}
 * />
 *
 * <KeyValueSection
 *   layout="grid"
 *   columns={2}
 *   entries={[
 *     { label: "CPU", value: "45%", icon: <CpuIcon /> },
 *     { label: "Memory", value: "2.1 GB", icon: <MemoryIcon /> },
 *   ]}
 * />
 * ```
 */
export function KeyValueSection({ entries, layout = 'vertical', columns = 2, dividers = false, labelWidth = 120, gap = 'md', title, titleSize = 'md', emptyMessage, className, }) {
    // Filter entries based on hideIfEmpty
    const visibleEntries = useMemo(() => {
        return entries.filter(entry => {
            if (!entry.hideIfEmpty)
                return true;
            return !isEmptyValue(entry.value);
        });
    }, [entries]);
    // Compute styles based on layout
    const computedContainerStyles = {
        ...containerStyles,
        ...(layout === 'grid' ? { display: 'grid', gap: `${gapSizes[gap]}px` } : {}),
    };
    const computedEntriesStyles = {
        ...entriesContainerStyles,
        gap: `${gapSizes[gap]}px`,
        ...(layout === 'grid' ? {
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
        } : {}),
    };
    const computedTitleStyles = {
        ...titleStyles,
        ...titleSizes[titleSize],
    };
    // Render empty state
    if (visibleEntries.length === 0 && emptyMessage) {
        return (_jsxs("div", { style: containerStyles, className: className, children: [title && _jsx("h3", { style: computedTitleStyles, children: title }), _jsx("p", { style: emptyStyles, children: emptyMessage })] }));
    }
    return (_jsxs("div", { style: computedContainerStyles, className: className, children: [title && _jsx("h3", { style: computedTitleStyles, children: title }), _jsx("div", { style: computedEntriesStyles, children: visibleEntries.map((entry, index) => {
                    const key = entry.key || entry.label || index;
                    const isLast = index === visibleEntries.length - 1;
                    const showDivider = dividers && !isLast && layout === 'vertical';
                    const entryBaseStyles = layout === 'inline'
                        ? entryInlineStyles
                        : entryStyles;
                    return (_jsxs("div", { style: {
                            ...entryBaseStyles,
                            ...(showDivider ? dividerStyles : {}),
                        }, "data-component": "key-value-entry", children: [_jsxs("div", { style: entryRowStyles, children: [entry.icon && _jsx("span", { "aria-hidden": "true", children: entry.icon }), _jsx("label", { style: {
                                            ...labelStyles,
                                            ...(layout === 'inline' ? { minWidth: typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth } : {}),
                                        }, title: entry.tooltip, children: entry.label })] }), _jsxs("div", { style: { ...valueStyles, ...(layout === 'inline' ? { flex: 1 } : {}) }, children: [entry.value, entry.badge && _jsx("span", { style: badgeStyles, children: entry.badge })] })] }, key));
                }) })] }));
}
export default KeyValueSection;
//# sourceMappingURL=KeyValueSection.js.map