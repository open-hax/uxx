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
import { tokens } from '@open-hax/uxx/tokens';
import { ContextSection } from './ContextSection.js';
import { InspectorDetailView } from './InspectorDetailView.js';
import { InspectorEmptyState } from './InspectorEmptyState.js';
import { InspectorErrorState } from './InspectorErrorState.js';
import { InspectorHeader } from './InspectorHeader.js';
import { PinnedTabsBar } from './PinnedTabsBar.js';
import { getEntityKey, type Entity, type PinnedEntry, type ErrorState } from './InspectorPane.types.js';

export type { Entity, PinnedEntry, ErrorState } from './InspectorPane.types.js';

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

const MAX_PINNED = 5;

/**
 * Panel for inspecting selected entities.
 */
export function InspectorPane({
  selection = null,
  context = [],
  pinned = [],
  activePinnedKey = null,
  error = null,
  onPin,
  onUnpin,
  onSetActive,
  onRetry,
  onContextSelect,
  renderDetail,
  renderContextItem,
}: InspectorPaneProps) {
  const hasSelection = selection !== null;
  const hasPinned = pinned.length > 0;

  const activePinned = hasPinned && activePinnedKey
    ? pinned.find((p) => p.key === activePinnedKey)
    : null;

  const displayEntity = activePinned ? activePinned.selection : selection;
  const displayContext = activePinned ? (activePinned.context || []) : context;

  const selectionKey = selection ? getEntityKey(selection) : null;
  const alreadyPinned = selectionKey ? pinned.some((p) => p.key === selectionKey) : false;
  const atMaxPinned = pinned.length >= MAX_PINNED;
  const canPin = hasSelection && !alreadyPinned && !atMaxPinned;

  return (
    <div
      data-component="inspector-pane"
      data-has-selection={hasSelection || undefined}
      data-has-pinned={hasPinned || undefined}
      style={{
        height: '100%',
        backgroundColor: tokens.colors.background.surface,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <InspectorHeader
        selection={selection}
        activePinned={Boolean(activePinned)}
        hasPinnedBar={hasPinned || canPin}
      />

      {(hasPinned || canPin) && (
        <PinnedTabsBar
          pinned={pinned}
          activePinnedKey={activePinnedKey}
          onSetActive={onSetActive}
          onUnpin={onUnpin}
          onPin={onPin}
          selection={selection}
          canPin={canPin}
        />
      )}

      <div
        className="inspector-content"
        style={{
          fontSize: tokens.typography.bodySm.fontSize,
          color: tokens.colors.text.secondary,
          padding: `${tokens.spacing[3]}px`,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: `${tokens.spacing[3]}px`,
        }}
      >
        {error && <InspectorErrorState error={error} onRetry={onRetry} />}

        {displayEntity ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[3]}px` }}>
            <InspectorDetailView entity={displayEntity} renderDetail={renderDetail} />
            <ContextSection
              context={displayContext}
              onContextSelect={onContextSelect}
              renderContextItem={renderContextItem}
            />
          </div>
        ) : (
          <InspectorEmptyState />
        )}
      </div>
    </div>
  );
}

export default InspectorPane;
