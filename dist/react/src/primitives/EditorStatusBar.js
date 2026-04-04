import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
function normalizePadding(padding) {
    if (typeof padding === 'number') {
        return `${padding}px`;
    }
    return padding ?? '4px 12px';
}
export function EditorStatusBar({ items, className, background = tokens.colors.background.surface, borderColor = tokens.colors.border.subtle, textColor = tokens.colors.text.muted, padding, gap = 16, }) {
    const firstEndIndex = items.findIndex((item) => item.align === 'end');
    return (_jsx("div", { className: className, "data-component": "editor-status-bar", style: {
            display: 'flex',
            alignItems: 'center',
            gap,
            padding: normalizePadding(padding),
            background,
            borderTop: `1px solid ${borderColor}`,
            fontSize: 12,
            color: textColor,
        }, children: items.map((item, index) => {
            const isFirstEndAligned = index === firstEndIndex;
            return (_jsx("span", { "data-testid": item.testId, style: isFirstEndAligned ? { marginLeft: 'auto' } : undefined, children: item.label }, item.key ?? `status-${index}`));
        }) }));
}
export default EditorStatusBar;
//# sourceMappingURL=EditorStatusBar.js.map