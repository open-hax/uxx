import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
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
            background: isActive ? tokens.colors.selection.default : tokens.colors.background.default,
            color: isActive ? tokens.colors.text.default : tokens.colors.text.secondary,
            border: `1px solid ${isActive ? tokens.colors.accent.green : tokens.colors.border.default}`,
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
export function PinnedTabsBar({ pinned, activePinnedKey, onSetActive, onUnpin, onPin, selection, canPin = false, pinLabel = 'Pin', }) {
    return (_jsxs("div", { "data-component": "pinned-tabs-bar", "data-testid": "pinned-tabs-bar", style: {
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
                }, children: pinLabel }))] }));
}
export default PinnedTabsBar;
//# sourceMappingURL=PinnedTabsBar.js.map