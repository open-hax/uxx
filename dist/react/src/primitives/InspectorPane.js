import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
import { ContextSection } from './ContextSection.js';
import { InspectorDetailView } from './InspectorDetailView.js';
import { InspectorEmptyState } from './InspectorEmptyState.js';
import { InspectorErrorState } from './InspectorErrorState.js';
import { InspectorHeader } from './InspectorHeader.js';
import { PinnedTabsBar } from './PinnedTabsBar.js';
import { getEntityKey } from './InspectorPane.types.js';
const MAX_PINNED = 5;
/**
 * Panel for inspecting selected entities.
 */
export function InspectorPane({ selection = null, context = [], pinned = [], activePinnedKey = null, error = null, onPin, onUnpin, onSetActive, onRetry, onContextSelect, renderDetail, renderContextItem, }) {
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
    return (_jsxs("div", { "data-component": "inspector-pane", "data-has-selection": hasSelection || undefined, "data-has-pinned": hasPinned || undefined, style: {
            height: '100%',
            backgroundColor: tokens.colors.background.surface,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }, children: [_jsx(InspectorHeader, { selection: selection, activePinned: Boolean(activePinned), hasPinnedBar: hasPinned || canPin }), (hasPinned || canPin) && (_jsx(PinnedTabsBar, { pinned: pinned, activePinnedKey: activePinnedKey, onSetActive: onSetActive, onUnpin: onUnpin, onPin: onPin, selection: selection, canPin: canPin })), _jsxs("div", { className: "inspector-content", style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.secondary,
                    padding: `${tokens.spacing[3]}px`,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: `${tokens.spacing[3]}px`,
                }, children: [error && _jsx(InspectorErrorState, { error: error, onRetry: onRetry }), displayEntity ? (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: `${tokens.spacing[3]}px` }, children: [_jsx(InspectorDetailView, { entity: displayEntity, renderDetail: renderDetail }), _jsx(ContextSection, { context: displayContext, onContextSelect: onContextSelect, renderContextItem: renderContextItem })] })) : (_jsx(InspectorEmptyState, {}))] })] }));
}
export default InspectorPane;
//# sourceMappingURL=InspectorPane.js.map