import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
const MAX_PINNED = 5;
/**
 * Get a stable key for an entity.
 */
function getEntityKey(entity) {
    return entity.key || entity.id || String(entity);
}
/**
 * Render empty state when no selection.
 */
function EmptyState() {
    return (_jsx("div", { "data-testid": "inspector-empty", style: {
            padding: `${tokens.spacing[4]}px`,
            textAlign: 'center',
            color: tokens.colors.text.muted,
            fontSize: tokens.typography.bodySm.fontSize,
        }, children: "Select an item to inspect details and context." }));
}
/**
 * Render error state with retry button.
 */
function ErrorState({ error, onRetry }) {
    const retryable = error.retryable ?? true;
    return (_jsxs("div", { "data-testid": "inspector-pane-error", style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: `${tokens.spacing[2]}px`,
            padding: `${tokens.spacing[2]}px`,
            border: `1px solid ${tokens.colors.accent.red}`,
            borderRadius: `${tokens.spacing[1]}px`,
            background: tokens.colors.alpha.red._12,
            color: tokens.colors.text.default,
        }, children: [_jsx("div", { "data-testid": "inspector-pane-error-message", style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    flex: 1,
                }, children: error.message }), retryable && onRetry && (_jsx("button", { type: "button", "data-testid": "inspector-pane-error-retry", onClick: onRetry, style: {
                    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
                    border: `1px solid ${tokens.colors.border.default}`,
                    borderRadius: `${tokens.spacing[0.5]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    background: tokens.colors.background.default,
                    color: tokens.colors.text.default,
                    cursor: 'pointer',
                }, children: "Retry" }))] }));
}
/**
 * Render entity detail view.
 */
function DetailView({ entity, renderDetail }) {
    if (renderDetail) {
        return _jsx(_Fragment, { children: renderDetail(entity) });
    }
    return (_jsxs("div", { "data-testid": "inspector-detail", style: {
            padding: `${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[1]}px`,
            background: tokens.colors.background.elevated,
        }, children: [_jsx("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                    marginBottom: `${tokens.spacing[1]}px`,
                }, children: "Detail" }), _jsx("div", { style: {
                    fontSize: tokens.typography.body.fontSize,
                    fontWeight: tokens.fontWeight.medium,
                    color: tokens.colors.text.default,
                    marginBottom: `${tokens.spacing[2]}px`,
                }, children: entity.title || '' }), entity.type && (_jsx("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.secondary,
                    textTransform: 'capitalize',
                    marginBottom: `${tokens.spacing[2]}px`,
                }, children: entity.type })), entity.text && entity.text !== '' && (_jsx("div", { style: {
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
                }, children: entity.text })), entity.time && (_jsxs("div", { style: {
                    marginTop: `${tokens.spacing[2]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                }, children: ["Observed ", entity.time] }))] }));
}
/**
 * Render a single context item.
 */
function ContextItem({ entity, onSelect, renderItem, }) {
    if (renderItem) {
        return (_jsx("div", { style: { cursor: onSelect ? 'pointer' : undefined }, onClick: () => onSelect?.(entity), children: renderItem(entity) }));
    }
    return (_jsx("div", { "data-testid": "inspector-context-item", onClick: () => onSelect?.(entity), style: {
            marginTop: `${tokens.spacing[2]}px`,
            padding: `${tokens.spacing[2]}px`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            background: tokens.colors.background.default,
            color: tokens.colors.text.secondary,
            fontSize: tokens.typography.bodySm.fontSize,
            cursor: onSelect ? 'pointer' : undefined,
        }, children: entity.title || 'Untitled' }));
}
/**
 * Render context section showing related entities.
 */
function ContextSection({ context, onContextSelect, renderContextItem, }) {
    return (_jsxs("div", { "data-testid": "inspector-context", style: {
            padding: `${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[1]}px`,
            background: tokens.colors.background.elevated,
        }, children: [_jsx("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                    marginBottom: `${tokens.spacing[1]}px`,
                }, children: "Context" }), context.length > 0 ? (_jsx("div", { className: "context-list", children: context.map((entity) => (_jsx(ContextItem, { entity: entity, onSelect: onContextSelect, renderItem: renderContextItem }, entity.key || entity.id))) })) : (_jsx("div", { style: {
                    marginTop: `${tokens.spacing[2]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                }, children: "No related context" }))] }));
}
/**
 * Render a single pinned entity tab.
 */
function PinnedTab({ entry, isActive, onSetActive, onUnpin, }) {
    return (_jsxs("div", { "data-testid": "pinned-tab", "data-key": entry.key, tabIndex: 0, onClick: () => onSetActive?.(entry.key), onKeyDown: (e) => {
            if (e.key === 'Delete' && isActive && onUnpin) {
                onUnpin(entry.key);
            }
        }, style: {
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
        }, children: [_jsx("span", { style: {
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }, children: entry.selection.title || 'Untitled' }), _jsx("button", { type: "button", "data-testid": "pinned-tab-unpin", onClick: (e) => {
                    e.stopPropagation();
                    onUnpin?.(entry.key);
                }, style: {
                    padding: '2px 4px',
                    marginLeft: `${tokens.spacing[1]}px`,
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '10px',
                    background: 'transparent',
                    color: tokens.colors.text.muted,
                    cursor: 'pointer',
                }, children: "\u00D7" })] }));
}
/**
 * Render the pinned tabs bar above the content.
 */
function PinnedTabsBar({ pinned, activePinnedKey, onSetActive, onUnpin, onPin, selection, canPin, }) {
    return (_jsxs("div", { "data-testid": "pinned-tabs-bar", style: {
            display: 'flex',
            alignItems: 'center',
            gap: `${tokens.spacing[1]}px`,
            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
            borderBottom: `1px solid ${tokens.colors.border.default}`,
            flexWrap: 'wrap',
        }, children: [pinned.length > 0 && (_jsx("div", { className: "pinned-tabs", style: {
                    display: 'flex',
                    gap: `${tokens.spacing[1]}px`,
                    flexWrap: 'wrap',
                }, children: pinned.map((entry) => (_jsx(PinnedTab, { entry: entry, isActive: entry.key === activePinnedKey, onSetActive: onSetActive, onUnpin: onUnpin }, entry.key))) })), canPin && onPin && selection && (_jsx("button", { type: "button", "data-testid": "pin-button", onClick: () => onPin(selection), style: {
                    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
                    border: `1px solid ${tokens.colors.border.default}`,
                    borderRadius: `${tokens.spacing[0.5]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    background: 'transparent',
                    color: tokens.colors.text.muted,
                    cursor: 'pointer',
                    marginLeft: 'auto',
                }, children: "Pin" }))] }));
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
export function InspectorPane({ selection = null, context = [], pinned = [], activePinnedKey = null, error = null, onPin, onUnpin, onSetActive, onRetry, onContextSelect, renderDetail, renderContextItem, }) {
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
    return (_jsxs("div", { "data-component": "inspector-pane", "data-has-selection": hasSelection || undefined, "data-has-pinned": hasPinned || undefined, style: {
            height: '100%',
            backgroundColor: tokens.colors.background.surface,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }, children: [_jsxs("div", { "data-testid": "inspector-header", style: {
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    padding: `${tokens.spacing[3]}px`,
                    background: tokens.colors.background.surface,
                    borderBottom: hasPinned || canPin
                        ? undefined
                        : `1px solid ${tokens.colors.border.default}`,
                }, children: [_jsx("h3", { className: "inspector-title", style: {
                            margin: 0,
                            fontSize: tokens.typography.bodySm.fontSize,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: tokens.colors.text.muted,
                        }, children: "Inspector" }), hasSelection && !activePinned && (_jsx("div", { "data-testid": "inspector-selection-title", style: {
                            marginTop: `${tokens.spacing[2]}px`,
                            fontSize: tokens.typography.body.fontSize,
                            fontWeight: tokens.fontWeight.medium,
                            color: tokens.colors.text.default,
                        }, children: selection.title })), hasSelection && selection.type && !activePinned && (_jsx("div", { style: {
                            marginTop: `${tokens.spacing[1]}px`,
                            fontSize: tokens.typography.bodySm.fontSize,
                            color: tokens.colors.text.secondary,
                            textTransform: 'capitalize',
                        }, children: selection.type }))] }), (hasPinned || canPin) && (_jsx(PinnedTabsBar, { pinned: pinned, activePinnedKey: activePinnedKey, onSetActive: onSetActive, onUnpin: onUnpin, onPin: onPin, selection: selection, canPin: canPin })), _jsxs("div", { className: "inspector-content", style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.secondary,
                    padding: `${tokens.spacing[3]}px`,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: `${tokens.spacing[3]}px`,
                }, children: [error && _jsx(ErrorState, { error: error, onRetry: onRetry }), displayEntity ? (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[3]}px` }, children: [_jsx(DetailView, { entity: displayEntity, renderDetail: renderDetail }), _jsx(ContextSection, { context: displayContext, onContextSelect: onContextSelect, renderContextItem: renderContextItem })] })) : (_jsx(EmptyState, {}))] })] }));
}
export default InspectorPane;
//# sourceMappingURL=InspectorPane.js.map