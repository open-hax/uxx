import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
function normalizePadding(padding) {
    if (typeof padding === 'number') {
        return `${padding}px`;
    }
    return padding ?? '8px 12px';
}
export function EditorToolbar({ items, className, background = tokens.colors.background.surface, borderColor = tokens.colors.border.subtle, textColor = tokens.colors.text.default, padding, gap = 4, wrap = true, }) {
    return (_jsx("div", { className: className, "data-component": "editor-toolbar", style: {
            display: 'flex',
            alignItems: 'center',
            gap,
            padding: normalizePadding(padding),
            background,
            borderBottom: `1px solid ${borderColor}`,
            flexWrap: wrap ? 'wrap' : 'nowrap',
        }, children: items.map((item, index) => {
            if (item.type === 'divider') {
                return (_jsx("div", { "data-testid": item.testId, style: {
                        width: 1,
                        height: 20,
                        background: borderColor,
                        margin: '0 4px',
                    } }, item.key ?? `divider-${index}`));
            }
            const accessibleLabel = item.ariaLabel ??
                (typeof item.label === 'string' ? item.label : undefined) ??
                item.title ??
                item.key ??
                'Toolbar action';
            return (_jsx("button", { type: "button", "data-testid": item.testId, "aria-label": accessibleLabel, onClick: item.onClick, disabled: item.disabled, title: item.title, style: {
                    background: 'none',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: 4,
                    color: textColor,
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    opacity: item.disabled ? 0.5 : 1,
                    ...item.buttonStyle,
                }, children: item.label }, item.key ?? `button-${index}`));
        }) }));
}
export default EditorToolbar;
//# sourceMappingURL=EditorToolbar.js.map