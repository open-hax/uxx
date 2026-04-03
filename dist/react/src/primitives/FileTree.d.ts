/**
 * FileTree Component
 *
 * Implements the file-tree.edn contract.
 * Hierarchical file navigation with expand/collapse and selection.
 */
import { type ReactNode, type MouseEvent } from 'react';
export type FileTreeItemType = 'file' | 'folder';
export interface FileTreeItem {
    id: string;
    name: string;
    type: FileTreeItemType;
    icon?: ReactNode;
    children?: FileTreeItem[];
    meta?: Record<string, unknown>;
    badge?: string;
    modified?: Date;
    size?: number;
}
export interface FileTreeProps {
    /** Tree items to render */
    items: FileTreeItem[];
    /** ID of currently selected item */
    selectedId?: string;
    /** IDs of expanded folders */
    expandedIds?: string[];
    /** Callback when item is selected */
    onSelect?: (item: FileTreeItem) => void;
    /** Callback when folder is expanded */
    onExpand?: (item: FileTreeItem) => void;
    /** Callback when folder is collapsed */
    onCollapse?: (item: FileTreeItem) => void;
    /** Callback when item is double-clicked */
    onDoubleClick?: (item: FileTreeItem) => void;
    /** Callback for context menu */
    onContextMenu?: (item: FileTreeItem, event: MouseEvent) => void;
    /** Whether to show file/folder icons */
    showIcons?: boolean;
    /** Whether to show file sizes */
    showSize?: boolean;
    /** Indentation in pixels per level */
    indentSize?: number;
    /** Search query to filter/highlight items */
    search?: string;
    /** Whether multiple items can be selected */
    multiSelect?: boolean;
}
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
export declare function FileTree({ items, selectedId, expandedIds: controlledExpandedIds, onSelect, onExpand, onCollapse, onDoubleClick, onContextMenu, showIcons, showSize, indentSize, search, multiSelect, }: FileTreeProps): import("react/jsx-runtime").JSX.Element;
export default FileTree;
//# sourceMappingURL=FileTree.d.ts.map