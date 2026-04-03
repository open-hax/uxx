import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FileTree Component
 *
 * Implements the file-tree.edn contract.
 * Hierarchical file navigation with expand/collapse and selection.
 */
import { useState, useCallback, useMemo } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
// Container styles
const containerStyles = {
    fontFamily: tokens.fontFamily.sans,
    fontSize: tokens.fontSize.sm,
    lineHeight: 1.4,
    color: tokens.colors.text.default,
    userSelect: 'none',
};
// Item styles
const itemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: `${tokens.spacing[1]}px`,
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    cursor: 'pointer',
    borderRadius: `${tokens.spacing[1]}px`,
    transition: tokens.transitions.colors,
};
// Item hover styles
const itemHoverStyles = {
    backgroundColor: tokens.colors.background.surface,
};
// Item selected styles
const itemSelectedStyles = {
    backgroundColor: tokens.colors.background.elevated,
};
// Folder icon styles
const folderIconStyles = {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: tokens.colors.text.muted,
    transition: 'transform 0.15s ease',
};
// File icon styles
const fileIconStyles = {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
};
// Badge styles
const badgeStyles = {
    marginLeft: 'auto',
    padding: '1px 4px',
    backgroundColor: tokens.colors.background.surface,
    borderRadius: '3px',
    fontSize: '10px',
    color: tokens.colors.text.muted,
};
// Size text styles
const sizeStyles = {
    marginLeft: 'auto',
    fontSize: '10px',
    color: tokens.colors.text.muted,
};
// Default file icons by extension
const fileIcons = {
    js: 'JS',
    ts: 'TS',
    tsx: 'TSX',
    jsx: 'JSX',
    json: '{ }',
    md: 'MD',
    css: 'CSS',
    html: 'HTML',
    py: 'PY',
    rs: 'RS',
    go: 'GO',
    java: '☕',
    cljs: 'CLJ',
    edn: 'EDN',
    yaml: 'YML',
    yml: 'YML',
    txt: 'TXT',
    git: 'GIT',
    default: '📄',
};
// Get file icon by name
const getFileIcon = (name) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return fileIcons[ext] || fileIcons.default;
};
// Format file size
const formatSize = (bytes) => {
    if (bytes < 1024)
        return `${bytes}B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};
/**
 * Hierarchical file navigation.
 *
 * @example
 * ```tsx
 * const items = [
 *   { id: 'src', name: 'src', type: 'folder', children: [
 *     { id: 'index.ts', name: 'index.ts', type: 'file' }
 *   ]},
 *   { id: 'package.json', name: 'package.json', type: 'file' }
 * ];
 *
 * <FileTree
 *   items={items}
 *   onSelect={(item) => console.log('Selected:', item)}
 *   onDoubleClick={(item) => console.log('Open:', item)}
 * />
 * ```
 */
export function FileTree({ items, selectedId, expandedIds: controlledExpandedIds, onSelect, onExpand, onCollapse, onDoubleClick, onContextMenu, showIcons = true, showSize = false, indentSize = 16, search, multiSelect = false, }) {
    const [internalExpandedIds, setInternalExpandedIds] = useState(new Set());
    const expandedIds = controlledExpandedIds ? new Set(controlledExpandedIds) : internalExpandedIds;
    const toggleExpand = useCallback((item) => {
        if (item.type !== 'folder')
            return;
        const isExpanded = expandedIds.has(item.id);
        if (isExpanded) {
            if (!controlledExpandedIds) {
                setInternalExpandedIds(prev => {
                    const next = new Set(prev);
                    next.delete(item.id);
                    return next;
                });
            }
            onCollapse?.(item);
        }
        else {
            if (!controlledExpandedIds) {
                setInternalExpandedIds(prev => new Set(prev).add(item.id));
            }
            onExpand?.(item);
        }
    }, [expandedIds, controlledExpandedIds, onExpand, onCollapse]);
    // Filter items by search
    const filterItems = useCallback((items, query) => {
        if (!query)
            return items;
        const lowerQuery = query.toLowerCase();
        return items.reduce((acc, item) => {
            const nameMatches = item.name.toLowerCase().includes(lowerQuery);
            if (item.type === 'folder' && item.children) {
                const filteredChildren = filterItems(item.children, query);
                if (filteredChildren.length > 0 || nameMatches) {
                    acc.push({ ...item, children: filteredChildren });
                }
            }
            else if (nameMatches) {
                acc.push(item);
            }
            return acc;
        }, []);
    }, []);
    const filteredItems = useMemo(() => search ? filterItems(items, search) : items, [items, search, filterItems]);
    // Highlight search match
    const highlightMatch = (text, query) => {
        if (!query)
            return text;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        if (index === -1)
            return text;
        return (_jsxs(_Fragment, { children: [text.slice(0, index), _jsx("span", { style: { backgroundColor: 'rgba(166, 226, 46, 0.3)' }, children: text.slice(index, index + query.length) }), text.slice(index + query.length)] }));
    };
    // Render item recursively
    const renderItem = (item, depth) => {
        const isFolder = item.type === 'folder';
        const isExpanded = expandedIds.has(item.id);
        const isSelected = selectedId === item.id;
        return (_jsxs("div", { children: [_jsxs("div", { "data-component": "file-tree-item", "data-type": item.type, "data-selected": isSelected || undefined, "data-expanded": isExpanded || undefined, style: {
                        ...itemStyles,
                        paddingLeft: `${tokens.spacing[2] + depth * indentSize}px`,
                        ...(isSelected ? itemSelectedStyles : {}),
                    }, onClick: () => {
                        onSelect?.(item);
                        if (isFolder)
                            toggleExpand(item);
                    }, onDoubleClick: () => onDoubleClick?.(item), onContextMenu: (e) => {
                        e.preventDefault();
                        onContextMenu?.(item, e);
                    }, onMouseEnter: (e) => {
                        if (!isSelected) {
                            e.currentTarget.style.backgroundColor = tokens.colors.background.surface;
                        }
                    }, onMouseLeave: (e) => {
                        if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }, children: [isFolder && (_jsx("span", { style: {
                                ...folderIconStyles,
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            }, children: "\u25B6" })), showIcons && (_jsx("span", { style: fileIconStyles, children: item.icon || (isFolder ? '📁' : getFileIcon(item.name)) })), _jsx("span", { style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: search ? highlightMatch(item.name, search) : item.name }), item.badge && _jsx("span", { style: badgeStyles, children: item.badge }), showSize && item.size !== undefined && (_jsx("span", { style: sizeStyles, children: formatSize(item.size) }))] }), isFolder && isExpanded && item.children && (_jsx("div", { children: item.children.map(child => renderItem(child, depth + 1)) }))] }, item.id));
    };
    return (_jsx("div", { "data-component": "file-tree", style: containerStyles, children: filteredItems.map(item => renderItem(item, 0)) }));
}
export default FileTree;
//# sourceMappingURL=FileTree.js.map