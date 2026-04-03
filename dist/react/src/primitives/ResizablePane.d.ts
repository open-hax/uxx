/**
 * ResizablePane Component
 *
 * Implements the resizable-pane.edn contract.
 * A panel that supports bidirectional drag-resize with min/max constraints
 * and optional persistence to localStorage.
 */
import { type ReactNode } from 'react';
export type ResizeDirection = 'left' | 'right';
export interface ResizablePaneProps {
    /** Current width of the pane in pixels */
    width?: number;
    /** Minimum width constraint */
    minWidth?: number;
    /** Maximum width constraint */
    maxWidth?: number;
    /** Which edge has the resize handle (left = handle on right, right = handle on left) */
    direction?: ResizeDirection;
    /** localStorage key for persisting width across sessions */
    persistenceKey?: string;
    /** Callback when width changes */
    onResize?: (newWidth: number) => void;
    /** Whether the pane can be collapsed */
    collapsible?: boolean;
    /** Whether the pane is currently collapsed */
    collapsed?: boolean;
    /** Callback when collapse state changes */
    onCollapse?: (collapsed: boolean) => void;
    /** Width of the resize handle in pixels */
    handleWidth?: number;
    /** Whether to show the resize handle */
    showHandle?: boolean;
    /** Window width below which resizing is disabled */
    narrowLayoutBreakpoint?: number;
    /** Content to render inside the pane */
    children?: ReactNode;
}
/**
 * Resizable pane component with drag-resize support.
 *
 * @example
 * ```tsx
 * <ResizablePane
 *   width={280}
 *   minWidth={180}
 *   maxWidth={500}
 *   direction="left"
 *   persistenceKey="sidebar-width"
 *   onResize={(w) => setWidth(w)}
 * >
 *   <SidebarContent />
 * </ResizablePane>
 * ```
 */
export declare function ResizablePane({ width, minWidth, maxWidth, direction, persistenceKey, onResize, collapsible, collapsed, onCollapse, handleWidth, showHandle, narrowLayoutBreakpoint, children, }: ResizablePaneProps): import("react/jsx-runtime").JSX.Element;
export default ResizablePane;
//# sourceMappingURL=ResizablePane.d.ts.map