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

import { type ReactNode, type CSSProperties } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
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

const MAX_PINNED = 5;

/**
 * Get a stable key for an entity.
 */
function getEntityKey(entity: Entity): string {
  return entity.key || entity.id || String(entity);
}

/**
 * Render empty state when no selection.
 */
function EmptyState() {
  return (
    <div
      data-testid="inspector-empty"
      style={{
        padding: `${tokens.spacing[4]}px`,
        textAlign: 'center',
        color: tokens.colors.text.muted,
        fontSize: tokens.typography.bodySm.fontSize,
      }}
    >
      Select an item to inspect details and context.
    </div>
  );
}

/**
 * Render error state with retry button.
 */
function ErrorState({ error, onRetry }: { error: ErrorState; onRetry?: () => void }) {
  const retryable = error.retryable ?? true;

  return (
    <div
      data-testid="inspector-pane-error"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: `${tokens.spacing[2]}px`,
        padding: `${tokens.spacing[2]}px`,
        border: `1px solid ${tokens.colors.accent.red}`,
        borderRadius: `${tokens.spacing[1]}px`,
        background: tokens.colors.alpha.red._12,
        color: tokens.colors.text.default,
      }}
    >
      <div
        data-testid="inspector-pane-error-message"
        style={{
          fontSize: tokens.typography.bodySm.fontSize,
          flex: 1,
        }}
      >
        {error.message}
      </div>
      {retryable && onRetry && (
        <button
          type="button"
          data-testid="inspector-pane-error-retry"
          onClick={onRetry}
          style={{
            padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            background: tokens.colors.background.default,
            color: tokens.colors.text.default,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Render entity detail view.
 */
function DetailView({ entity, renderDetail }: { entity: Entity; renderDetail?: (entity: Entity) => ReactNode }) {
  if (renderDetail) {
    return <>{renderDetail(entity)}</>;
  }

  return (
    <div
      data-testid="inspector-detail"
      style={{
        padding: `${tokens.spacing[3]}px`,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: `${tokens.spacing[1]}px`,
        background: tokens.colors.background.elevated,
      }}
    >
      <div
        style={{
          fontSize: tokens.typography.bodySm.fontSize,
          color: tokens.colors.text.muted,
          marginBottom: `${tokens.spacing[1]}px`,
        }}
      >
        Detail
      </div>
      <div
        style={{
          fontSize: tokens.typography.body.fontSize,
          fontWeight: tokens.fontWeight.medium,
          color: tokens.colors.text.default,
          marginBottom: `${tokens.spacing[2]}px`,
        }}
      >
        {entity.title || ''}
      </div>
      {entity.type && (
        <div
          style={{
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.secondary,
            textTransform: 'capitalize',
            marginBottom: `${tokens.spacing[2]}px`,
          }}
        >
          {entity.type}
        </div>
      )}
      {entity.text && entity.text !== '' && (
        <div
          style={{
            color: tokens.colors.text.secondary,
            whiteSpace: 'pre-wrap',
            fontFamily: tokens.fontFamily.mono,
            fontSize: tokens.typography.bodySm.fontSize,
            maxHeight: '300px',
            overflowY: 'auto',
            padding: `${tokens.spacing[2]}px`,
            background: tokens.colors.background.default,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
          }}
        >
          {entity.text}
        </div>
      )}
      {entity.time && (
        <div
          style={{
            marginTop: `${tokens.spacing[2]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.muted,
          }}
        >
          Observed {entity.time}
        </div>
      )}
    </div>
  );
}

/**
 * Render a single context item.
 */
function ContextItem({
  entity,
  onSelect,
  renderItem,
}: {
  entity: Entity;
  onSelect?: (entity: Entity) => void;
  renderItem?: (entity: Entity) => ReactNode;
}) {
  if (renderItem) {
    return (
      <div
        style={{ cursor: onSelect ? 'pointer' : undefined }}
        onClick={() => onSelect?.(entity)}
      >
        {renderItem(entity)}
      </div>
    );
  }

  return (
    <div
      data-testid="inspector-context-item"
      onClick={() => onSelect?.(entity)}
      style={{
        marginTop: `${tokens.spacing[2]}px`,
        padding: `${tokens.spacing[2]}px`,
        borderRadius: `${tokens.spacing[0.5]}px`,
        background: tokens.colors.background.default,
        color: tokens.colors.text.secondary,
        fontSize: tokens.typography.bodySm.fontSize,
        cursor: onSelect ? 'pointer' : undefined,
      }}
    >
      {entity.title || 'Untitled'}
    </div>
  );
}

/**
 * Render context section showing related entities.
 */
function ContextSection({
  context,
  onContextSelect,
  renderContextItem,
}: {
  context: Entity[];
  onContextSelect?: (entity: Entity) => void;
  renderContextItem?: (entity: Entity) => ReactNode;
}) {
  return (
    <div
      data-testid="inspector-context"
      style={{
        padding: `${tokens.spacing[3]}px`,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: `${tokens.spacing[1]}px`,
        background: tokens.colors.background.elevated,
      }}
    >
      <div
        style={{
          fontSize: tokens.typography.bodySm.fontSize,
          color: tokens.colors.text.muted,
          marginBottom: `${tokens.spacing[1]}px`,
        }}
      >
        Context
      </div>
      {context.length > 0 ? (
        <div className="context-list">
          {context.map((entity) => (
            <ContextItem
              key={entity.key || entity.id}
              entity={entity}
              onSelect={onContextSelect}
              renderItem={renderContextItem}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            marginTop: `${tokens.spacing[2]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.muted,
          }}
        >
          No related context
        </div>
      )}
    </div>
  );
}

/**
 * Render a single pinned entity tab.
 */
function PinnedTab({
  entry,
  isActive,
  onSetActive,
  onUnpin,
}: {
  entry: PinnedEntry;
  isActive: boolean;
  onSetActive?: (key: string) => void;
  onUnpin?: (key: string) => void;
}) {
  return (
    <div
      data-testid="pinned-tab"
      data-key={entry.key}
      tabIndex={0}
      onClick={() => onSetActive?.(entry.key)}
      onKeyDown={(e) => {
        if (e.key === 'Delete' && isActive && onUnpin) {
          onUnpin(entry.key);
        }
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${tokens.spacing[1]}px`,
        padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
        borderRadius: `${tokens.spacing[0.5]}px`,
        fontSize: tokens.typography.bodySm.fontSize,
        cursor: 'pointer',
        background: isActive
          ? tokens.colors.selection.default
          : tokens.colors.background.default,
        color: isActive
          ? tokens.colors.text.default
          : tokens.colors.text.secondary,
        border: `1px solid ${isActive
          ? tokens.colors.accent.green
          : tokens.colors.border.default}`,
      }}
    >
      <span
        style={{
          maxWidth: '100px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.selection.title || 'Untitled'}
      </span>
      <button
        type="button"
        data-testid="pinned-tab-unpin"
        onClick={(e) => {
          e.stopPropagation();
          onUnpin?.(entry.key);
        }}
        style={{
          padding: '2px 4px',
          marginLeft: `${tokens.spacing[1]}px`,
          border: 'none',
          borderRadius: '2px',
          fontSize: '10px',
          background: 'transparent',
          color: tokens.colors.text.muted,
          cursor: 'pointer',
        }}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Render the pinned tabs bar above the content.
 */
function PinnedTabsBar({
  pinned,
  activePinnedKey,
  onSetActive,
  onUnpin,
  onPin,
  selection,
  canPin,
}: {
  pinned: PinnedEntry[];
  activePinnedKey?: string | null;
  onSetActive?: (key: string) => void;
  onUnpin?: (key: string) => void;
  onPin?: (entity: Entity) => void;
  selection?: Entity | null;
  canPin: boolean;
}) {
  return (
    <div
      data-testid="pinned-tabs-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${tokens.spacing[1]}px`,
        padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
        borderBottom: `1px solid ${tokens.colors.border.default}`,
        flexWrap: 'wrap',
      }}
    >
      {pinned.length > 0 && (
        <div
          className="pinned-tabs"
          style={{
            display: 'flex',
            gap: `${tokens.spacing[1]}px`,
            flexWrap: 'wrap',
          }}
        >
          {pinned.map((entry) => (
            <PinnedTab
              key={entry.key}
              entry={entry}
              isActive={entry.key === activePinnedKey}
              onSetActive={onSetActive}
              onUnpin={onUnpin}
            />
          ))}
        </div>
      )}
      {canPin && onPin && selection && (
        <button
          type="button"
          data-testid="pin-button"
          onClick={() => onPin(selection)}
          style={{
            padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            background: 'transparent',
            color: tokens.colors.text.muted,
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          Pin
        </button>
      )}
    </div>
  );
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

  // Determine what to display: active pinned or current selection
  const activePinned = hasPinned && activePinnedKey
    ? pinned.find((p) => p.key === activePinnedKey)
    : null;

  const displayEntity = activePinned
    ? activePinned.selection
    : selection;

  const displayContext = activePinned
    ? (activePinned.context || [])
    : context;

  // Check if we can pin the current selection
  const selectionKey = selection ? getEntityKey(selection) : null;
  const alreadyPinned = selectionKey
    ? pinned.some((p) => p.key === selectionKey)
    : false;
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
      {/* Header */}
      <div
        data-testid="inspector-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          padding: `${tokens.spacing[3]}px`,
          background: tokens.colors.background.surface,
          borderBottom: hasPinned || canPin
            ? undefined
            : `1px solid ${tokens.colors.border.default}`,
        }}
      >
        <h3
          className="inspector-title"
          style={{
            margin: 0,
            fontSize: tokens.typography.bodySm.fontSize,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: tokens.colors.text.muted,
          }}
        >
          Inspector
        </h3>
        {hasSelection && !activePinned && (
          <div
            data-testid="inspector-selection-title"
            style={{
              marginTop: `${tokens.spacing[2]}px`,
              fontSize: tokens.typography.body.fontSize,
              fontWeight: tokens.fontWeight.medium,
              color: tokens.colors.text.default,
            }}
          >
            {selection.title}
          </div>
        )}
        {hasSelection && selection.type && !activePinned && (
          <div
            style={{
              marginTop: `${tokens.spacing[1]}px`,
              fontSize: tokens.typography.bodySm.fontSize,
              color: tokens.colors.text.secondary,
              textTransform: 'capitalize',
            }}
          >
            {selection.type}
          </div>
        )}
      </div>

      {/* Pinned tabs bar (if any pinned or can pin) */}
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

      {/* Content */}
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
        {/* Error state */}
        {error && <ErrorState error={error} onRetry={onRetry} />}

        {/* Detail or empty state */}
        {displayEntity ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[3]}px` }}>
            <DetailView entity={displayEntity} renderDetail={renderDetail} />
            <ContextSection
              context={displayContext}
              onContextSelect={onContextSelect}
              renderContextItem={renderContextItem}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

export default InspectorPane;
