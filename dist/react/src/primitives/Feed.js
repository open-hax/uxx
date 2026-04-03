import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useCallback } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
// Relative time formatter
function formatRelativeTime(date) {
    const now = new Date();
    const then = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60)
        return 'just now';
    if (diffMin < 60)
        return `${diffMin}m ago`;
    if (diffHour < 24)
        return `${diffHour}h ago`;
    if (diffDay < 7)
        return `${diffDay}d ago`;
    return then.toLocaleDateString();
}
// Group items by date
function groupByDate(items, groupBy) {
    const groups = new Map();
    items.forEach((item) => {
        const date = new Date(item.timestamp);
        let key;
        switch (groupBy) {
            case 'hour':
                key = `${date.toLocaleDateString()} ${date.getHours()}:00`;
                break;
            case 'session':
                key = `Session ${Math.floor(date.getTime() / (4 * 60 * 60 * 1000))}`;
                break;
            case 'agent':
                key = item.author?.name || 'System';
                break;
            case 'date':
            default:
                key = date.toLocaleDateString();
        }
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(item);
    });
    return groups;
}
// Get icon for item type
function getTypeIcon(type) {
    switch (type) {
        case 'message': return '💬';
        case 'file': return '📄';
        case 'commit': return '🔖';
        case 'agent': return '🤖';
        case 'system': return '⚙️';
        case 'user': return '👤';
        case 'notification': return '🔔';
        default: return '•';
    }
}
// Get file status icon
function getFileStatusIcon(status) {
    switch (status) {
        case 'added': return '+';
        case 'modified': return '~';
        case 'deleted': return '-';
        case 'renamed': return '→';
        default: return '';
    }
}
// Get file status color
function getFileStatusColor(status) {
    switch (status) {
        case 'added': return tokens.monokai.accent.cyan;
        case 'modified': return tokens.monokai.accent.orange;
        case 'deleted': return tokens.monokai.accent.red;
        default: return tokens.colors.text.muted;
    }
}
export const Feed = ({ items, variant = 'timeline', groupBy = 'date', showTimestamp = true, relativeTime = true, infiniteScroll = false, onLoadMore, onItemClick, onItemAction, emptyState, loading = false, markRead, className, }) => {
    const [expandedItems, setExpandedItems] = useState(new Set());
    const groupedItems = useMemo(() => groupBy !== 'none' ? groupByDate(items, groupBy) : new Map([['All', items]]), [items, groupBy]);
    const handleItemClick = useCallback((item) => {
        onItemClick?.(item);
        if (!item.read && markRead) {
            markRead([item.id]);
        }
    }, [onItemClick, markRead]);
    const handleItemAction = useCallback((e, action, item) => {
        e.stopPropagation();
        onItemAction?.(action, item);
    }, [onItemAction]);
    const toggleExpand = useCallback((itemId) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            }
            else {
                next.add(itemId);
            }
            return next;
        });
    }, []);
    const renderItem = (item, index) => {
        const isExpanded = expandedItems.has(item.id);
        const isTimeline = variant === 'timeline';
        const isCompact = variant === 'compact';
        return (_jsxs("div", { "data-item-id": item.id, "data-item-type": item.type, "data-read": item.read, onClick: () => handleItemClick(item), style: {
                display: 'flex',
                gap: isCompact ? 8 : 12,
                padding: isCompact ? '8px 12px' : '12px 16px',
                background: variant === 'cards' ? tokens.colors.background.surface : 'transparent',
                borderRadius: variant === 'cards' ? tokens.spacing[2] : 0,
                border: variant === 'cards' ? `1px solid ${tokens.colors.border.default}` : 'none',
                marginBottom: variant === 'cards' ? 8 : 0,
                cursor: onItemClick ? 'pointer' : 'default',
                opacity: item.read ? 0.7 : 1,
                position: 'relative',
            }, children: [!item.read && (_jsx("div", { style: {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: tokens.monokai.accent.cyan,
                        borderRadius: '0 2px 2px 0',
                    } })), isTimeline && (_jsxs("div", { style: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: 24,
                    }, children: [_jsx("div", { style: {
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: tokens.colors.background.surface,
                                border: `2px solid ${tokens.colors.border.default}`,
                            } }), index < items.length - 1 && (_jsx("div", { style: {
                                width: 2,
                                flex: 1,
                                background: tokens.colors.border.default,
                                marginTop: 4,
                            } }))] })), !isTimeline && (_jsx("div", { style: {
                        width: isCompact ? 24 : 32,
                        height: isCompact ? 24 : 32,
                        borderRadius: '50%',
                        background: item.author?.avatar
                            ? undefined
                            : tokens.colors.background.surface,
                        border: `1px solid ${tokens.colors.border.default}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isCompact ? 12 : 14,
                        flexShrink: 0,
                        overflow: 'hidden',
                    }, children: item.author?.avatar ? (_jsx("img", { src: item.author.avatar, alt: item.author.name, style: { width: '100%', height: '100%', objectFit: 'cover' } })) : (item.icon || getTypeIcon(item.type)) })), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 4,
                            }, children: [item.author && (_jsx("span", { style: {
                                        fontWeight: 500,
                                        color: tokens.colors.text.default,
                                    }, children: item.author.name })), item.badge && (_jsx("span", { style: {
                                        fontSize: 10,
                                        padding: '2px 6px',
                                        background: tokens.colors.background.elevated,
                                        borderRadius: 4,
                                        color: tokens.colors.text.muted,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }, children: item.badge })), showTimestamp && (_jsx("span", { style: {
                                        fontSize: 12,
                                        color: tokens.colors.text.subtle,
                                        marginLeft: 'auto',
                                    }, children: relativeTime
                                        ? formatRelativeTime(item.timestamp)
                                        : new Date(item.timestamp).toLocaleString() }))] }), item.title && (_jsx("div", { style: {
                                fontWeight: 500,
                                marginBottom: 4,
                                color: tokens.colors.text.default,
                            }, children: item.title })), _jsx("div", { style: {
                                fontSize: isCompact ? 12 : 14,
                                color: tokens.colors.text.muted,
                                lineHeight: 1.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
                            }, onClick: (e) => {
                                if (!isExpanded && item.content.length > 100) {
                                    e.stopPropagation();
                                    toggleExpand(item.id);
                                }
                            }, children: item.content }), item.file && (_jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginTop: 8,
                                padding: '4px 8px',
                                background: tokens.colors.background.elevated,
                                borderRadius: 4,
                                fontSize: 12,
                                fontFamily: 'JetBrains Mono, monospace',
                            }, children: [_jsx("span", { style: {
                                        color: getFileStatusColor(item.file.status),
                                        fontWeight: 600,
                                    }, children: getFileStatusIcon(item.file.status) }), _jsx("span", { style: { color: tokens.colors.text.default }, children: item.file.name }), _jsx("span", { style: { color: tokens.colors.text.subtle }, children: item.file.path })] })), item.diff && (_jsxs("div", { style: {
                                display: 'flex',
                                gap: 12,
                                marginTop: 8,
                                fontSize: 12,
                            }, children: [_jsxs("span", { style: { color: tokens.monokai.accent.cyan }, children: ["+", item.diff.additions] }), _jsxs("span", { style: { color: tokens.monokai.accent.red }, children: ["-", item.diff.deletions] })] })), item.actions && item.actions.length > 0 && (_jsx("div", { style: {
                                display: 'flex',
                                gap: 8,
                                marginTop: 8,
                            }, children: item.actions.map((action) => (_jsx("button", { onClick: (e) => handleItemAction(e, action, item), style: {
                                    background: 'none',
                                    border: `1px solid ${tokens.colors.border.default}`,
                                    borderRadius: 4,
                                    padding: '4px 8px',
                                    fontSize: 12,
                                    color: tokens.colors.text.muted,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }, children: action }, action))) }))] })] }, item.id));
    };
    if (items.length === 0) {
        return (_jsx("div", { className: className, "data-component": "feed", "data-empty": true, style: {
                padding: 32,
                textAlign: 'center',
                color: tokens.colors.text.muted,
            }, children: emptyState || 'No activity yet' }));
    }
    return (_jsxs("div", { className: className, "data-component": "feed", "data-variant": variant, role: "feed", "aria-label": "Activity feed", style: {
            overflow: 'auto',
            maxHeight: infiniteScroll ? '80vh' : undefined,
        }, children: [Array.from(groupedItems.entries()).map(([groupName, groupItems]) => (_jsxs("div", { children: [groupBy !== 'none' && (_jsxs("div", { style: {
                            padding: '8px 16px',
                            fontSize: 12,
                            fontWeight: 500,
                            color: tokens.colors.text.subtle,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            background: tokens.colors.background.default,
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            borderBottom: `1px solid ${tokens.colors.border.default}`,
                        }, children: [groupName, " (", groupItems.length, ")"] })), groupItems.map(renderItem)] }, groupName))), loading && (_jsx("div", { style: {
                    padding: 16,
                    textAlign: 'center',
                    color: tokens.colors.text.muted,
                }, children: "Loading..." })), infiniteScroll && onLoadMore && !loading && (_jsx("button", { onClick: onLoadMore, style: {
                    width: '100%',
                    padding: 12,
                    background: 'transparent',
                    border: 'none',
                    borderTop: `1px solid ${tokens.colors.border.default}`,
                    color: tokens.colors.text.muted,
                    cursor: 'pointer',
                }, children: "Load more" }))] }));
};
export default Feed;
//# sourceMappingURL=Feed.js.map