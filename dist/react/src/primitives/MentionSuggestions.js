import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
export function MentionSuggestions({ items, onSelect, renderItem, }) {
    if (items.length === 0) {
        return null;
    }
    return (_jsx("div", { "data-component": "mention-suggestions", "data-testid": "mention-suggestions", style: {
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: tokens.colors.background.elevated,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: tokens.spacing[2],
            maxHeight: 200,
            overflow: 'auto',
            zIndex: 1000,
        }, children: items.map((item) => (_jsx("button", { type: "button", "data-testid": "mention-suggestion-item", onClick: () => onSelect?.(item), style: {
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                color: tokens.colors.text.default,
            }, children: renderItem ? (renderItem(item)) : (_jsxs(_Fragment, { children: [item.avatar && (_jsx("img", { src: item.avatar, alt: item.name, style: { width: 24, height: 24, borderRadius: '50%' } })), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 500 }, children: item.name }), item.description && (_jsx("div", { style: { fontSize: 12, color: tokens.colors.text.muted }, children: item.description }))] })] })) }, item.id))) }));
}
export default MentionSuggestions;
//# sourceMappingURL=MentionSuggestions.js.map