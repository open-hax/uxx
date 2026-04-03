/**
 * InspectorPane Component
 *
 * Implements the inspector-pane.edn contract.
 * Story 3.1: Core implementation with selection, detail view, error state, and empty state.
 * Story 3.2: Context panel showing related entities.
 * Story 3.3: Pin & Compare functionality.
 *
 * A panel for inspecting selected entities with context, detail view, and comparison support.
 */
import { type ReactNode } from 'react';
export interface Entity {
    /** Unique identifier */
    id: string;
    /** Optional key for pinning/comparison */
    key?: string;
    /** Display title */
    title: string;
    /** Entity type */
    type?: string;
    /** Text content */
    text?: string;
    /** Time display string */
    time?: string;
    /** Timestamp for sorting */
    timestamp?: number;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
export interface PinnedEntry {
    /** Unique key for this pinned entry */
    key: string;
    /** The pinned entity */
    selection: Entity;
    /** Related context entities */
    context?: Entity[];
}
export interface ErrorState {
    /** Error message to display */
    message: string;
    /** Whether retry is available */
    retryable?: boolean;
}
export interface InspectorPaneProps {
    /** Currently selected entity */
    selection?: Entity | null;
    /** Related context entities */
    context?: Entity[];
    /** Pinned entities for comparison */
    pinned?: PinnedEntry[];
    /** Key of currently active pinned entity */
    activePinnedKey?: string | null;
    /** Error state if loading failed */
    error?: ErrorState | null;
    /** Callback to pin the current selection */
    onPin?: (entity: Entity) => void;
    /** Callback to unpin an entity by key */
    onUnpin?: (key: string) => void;
    /** Callback to set the active pinned entity */
    onSetActive?: (key: string) => void;
    /** Callback to retry after error */
    onRetry?: () => void;
    /** Callback when a context item is selected */
    onContextSelect?: (entity: Entity) => void;
    /** Custom renderer for entity detail view */
    renderDetail?: (entity: Entity) => ReactNode;
    /** Custom renderer for context items */
    renderContextItem?: (entity: Entity) => ReactNode;
}
/**
 * Panel for inspecting selected entities.
 *
 * Story 3.1: Core implementation.
 * Story 3.2: Context panel.
 * Story 3.3: Pin & Compare.
 *
 * @example
 * ```tsx
 * <InspectorPane
 *   selection={{ id: '1', title: 'Session 123', type: 'info' }}
 *   context={[{ id: '2', title: 'Related' }]}
 *   pinned={[{ key: '1', selection: { id: '1', title: 'Session 123' }, context: [] }]}
 *   activePinnedKey="1"
 *   onPin={(e) => setPinned([...pinned, { key: e.key, selection: e, context: [] }])}
 *   onUnpin={(k) => setPinned(pinned.filter(p => p.key !== k))}
 *   onSetActive={(k) => setActiveKey(k)}
 * />
 * ```
 */
export declare function InspectorPane({ selection, context, pinned, activePinnedKey, error, onPin, onUnpin, onSetActive, onRetry, onContextSelect, renderDetail, renderContextItem, }: InspectorPaneProps): import("react/jsx-runtime").JSX.Element;
export default InspectorPane;
//# sourceMappingURL=InspectorPane.d.ts.map