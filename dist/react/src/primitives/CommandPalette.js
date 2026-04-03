import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * CommandPalette Component
 *
 * Implements the command-palette.edn contract.
 * Quick action search palette with keyboard navigation and fuzzy search.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { tokens } from '@open-hax/uxx/tokens';
// Backdrop styles
const backdropStyles = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: tokens.zIndex.modal,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '15vh',
};
// Palette container styles
const paletteStyles = {
    backgroundColor: tokens.colors.background.elevated,
    borderRadius: `${tokens.spacing[3]}px`,
    boxShadow: tokens.shadow['2xl'],
    border: `1px solid ${tokens.colors.border.subtle}`,
    width: '100%',
    maxWidth: '600px',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: tokens.fontFamily.sans,
    overflow: 'hidden',
};
// Input wrapper styles
const inputWrapperStyles = {
    display: 'flex',
    alignItems: 'center',
    padding: `${tokens.spacing[4]}px`,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
    gap: `${tokens.spacing[2]}px`,
};
// Input styles
const inputStyles = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: tokens.colors.text.default,
    fontSize: tokens.fontSize.lg,
    fontFamily: tokens.fontFamily.sans,
};
// Results container styles
const resultsStyles = {
    flex: 1,
    overflowY: 'auto',
    padding: `${tokens.spacing[2]}px 0`,
};
// Group label styles
const groupLabelStyles = {
    padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};
// Item styles
const itemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: `${tokens.spacing[3]}px`,
    padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
    cursor: 'pointer',
    transition: tokens.transitions.colors,
};
// Item active styles
const itemActiveStyles = {
    backgroundColor: tokens.colors.background.surface,
};
// Shortcut badge styles
const shortcutStyles = {
    marginLeft: 'auto',
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    backgroundColor: tokens.colors.background.surface,
    borderRadius: `${tokens.spacing[1]}px`,
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.text.muted,
    fontFamily: tokens.fontFamily.mono,
};
// Empty state styles
const emptyStateStyles = {
    padding: `${tokens.spacing[8]}px ${tokens.spacing[4]}px`,
    textAlign: 'center',
    color: tokens.colors.text.muted,
};
// Loading styles
const loadingStyles = {
    padding: `${tokens.spacing[4]}px`,
    textAlign: 'center',
};
// Fuzzy match function
const fuzzyMatch = (text, query) => {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    if (textLower.includes(queryLower)) {
        return { matches: true, score: 100 - text.length };
    }
    let score = 0;
    let queryIndex = 0;
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
        if (textLower[i] === queryLower[queryIndex]) {
            score += (i === queryIndex) ? 10 : 1;
            queryIndex++;
        }
    }
    return { matches: queryIndex === query.length, score };
};
/**
 * Command palette for quick actions and search.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <CommandPalette
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onSelect={(item) => { item.action?.(); setOpen(false); }}
 *   items={[
 *     { id: 'new', label: 'New File', shortcut: '⌘N', icon: <FileIcon /> },
 *     { id: 'open', label: 'Open File', shortcut: '⌘O', icon: <FolderIcon /> },
 *   ]}
 * />
 * ```
 */
export function CommandPalette({ open = false, onClose, onSelect, placeholder = 'Type a command or search...', items, groups, recentItems, maxResults = 50, emptyState, loading = false, shortcut = '⌘K', }) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    // Flatten items with groups
    const flatItems = useMemo(() => {
        if (groups) {
            return groups.flatMap(g => g.items);
        }
        return items;
    }, [items, groups]);
    // Filter items by query
    const filteredItems = useMemo(() => {
        if (!query.trim()) {
            // Show recent items first when no query
            if (recentItems && recentItems.length > 0) {
                const recentSet = new Set(recentItems.map(r => r.id));
                const others = flatItems.filter(i => !recentSet.has(i.id));
                return [...recentItems, ...others].slice(0, maxResults);
            }
            return flatItems.slice(0, maxResults);
        }
        const results = flatItems
            .map(item => {
            const labelMatch = fuzzyMatch(item.label, query);
            const descMatch = item.description ? fuzzyMatch(item.description, query) : { matches: false, score: 0 };
            return {
                item,
                score: Math.max(labelMatch.score, descMatch.score),
                matches: labelMatch.matches || descMatch.matches,
            };
        })
            .filter(r => r.matches && !r.item.disabled)
            .sort((a, b) => b.score - a.score)
            .map(r => r.item)
            .slice(0, maxResults);
        return results;
    }, [query, flatItems, recentItems, maxResults]);
    // Reset state when opening
    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);
    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, filteredItems.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredItems[activeIndex]) {
                    onSelect(filteredItems[activeIndex]);
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [filteredItems, activeIndex, onSelect, onClose]);
    // Scroll active item into view
    useEffect(() => {
        if (resultsRef.current) {
            const activeElement = resultsRef.current.querySelector(`[data-index="${activeIndex}"]`);
            activeElement?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);
    if (!open)
        return null;
    const renderItems = (items, startIndex) => items.map((item, idx) => {
        const index = startIndex + idx;
        const isActive = index === activeIndex;
        return (_jsxs("div", { "data-index": index, "data-component": "command-item", "data-active": isActive || undefined, "data-disabled": item.disabled || undefined, style: {
                ...itemStyles,
                ...(isActive ? itemActiveStyles : {}),
                opacity: item.disabled ? 0.5 : 1,
            }, onClick: () => {
                if (!item.disabled) {
                    onSelect(item);
                    onClose();
                }
            }, onMouseEnter: () => setActiveIndex(index), children: [item.icon && _jsx("span", { style: { fontSize: '18px' }, children: item.icon }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { color: tokens.colors.text.default }, children: item.label }), item.description && (_jsx("div", { style: { fontSize: tokens.fontSize.sm, color: tokens.colors.text.muted }, children: item.description }))] }), item.shortcut && _jsx("span", { style: shortcutStyles, children: item.shortcut })] }, item.id));
    });
    return createPortal(_jsx("div", { "data-component": "command-palette", "data-open": open, style: backdropStyles, onClick: (e) => e.target === e.currentTarget && onClose(), children: _jsxs("div", { style: paletteStyles, children: [_jsxs("div", { style: inputWrapperStyles, children: [_jsx("span", { style: { color: tokens.colors.text.muted }, children: "\uD83D\uDD0D" }), _jsx("input", { ref: inputRef, type: "text", placeholder: placeholder, value: query, onChange: (e) => {
                                setQuery(e.target.value);
                                setActiveIndex(0);
                            }, onKeyDown: handleKeyDown, style: inputStyles }), shortcut && (_jsx("span", { style: { ...shortcutStyles, fontSize: tokens.fontSize.sm }, children: shortcut }))] }), _jsx("div", { ref: resultsRef, style: resultsStyles, children: loading ? (_jsx("div", { style: loadingStyles, children: "Loading..." })) : filteredItems.length === 0 ? (emptyState || (_jsxs("div", { style: emptyStateStyles, children: ["No results found for \"", query, "\""] }))) : groups ? (groups.map((group) => {
                        const groupItems = filteredItems.filter(i => group.items.some(gi => gi.id === i.id));
                        if (groupItems.length === 0)
                            return null;
                        return (_jsxs("div", { children: [_jsx("div", { style: groupLabelStyles, children: group.label }), renderItems(groupItems, 0)] }, group.id));
                    })) : (renderItems(filteredItems, 0)) }), recentItems && recentItems.length > 0 && !query && (_jsxs("div", { style: {
                        padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
                        borderTop: `1px solid ${tokens.colors.border.default}`,
                        fontSize: tokens.fontSize.xs,
                        color: tokens.colors.text.muted,
                    }, children: [recentItems.length, " recent \u2022 ", filteredItems.length, " commands"] }))] }) }), document.body);
}
export default CommandPalette;
//# sourceMappingURL=CommandPalette.js.map