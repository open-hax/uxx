import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
export function MentionSuggestions({ items, onSelect, renderItem, selectedIndex = 0, onSelectedIndexChange, onKeyDown, }) {
    if (items.length === 0) {
        return null;
    }
    const activeIndex = Math.min(Math.max(selectedIndex, 0), items.length - 1);
    const activeDescendant = `mention-item-${items[activeIndex]?.id}`;
    const dropdownMaxHeight = tokens.spacing[24] * 2 + tokens.spacing[2];
    return (_jsx("div", { "data-component": "mention-suggestions", "data-testid": "mention-suggestions", role: "listbox", tabIndex: -1, "aria-label": "Mention suggestions", "aria-activedescendant": activeDescendant, onKeyDown: onKeyDown, style: {
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: tokens.colors.background.elevated,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[2]}px`,
            maxHeight: `${dropdownMaxHeight}px`,
            overflow: 'auto',
            zIndex: 1000,
        }, children: items.map((item, index) => {
            const isSelected = index === activeIndex;
            return (_jsx("button", { id: `mention-item-${item.id}`, type: "button", "data-testid": "mention-suggestion-item", role: "option", "aria-selected": isSelected, tabIndex: isSelected ? 0 : -1, onClick: () => onSelect?.(item), onMouseEnter: () => onSelectedIndexChange?.(index), onFocus: () => onSelectedIndexChange?.(index), style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 12px',
                    background: isSelected ? tokens.colors.selection.default : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: tokens.colors.text.default,
                    outline: isSelected ? `1px solid ${tokens.colors.accent.cyan}` : 'none',
                    outlineOffset: '-1px',
                }, children: renderItem ? (renderItem(item)) : (_jsxs(_Fragment, { children: [item.avatar && (_jsx("img", { src: item.avatar, alt: item.name, style: { width: 24, height: 24, borderRadius: '50%' } })), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 500 }, children: item.name }), item.description && (_jsx("div", { style: { fontSize: 12, color: tokens.colors.text.muted }, children: item.description }))] })] })) }, item.id));
        }) }));
}
export default MentionSuggestions;
//# sourceMappingURL=MentionSuggestions.js.map